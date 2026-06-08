<script setup lang="ts">
import { tests } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Test Bank</h2>
      <button @click="router.push('/admin/tests/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Test</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">Title</th><th class="p-3">Questions</th><th class="p-3">Time</th><th class="p-3">Random</th><th class="p-3">Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in tests" :key="t.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ t.title }}</td>
            <td class="p-3">{{ t.questions.length }}</td>
            <td class="p-3">{{ t.timeLimit }} min</td>
            <td class="p-3">{{ t.randomize ? (t.pickCount ?? 'all') + ' picked' : 'No' }}</td>
            <td class="p-3"><button @click="router.push('/admin/tests/' + t.id)" class="text-blue-600 hover:underline text-sm">Edit</button></td>
          </tr>
          <tr v-if="tests.length === 0"><td colspan="5" class="p-6 text-center text-gray-400">No tests yet</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
