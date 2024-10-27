<script setup lang="ts">
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import type { TimetableSubject } from '~/types/frontend/api'

useSeoMeta({
    title: 'Генератор расписания',
    description:
        'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
    ogTitle: 'Генератор расписания',
    ogDescription:
        'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
    ogImage: '',
    ogUrl: '',
    twitterTitle: 'Генератор расписания',
    twitterDescription:
        'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
    twitterImage: '',
    twitterCard: 'summary',
})

const weekDayWeights = ref([1, 2.25, 3, 2.25, 1, 0.1])
const timeSlotWeights = ref([0.04, 0.06, 0.13, 0.5, 2, 3.21, 3.66, 2.75])
const dayReductionWeight = ref(0.4) // Чем меньше значение тем меньше пар в день
const dayReductionFalloff = ref(0.1) // Чем меньше значение тем больше окон
const consistentWeeks = ref(true) // Старается соблюсти одинаковые предметы по неделям
const selectedDate = ref(new Date('2024-02-12'))
const attrs = ref<Event[]>([])
const todaysList = ref<TimetableSubject[]>([])
let timetableSubjects: TimetableSubject[] = []

const holidays = [
    '2024-01-01',
    '2024-01-02',
    '2024-01-03',
    '2024-01-04',
    '2024-01-05',
    '2024-01-06',
    '2024-01-07',
    '2024-02-23',
    '2024-03-08',
    '2024-05-01',
    '2024-05-09',
    '2024-06-12',
].map((date) => new Date(date))
const startDate = new Date('2024-02-12')
const endDate = new Date('2024-06-16')

async function generateSchedule() {
    try {
        const timetable = await $fetch<TimetableSubject[]>('/api/generate')

        if (!timetable) {
            console.warn('Расписание не пришло с бэкенда')
            return
        }

        console.log('Timetable length: ', timetable.length)

        timetableSubjects = timetable.map((subject) => ({
            ...subject,
            dateTime: new Date(subject.dateTime),
        }))
        numberSubjects()
        populateCalendar()
    } catch (err) {
        console.error('Ошибка фетчинга расписания:', err)
    }
}

function numberSubjects() {
    const subjectGroups = new Map<string, TimetableSubject[]>()

    timetableSubjects.forEach((subject) => {
        const key = `${subject.name}-${subject.type}-${subject.subgroup}`
        if (!subjectGroups.has(key)) {
            subjectGroups.set(key, [])
        }
        subjectGroups.get(key)?.push(subject)
    })

    const updatedSubjects: TimetableSubject[] = []

    subjectGroups.forEach((group) => {
        const total = group.length

        group.forEach((subject, index) => {
            const numberedSubject: TimetableSubject = {
                ...subject,
                name: `${subject.name} ${index + 1}/${total}`,
            }
            updatedSubjects.push(numberedSubject)
        })
    })

    timetableSubjects = updatedSubjects.sort(
        (a, b) => a.dateTime.getTime() - b.dateTime.getTime()
    )
}

interface Event {
    key: string
    dot: string
    dates: Date
}

const classTypeMap = new Map<string, string>([
    ['Лекция', 'green'],
    ['Семинар', 'blue'],
    ['Лабораторное занятие', 'yellow'],
])

function populateCalendar() {
    const eventArray: Event[] = []

    for (const subject of timetableSubjects) {
        eventArray.push({
            key: subject.id.toString(),
            dot: classTypeMap.get(subject.type) || 'blue',
            dates: subject.dateTime,
        })
    }

    attrs.value = eventArray
    getToday()
}

function getToday() {
    todaysList.value = []

    const searchDay = selectedDate.value ? selectedDate.value : new Date()
    searchDay.setHours(0, 0, 0, 0)

    for (const subject of timetableSubjects) {
        const subjectDate = new Date(subject.dateTime)
        subjectDate.setHours(0, 0, 0, 0)

        if (subjectDate.getTime() === searchDay.getTime()) {
            todaysList.value.push(subject)
        }
    }
}

