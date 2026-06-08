<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { assessments, classes } from '@/data/mockData'
const auth = useAuthStore()
const myAssessments = assessments.filter(a => a.raterId === auth.userId)
const myClasses = classes.filter(c => c.raters.includes(auth.userId))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Rater Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Assigned Classes</p><p class="text-2xl font-bold">{{ myClasses.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Assessments Done</p><p class="text-2xl font-bold">{{ myAssessments.length }}</p></div>
    </div>
    <div class="bg-white p-6 rounded shadow">
      <p class="text-gray-700">Welcome, {{ auth.userName }}. Evaluate participants from the Assessments menu.</p>
    </div>
  </div>
</template>
