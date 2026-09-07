import { load } from "cheerio";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fetchHtmlWithRetry = async (
  url: string,
  retries = 3,
  backoffMs = 1000
): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; orca-ff-backend/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await sleep(backoffMs * 2 ** (attempt - 1));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Fetch failed for ${url}: ${String(lastError)}`);
};

const parseHtmlTables = (
  html: string
): Array<Array<Record<string, string>>> => {
  const $ = load(html);
  const tables: Array<Array<Record<string, string>>> = [];
  $("table").each((_, table) => {
    const $table = $(table);
    // FantasyPros stats tables have a two-row thead: a group row
    // (PASSING/RUSHING/MISC) followed by the actual stat row. Always use
    // the header row with the most cells so group rows are skipped.
    // Tables with a single header row behave exactly as before.
    const $headRows = $table.find("thead tr");
    let $headerRow = $table.find("tr").first();
    if ($headRows.length > 0) {
      let maxCells = -1;
      $headRows.each((__, row) => {
        const cellCount = $(row).find("th, td").length;
        if (cellCount > maxCells) {
          maxCells = cellCount;
          $headerRow = $(row);
        }
      });
    }
    const headers: string[] = [];
    const seenCounts: Record<string, number> = {};
    $headerRow.find("th, td").each((index, cell) => {
      let text = $(cell).text().trim().replace(/\s+/g, " ");
      if (text === "") {
        text = String(index);
      }
      // Duplicate column names (e.g. passing/rushing ATT/YDS/TD) get
      // _2/_3 suffixes, matching the DatabasePlayer key convention.
      const seen = seenCounts[text] ?? 0;
      seenCounts[text] = seen + 1;
      headers.push(seen === 0 ? text : `${text}_${seen + 1}`);
    });
    if (headers.length === 0) return;
    const rows: Array<Record<string, string>> = [];
    $table
      .find("tr")
      .not($headerRow)
      .each((__, row) => {
        const $cells = $(row).find("td, th");
        if ($cells.length === 0) return;
        const record: Record<string, string> = {};
        $cells.each((cellIndex, cell) => {
          const key = headers[cellIndex] ?? String(cellIndex);
          record[key] = $(cell).text().trim().replace(/\s+/g, " ");
        });
        if (Object.values(record).some((v) => v !== "")) rows.push(record);
      });
    tables.push(rows);
  });
  return tables;
};

/**
 * Retrieve a web page and extract all tables from the HTML.
 * Uses native fetch + cheerio (replaces request/x-ray/tabletojson).
 * @param {string} url The URL of the page to retrieve.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of table data.
 */
export const get = async (url: string): Promise<Array<any>> => {
  const html = await fetchHtmlWithRetry(url);
  return parseHtmlTables(html);
};
