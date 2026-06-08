<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, tests, testAttempts } from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()
const myClasses = computed(() => classes.filter(c => c.participants.includes(auth.userId)))

const availableTests = computed(() => {
  const result: { testId: string; testTitle: string; className: string; classId: string; timeLimit: number }[] = []
  myClasses.value.forEach(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    curriculum?.items.forEach(item => {
      if (item.trainingMethodType === 'knowledgeTest' || item.trainingMethodType === 'accounting' || item.trainingMethodType === 'inClass') {
        const t = tests.find(t => t.id === item.contentId)
        if (t) {
          const taken = testAttempts.some(a => a.testId === t.id && a.participantId === auth.userId && a.classId === cls.id && a.status === 'completed')
          if (!taken) result.push({ testId: t.id, testTitle: t.title, className: cls.name, classId: cls.id, timeLimit: t.timeLimit })
        }
      }
    })
  })
  return result
})

const completedAttempts = computed(() => testAttempts.filter(a => a.participantId === auth.userId && a.status === 'completed'))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Tests</h2>
    <div v-if="availableTests.length === 0" class="text-center py-12 text-gray-400">No pending tests</div>
    <div class="space-y-3" v-else>
      <div v-for="t in availableTests" :key="t.testId + t.classId" class="bg-white rounded shadow p-4 flex items-center justify-between">
        <div><h3 class="font-semibold">{{ t.testTitle }}</h3><p class="text-sm text-gray-500">Class: {{ t.className }} | {{ t.timeLimit }} min</p></div>
        <button @click="router.push(`/participant/tests/${t.testId}/take?classId=${t.classId}`)" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">Start</button>
      </div>
    </div>
    <h3 class="text-xl font-semibold mt-8 mb-3">Completed</h3>
    <div v-for="a in completedAttempts" :key="a.id" class="bg-white rounded shadow p-4 flex items-center justify-between">
      <div><p class="font-medium">{{ tests.find(t => t.id === a.testId)?.title }}</p><p class="text-sm text-gray-500">Score: {{ a.normalizedScore }}%</p></div>
      <button @click="router.push(`/participant/tests/${a.testId}/result?attemptId=${a.id}`)" class="text-blue-600 hover:underline text-sm">View</button>
    </div>
  </div>
</template>
