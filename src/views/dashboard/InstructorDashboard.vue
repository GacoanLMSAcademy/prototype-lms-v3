<script setup lang="ts">
import { tests, materis, inClasses, curricula, classes } from '@/data/mockData'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Instructor Dashboard</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Tests</p><p class="text-2xl font-bold">{{ tests.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Materi</p><p class="text-2xl font-bold">{{ materis.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">In-Classes</p><p class="text-2xl font-bold">{{ inClasses.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Curricula</p><p class="text-2xl font-bold">{{ curricula.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Classes</p><p class="text-2xl font-bold">{{ classes.length }}</p></div>
    </div>
    <div class="bg-white p-6 rounded shadow">
      <p class="text-gray-700">Welcome, {{ auth.userName }}. Build your curriculum and manage classes from the sidebar.</p>
    </div>
  </div>
</template>
