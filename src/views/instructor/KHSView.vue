<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, inClasses, testAttempts, users } from '@/data/mockData'

const auth = useAuthStore()
const myClasses = computed(() => classes.filter(c => c.instructorId === auth.userId || (c.inClassInstructorAssignments ?? []).some(a => a.instructorId === auth.userId)))

const transcripts = computed(() => {
  return myClasses.value.map(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    const entries = curriculum?.items.map(item => {
      const ic = inClasses.find(i => i.id === item.contentId)
      const atts = testAttempts.filter(a => a.classId === cls.id && a.participantId === cls.participants[0])
      const avg = atts.length > 0 ? Math.round(atts.reduce((s, a) => s + a.normalizedScore, 0) / atts.length) : 0
      return { methodTitle: item.trainingMethodType, methodType: item.trainingMethodType, weight: item.weight, score: avg, weightedScore: Math.round((item.weight / 100) * avg), passStatus: avg >= item.passingScore ? 'pass' : 'fail' }
    }) ?? []
    const total = entries.reduce((s, e) => s + e.weightedScore, 0)
    return { className: cls.name, entries, totalScore: total, pass: total >= (curriculum?.passingThreshold ?? 75) }
  })
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">KHS (Transcript)</h2>
    <div v-for="t in transcripts" :key="t.className" class="bg-white rounded shadow p-4 mb-6">
      <h3 class="font-semibold mb-3">{{ t.className }}</h3>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-2">Method</th><th class="p-2">Type</th><th class="p-2">Weight</th><th class="p-2">Score</th><th class="p-2">Weighted</th><th class="p-2">Status</th></tr></thead>
        <tbody>
          <tr v-for="e in t.entries" :key="e.methodTitle" class="border-t text-sm">
            <td class="p-2 capitalize">{{ e.methodTitle }}</td><td class="p-2 text-xs bg-gray-100 px-2 py-0.5 rounded inline-block my-1">{{ e.methodType }}</td>
            <td class="p-2">{{ e.weight }}%</td><td class="p-2">{{ e.score }}</td><td class="p-2">{{ e.weightedScore }}</td>
            <td class="p-2"><span class="text-xs px-2 py-0.5 rounded" :class="e.passStatus === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ e.passStatus }}</span></td>
          </tr>
        </tbody>
        <tfoot class="border-t font-semibold">
          <tr><td colspan="4" class="p-2">Total Score</td><td class="p-2">{{ t.totalScore }}</td><td class="p-2"><span class="text-xs px-2 py-0.5 rounded" :class="t.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ t.pass ? 'Pass' : 'Fail' }}</span></td></tr>
        </tfoot>
      </table>
    </div>
    <div v-if="transcripts.length === 0" class="text-center py-12 text-gray-400">No data available</div>
  </div>
</template>
