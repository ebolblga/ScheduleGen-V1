<script setup lang="ts">
import type { TimetableSubject } from '~/types/frontend/api';

const props = defineProps<{
  subject: TimetableSubject;
}>();

const timeMap = new Map([
    ["08:30", "08:30 - 10:10"],
    ["10:20", "10:20 - 12:00"],
    ["12:20", "12:20 - 14:00"],
    ["14:10", "14:10 - 15:50"],
    ["16:00", "16:00 - 17:40"],
    ["18:00", "18:00 - 19:30"],
    ["19:40", "19:40 - 21:10"],
    ["21:20", "21:20 - 22:50"],
    ["08:30l", "08:30 - 12:00"],
    ["10:20l", "10:20 - 14:00"],
    ["12:20l", "12:20 - 15:50"],
    ["14:10l", "14:10 - 17:40"],
    ["16:00l", "16:00 - 19:30"],
    ["18:00l", "18:00 - 21:10"],
    ["19:40l", "19:40 - 22:50"],
    ["21:20l", "21:20 - 01:00"]
]);

function formatTime(date: Date, subjectType: string): string {
  const hours: string = String(date.getHours()).padStart(2, '0');
  const minutes: string = String(date.getMinutes()).padStart(2, '0');
  const formattedTime = subjectType === "Лабораторное занятие" ? `${hours}:${minutes}l` : `${hours}:${minutes}`;
  const timeRange = timeMap.get(formattedTime);
  return timeRange ? timeRange : formattedTime;
}
</script>
<template>
  <div class="w-full bg-background2 rounded-lg mb-3 p-3 overflow-hidden">
    <p class="text-sm text-text inline">{{ subject.groups + ' ' + subject.subgroup }}</p>
    <p class="font-bold text-primary italic">{{ subject.name }}</p>
    <p
      class="text-sm font-semibold"
      :class="{
        'text-[#0D7211]': subject.type === 'Лекция',
        'text-[#1962DA]': subject.type === 'Семинар',
        'text-[#8F5107]': subject.type === 'Лабораторное занятие'
      }"
    >
      {{ subject.type }}
    </p>
    <p class="text-sm text-text inline">{{ formatTime(subject.dateTime, subject.type) }}</p>
    <p v-if="subject.location === 'Онлайн' && subject.url !== ''" class="text-right text-sm underline italic cursor-pointer text-blue-600">
      <a :href="subject.url" target="_blank" rel="noopener noreferrer">{{ subject.location }}</a>
    </p>
    <p v-else class="text-sm text-right text-secondary">{{ subject.location }}</p>
  </div>
</template>