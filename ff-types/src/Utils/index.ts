export const sanitizePlayerName = (name: string) =>
  name.replace(/\./g, "").toLowerCase();
