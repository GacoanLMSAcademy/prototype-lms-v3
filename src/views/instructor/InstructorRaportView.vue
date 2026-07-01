<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { instructorRaports, users } from '@/data/mockData'

const auth = useAuthStore()

const myRaports = computed(() => {
  return instructorRaports.filter(r => r.instructorId === auth.userId && r.status === 'published')
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Instructor Raports</h2>

    <div v-if="myRaports.length === 0" class="text-center py-12 text-gray-400">
      No published raports available.
    </div>

    <div v-for="raport in myRaports" :key="raport.id" class="bg-white rounded shadow mb-4">
      <div class="p-4 flex justify-between items-center">
        <div>
          <h3 class="font-semibold">{{ users.find(u => u.id === raport.instructorId)?.name || raport.instructorId }}</h3>
          <p class="text-sm text-gray-500">{{ raport.month }}/{{ raport.year }}</p>
        </div>
        <span :class="['px-3 py-1 rounded text-sm', 'bg-green-100 text-green-700']">
          Published
        </span>
      </div>
      <div class="p-4 border-t">
        <h4 class="font-medium mb-2">Quantitative Data</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Completion Rate</p>
            <p class="font-bold">{{ raport.quantitativeData.completionRate }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Pass Rate</p>
            <p class="font-bold">{{ raport.quantitativeData.passRate }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Avg Feedback</p>
            <p class="font-bold">{{ Object.values(raport.quantitativeData.feedbackAverage).reduce((a,b) => a+b, 0) / Object.keys(raport.quantitativeData.feedbackAverage).length }}/5</p>
          </div>
        </div>
      </div>
      <div class="p-4 border-t" v-if="raport.qualitativeAnalysis">
        <h4 class="font-medium mb-2">Qualitative Analysis</h4>
        <p class="text-sm">{{ raport.qualitativeAnalysis }}</p>
      </div>
    </div>
  </div>
</template>