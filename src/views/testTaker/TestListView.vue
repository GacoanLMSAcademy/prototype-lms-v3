<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  curricula,
  tests,
  testAttempts,
  inClasses,
  inClassRetakePermissions,
} from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()

const myClasses = computed(() => classes.filter((c) => c.participants.includes(auth.userId)))

// ── Regular curriculum tests (knowledge tests, accounting, etc.) ──
const curriculumTests = computed(() => {
  const result: {
    testId: string
    testTitle: string
    className: string
    classId: string
    timeLimit: number
  }[] = []
  myClasses.value.forEach((cls) => {
    const curriculum = curricula.find((c) => c.id === cls.curriculumId)
    curriculum?.items.forEach((item) => {
      if (item.trainingMethodType === 'knowledgeTest' || item.trainingMethodType === 'accounting') {
        const t = tests.find((t) => t.id === item.contentId)
        if (t) {
          const taken = testAttempts.some(
            (a) =>
              a.testId === t.id &&
              a.participantId === auth.userId &&
              a.classId === cls.id &&
              a.status === 'completed',
          )
          if (!taken)
            result.push({
              testId: t.id,
              testTitle: t.title,
              className: cls.name,
              classId: cls.id,
              timeLimit: t.timeLimit,
            })
        }
      }
    })
  })
  return result
})

// ── InClass pre/post tests ──
interface InClassTestEntry {
  testId: string
  testTitle: string
  testType: 'preTest' | 'postTest'
  className: string
  classId: string
  inClassId: string
  inClassTitle: string
  categoryId: string
  categoryName: string
  timeLimit: number
  isRetake: boolean // this slot is a retake (has permission)
  attemptCount: number // how many times already taken
  bestScore: number | null
}

const inClassTests = computed((): InClassTestEntry[] => {
  const result: InClassTestEntry[] = []

  myClasses.value.forEach((cls) => {
    // find inClass sessions linked to this class via curriculum items
    const curriculum = curricula.find((c) => c.id === cls.curriculumId)
    if (!curriculum) return

    curriculum.items.forEach((item) => {
      if (item.trainingMethodType !== 'inClass') return
      const ic = inClasses.find((ic) => ic.id === item.contentId)
      if (!ic) return

      ic.categories.forEach((cat) => {
        const tryAdd = (testType: 'preTest' | 'postTest') => {
          const testId = testType === 'preTest' ? cat.preTestId : cat.postTestId
          if (!testId) return
          const t = tests.find((t) => t.id === testId)
          if (!t) return

          const myAttempts = testAttempts.filter(
            (a) =>
              a.testId === testId &&
              a.participantId === auth.userId &&
              a.classId === cls.id &&
              a.categoryId === cat.id &&
              a.testType === testType &&
              a.status === 'completed',
          )

          const attemptCount = myAttempts.length
          const bestScore =
            attemptCount > 0 ? Math.max(...myAttempts.map((a) => a.normalizedScore)) : null

          // check if there's an unused retake permission for this slot
          const retakePermission = inClassRetakePermissions.find(
            (p) =>
              p.participantId === auth.userId &&
              p.classId === cls.id &&
              p.inClassId === ic.id &&
              p.categoryId === cat.id &&
              p.testId === testId &&
              p.testType === testType &&
              !p.usedAt,
          )

          // show the slot if:
          // - never taken (attemptCount === 0)
          // - has an active retake permission
          if (attemptCount === 0 || retakePermission) {
            result.push({
              testId,
              testTitle: t.title,
              testType,
              className: cls.name,
              classId: cls.id,
              inClassId: ic.id,
              inClassTitle: ic.title,
              categoryId: cat.id,
              categoryName: cat.name,
              timeLimit: t.timeLimit,
              isRetake: !!retakePermission,
              attemptCount,
              bestScore,
            })
          }
        }

        tryAdd('preTest')
        tryAdd('postTest')
      })
    })
  })

  return result
})

// ── Completed attempts (for history section) ──
const completedAttempts = computed(() =>
  testAttempts
    .filter((a) => a.participantId === auth.userId && a.status === 'completed')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
)

function startTest(entry: InClassTestEntry) {
  const params = new URLSearchParams({
    classId: entry.classId,
    inClassId: entry.inClassId,
    categoryId: entry.categoryId,
    testType: entry.testType,
  })
  if (entry.isRetake) params.set('isRetake', '1')
  router.push(`/participant/tests/${entry.testId}/take?${params.toString()}`)
}

