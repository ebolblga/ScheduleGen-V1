<script setup lang="ts">
defineProps({
    modelValue: {
        type: Number,
        required: true,
    },
    id: {
        type: String,
        default: '',
    },
})

const emit = defineEmits(['update:modelValue'])
</script>
<template>
    <div>
        <label :for="id" class="block mb-2 text-sm font-medium text-text">
            <slot />
            <span class="text-primary">{{ ' ' + modelValue }}</span>
        </label>
        <input
            type="range"
            step="0.1"
            :value="modelValue"
            class="w-full h-1 bg-accent accent-chart rounded-lg appearance-none cursor-pointer"
            @input="
                (event: Event) =>
                    emit(
                        'update:modelValue',
                        +(event.target as HTMLInputElement).value
                    )
            " >
    </div>
</template>
