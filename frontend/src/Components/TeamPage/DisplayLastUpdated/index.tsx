type DisplayLastUpdatedProps = {
  lastUpdated: string;
};

export const DisplayLastUpdated = ({
  lastUpdated,
}: DisplayLastUpdatedProps) => {
  return (
    <div className="timeDisplay">
      Last roster update: {new Date(lastUpdated).toLocaleString() || "never"}
    </div>
  );
};
