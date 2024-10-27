import { promises as fs } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import type {
    Slot,
    Subject,
    SubjectClassroom,
    Classroom,
    SubjectLecturer,
    Lecturer,
} from '~/types/backend/db'
import type { TimetableSubject } from '~/types/frontend/api'

const weekDayWeights = [1, 2.25, 3, 2.25, 1, 0.1]
const timeSlotWeights = [0.25, 0.5, 1, 2, 3, 4, 5, 4]
const dayReductionWeight = 0.4 // Чем меньше значение тем меньше пар в день
const dayReductionFalloff = 0.1 // Чем меньше значение тем больше окон
const consistentWeeks = true // Старается соблюсти одинаковые предметы по неделям
let timetable: Slot[] = []
let subjects: Subject[] = []
const subjectClassrooms = new Map<string, string[]>()
let classrooms: Classroom[] = []
const subjectLecturers = new Map<string, number[]>()
const lecturers = new Map<number, Lecturer>()
let holidays = new Set<string>()

const timeMap: { [key: number]: number } = {
    0: 8 * 60 + 30, // 8:30 -> 510 minutes
    1: 10 * 60 + 20, // 10:20 -> 620 minutes
    2: 12 * 60 + 20, // 12:20 -> 740 minutes
    3: 14 * 60 + 10, // 14:10 -> 850 minutes
    4: 16 * 60, // 16:00 -> 960 minutes
    5: 18 * 60, // 18:00 -> 1080 minutes
    6: 19 * 60 + 40, // 19:40 -> 1180 minutes
    7: 21 * 60 + 20, // 21:20 -> 1280 minutes
}

const classTypeMap = new Map<number, string>([
    [0, 'Лекция'],
    [1, 'Семинар'],
    [2, 'Лабораторное занятие'],
])

const subjectTypeMap = new Map<number, keyof Subject>([
    [0, 'lecture_count'],
    [1, 'sem_count'],
    [2, 'lab_count'],
])

function computeWeight(date: Date, timeSlot: number): number {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    if (holidays.has(`${year}-${month}-${day}`)) {
        return 0 // Возвращает 0 если это праздник
    }

    const dayOfWeek = date.getDay() - 1
    const weekDayWeight = weekDayWeights[dayOfWeek]
    const timeSlotWeight = timeSlotWeights[timeSlot]
    return weekDayWeight * timeSlotWeight
}

function timetableToJson(): TimetableSubject[] {
    const timetableSubjects: TimetableSubject[] = []
    for (const slot of timetable) {
        if (slot.subject_name !== '') {
            let fullName = ''
            const lecturer = lecturers.get(slot.lecturer_id)
            if (lecturer) {
                fullName = `${lecturer.surname} ${lecturer.name} ${lecturer.patronymic}`
            }

            timetableSubjects.push({
                id: slot.id,
                groups: [fullName],
                name: slot.subject_name,
                type: classTypeMap.get(slot.subject_type) || '',
                subgroup: '',
                location: slot.classroom_number,
                dateTime: slot.date,
                url: '',
                mdFile: '',
            })
        }
    }

    return timetableSubjects
}

function getRandomSlotByWeight(): number {
    const totalWeight = timetable.reduce((sum, slot) => sum + slot.weight, 0)

    const random = Math.random() * totalWeight

    let cumulativeWeight = 0
    for (const slot of timetable) {
        if (isNaN(slot.weight)) {
            console.log(slot)
            continue
        }

        cumulativeWeight += slot.weight
        if (random < cumulativeWeight) {
            return slot.id
        }
    }

    return 0
}

