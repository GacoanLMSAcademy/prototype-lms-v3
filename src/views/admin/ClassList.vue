<script setup lang="ts">
import { classes, curricula, users } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()

function instructorSummary(c: typeof classes[number]) {
  const ids = new Set([c.instructorId, ...(c.inClassInstructorAssignments?.map(a => a.instructorId) ?? [])].filter(Boolean))
  return Array.from(ids).map(id => users.find(u => u.id === id)?.name ?? id).join(', ') || '-'
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Classes</h2>
      <button @click="router.push('/admin/classes/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Class</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">Name</th><th class="p-3">Curriculum</th><th class="p-3">Instructors</th><th class="p-3">Dates</th><th class="p-3">Status</th><th class="p-3">Participants</th><th class="p-3">Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ c.name }}</td>
            <td class="p-3">{{ curricula.find(cur => cur.id === c.curriculumId)?.title ?? '-' }}</td>
            <td class="p-3">{{ instructorSummary(c) }}</td>
            <td class="p-3 text-sm">{{ c.startDate }} — {{ c.endDate }}</td>
            <td class="p-3"><span class="text-xs px-2 py-0.5 rounded" :class="c.status === 'active' ? 'bg-green-100 text-green-800' : c.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'">{{ c.status }}</span></td>
            <td class="p-3">{{ c.participants.length }}</td>
            <td class="p-3"><button @click="router.push('/admin/classes/' + c.id)" class="text-blue-600 hover:underline text-sm">Detail</button></td>
          </tr>
          <tr v-if="classes.length === 0"><td colspan="7" class="p-6 text-center text-gray-400">No classes yet</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
