<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { classes, testAttempts } from '@/data/mockData'
const auth = useAuthStore()
const myClasses = classes.filter(c => c.participants.includes(auth.userId))
const myAttempts = testAttempts.filter(a => a.participantId === auth.userId)
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Participant Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">My Classes</p><p class="text-2xl font-bold">{{ myClasses.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Tests Taken</p><p class="text-2xl font-bold">{{ myAttempts.length }}</p></div>
    </div>
    <div class="bg-white p-6 rounded shadow">
      <p class="text-gray-700">Welcome, {{ auth.userName }}! Access your tests, progress, and transcript from the sidebar.</p>
    </div>
  </div>
</template>
