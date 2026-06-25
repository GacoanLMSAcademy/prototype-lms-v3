<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tests, testAttempts, inClassRetakePermissions } from '@/data/mockData'
import type { Answer, Question } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const test = tests.find((t) => t.id === route.params.id)
const classId = (route.query.classId as string) || ''
const inClassId = (route.query.inClassId as string) || ''
const categoryId = (route.query.categoryId as string) || ''
const testType = (route.query.testType as 'preTest' | 'postTest' | 'knowledgeTest') || undefined
const isRetake = route.query.isRetake === '1'

const timeRemaining = ref(test?.timeLimit ? test.timeLimit * 60 : 0)
const submitted = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!test) return
  answers.value = test.questions.map((q) => ({
    questionId: q.id,
    value: q.type === 'dragDrop' ? [] : '',
  }))
  timeRemaining.value = test.timeLimit * 60
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) timeRemaining.value--
    else submitTest()
  }, 1000)
})
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

const answers = ref<Answer[]>([])

// count previous attempts for this test+category+testType to determine attemptNumber
const previousAttemptCount = computed(
  () =>
    testAttempts.filter(
      (a) =>
        a.testId === route.params.id &&
        a.participantId === auth.userId &&
        a.classId === classId &&
        (categoryId ? a.categoryId === categoryId : true) &&
        (testType ? a.testType === testType : true) &&
        a.status === 'completed',
    ).length,
)

function setAnswer(questionId: string, value: string | string[]) {
  const ans = answers.value.find((a) => a.questionId === questionId)
  if (ans) ans.value = value
}

function getDragItems(q: Question) {
  if (q.type !== 'dragDrop' || !q.items) return []
  const answer = answers.value.find((a) => a.questionId === q.id)?.value
  if (Array.isArray(answer) && answer.length > 0)
    return answer.map((id) => q.items!.find((i) => i.id === id)!).filter(Boolean)
  return [...q.items].sort((a, b) => a.correctOrder - b.correctOrder)
}

function moveDragItem(qId: string, fromIdx: number, toIdx: number) {
  const ans = answers.value.find((a) => a.questionId === qId)
  if (!ans || !Array.isArray(ans.value)) return
  const items = [...ans.value]
  const [moved] = items.splice(fromIdx, 1)
  if (moved === undefined) return
  items.splice(toIdx, 0, moved)
  ans.value = items
}

function initDragOrder(q: Question) {
  const ans = answers.value.find((a) => a.questionId === q.id)
  if (ans && Array.isArray(ans.value) && ans.value.length === 0 && q.items)
    ans.value = q.items.map((i) => i.id).sort(() => Math.random() - 0.5)
}

function submitTest() {
  if (submitted.value || !test) return
  submitted.value = true
  if (timerInterval) clearInterval(timerInterval)
  let score = 0
  let totalPoints = 0
  test.questions.forEach((q) => {
    totalPoints += q.points
    const ans = answers.value.find((a) => a.questionId === q.id)
    if (!ans) return
    if (q.type === 'mcq' && q.options) {
      if (q.options.find((o) => o.id === ans.value)?.isCorrect) score += q.points
    } else if (q.type === 'fillBlank' && q.correctAnswer) {
      if (String(ans.value).trim().toLowerCase() === q.correctAnswer.trim().toLowerCase())
        score += q.points
    } else if (q.type === 'essay') score += Math.round(q.points * 0.8)
    else if (q.type === 'dragDrop' && q.items) {
      const order = ans.value as string[]
      if (order.every((id, idx) => q.items!.find((i) => i.id === id)?.correctOrder === idx + 1))
        score += q.points
    }
  })
  const normalized = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
  const attemptNumber = previousAttemptCount.value + 1

  // Mark retake permission as used
  if (isRetake) {
    const perm = inClassRetakePermissions.find(
      (p) =>
        p.participantId === auth.userId &&
        p.classId === classId &&
        p.testId === String(route.params.id) &&
        (categoryId ? p.categoryId === categoryId : !p.categoryId) &&
        (inClassId ? p.inClassId === inClassId : !p.inClassId) &&
        (testType ? p.testType === testType : p.testType === 'knowledgeTest') &&
        !p.usedAt,
    )
    if (perm) perm.usedAt = new Date().toISOString()
  }

  const lastIdx = testAttempts.push({
    id: 'ta' + Date.now(),
    testId: test.id,
    participantId: auth.userId,
    classId,
    inClassId: inClassId || undefined,
    categoryId: categoryId || undefined,
    testType: testType || undefined,
    attemptNumber,
    answers: answers.value,
    score,
    totalPoints,
    normalizedScore: normalized,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
  })
  alert(`Test submitted! Score: ${normalized}%`)
  const last = testAttempts[lastIdx - 1]
  if (!last) return
  router.push(`/participant/tests/${test.id}/result?attemptId=${last.id}`)
}
</script>

