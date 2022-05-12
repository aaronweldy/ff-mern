export type NflRankedTextProps = {
  rank: number;
};

export const NflRankedText = ({ rank }: NflRankedTextProps) => {
  let color = "green";
  if (rank > 12 && rank < 25) {
    color = "darkorange";
  } else if (rank >= 25) {
    color = "red";
  }

  return <span style={{ color }}>{rank}</span>;
};
