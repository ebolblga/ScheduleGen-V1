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

    console.log(timetable);
    timetableSubjects = timetable;
    populateCalendar();
  } catch (err) {
    console.error('Ошибка фетчинга расписания:', err);
  }
}

interface Event {
    key: string;
    dot: string;
    dates: Date;
}

const classTypeMap = new Map<string, string>([
  ['Лекция', "green"],
  ['Семинар', "blue"],
  ['Лабораторная работа', "yellow"]
]);

function populateCalendar() {
  let eventArray: Event[] = [];

  for (const subject of timetableSubjects) {
    eventArray.push({
      key: subject.id.toString(),
      dot: classTypeMap.get(subject.type) || "blue",
      dates: new Date(subject.dateTime)
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
      <img width="300px" class="select-none" src="/stankin-logo-eng.svg" />
      <BaseButton @click="generateSchedule" class="w-[300px] mt-5 mb-5">
        Сгенерировать расписание!
      </BaseButton>
      <DatePicker :attributes="attrs" @click="getToday()" expanded :first-day-of-week="2" :color="'gray'" locale="ru" is-dark borderless title-position="left" class="rounded-lg" v-model="selectedDate" />
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