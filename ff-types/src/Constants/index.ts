export type FullNflTeam =
  | "green bay packers"
  | "pittsburgh steelers"
  | "kansas city chiefs"
  | "new england patriots"
  | "buffalo bills"
  | "carolina panthers"
  | "seattle seahawks"
  | "indianapolis colts"
  | "arizona cardinals"
  | "baltimore ravens"
  | "houston texans"
  | "new orleans saints"
  | "philadelphia eagles"
  | "denver broncos"
  | "detroit lions"
  | "minnesota vikings"
  | "atlanta falcons"
  | "new york giants"
  | "dallas cowboys"
  | "jacksonville jaguars"
  | "miami dolphins"
  | "cincinnati bengals"
  | "las vegas raiders"
  | "tampa bay buccaneers"
  | "los angeles rams"
  | "chicago bears"
  | "cleveland browns"
  | "los angeles chargers"
  | "san francisco 49ers"
  | "new york jets"
  | "washington commanders"
  | "tennessee titans";

export type AbbreviatedNflTeam =
  | "ARI"
  | "ATL"
  | "BAL"
  | "BUF"
  | "CAR"
  | "CHI"
  | "CIN"
  | "CLE"
  | "DAL"
  | "DEN"
  | "DET"
  | "GB"
  | "HOU"
  | "IND"
  | "JAC"
  | "JAX"
  | "KC"
  | "LAC"
  | "LAR"
  | "LV"
  | "MIA"
  | "MIN"
  | "NE"
  | "NO"
  | "NYG"
  | "NYJ"
  | "PHI"
  | "PIT"
  | "SEA"
  | "SF"
  | "TB"
  | "TEN"
  | "WAS"
  | "WSH";

export const AbbreviationToFullTeam: Record<AbbreviatedNflTeam, FullNflTeam> = {
  ARI: "arizona cardinals",
  ATL: "atlanta falcons",
  BAL: "baltimore ravens",
  BUF: "buffalo bills",
  CAR: "carolina panthers",
  CHI: "chicago bears",
  CIN: "cincinnati bengals",
  CLE: "cleveland browns",
  DAL: "dallas cowboys",
  DEN: "denver broncos",
  DET: "detroit lions",
  GB: "green bay packers",
  HOU: "houston texans",
  IND: "indianapolis colts",
  JAC: "jacksonville jaguars",
  JAX: "jacksonville jaguars",
  KC: "kansas city chiefs",
  LAC: "los angeles chargers",
  LAR: "los angeles rams",
  LV: "las vegas raiders",
  MIA: "miami dolphins",
  MIN: "minnesota vikings",
  NE: "new england patriots",
  NO: "new orleans saints",
  NYG: "new york giants",
  NYJ: "new york jets",
  PHI: "philadelphia eagles",
  PIT: "pittsburgh steelers",
  SEA: "seattle seahawks",
  SF: "san francisco 49ers",
  TB: "tampa bay buccaneers",
  TEN: "tennessee titans",
  WAS: "washington commanders",
  WSH: "washington commanders",
};

export const FullTeamToAbbreviation: Record<FullNflTeam, AbbreviatedNflTeam> = Object.fromEntries(
  Object.entries(AbbreviationToFullTeam).map(([abbr, fullName]) => [fullName, abbr as AbbreviatedNflTeam])
) as Record<FullNflTeam, AbbreviatedNflTeam>;

export type Week =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18";
