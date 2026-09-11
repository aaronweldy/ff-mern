import {
  convertedScoringTypes,
  DatabasePlayer,
  ScoringSetting,
  SinglePosition,
  StatKey,
} from "@ff-mern/ff-types";

export type CalculatedPlayerScore = {
  totalPoints: number;
  categories: Record<string, number>;
};

/** Calculates one player's score from the legacy statistics shape. */
export const calculatePlayerScore = (
  statistics: DatabasePlayer,
  position: SinglePosition,
  scoringSettings: ScoringSetting[]
): CalculatedPlayerScore => {
  const categories = scoringSettings
    .filter((setting) => setting.position.includes(position))
    .map((setting) => {
      const category = setting.category;
      const hash =
        category.qualifier === "between"
          ? `${category.qualifier}|${category.thresholdMax}${category.thresholdMin}|${category.statType}`
          : `${category.qualifier}|${category.threshold}|${category.statType}`;
      try {
        const statKey = convertedScoringTypes[position][category.statType];
        const statNumber = Number.parseFloat(statistics[statKey as StatKey]);
        if (Number.isNaN(statNumber)) return { [hash]: 0 };

        let points = 0;
        switch (category.qualifier) {
          case "per":
            points = (statNumber / category.threshold) * setting.points;
            break;
          case "greater than":
            if (statNumber >= category.threshold) points = setting.points;
            break;
          case "between":
            if (
              statNumber >= (category.thresholdMin || Infinity) &&
              statNumber <= (category.thresholdMax || -Infinity)
            ) {
              points = setting.points;
            }
            break;
        }
        const minimumsPass = setting.minimums.every((minimum) => {
          const statKey = convertedScoringTypes[position][minimum.statType];
          return (
            Number.parseFloat(statistics[statKey as StatKey]) >= minimum.threshold
          );
        });
        return { [hash]: minimumsPass ? points : 0 };
      } catch (error) {
        console.error(`Error finding stats for ${position}:`, error);
        return { [hash]: 0 };
      }
    });

  return {
    totalPoints: Number.parseFloat(
      categories
        .reduce((total, category) => total + Object.values(category)[0], 0)
        .toPrecision(4)
    ),
    categories: Object.assign({}, ...categories),
  };
};