function reduceWeights(randomSlotId: number, dateTime: Date) {
    const startTime = new Date(dateTime)
    startTime.setHours(8, 30)
    const endTime = new Date(dateTime)
    endTime.setHours(21, 20)

    let i = randomSlotId - 1
    let reduction = dayReductionWeight

    while (i >= 0 && timetable[i].date >= startTime) {
        timetable[i].weight *= reduction
        i--
        reduction -= dayReductionFalloff
        if (reduction < 0) reduction = 0.0001
    }

    i = randomSlotId + 1
    reduction = dayReductionWeight

    while (i < timetable.length && timetable[i].date <= endTime) {
        timetable[i].weight *= reduction
        i++
        reduction -= dayReductionFalloff
        if (reduction < 0) reduction = 0.0001
    }
}

function populateSubject(
    randomSubjectIndex: number,
    subjectType: number,
    randomSlotId: number,
    randomClassroom: string
) {
    try {
        if (!timetable) {
            console.error('Error: timetable - undefined или null')
            return
        }

        if (randomSlotId < 0 || randomSlotId >= timetable.length) {
            // console.log("randomSlotId за пределами: ", randomSlotId);
            return
        }

        if (timetable[randomSlotId].weight === 0) {
            // console.log("randomSlotId уже занят: ", randomSlotId);
            return
        }

        timetable[randomSlotId] = {
            id: timetable[randomSlotId].id,
            lecturer_id: chooseLecturer(
                subjects[randomSubjectIndex].subject_name
            ),
            subject_name: subjects[randomSubjectIndex].subject_name,
            subject_type: subjectType,
            classroom_number: randomClassroom,
            date: timetable[randomSlotId].date,
            weight: 0,
            entropy: timetable[randomSlotId].entropy,
        }

        reduceWeights(randomSlotId, timetable[randomSlotId].date)

        const property = subjectTypeMap.get(subjectType) as keyof Subject
        if (property) {
            const value = subjects[randomSubjectIndex][property]

            if (typeof value === 'number') {
                subjects[randomSubjectIndex][property]--

                if (!consistentWeeks) return

                // Тут вместо +- 48 искать слот с такой же датой неделю в перёд
                // А ещё нужно дополнительно проверять что аудитория и преподаватель свободны в это время
                if (value > 2) {
                    populateSubject(
                        randomSubjectIndex,
                        subjectType,
                        randomSlotId - 48,
                        randomClassroom
                    )
                    populateSubject(
                        randomSubjectIndex,
                        subjectType,
                        randomSlotId + 48,
                        randomClassroom
                    )
                } else if (value === 2) {
                    populateSubject(
                        randomSubjectIndex,
                        subjectType,
                        randomSlotId + 48,
                        randomClassroom
                    )
                }
            }
        }
    } catch (error) {
        console.error('Ошибка в populateSubject:', error)
    }
}

async function loadData() {
    const db = new Database('server/db/database.db', { verbose: console.log })

    // const groupCount = db.prepare('SELECT COUNT(*) as count FROM Groups;').get() as GroupCountResult;

    subjects = db.prepare('SELECT * FROM Subjects;').all() as Subject[]

    const rows0 = db
        .prepare('SELECT * FROM SubjectClassrooms;')
        .all() as SubjectClassroom[]
    rows0.forEach((row) => {
        const { subject_name, classroom_number } = row

        if (subjectClassrooms.has(subject_name)) {
            subjectClassrooms.get(subject_name)?.push(classroom_number)
        } else {
            subjectClassrooms.set(subject_name, [classroom_number])
        }
    })

    classrooms = db.prepare('SELECT * FROM Classrooms;').all() as Classroom[]

    const rows1 = db
        .prepare('SELECT * FROM SubjectLecturers;')
        .all() as SubjectLecturer[]
    rows1.forEach((row) => {
        const { subject_name, lecturer_id } = row

        if (subjectLecturers.has(subject_name)) {
            subjectLecturers.get(subject_name)?.push(lecturer_id)
        } else {
            subjectLecturers.set(subject_name, [lecturer_id])
        }
    })

    const rows2 = db.prepare('SELECT * FROM Lecturers;').all() as Lecturer[]
    rows2.forEach((lecturer) => {
        lecturers.set(lecturer.id, lecturer)
    })

    db.close()

    // Загрузка праздников в Set
    const filePath = join(process.cwd(), 'server/db', 'holidays.json')
    const data = await fs.readFile(filePath, 'utf8')
    holidays = new Set(JSON.parse(data))
}

