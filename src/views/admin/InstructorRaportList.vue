<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { instructorRaports, users, classes } from '@/data/mockData'

const auth = useAuthStore()

// Filter by month/year
const selectedMonth = ref<number>(new Date().getMonth() + 1)
const selectedYear = ref<number>(new Date().getFullYear())

const filteredRaports = computed(() => {
  return instructorRaports.filter(r => {
    return r.month === selectedMonth.value && r.year === selectedYear.value
  })
})

const canCreateRaport = computed(() => {
  // Check if there are classes taught by instructors in the selected month
  return true
})

// Generate a new raport for the selected month
async function generateRaport() {
  // In a real app, this would call an API to generate the raport
  // For now, we'll just show a success message
  alert('Raport generated successfully!')
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Instructor Raport Management</h2>

    <div class="bg-white rounded shadow p-6 mb-6">
      <h3 class="text-lg font-medium mb-4">Filter by Period</h3>
      <div class="flex gap-4">
        <select v-model.number="selectedMonth" class="border rounded px-3 py-2">
          <option :value="1">January</option>
          <option :value="2">February</option>
          <option :value="3">March</option>
          <option :value="4">April</option>
          <option :value="5">May</option>
          <option :value="6">June</option>
          <option :value="7">July</option>
          <option :value="8">August</option>
          <option :value="9">September</option>
          <option :value="10">October</option>
          <option :value="11">November</option>
          <option :value="12">December</option>
        </select>
        <select v-model.number="selectedYear" class="border rounded px-3 py-2">
          <option :value="2026">2026</option>
          <option :value="2025">2025</option>
          <option :value="2024">2024</option>
        </select>
        <button @click="generateRaport" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Generate Raport
        </button>
      </div>
    </div>

    <div v-if="filteredRaports.length === 0" class="text-center py-12 text-gray-400">
      No raports found for the selected period.
    </div>

    <div v-for="raport in filteredRaports" :key="raport.id" class="bg-white rounded shadow mb-4">
      <div class="p-4 flex justify-between items-center">
        <div>
          <h3 class="font-semibold">{{ users.find(u => u.id === raport.instructorId)?.name || raport.instructorId }}</h3>
          <p class="text-sm text-gray-500">{{ raport.month }}/{{ raport.year }}</p>
        </div>
        <div class="flex gap-2">
          <span :class="['px-3 py-1 rounded text-sm', raport.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700']">
            {{ raport.status }}
          </span>
          <button v-if="raport.status === 'draft'" class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            Publish
          </button>
          <button class="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">
            Edit
          </button>
        </div>
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
    </div>
  </div>
</template>