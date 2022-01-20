import { ScoringSetting } from "@ff-mern/ff-types";

export const defaultScoringSettings: Record<string, ScoringSetting[]> = {
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