function chooseLecturer(subject_name: string): number {
    if (!subjectLecturers.has(subject_name)) return -1

    const lecturerIds = subjectLecturers.get(subject_name)

    if (!lecturerIds) return -1

    const randomLecturerIndex = Math.floor(Math.random() * lecturerIds.length)

    return lecturerIds[randomLecturerIndex]
}

function chooseClassroom(subject_name: string): string {
    if (!subjectClassrooms.has(subject_name)) return ''

    const classroom_numbers = subjectClassrooms.get(subject_name)

    if (!classroom_numbers) return ''

    const randomClassroomIndex = Math.floor(
        Math.random() * classroom_numbers.length
    )

    return classroom_numbers[randomClassroomIndex]
}

export default defineEventHandler(async () => {
    const startTime = performance.now()

    // Загрузка данных из базы данных
    loadData()

    // Узнаём рабочие дни на семестр (весна 2024)
    const filePath = join(process.cwd(), 'server/db', 'workdays.json')
    const data = await fs.readFile(filePath, 'utf8')
    const workdaysStr: string[] = JSON.parse(data)
    const workdays = workdaysStr.map((dateStr) => new Date(dateStr))

    let idCounter = 0
    // timetable = Array.from({ length: workdays.length * 8 });
    timetable = Array.from({ length: workdays.length * 8 }, () => ({
        id: -1,
        lecturer_id: -1,
        subject_name: '',
        subject_type: -1,
        classroom_number: '',
        date: new Date(),
        weight: 0,
        entropy: -1,
    }))

    // Заполнение календаря пустыми слотами
    for (let day = 0; day < workdays.length; day++) {
        for (let timeSlot = 0; timeSlot <= 7; timeSlot++) {
            const date = new Date(workdays[day])

            // Добавим минуты
            date.setHours(0, timeMap[timeSlot], 0, 0)

            const slot: Slot = {
                id: idCounter++,
                lecturer_id: -1,
                subject_name: '',
                subject_type: -1,
                classroom_number: '',
                date: date,
                weight: computeWeight(date, timeSlot),
                entropy: -1,
            }

            timetable[day * 8 + timeSlot] = slot
        }
    }

    while (subjects.length > 0) {
        // Выбор случайного предмета
        const randomSubjectIndex = Math.floor(Math.random() * subjects.length)

        // Выбор типа пары
        let subjectType = 2
        if (subjects[randomSubjectIndex].sem_count > 0) subjectType = 1
        if (subjects[randomSubjectIndex].lecture_count > 0) subjectType = 0

        // Выбор случайного слота (Softmax function)
        const randomSlotId: number = getRandomSlotByWeight()

        // Тут будет чек что преподаватель свободен;
        // const randomLecturerId = chooseLecturer(subjects[randomSubjectIndex].subject_name);

        // Выбор случайного места
        // const randomClassroomIndex = Math.floor(
        //   Math.random() * classrooms.length,
        // );

        const randomClassroom = chooseClassroom(
            subjects[randomSubjectIndex].subject_name
        )

        populateSubject(
            randomSubjectIndex,
            subjectType,
            randomSlotId,
            randomClassroom
        )

        // Проверяем есть ли ещё пары в этом предмете
        if (
            subjects[randomSubjectIndex].lecture_count === 0 &&
            subjects[randomSubjectIndex].sem_count === 0 &&
            subjects[randomSubjectIndex].lab_count === 0
        ) {
            subjects.splice(randomSubjectIndex, 1)
        }
    }

    console.log(`Finished processing in ${performance.now() - startTime}ms`)
    const filePath2 = join(process.cwd(), '/server/db', 'timetable.json')
    await fs.writeFile(filePath2, JSON.stringify(timetable, null, 2), 'utf8')
    return timetableToJson()
})
