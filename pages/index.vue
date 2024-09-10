<script setup lang="ts">
import type { Lecturer } from '~/types/backend/db';

useSeoMeta({
  title: 'Генератор расписания',
  description: 'Инструмент для генерации расписания МГТУ «СТАНКИН»',
  ogTitle: 'Генератор расписания',
  ogDescription: 'Инструмент для генерации расписания МГТУ «СТАНКИН»',
  ogImage: '',
  ogUrl: '',
  twitterTitle: 'Генератор расписания',
  twitterDescription: 'Инструмент для генерации расписания МГТУ «СТАНКИН»',
  twitterImage: '',
  twitterCard: 'summary'
});

const { data: lecturers, error } = await useFetch<Lecturer[]>('/api/get-data');

if (error.value) {
  console.error('Error fetching lecturer names:', error.value);
}
</script>
<template>
  <div>
    <BaseButton>Сгенерировать расписание!</BaseButton>
    <h1>Список преподов: </h1>
    <ul>
      <li v-for="lecturer in lecturers" :key="lecturer.surname">{{ lecturer.surname }}</li>
    </ul>
  </div>
</template>