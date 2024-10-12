import { defineEventHandler } from "h3";
import { promises as fs } from "fs";
import { join } from "path";

// Функция для проверки, является ли день рабочим (понедельник-суббота и не праздник)
const isWorkday = (date: Date, holidays: Date[]): boolean => {
  const day = date.getDay();
  // Понедельник - Суббота: 1-6
  const isWeekday = day >= 1 && day <= 6;
  // Проверяем, не является ли день праздником
  // const isHoliday = holidays.some(
  //   (holiday) => holiday.getTime() === date.getTime(),
  // );
  // return isWeekday && !isHoliday;
  return isWeekday;
};

export default defineEventHandler(async () => {
  // Определяем начальную и конечную даты
  const startDate = new Date("2024-02-12");
  const endDate = new Date("2024-06-16");

  // Список нерабочих праздничных дней
  const holidays = [
    "2024-01-01",
    "2024-01-02",
    "2024-01-03",
    "2024-01-04",
    "2024-01-05",
    "2024-01-06",
    "2024-01-07",
    "2024-02-23",
    "2024-03-08",
    "2024-05-01",
    "2024-05-09",
    "2024-06-12",
  ].map((date) => new Date(date)); // Преобразуем строки дат в объекты Date для удобства

  // Массив для хранения рабочих дней
  const workdays: string[] = [];

  // Генерация дат
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (isWorkday(d, holidays)) {
      // Форматируем дату в строку "YYYY-MM-DD"
      workdays.push(d.toISOString().split("T")[0]);
    }
  }

  // Путь к файлу для сохранения
  const filePath = join(process.cwd(), "/server/db", "workdays.json");

  // Сохраняем рабочие дни в файл
  await fs.writeFile(filePath, JSON.stringify(workdays, null, 2), "utf8");

  return {
    message: `Рабочие дни успешно сохранены в ${filePath}`,
    workdays,
  };
});
