import { sanitizePlayerName } from "@ff-mern/ff-types";
import { normalizeNflverseWeeklyStat } from "./nflverseStats.js";
const playerStatsUrl = (season) => `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;
const parseCsvRows = (csv) => {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < csv.length; index += 1) {
        const character = csv[index];
        if (character === '"') {
            if (quoted && csv[index + 1] === '"') {
                value += '"';
                index += 1;
            }
            else {
                quoted = !quoted;
            }
        }
        else if (character === "," && !quoted) {
            row.push(value);
            value = "";
        }
        else if (character === "\n" && !quoted) {
            row.push(value.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            value = "";
        }
        else {
            value += character;
        }
    }
    if (value || row.length > 0) {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
    }
    return rows;
};
export const parseNflverseWeeklyStats = (csv, season, week) => {
    const stats = {};
    const [header, ...dataRows] = parseCsvRows(csv);
    if (!header || header.length === 0)
        return stats;
    const column = (name) => header.indexOf(name);
    const seasonColumn = column("season");
    const weekColumn = column("week");
    const seasonTypeColumn = column("season_type");
    const displayNameColumn = column("player_display_name");
    const playerNameColumn = column("player_name");
    if (seasonColumn < 0 ||
        weekColumn < 0 ||
        seasonTypeColumn < 0 ||
        (displayNameColumn < 0 && playerNameColumn < 0)) {
        return stats;
    }
    for (const dataRow of dataRows) {
        if (dataRow.length !== header.length ||
            Number(dataRow[seasonColumn]) !== season ||
            Number(dataRow[weekColumn]) !== week ||
            dataRow[seasonTypeColumn] !== "REG") {
            continue;
        }
        const row = Object.fromEntries(header.map((field, index) => [field, dataRow[index]]));
        const normalized = normalizeNflverseWeeklyStat(row);
        if (!normalized)
            continue;
        const name = String(dataRow[displayNameColumn] ||
            (playerNameColumn >= 0 ? dataRow[playerNameColumn] : ""));
        stats[sanitizePlayerName(name)] = normalized;
    }
    return stats;
};
/** Downloads and normalizes one regular-season nflverse player-stat week. */
export const loadNflverseWeeklyStats = async (season, week) => {
    const response = await fetch(playerStatsUrl(season));
    if (!response.ok) {
        throw new Error(`nflverse download failed: ${response.status} ${response.statusText}`);
    }
    return parseNflverseWeeklyStats(await response.text(), season, week);
};
//# sourceMappingURL=nflverseWeekStats.js.map