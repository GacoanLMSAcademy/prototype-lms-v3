<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, inClasses, users, lgis } from '@/data/mockData'

const auth = useAuthStore()
const myClasses = computed(() => classes.filter(c => c.instructorId === auth.userId || (c.inClassInstructorAssignments ?? []).some(a => a.instructorId === auth.userId)))

const tableData = computed(() => {
  const rows: { participantName: string; inClassTitle: string; preScore: number; postScore: number; lgi: string }[] = []
  myClasses.value.forEach(cls => {
    cls.participants.forEach(pid => {
      inClasses.forEach(ic => {
        const lgi = lgis.find(l => l.participantId === pid && l.inClassId === ic.id)
        if (lgi) rows.push({ participantName: users.find(u => u.id === pid)?.name ?? pid, inClassTitle: ic.title, preScore: lgi.preTestScore, postScore: lgi.postTestScore, lgi: lgi.lgiValue.toFixed(2) })
      })
    })
  })
  return rows
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">LGI Report (Learning Gain Indicator)</h2>
    <p class="text-sm text-gray-500 mb-4">LGI = (Post-Test - Pre-Test) / (100 - Pre-Test)</p>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-3">Participant</th><th class="p-3">Session</th><th class="p-3">Pre</th><th class="p-3">Post</th><th class="p-3">LGI</th></tr></thead>
        <tbody>
          <tr v-for="(row, idx) in tableData" :key="idx" class="border-t hover:bg-gray-50">
            <td class="p-3">{{ row.participantName }}</td><td class="p-3">{{ row.inClassTitle }}</td>
            <td class="p-3">{{ row.preScore }}</td><td class="p-3">{{ row.postScore }}</td>
            <td class="p-3 font-medium">{{ row.lgi }}</td>
          </tr>
          <tr v-if="tableData.length === 0"><td colspan="5" class="p-6 text-center text-gray-400">No LGI data</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
