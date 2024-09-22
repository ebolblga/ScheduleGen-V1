import { promises as fs } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import type { Slot, Subject } from '~/types/backend/db';
import type { TimetableSubject } from '~/types/frontend/api';

const weekDayWeights = [0.75, 0.5, 0.5, 0.5, 0.5, 1];
const timeSlotWeights = [1, 1, 0.75, 0.5, 0.25, 0.5, 0.75, 1];
let timetable: Slot[] = [];
const startDate = new Date('2024-02-12');
const endDate = new Date('2024-06-16');

function parseDateStrings(dateStrings: string[]): Date[] {
  return dateStrings.map(dateStr => new Date(dateStr));
};

function computeWeight(date: Date, timeSlot: number): number {
  const dayOfWeek = date.getDay();
  const weekDayWeight = weekDayWeights[dayOfWeek];
  const timeSlotWeight = timeSlotWeights[timeSlot];
  return weekDayWeight + timeSlotWeight;
}

const timeMap: { [key: number]: number } = {
  0: 8 * 60 + 30,   // 8:30 -> 510 minutes
  1: 10 * 60 + 20,  // 10:20 -> 620 minutes
  2: 12 * 60 + 20,  // 12:20 -> 740 minutes
  3: 14 * 60 + 10,  // 14:10 -> 850 minutes
  4: 16 * 60,       // 16:00 -> 960 minutes
  5: 18 * 60,       // 18:00 -> 1080 minutes
  6: 19 * 60 + 40,  // 19:40 -> 1180 minutes
  7: 21 * 60 + 20   // 21:20 -> 1280 minutes
};

const classTypeMap = new Map<number, string>([
  [0, 'Лекция'],
  [1, 'Семинар'],
  [2, 'Лабораторная работа']
]);

function timetableToJson(timetable: Slot[]): TimetableSubject[] {
  const timetableSubjects: TimetableSubject[] = [];
  for (const slot of timetable) {
    if (slot.subject_name !== '') {
      timetableSubjects.push({
        id: slot.id,
        groups: [slot.lecturer_id.toString()],
        name: slot.subject_name,
        type: classTypeMap.get(slot.subject_type) || '',
        subgroup: '',
        location: slot.classroom_number,
        dateTime: slot.date,
        url: '',
        mdFile: ''
      });
    }
  }

  return timetableSubjects;
}

export default defineEventHandler(async (event) => {
  // Заполняем массив предметов
  // const stmt = db.prepare('SELECT COUNT(*) as count FROM Groups;');
  // const groupCount = stmt.get() as GroupCountResult;
  const db = new Database('server/db/database.db', { verbose: console.log });
  const stmt = db.prepare('SELECT * FROM Subjects;');
  const subjectsArray = stmt.get() as Subject[];
  db.close();

  // Узнаём рабочие дни на семестр (весна 2024)
  const filePath = join(process.cwd(), 'server/db', 'workdays.json');
  const data = await fs.readFile(filePath, 'utf8');
  const workdaysStr: string[] = JSON.parse(data);
  const workdays = parseDateStrings(workdaysStr);

  let idCounter = 0;
  timetable = Array.from({ length: workdays.length * 8 });

  // Заполнение календаря пустыми слотами
  for (let day = 0; day < workdays.length; day++) {
    for (let timeSlot = 0; timeSlot <= 7; timeSlot++) {
      const date = new Date(workdays[day]);

      // Добавим минуты
      date.setHours(0, timeMap[timeSlot], 0, 0);

      const slot: Slot = {
        id: idCounter++,
        lecturer_id: -1,
        subject_name: '',
        subject_type: -1,
        classroom_number: '',
        date: date,
        weight: computeWeight(date, timeSlot),
        entropy: -1
      };

      timetable[(day * 8) + timeSlot] = slot;
    }
  }

  // timetable[0] = {
  //   id: timetable[0].id,
  //   lecturer_id: 0,
  //   subject_name: "Какой то там предмет",
  //   subject_type: 0,
  //   classroom_number: "205a",
  //   date: timetable[0].date,
  //   weight: timetable[0].weight,
  //   entropy: -1
  // };

  // timetable[5] = {
  //   id: timetable[5].id,
  //   lecturer_id: 0,
  //   subject_name: "Какой то там предмет",
  //   subject_type: 1,
  //   classroom_number: "205a",
  //   date: timetable[5].date,
  //   weight: timetable[5].weight,
  //   entropy: -1
  // };

  return timetableToJson(timetable);
});