<script setup lang="ts">
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import type { TimetableSubject } from '~/types/frontend/api';

useSeoMeta({
  title: 'Генератор расписания',
  description: 'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
  ogTitle: 'Генератор расписания',
  ogDescription: 'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
  ogImage: '',
  ogUrl: '',
  twitterTitle: 'Генератор расписания',
  twitterDescription: 'Инструмент для генерации расписания МГТУ «СТАНКИН» учебных занятий ',
  twitterImage: '',
  twitterCard: 'summary'
});

const selectedDate = ref(new Date("2024-02-12"));
const attrs = ref<Event[]>([]);
const todaysList = ref<TimetableSubject[]>([]);
let timetableSubjects: TimetableSubject[] = []

async function generateSchedule() {
  try {
    const timetable = await $fetch<TimetableSubject[]>('/api/generate');

    if (!timetable) {
      console.warn('Расписание не пришло с бэкенда');
      return;
    }

    console.log("Timetable length: ", timetable.length);

    timetableSubjects = timetable.map(subject => ({
      ...subject,
      dateTime: new Date(subject.dateTime)
    }));
    numberSubjects();
    populateCalendar();
  } catch (err) {
    console.error('Ошибка фетчинга расписания:', err);
  }
}

function numberSubjects() {
  const subjectGroups = new Map<string, TimetableSubject[]>();

  timetableSubjects.forEach(subject => {
    const key = `${subject.name}-${subject.type}-${subject.subgroup}`;
    if (!subjectGroups.has(key)) {
      subjectGroups.set(key, []);
    }
    subjectGroups.get(key)?.push(subject);
  });

  const updatedSubjects: TimetableSubject[] = [];

  subjectGroups.forEach((group) => {
    const total = group.length;

    group.forEach((subject, index) => {
      const numberedSubject: TimetableSubject = {
        ...subject,
        name: `${subject.name} ${index + 1}/${total}`
      };
      updatedSubjects.push(numberedSubject);
    });
  });

  timetableSubjects = updatedSubjects;
}

interface Event {
    key: string;
    dot: string;
    dates: Date;
}

const classTypeMap = new Map<string, string>([
  ['Лекция', "green"],
  ['Семинар', "blue"],
  ['Лабораторное занятие', "yellow"]
]);

function populateCalendar() {
  const eventArray: Event[] = [];

  for (const subject of timetableSubjects) {
    eventArray.push({
      key: subject.id.toString(),
      dot: classTypeMap.get(subject.type) || "blue",
      dates: subject.dateTime
    });
  }

  attrs.value = eventArray;
  getToday();
}

function getToday() {
  todaysList.value = [];

  const searchDay = selectedDate.value ? selectedDate.value : new Date();
  searchDay.setHours(0, 0, 0, 0);

  for (const subject of timetableSubjects) {
    const subjectDate = new Date(subject.dateTime);
    subjectDate.setHours(0, 0, 0, 0);

    if (subjectDate.getTime() === searchDay.getTime()) {
      todaysList.value.push(subject);
    }
  }
}
</script>
<template>
  <div class="h-screen p-3 flex justify-center items-center">
    <div class="w-[50vw] flex flex-col justify-center items-center">
      <img width="300px" class="select-none" src="/stankin-logo-eng.svg" >
      <BaseButton class="w-[300px] mt-5 mb-5" @click="generateSchedule">
        Сгенерировать расписание!
      </BaseButton>
      <DatePicker v-model="selectedDate" :attributes="attrs" expanded :first-day-of-week="2" :color="'gray'" locale="ru" is-dark borderless title-position="left" class="rounded-lg" @click="getToday()" />
      <div v-if="todaysList" class="overflow-auto h-[40vh] w-full scrollbar mt-3">
        <BaseSubjectCard v-for="subject in todaysList" :key="subject.id" :subject="subject" />
      </div>
    </div>
  </div>
</template>
<style>
.vc-container {
    background-color: #1D2021;
}

.vc-container .vc-weekday {
    color:#e6cf90;
}

.vc-container .vc-weekday-1 {
    color:#836117;
}
</style>