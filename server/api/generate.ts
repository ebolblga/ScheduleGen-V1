import { promises as fs } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import type { Slot, Subject, Classroom } from '~/types/backend/db';
import type { TimetableSubject } from '~/types/frontend/api';

const weekDayWeights = [1, 2, 3, 2, 1, 0.1];
const timeSlotWeights = [1, 1, 2, 3, 4, 4, 3, 1];
let timetable: Slot[] = [];
const startDate = new Date('2024-02-12');
const endDate = new Date('2024-06-16');

function parseDateStrings(dateStrings: string[]): Date[] {
  return dateStrings.map(dateStr => new Date(dateStr));
};

function computeWeight(date: Date, timeSlot: number): number {
  const dayOfWeek = date.getDay() - 1;
  const weekDayWeight = weekDayWeights[dayOfWeek];
  const timeSlotWeight = timeSlotWeights[timeSlot];
  return weekDayWeight * timeSlotWeight;
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
  [2, 'Лабораторное занятие']
]);

const subjectTypeMap = new Map<number, keyof Subject>([
  [0, "lecture_count"],
  [1, "sem_count"],
  [2, "lab_count"]
])

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

function getRandomSlotByWeight(timetable: Slot[]): number {
  const totalWeight = timetable.reduce((sum, slot) => sum + slot.weight, 0);

  const random = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const slot of timetable) {
    if (isNaN(slot.weight)) {
      console.log(slot);
      continue;
    }

    cumulativeWeight += slot.weight;
    if (random < cumulativeWeight) {
      return slot.id;
    }
  }

  return 0;
}

function populateSubject(timetable: Slot[], randomSlotId: number): Slot[] {
  //     // Вставляем предметы
  //     let successfulPopulationsCounter = 1;
  //     let breakFlag = false;
  //     let maxPopulationsAvailable = 1;

  //     switch (subjectType) {
  //       case 0: {
  //         maxPopulationsAvailable = subjectsArray[randomSubjectIndex].lecture_count;
  //         break;
  //       }

  //       case 1: {
  //         maxPopulationsAvailable = subjectsArray[randomSubjectIndex].sem_count;
  //         break;
  //       }

  //       case 2: {
  //         maxPopulationsAvailable = subjectsArray[randomSubjectIndex].lab_count;
  //         break;
  //       }
  //     }

  // while (successfulPopulationsCounter <= maxPopulationsAvailable) {
  //   timetable[randomSlotId] = {
  //     id: timetable[randomSlotId].id,
  //     lecturer_id: timetable[randomSlotId].lecturer_id,
  //     subject_name: subjectsArray[randomSubjectIndex].subject_name,
  //     subject_type: subjectType,
  //     classroom_number: classroomArray[randomClassroomIndex].classroom_number,
  //     date: timetable[randomSlotId].date,
  //     weight: 0,
  //     entropy: timetable[randomSlotId].entropy
  //   }

  //   successfulPopulationsCounter++;
  //   randomSlotId += 48;
  //   if (randomSlotId >= timetable.length) {
  //     breakFlag = true;
  //     break;
  //   }
  //   if (timetable[randomSlotId].subject_name !== '') {
  //     breakFlag = true;
  //     break;
  //   }
  // }

  return timetable;
}

export default defineEventHandler(async (event) => {
  // Заполняем массив предметов
  // const stmt = db.prepare('SELECT COUNT(*) as count FROM Groups;');
  // const groupCount = stmt.get() as GroupCountResult;
  const db = new Database('server/db/database.db', { verbose: console.log });
  const stmt1 = db.prepare('SELECT * FROM Subjects;');
  const subjectsArray = stmt1.all() as Subject[];
  const stmt2 = db.prepare('SELECT * FROM Classrooms;');
  const classroomArray = stmt2.all() as Classroom[];
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

  while (subjectsArray.length > 0) {
    // Выбор случайного предмета
    const randomSubjectIndex = Math.floor(Math.random() * subjectsArray.length);

    // Выбор типа пары
    let subjectType = 2;
    if (subjectsArray[randomSubjectIndex].sem_count > 0) subjectType = 1;
    if (subjectsArray[randomSubjectIndex].lecture_count > 0) subjectType = 0

    // Выбор случайного слота (Softmax function)
    let randomSlotId: number = getRandomSlotByWeight(timetable);

    // Тут будет чек что препод свободен;

    // Выбор случайного места
    const randomClassroomIndex = Math.floor(Math.random() * classroomArray.length);

    timetable[randomSlotId] = {
      id: timetable[randomSlotId].id,
      lecturer_id: timetable[randomSlotId].lecturer_id,
      subject_name: subjectsArray[randomSubjectIndex].subject_name,
      subject_type: subjectType,
      classroom_number: classroomArray[randomClassroomIndex].classroom_number,
      date: timetable[randomSlotId].date,
      weight: 0,
      entropy: timetable[randomSlotId].entropy
    }

    // Удаляем тип предмета из массива предметов
    const property = subjectTypeMap.get(subjectType);
    if (property) subjectsArray[randomSubjectIndex][property]--;

    // populateSubject();

    // Проверяем есть ли ещё пары в этом предмете
    if (subjectsArray[randomSubjectIndex].lecture_count === 0 && subjectsArray[randomSubjectIndex].sem_count === 0 && subjectsArray[randomSubjectIndex].lab_count === 0) {
      subjectsArray.splice(randomSubjectIndex, 1);
    }
  }

  return timetableToJson(timetable);
});