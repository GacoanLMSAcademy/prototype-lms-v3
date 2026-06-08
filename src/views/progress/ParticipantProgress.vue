<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, participantProgress as progress, inClasses } from '@/data/mockData'

const auth = useAuthStore()
const myClasses = computed(() => classes.filter(c => c.participants.includes(auth.userId)))

const myProgress = computed(() => progress.filter(p => p.participantId === auth.userId))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Progress</h2>
    <div v-for="cls in myClasses" :key="cls.id" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-3">{{ cls.name }}</h3>
      <div class="space-y-2">
        <div v-for="p in myProgress.filter(pr => pr.classId === cls.id)" :key="p.methodId" class="border-t py-2 flex items-center justify-between">
          <div>
            <span class="text-sm font-medium capitalize">{{ p.methodType }}</span>
            <span v-if="p.score !== undefined" class="text-sm text-gray-500 ml-2">Score: {{ p.score }}%</span>
          </div>
          <span class="text-xs px-2 py-0.5 rounded" :class="p.status === 'passed' || p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : p.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'">{{ p.status }}</span>
        </div>
        <p v-if="myProgress.filter(pr => pr.classId === cls.id).length === 0" class="text-gray-400 text-sm">No progress data</p>
      </div>
    </div>
  </div>
</template>
