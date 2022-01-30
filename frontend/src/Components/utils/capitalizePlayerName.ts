/**
 * Capitalizes the first letter of a player's first/last name (for display purposes).
 * @param name Name of the player to modify
 */

export const capitalizePlayerName = (name: string) =>
  name
    .split(" ")
    .map((partialName) => {
      if (partialName.length <= 1) {
        return partialName;
      } else if (partialName === "ii") {
        return "II";
      }
      return partialName[0].toUpperCase() + partialName.slice(1);
    })
    .join(" ");
