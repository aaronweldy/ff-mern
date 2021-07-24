export const lineupOrder = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  'WR/RB': 6,
  'WR/RB/TE': 7,
  'QB/WR/RB/TE': 8,
};

export const positionTypes = [
  'QB',
  'RB',
  'WR',
  'TE',
  'K',
  'WR/RB',
  'WR/RB/TE',
  'QB/WR/RB/TE',
];

export const lineupSorter = (a, b) => lineupOrder[a] - lineupOrder[b];
