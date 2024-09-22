<script setup lang="ts">
import { defineProps } from 'vue';
import type { TimetableSubject } from '~/types/backend/db';

const props = defineProps<{
  subject: TimetableSubject;
}>();

function formatTime(date: Date): string {
  const hours: string = String(date.getHours()).padStart(2, '0');
  const minutes: string = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
</script>
<template>
  <div class="w-full bg-background2 rounded-lg mb-3 p-3 overflow-hidden">
    <p class="text-sm text-text inline">{{ subject.groups + ' ' + subject.subgroup }}</p>
    <p class="font-bold text-primary italic">{{ subject.name }}</p>
    <p
      class="text-sm font-semibold"
      :class="{
        'text-[#0D7211]': subject.type.includes('Лекция'),
        'text-[#1962DA]': subject.type.includes('Семинар'),
        'text-[#8F5107]': subject.type.includes('Лабораторное занятие')
      }"
    >
      {{ subject.type }}
    </p>
    <p class="text-sm text-text inline">{{ formatTime(new Date(subject.dateTime)) }}</p>
    <p v-if="subject.location === 'Онлайн' && subject.url !== ''" class="text-right text-sm underline italic cursor-pointer text-blue-600">
      <a :href="subject.url" target="_blank" rel="noopener noreferrer">{{ subject.location }}</a>
    </p>
    <p v-else class="text-sm text-right text-secondary">{{ subject.location }}</p>
  </div>
</template>