<template>
  <div v-if="test">
    <div class="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold">{{ test.title }}</h2>
        <div class="flex items-center gap-2 mt-0.5">
          <span
            v-if="testType"
            :class="[
              'text-xs px-2 py-0.5 rounded-full font-medium',
              testType === 'preTest'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-teal-100 text-teal-700',
            ]"
          >
            {{ testType === 'preTest' ? 'Pre-Test' : 'Post-Test' }}
          </span>
          <span
            v-if="isRetake"
            class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium"
            >🔁 Retake</span
          >
        </div>
      </div>
      <div class="text-lg font-mono" :class="timeRemaining < 60 ? 'text-red-600' : 'text-gray-800'">
        {{ formatTime(timeRemaining) }}
      </div>
    </div>
    <div class="space-y-6 max-w-3xl">
      <div v-for="(q, idx) in test.questions" :key="q.id" class="bg-white rounded shadow p-4">
        <p class="font-medium mb-3">
          Q{{ idx + 1 }} ({{ q.points }}pts)
          <span class="text-xs bg-gray-200 px-2 py-0.5 rounded ml-2">{{ q.type }}</span>
        </p>
        <p class="mb-3">{{ q.text }}</p>
        <div v-if="q.type === 'mcq' && q.options">
          <label
            v-for="opt in q.options"
            :key="opt.id"
            class="flex items-center gap-2 mb-2 cursor-pointer"
          >
            <input
              type="radio"
              :name="q.id"
              :value="opt.id"
              @change="setAnswer(q.id, opt.id)"
              class="accent-blue-600"
            />
            <span class="text-sm">{{ opt.text }}</span>
          </label>
        </div>
        <div v-if="q.type === 'essay'">
          <textarea
            @input="setAnswer(q.id, ($event.target as HTMLTextAreaElement).value)"
            class="w-full border rounded p-2 text-sm"
            rows="4"
          ></textarea>
        </div>
        <div v-if="q.type === 'fillBlank'">
          <input
            @input="setAnswer(q.id, ($event.target as HTMLInputElement).value)"
            class="w-full border rounded px-3 py-2"
            placeholder="Type answer..."
          />
        </div>
        <div v-if="q.type === 'dragDrop' && q.items" @click="initDragOrder(q)">
          <div
            v-for="(item, di) in getDragItems(q)"
            :key="item.id"
            draggable="true"
            @dragstart="(e) => e.dataTransfer?.setData('text/plain', String(di))"
            @dragover.prevent
            @drop="
              (e) => {
                const from = Number(e.dataTransfer?.getData('text/plain'))
                moveDragItem(q.id, from, di)
              }
            "
            class="bg-gray-100 border rounded px-3 py-2 text-sm cursor-grab hover:bg-gray-200 mb-1"
          >
            {{ di + 1 }}. {{ item.text }}
          </div>
          <p class="text-xs text-gray-400 mt-1">Drag to reorder</p>
        </div>
      </div>
      <button
        @click="submitTest"
        class="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700 text-lg font-semibold"
      >
        Submit Test
      </button>
    </div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Test not found</div>
</template>
