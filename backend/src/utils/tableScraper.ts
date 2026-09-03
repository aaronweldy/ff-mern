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
    const $headerRow =
      $table.find("thead tr").first().length > 0
        ? $table.find("thead tr").first()
        : $table.find("tr").first();
    const headers: string[] = [];
    $headerRow.find("th, td").each((index, cell) => {
      const text = $(cell).text().trim().replace(/\s+/g, " ");
      headers.push(text === "" ? String(index) : text);
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
