<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { testAttempts, tests } from '@/data/mockData'

const route = useRoute()
const router = useRouter()
const attempt = testAttempts.find(a => a.id === route.query.attemptId)
const test = tests.find(t => t.id === attempt?.testId)
</script>

<template>
  <div v-if="attempt && test" class="max-w-lg mx-auto">
    <h2 class="text-2xl font-bold mb-6">Test Result</h2>
    <div class="bg-white rounded shadow p-6 text-center">
      <p class="text-gray-500 mb-2">{{ test.title }}</p>
      <p class="text-5xl font-bold mb-2" :class="attempt.normalizedScore >= 70 ? 'text-green-600' : 'text-red-600'">{{ attempt.normalizedScore }}%</p>
      <p class="text-gray-600 mb-4">{{ attempt.score }} / {{ attempt.totalPoints }} points</p>
      <div class="w-full bg-gray-200 rounded-full h-3 mb-6"><div class="h-3 rounded-full transition-all" :class="attempt.normalizedScore >= 70 ? 'bg-green-600' : 'bg-red-600'" :style="{ width: attempt.normalizedScore + '%' }"></div></div>
      <button @click="router.push('/participant/tests')" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Back</button>
    </div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Result not found</div>
</template>
