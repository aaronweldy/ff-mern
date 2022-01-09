import { Position, SinglePosition } from "./Position";

export class LocalPlayer {
  public name: string;
  public position: SinglePosition;
  public points: number[];
  public backup: string[];
  public lineup: Position[];
  public weekStats: Array<Record<string, number>>;
  public error: boolean;
  public dummyPlayer: boolean;

  constructor(
    name: string,
    position: SinglePosition,
    lineup: Position,
    numWeeks: number,
    dummy: boolean
  ) {
    this.name = name;
    this.position = position;
    this.points = Array<number>(numWeeks).fill(0);
    this.backup = Array<string>(numWeeks).fill("");
    this.lineup = Array<Position>(numWeeks).fill(lineup);
    this.weekStats = Array<Record<string, number>>(numWeeks).fill({});
    this.dummyPlayer = dummy;
  }
}
