import { SinglePosition, ScoringCategory, StatKey } from "..";

export const sanitizePlayerName = (name: string) =>
  name.replace(/\./g, "").toLowerCase();

export const sanitizeNflScheduleTeamName = (name: string) => {
  return name.replace(/\@/g, "");
};

export const convertedScoringTypes: Record<
  SinglePosition,
  Partial<Record<ScoringCategory, StatKey>>
> = {
  QB: {
    ATT: "ATT",
    CMP: "CMP",
    "PASS YD": "YDS",
    "RUSH YD": "YDS_2",
    "YD PER COMPLETION": "Y/CMP",
    CARRIES: "ATT_2",
    "PASS TD": "TD",
    "RUSH TD": "TD_2",
    "YD PER ATT": "Y/A",
    "CP%": "PCT",
    INT: "INT",
    FUM: "FL",
  },
  RB: {
    "REC YD": "YDS_2",
    "RUSH YD": "YDS",
    CARRIES: "ATT",
    "YD PER CARRY": "Y/A",
    "YD PER CATCH": "Y/R",
    REC: "REC",
    TARGETS: "TGT",
    "RUSH TD": "TD",
    "REC TD": "TD_2",
    FUM: "FL",
  },
  WR: {
    "REC YD": "YDS",
    "RUSH YD": "YDS_2",
    CARRIES: "ATT",
    "YD PER CARRY": "Y/A",
    "YD PER CATCH": "Y/R",
    REC: "REC",
    TARGETS: "TGT",
    "RUSH TD": "TD_2",
    "REC TD": "TD",
    FUM: "FL",
  },
  TE: {
    "REC YD": "YDS",
    "RUSH YD": "YDS_2",
    CARRIES: "ATT",
    "YD PER CARRY": "Y/A",
    "YD PER CATCH": "Y/R",
    REC: "REC",
    TARGETS: "TGT",
    "RUSH TD": "TD_2",
    "REC TD": "TD",
    FUM: "FL",
  },
  K: {
    "FG 1-19": "1-19",
    "FG 20-29": "20-29",
    "FG 30-39": "30-39",
    "FG 40-49": "40-49",
    "FG 50+": "50+",
    XPT: "XPT",
  },
};

export const scoringTypes = [
  "PASS YD",
  "CMP",
  "ATT",
  "CP%",
  "PASS TD",
  "INT",
  "YD PER ATT",
  "YD PER COMPLETION",
  "CARRIES",
  "RUSH YD",
  "YD PER CARRY",
  "FUM",
  "RUSH TD",
  "TARGETS",
  "REC",
  "REC YD",
  "REC TD",
  "YD PER CATCH",
  "XPT",
  "FG 1-19",
  "FG 20-29",
  "FG 30-39",
  "FG 40-49",
  "FG 50+",
  "FG/XP MISS",
];
