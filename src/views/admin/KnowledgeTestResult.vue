<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { knowledgeTestClasses, testAttempts, users, classes } from '@/data/mockData'

const route = useRoute()
const router = useRouter()

const kt = knowledgeTestClasses.find(kt => kt.id === route.params.id)
const attempts = testAttempts.filter(a => a.classId === kt?.id)
const passScore = kt?.passingScore ?? 70

const results = computed(() => {
  return kt?.participants.map(pid => {
    const user = users.find(u => u.id === pid)
    const attempt = attempts.find(a => a.participantId === pid)
    const score = attempt?.normalizedScore ?? 0
    return { userId: pid, name: user?.name ?? pid, score, passed: score >= passScore, hasAttempt: !!attempt }
  }) ?? []
})

const passedCount = computed(() => results.value.filter(r => r.passed).length)

function approveToClass() {
  const passedIds = results.value.filter(r => r.passed).map(r => r.userId)
  const linkedClasses = classes.filter(c => c.knowledgeTestClassId === kt?.id)
  if (linkedClasses.length === 0) { alert('No linked regular classes. Create them under Classes menu.'); return }
  alert(`Approved ${passedIds.length} participants. Assign them to the ${linkedClasses.length} regular class(es) linked to this knowledge test.`)
}
</script>

<template>
  <div v-if="kt">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Results: {{ kt.name }}</h2>
      <button @click="router.push('/admin/classes')" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Manage Classes</button>
    </div>
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Pass Score</p><p class="text-2xl font-bold">{{ passScore }}%</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Passed / Total</p><p class="text-2xl font-bold">{{ passedCount }} / {{ results.length }}</p></div>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-3">Participant</th><th class="p-3">Score</th><th class="p-3">Status</th></tr></thead>
        <tbody>
          <tr v-for="r in results" :key="r.userId" class="border-t">
            <td class="p-3">{{ r.name }}</td>
            <td class="p-3">{{ r.hasAttempt ? r.score + '%' : 'Not taken' }}</td>
            <td class="p-3"><span v-if="!r.hasAttempt" class="text-gray-400 text-sm">Pending</span><span v-else-if="r.passed" class="text-green-600 text-sm font-medium">Passed</span><span v-else class="text-red-600 text-sm font-medium">Failed</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="approveToClass" class="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Approve Passed</button>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Not found</div>
</template>
