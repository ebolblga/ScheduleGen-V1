<script setup lang="ts">
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex items-center">
    <input
      type="checkbox"
      :checked="modelValue"
      class="w-4 h-4 cursor-pointer accent-accent focus:ring-primary focus:ring-2 mr-2"
      @input="(event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked)"
    >
    <slot />
  </div>
</template>