export const getCurrentSeason = () => {
  const curDate = new Date();
  const curYear = curDate.getFullYear();
  const curMonth = curDate.getMonth();
  if (curMonth < 9) {
    return curYear - 1;
  }
  return curYear;
};
