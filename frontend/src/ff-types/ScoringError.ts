import { LocalPlayer } from "./LocalPlayer";
import { Position, SinglePosition } from "./Position";
import { ScoringSetting } from "./Scoring";
import { Team } from "./Team";

export type ErrorType = "NOT FOUND" | "POSSIBLE BACKUP";

export class ScoringError {
  public type: ErrorType;
  public desc: string;
  public player: LocalPlayer;
  public team: Team;

  constructor(type: ErrorType, desc: string, player: LocalPlayer, team: Team) {
    this.type = type;
    this.desc = desc;
    this.player = player;
    this.team = team;
  }
}
