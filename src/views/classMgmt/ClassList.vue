<script setup lang="ts">
import { classes, curricula, users } from '@/data/mockData'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
const isSupervisor = auth.userRole === 'supervisor'
const displayClasses = classes
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Classes (Read-only)</h2>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">Name</th><th class="p-3">Curriculum</th><th class="p-3">Instructor</th><th class="p-3">Dates</th><th class="p-3">Status</th><th class="p-3">Participants</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in displayClasses" :key="c.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ c.name }}</td>
            <td class="p-3">{{ curricula.find(cur => cur.id === c.curriculumId)?.title ?? '-' }}</td>
            <td class="p-3">{{ users.find(u => u.id === c.instructorId)?.name ?? '-' }}</td>
            <td class="p-3 text-sm">{{ c.startDate }} — {{ c.endDate }}</td>
            <td class="p-3"><span class="text-xs px-2 py-0.5 rounded" :class="c.status === 'active' ? 'bg-green-100 text-green-800' : c.status === 'completed' ? 'bg-gray-100' : 'bg-yellow-100'">{{ c.status }}</span></td>
            <td class="p-3">{{ c.participants.length }}</td>
          </tr>
          <tr v-if="displayClasses.length === 0"><td colspan="6" class="p-6 text-center text-gray-400">No classes</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