function startCurriculumTest(testId: string, classId: string) {
  router.push(`/participant/tests/${testId}/take?classId=${classId}`)
}

function testName(testId: string) {
  return tests.find((t) => t.id === testId)?.title ?? testId
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' })
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6 text-gray-800">My Tests</h2>

    <!-- ── InClass Pre/Post Tests ── -->
    <section v-if="inClassTests.length > 0" class="mb-8">
      <h3 class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span class="text-lg">🏫</span>
        In-Class Tests
      </h3>
      <div class="space-y-3">
        <div
          v-for="entry in inClassTests"
          :key="`${entry.testId}-${entry.classId}-${entry.categoryId}-${entry.testType}`"
          class="bg-white rounded-xl shadow p-4 flex items-start justify-between gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span
                :class="[
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  entry.testType === 'preTest'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-teal-100 text-teal-700',
                ]"
              >
                {{ entry.testType === 'preTest' ? 'Pre-Test' : 'Post-Test' }}
              </span>
              <span
                v-if="entry.isRetake"
                class="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
              >
                🔁 Retake #{{ entry.attemptCount + 1 }}
              </span>
            </div>
            <h4 class="font-semibold text-gray-800 truncate">{{ entry.testTitle }}</h4>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ entry.className }} › {{ entry.inClassTitle }} › {{ entry.categoryName }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">{{ entry.timeLimit }} min</p>
            <p v-if="entry.bestScore !== null" class="text-xs text-gray-500 mt-1">
              Best previous score:
              <span
                :class="
                  entry.bestScore >= 70 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'
                "
              >
                {{ entry.bestScore }}%
              </span>
            </p>
          </div>
          <button
            @click="startTest(entry)"
            :class="[
              'shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition',
              entry.isRetake
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white',
            ]"
          >
            {{ entry.isRetake ? 'Retake' : 'Start' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Curriculum / Knowledge Tests ── -->
    <section v-if="curriculumTests.length > 0" class="mb-8">
      <h3 class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span class="text-lg">📝</span>
        Other Pending Tests
      </h3>
      <div class="space-y-3">
        <div
          v-for="t in curriculumTests"
          :key="t.testId + t.classId"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between"
        >
          <div>
            <h4 class="font-semibold text-gray-800">{{ t.testTitle }}</h4>
            <p class="text-sm text-gray-500">{{ t.className }} | {{ t.timeLimit }} min</p>
          </div>
          <button
            @click="startCurriculumTest(t.testId, t.classId)"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Start
          </button>
        </div>
      </div>
    </section>

    <!-- Empty state -->
    <div
      v-if="inClassTests.length === 0 && curriculumTests.length === 0"
      class="text-center py-16 text-gray-400"
    >
      <span class="text-4xl block mb-3">✅</span>
      No pending tests right now.
    </div>

    <!-- ── Attempt History ── -->
    <section class="mt-4">
      <h3 class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span class="text-lg">📋</span>
        Test History
      </h3>

      <div v-if="completedAttempts.length === 0" class="text-sm text-gray-400 italic py-4">
        No completed tests yet.
      </div>

      <div class="space-y-2">
        <div
          v-for="a in completedAttempts"
          :key="a.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                v-if="a.testType"
                :class="[
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  a.testType === 'preTest'
                    ? 'bg-indigo-50 text-indigo-600'
                    : a.testType === 'postTest'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-amber-50 text-amber-600',
                ]"
              >
                {{
                  a.testType === 'preTest'
                    ? 'Pre-Test'
                    : a.testType === 'postTest'
                      ? 'Post-Test'
                      : 'Retake'
                }}
              </span>
              <span v-if="(a.attemptNumber ?? 1) > 1" class="text-xs text-gray-400">
                Attempt #{{ a.attemptNumber }}
              </span>
            </div>
            <p class="font-medium text-gray-800 truncate">{{ testName(a.testId) }}</p>
            <p class="text-xs text-gray-400">{{ formatDate(a.startedAt) }}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0 ml-3">
            <span
              :class="[
                'text-sm font-bold px-3 py-1 rounded-full',
                a.normalizedScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
              ]"
            >
              {{ a.normalizedScore }}%
            </span>
            <button
              @click="router.push(`/participant/tests/${a.testId}/result?attemptId=${a.id}`)"
              class="text-blue-600 hover:underline text-sm"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
