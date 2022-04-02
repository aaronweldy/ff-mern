type DisplayLastUpdatedProps = {
  lastUpdated: Date;
};

export const DisplayLastUpdated = ({
  lastUpdated,
}: DisplayLastUpdatedProps) => {
  return (
    <div className="timeDisplay">
      Last roster update: {lastUpdated?.toLocaleDateString() || "never"}
    </div>
  );
};
