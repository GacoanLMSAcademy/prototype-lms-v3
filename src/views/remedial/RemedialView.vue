<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { remedials, users, classes } from '@/data/mockData'

const auth = useAuthStore()
const isInstructor = auth.userRole === 'instructor'
const isSupervisor = auth.userRole === 'supervisor'

const displayRemedials = computed(() => remedials.map(r => ({
  ...r,
  participantName: users.find(u => u.id === r.participantId)?.name ?? r.participantId,
  className: classes.find(c => c.id === r.classId)?.name ?? r.classId,
})))

function assign() { alert('Assign remedial (mock)') }
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Remedial</h2>
      <button v-if="isSupervisor" @click="assign" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Assign Remedial</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-3">Participant</th><th class="p-3">Class</th><th class="p-3">Method</th><th class="p-3">Status</th></tr></thead>
        <tbody>
          <tr v-for="r in displayRemedials" :key="r.id" class="border-t">
            <td class="p-3">{{ r.participantName }}</td><td class="p-3">{{ r.className }}</td>
            <td class="p-3 capitalize">{{ r.methodType }}</td>
            <td class="p-3"><span class="text-sm px-2 py-0.5 rounded" :class="r.status === 'completed' ? 'bg-green-100 text-green-800' : r.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'">{{ r.status }}</span></td>
          </tr>
          <tr v-if="displayRemedials.length === 0"><td colspan="4" class="p-6 text-center text-gray-400">No remedial assignments</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