const disabledDates = ref<{ start: Date | null; end: Date | null }[]>([
    // Выключить всё до начала семестра
    { start: null, end: new Date(startDate.getTime() - 86400000) },

    // Выключить всё после конца семестра
    { start: new Date(endDate.getTime() + 86400000), end: null },

    // Выключить праздники
    ...holidays.map((holiday) => ({ start: holiday, end: holiday })),

    // Выключить все воскресенья
    ...generateDisabledSundays(startDate, endDate),
])

function generateDisabledSundays(start: Date, end: Date) {
    const disabledSundays = []
    const currentDate = new Date(start)
    const dayOfWeek = currentDate.getDay()
    const daysUntilSunday = (7 - dayOfWeek) % 7
    currentDate.setDate(currentDate.getDate() + daysUntilSunday)

    // Добавление всех воскресений
    while (currentDate <= end) {
        disabledSundays.push({
            start: new Date(currentDate),
            end: new Date(currentDate),
        })
        currentDate.setDate(currentDate.getDate() + 7)
    }

    return disabledSundays
}
</script>
<template>
    <div class="h-screen flex flex-row">
        <div class="p-3 flex justify-center items-center">
            <div class="w-[50vw] flex flex-col justify-center items-center">
                <NuxtImg
                    width="300px"
                    class="select-none"
                    src="/stankin-logo-eng.svg"
                    placeholder />
                <BaseButton
                    class="w-[300px] mt-5 mb-5"
                    @click="generateSchedule">
                    Сгенерировать расписание!
                </BaseButton>
                <DatePicker
                    v-model="selectedDate"
                    :disabled-dates="disabledDates"
                    :attributes="attrs"
                    expanded
                    :first-day-of-week="2"
                    :color="'gray'"
                    locale="ru"
                    is-dark
                    borderless
                    title-position="left"
                    class="rounded-lg"
                    @click="getToday()" />
                <div
                    v-if="todaysList"
                    class="overflow-auto h-[40vh] w-full scrollbar mt-3">
                    <BaseSubjectCard
                        v-for="subject in todaysList"
                        :key="subject.id"
                        :subject="subject" />
                </div>
            </div>
        </div>
        <div class="p-3 mx-auto overflow-auto scrollbar">
            <p class="text-lg text-accent">Коллапс волновой функции</p>
            <div class="border-[1px] w-full border-primary" />
            <p class="mb-3">Параметры</p>
            <BaseChart
                v-model="weekDayWeights"
                :max-weight="5"
                title="Распределение учебных занятий по неделе">
                <p>П</p>
                <p>В</p>
                <p>С</p>
                <p>Ч</p>
                <p>П</p>
                <p>С</p>
            </BaseChart>
            <BaseChart
                v-model="timeSlotWeights"
                :max-weight="5"
                title="Распределение учебных занятий по дню"
                class="mt-3">
                <p />
                <p />
                <p class="font-thin">08:30</p>
                <p class="font-thin">10:20</p>
                <p class="font-thin">12:20</p>
                <p class="font-thin">14:10</p>
                <p class="font-thin">16:00</p>
                <p class="font-thin">18:00</p>
                <p class="font-thin">19:40</p>
                <p class="font-thin">21:20</p>
                <p />
                <p />
            </BaseChart>
            <BaseRange
                id="range-input1"
                v-model="dayReductionWeight"
                min="0"
                max="10"
                class="mt-3"
                >Параметр комкования пар:</BaseRange
            >
            <BaseRange
                id="range-input2"
                v-model="dayReductionFalloff"
                min="0"
                max="1"
                class="mt-3"
                >Параметр "оконности":</BaseRange
            >
            <!-- <p>Рекурсивно распространять занятия понедельно: true</p> -->
            <BaseCheckbox v-model="consistentWeeks" class="mt-3"
                >Рекурсивно распространять занятия понедельно</BaseCheckbox
            >
            <p class="text-lg text-accent mt-3">Генетический алгоритм</p>
            <div class="border-[1px] w-full border-primary" />
            <p class="mb-3">Параметры</p>
        </div>
    </div>
</template>
<style>
.vc-container {
    background-color: #1d2021;
}

.vc-container .vc-weekday {
    color: #e6cf90;
}

.vc-container .vc-weekday-1 {
    color: #836117;
}
</style>
