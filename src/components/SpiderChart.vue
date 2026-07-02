<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: { sectionName: string; averageScore: number }[]
}>()

const maxScore = 5
const size = 200
const center = size / 2

const points = computed(() => {
  const angleStep = (2 * Math.PI) / props.data.length
  return props.data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2
    const radius = (item.averageScore / maxScore) * center
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  })
})

const path = computed(() => {
  return points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 200 200">
    <!-- Web/Grid -->
    <g stroke="#e2e8f0" fill="none">
        <circle v-for="i in 5" :key="i" :cx="center" :cy="center" :r="(i/5) * center" />
        <line v-for="(p, i) in points" :key="i" :x1="center" :y1="center" :x2="center + center * Math.cos(i * (2*Math.PI/data.length) - Math.PI/2)" :y2="center + center * Math.sin(i * (2*Math.PI/data.length) - Math.PI/2)" />
    </g>
    <!-- Data -->
    <path :d="path" fill="rgba(59, 130, 246, 0.5)" stroke="#3b82f6" stroke-width="2" />
  </svg>
</template>