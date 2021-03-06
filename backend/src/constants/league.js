export const convertedScoringTypes = {
  QB: {
    ATT: "ATT",
    "PASS YD": "YDS",
    "RUSH YD": "YDS_2",
    CARRIES: "ATT_2",
    "PASS TD": "TD",
    "RUSH TD": "TD_2",
    "YD PER ATT": "Y/A",
    "CP%": "CP%",
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
  },
};

export const defaultScoringSettings = {
  Standard: [
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 10, statType: "RUSH YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 10, statType: "REC YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 25, statType: "PASS YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 6,
      category: { qualifier: "per", threshold: 1, statType: "RUSH TD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "PASS TD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: -2,
      category: { qualifier: "per", threshold: 1, statType: "FUM" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: -1,
      category: { qualifier: "per", threshold: 1, statType: "INT" },
      minimums: [],
    },
    {
      position: "K",
      points: 3,
      category: { qualifier: "per", threshold: 1, statType: "FG 1-19" },
      minimums: [],
    },
    {
      position: "K",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "FG 20-29" },
      minimums: [],
    },
    {
      position: "K",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "FG 30-39" },
      minimums: [],
    },
    {
      position: "K",
      points: 5,
      category: { qualifier: "per", threshold: 1, statType: "FG 40-49" },
      minimums: [],
    },
    {
      position: "K",
      points: 3,
      category: { qualifier: "per", threshold: 1, statType: "FG 50+" },
      minimums: [],
    },
  ],
  PPR: [
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 10, statType: "RUSH YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 10, statType: "REC YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 25, statType: "PASS YD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 6,
      category: { qualifier: "per", threshold: 1, statType: "RUSH TD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "PASS TD" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: -2,
      category: { qualifier: "per", threshold: 1, statType: "FUM" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: -1,
      category: { qualifier: "per", threshold: 1, statType: "INT" },
      minimums: [],
    },
    {
      position: "K",
      points: 3,
      category: { qualifier: "per", threshold: 1, statType: "FG 1-19" },
      minimums: [],
    },
    {
      position: "K",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "FG 20-29" },
      minimums: [],
    },
    {
      position: "K",
      points: 4,
      category: { qualifier: "per", threshold: 1, statType: "FG 30-39" },
      minimums: [],
    },
    {
      position: "K",
      points: 5,
      category: { qualifier: "per", threshold: 1, statType: "FG 40-49" },
      minimums: [],
    },
    {
      position: "K",
      points: 6,
      category: { qualifier: "per", threshold: 1, statType: "FG 50+" },
      minimums: [],
    },
    {
      position: "QB/WR/RB/TE",
      points: 1,
      category: { qualifier: "per", threshold: 1, statType: "REC" },
      minimums: [],
    },
  ],
};

export const lineupOrder = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  "WR/RB": 6,
  "WR/RB/TE": 7,
  "QB/WR/RB/TE": 8,
};
