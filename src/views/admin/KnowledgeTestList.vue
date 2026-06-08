<script setup lang="ts">
import { knowledgeTestClasses, tests } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Knowledge Tests (Screening)</h2>
      <button @click="router.push('/admin/knowledge-tests/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">Name</th><th class="p-3">Test</th><th class="p-3">Pass Score</th><th class="p-3">Participants</th><th class="p-3">Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="kt in knowledgeTestClasses" :key="kt.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ kt.name }}</td>
            <td class="p-3">{{ tests.find(t => t.id === kt.testId)?.title ?? '-' }}</td>
            <td class="p-3">{{ kt.passingScore }}</td>
            <td class="p-3">{{ kt.participants.length }}/{{ kt.maxParticipants }}</td>
            <td class="p-3 flex gap-2">
              <button @click="router.push('/admin/knowledge-tests/' + kt.id + '/results')" class="text-green-600 hover:underline text-sm">Results</button>
              <button @click="router.push('/admin/knowledge-tests/' + kt.id)" class="text-blue-600 hover:underline text-sm">Edit</button>
            </td>
          </tr>
          <tr v-if="knowledgeTestClasses.length === 0"><td colspan="5" class="p-6 text-center text-gray-400">No knowledge tests yet</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
