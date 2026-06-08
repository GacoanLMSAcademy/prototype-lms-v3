<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, testAttempts, assessments, multiraterMethods, presentationMethods, validationMethods, skillTestMethods, verifyMethods, accountingMethods } from '@/data/mockData'

const auth = useAuthStore()
const myClasses = computed(() => classes.filter(c => c.participants.includes(auth.userId)))

const formMethodTypes = ['multirater', 'presentation', 'validation', 'skillTest', 'verify'] as const

function getMethodEntities(type: string) {
  if (type === 'multirater') return multiraterMethods
  if (type === 'presentation') return presentationMethods
  if (type === 'validation') return validationMethods
  if (type === 'skillTest') return skillTestMethods
  if (type === 'verify') return verifyMethods
  if (type === 'accounting') return accountingMethods
  return []
}

const transcripts = computed(() => myClasses.value.map(cls => {
  const curriculum = curricula.find(c => c.id === cls.curriculumId)
  const entries = curriculum?.items.map(item => {
    let score = 0
    if (item.trainingMethodType === 'accounting' || item.trainingMethodType === 'inClass' || item.trainingMethodType === 'knowledgeTest') {
      const atts = testAttempts.filter(a => a.participantId === auth.userId && a.classId === cls.id)
      score = atts.length > 0 ? Math.round(atts.reduce((s, a) => s + a.normalizedScore, 0) / atts.length) : 0
    } else if (formMethodTypes.includes(item.trainingMethodType as any)) {
      const entity = getMethodEntities(item.trainingMethodType).find((e: any) => e.id === item.contentId) as any
      const cats = entity?.categories ?? []
      const totalWeight = cats.reduce((s: number, c: any) => s + c.weight, 0) || 1
      let weightedSum = 0
      cats.forEach((cat: any) => {
        const ass = assessments.filter(a => a.participantId === auth.userId && a.classId === cls.id && a.trainingMethodId === item.id && a.categoryId === cat.id)
        const avg = ass.length > 0 ? ass.reduce((s, a) => s + a.normalizedScore, 0) / ass.length : 0
        weightedSum += avg * (cat.weight / totalWeight)
      })
      score = Math.round(weightedSum)
    }
    const passStatus = score >= item.passingScore ? 'pass' : 'fail'
    return { methodTitle: item.trainingMethodType, methodType: item.trainingMethodType, weight: item.weight, score, weightedScore: Math.round((item.weight / 100) * score), passStatus }
  }) ?? []
  const total = entries.reduce((s, e) => s + e.weightedScore, 0)
  return { className: cls.name, entries, totalScore: total, pass: total >= (curriculum?.passingThreshold ?? 75) }
}))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Transcript (KHS)</h2>
    <div v-for="t in transcripts" :key="t.className" class="bg-white rounded shadow p-4 mb-6">
      <h3 class="font-semibold mb-3">{{ t.className }}</h3>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-2">Method</th><th class="p-2">Weight</th><th class="p-2">Score</th><th class="p-2">Weighted</th><th class="p-2">Status</th></tr></thead>
        <tbody>
          <tr v-for="e in t.entries" :key="e.methodTitle" class="border-t text-sm">
            <td class="p-2 capitalize">{{ e.methodTitle }}</td><td class="p-2">{{ e.weight }}%</td><td class="p-2">{{ e.score }}</td><td class="p-2">{{ e.weightedScore }}</td>
            <td class="p-2"><span class="text-xs px-2 py-0.5 rounded" :class="e.passStatus === 'pass' ? 'bg-green-100' : 'bg-red-100'">{{ e.passStatus }}</span></td>
          </tr>
        </tbody>
        <tfoot class="border-t font-semibold">
          <tr><td colspan="3" class="p-2">Total</td><td class="p-2">{{ t.totalScore }}</td><td class="p-2"><span class="text-xs px-2 py-0.5 rounded" :class="t.pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ t.pass ? 'Pass' : 'Fail' }}</span></td></tr>
        </tfoot>
      </table>
    </div>
    <div v-if="transcripts.length === 0" class="text-center py-12 text-gray-400">No transcript data</div>
  </div>
</template>