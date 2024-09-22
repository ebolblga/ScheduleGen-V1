// This functions gets a list of holidays for a given year
export default defineEventHandler(async (event) => {
  const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2024/RU');
  const holidays = await response.json();
  return holidays;
});