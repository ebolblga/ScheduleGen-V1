<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import { colors } from '../../types/tailwindcss'

interface Props {
    modelValue: number[]
    maxWeight: number
    title: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])
const localWeights = ref([...props.modelValue])

const chart = ref<HTMLDivElement | null>(null)

onMounted(() => {
    updateChart()
})

watch(
    () => props.modelValue,
    (newVal) => {
        localWeights.value = [...newVal]
    }
)

function updateChart() {
    const svg_dx = 500
    const svg_dy = 300
    const margin = { top: 20, right: 70, bottom: 20, left: 70 }

    // Очистка прошлого SVG
    const svg = d3
        .select(chart.value)
        .html('')
        .append('svg')
        .attr('width', svg_dx)
        .attr('height', svg_dy)

    const numPoints = localWeights.value.length

    // Масштаб X
    const x = d3
        .scaleLinear()
        .domain([0, numPoints - 1])
        .range([margin.left, svg_dx - margin.right])

    // Масштаб Y
    const y = d3
        .scaleLinear()
        .domain([0, props.maxWeight])
        .nice()
        .range([svg_dy - margin.bottom, margin.top])

    // Дополнительные точки для сглаживания линии за пределами диаграммы.
    const extendedData = [
        localWeights.value[0],
        ...localWeights.value,
        localWeights.value[numPoints - 1],
    ]

    // Генерация линии
    const line = d3
        .line<number>()
        .x((d, i) => {
            if (i === 0) return x(0) - (x(1) - x(0)) // Экстраполировать влево (до первой точки)
            if (i === numPoints + 1) return x(numPoints - 1) + (x(1) - x(0)) // Экстраполировать вправо (после последней точки)
            return x(i - 1)
        })
        .y((d) => y(d))
        .curve(d3.curveCatmullRom)

    // Добавление линии в SVG
    svg.append('path')
        .datum(extendedData)
        .attr('fill', 'none')
        .attr('stroke', colors.chart)
        .attr('stroke-width', 2)
        .attr('d', line(extendedData))

    // Drag behavior
    const drag = d3
        .drag<SVGCircleElement, number>()
        .on('start', function () {
            d3.select(this).raise().attr('stroke', 'black')
        })
        .on('drag', function (event) {
            const index = d3.select(this).datum() as number

            // Получение положения Y относительно конкретной диаграммы
            const newY = Math.max(
                0,
                Math.min(props.maxWeight, y.invert(event.y))
            )

            localWeights.value[index] = newY

            emit('update:modelValue', localWeights.value)

            // Обновление точек
            d3.select(this).attr('cy', y(newY))

            // Обновление подписи
            svg.selectAll('text')
                .filter((_, i) => i === index)
                .attr('y', y(newY) - 10)
                .text(newY.toFixed(2))

            const updatedExtendedData = [
                localWeights.value[0],
                ...localWeights.value,
                localWeights.value[numPoints - 1],
            ]

            // Обновление линии
            svg.select('path')
                .datum(updatedExtendedData)
                .attr('d', line(updatedExtendedData))
        })
        .on('end', function () {
            d3.select(this).attr('stroke', null)
        })

    // Добавление точек
    svg.selectAll('circle')
        .data(localWeights.value)
        .join('circle')
        .attr('cx', (d, i) => x(i))
        .attr('cy', (d) => y(d))
        .attr('r', 5)
        .attr('fill', colors.chart)
        .call(drag as any)
        .each(function (d, i) {
            d3.select(this).datum(i)
        })

    // Добавление подписей
    svg.selectAll('text')
        .data(localWeights.value)
        .join('text')
        .attr('x', (d, i) => x(i))
        .attr('y', (d) => y(d) - 10)
        .attr('text-anchor', 'middle')
        .text((d) => d.toFixed(2))
        .attr('fill', colors.primary)
}
</script>
<template>
    <div>
        <p class="text-base">{{ props.title }}</p>
        <div class="bg-background2 rounded-md p-2 select-none">
            <div ref="chart" class="fade-svg w-[500px] h-[300px]" />
            <div class="flex justify-evenly font-bold text-primary">
                <slot />
            </div>
        </div>
    </div>
</template>
<style scoped>
.fade-svg {
    mask-image: linear-gradient(
        90deg,
        transparent,
        black 20%,
        black 80%,
        transparent
    );
}
</style>
