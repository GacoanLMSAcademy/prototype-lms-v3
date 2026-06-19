<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  curricula,
  inClasses,
  tests,
  materis,
  testAttempts,
  inClassActivityCompletions,
  materiAccessTokens,
} from '@/data/mockData'
import type { InClassActivity } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// ── Resolve context from route ──
// Route: /participant/inclass/:classId/:inClassId
const classId = route.params.classId as string
const inClassId = route.params.inClassId as string

const cls = classes.find((c) => c.id === classId)
const inClass = inClasses.find((ic) => ic.id === inClassId)

// ── Active category tab ──
const activeCatIndex = ref(0)
const activeCategory = computed(() => inClass?.categories[activeCatIndex.value])

// ── Build ordered activity sequence for a category ──
function buildActivities(categoryId: string): InClassActivity[] {
  const cat = inClass?.categories.find((c) => c.id === categoryId)
  if (!cat) return []
  const seq: InClassActivity[] = []
  let order = 0
  if (cat.preTestId) seq.push({ type: 'preTest', refId: cat.preTestId, order: order++ })
  for (const mId of cat.materiIds) seq.push({ type: 'materi', refId: mId, order: order++ })
  if (cat.postTestId) seq.push({ type: 'postTest', refId: cat.postTestId, order: order++ })
  return seq
}

// ── Check completion ──
function isCompleted(categoryId: string, actType: InClassActivity['type'], refId: string): boolean {
  // pre/post test: check testAttempts
  if (actType === 'preTest' || actType === 'postTest') {
    return testAttempts.some(
      (a) =>
        a.participantId === auth.userId &&
        a.classId === classId &&
        a.inClassId === inClassId &&
        a.categoryId === categoryId &&
        a.testType === actType &&
        a.status === 'completed',
    )
  }
  // materi: check inClassActivityCompletions
  return inClassActivityCompletions.some(
    (c) =>
      c.participantId === auth.userId &&
      c.classId === classId &&
      c.inClassId === inClassId &&
      c.categoryId === categoryId &&
      c.activityType === 'materi' &&
      c.refId === refId,
  )
}

// ── Check if activity is unlocked ──
// An activity is unlocked if ALL previous activities in the sequence are completed,
// OR if there's a valid (unused) access token for it.
function isUnlocked(
  activities: InClassActivity[],
  categoryId: string,
  activity: InClassActivity,
): boolean {
  if (activity.order === 0) return true // first is always open
  // check token
  const hasToken = materiAccessTokens.some(
    (t) =>
      t.participantId === auth.userId &&
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === categoryId &&
      t.activityType === activity.type &&
      t.refId === activity.refId &&
      !t.usedAt,
  )
  if (hasToken) return true
  // check all previous are completed
  const prev = activities.filter((a) => a.order < activity.order)
  return prev.every((a) => isCompleted(categoryId, a.type, a.refId))
}

// ── Mark materi as completed ──
function completeMateri(categoryId: string, materiId: string) {
  const alreadyDone = inClassActivityCompletions.some(
    (c) =>
      c.participantId === auth.userId &&
      c.classId === classId &&
      c.inClassId === inClassId &&
      c.categoryId === categoryId &&
      c.activityType === 'materi' &&
      c.refId === materiId,
  )
  if (alreadyDone) return
  // Consume access token if one was used
  const token = materiAccessTokens.find(
    (t) =>
      t.participantId === auth.userId &&
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === categoryId &&
      t.activityType === 'materi' &&
      t.refId === materiId &&
      !t.usedAt,
  )
  if (token) token.usedAt = new Date().toISOString()

  inClassActivityCompletions.push({
    id: 'iac' + Date.now(),
    participantId: auth.userId,
    classId,
    inClassId,
    categoryId,
    activityType: 'materi',
    refId: materiId,
    completedAt: new Date().toISOString(),
  })
}

// ── Token unlock modal ──
const showTokenModal = ref(false)
const tokenInput = ref('')
const tokenError = ref('')
const pendingActivity = ref<{ categoryId: string; activity: InClassActivity } | null>(null)

function openTokenModal(categoryId: string, activity: InClassActivity) {
  pendingActivity.value = { categoryId, activity }
  tokenInput.value = ''
  tokenError.value = ''
  showTokenModal.value = true
}

function redeemToken() {
  if (!pendingActivity.value) return
  const { categoryId, activity } = pendingActivity.value
  const match = materiAccessTokens.find(
    (t) =>
      t.token.toUpperCase() === tokenInput.value.toUpperCase() &&
      t.participantId === auth.userId &&
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === categoryId &&
      t.activityType === activity.type &&
      t.refId === activity.refId &&
      !t.usedAt,
  )
  if (!match) {
    tokenError.value = 'Invalid or already used token. Check with your instructor.'
    return
  }
  match.usedAt = new Date().toISOString()
  showTokenModal.value = false
  // force reactivity refresh
  tokenInput.value = ''
}

// ── Navigate to test ──
function goToTest(
  categoryId: string,
  testId: string,
  testType: 'preTest' | 'postTest',
  activity: InClassActivity,
) {
  // consume token if applicable
  const token = materiAccessTokens.find(
    (t) =>
      t.participantId === auth.userId &&
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === categoryId &&
      t.activityType === testType &&
      t.refId === testId &&
      !t.usedAt,
  )
  if (token) token.usedAt = new Date().toISOString()

  const params = new URLSearchParams({
    classId,
    inClassId,
    categoryId,
    testType,
  })
  router.push(`/participant/tests/${testId}/take?${params.toString()}`)
}

// ── Helpers ──
function testTitle(id: string) {
  return tests.find((t) => t.id === id)?.title ?? id
}
function materiTitle(id: string) {
  return materis.find((m) => m.id === id)?.title ?? id
}
function materiIcon(id: string) {
  const type = materis.find((m) => m.id === id)?.type
  return { pdf: '📄', slide: '📊', video: '🎬', h5p: '🎮' }[type ?? ''] ?? '📚'
}
function activityLabel(a: InClassActivity) {
  if (a.type === 'preTest') return `Pre-Test: ${testTitle(a.refId)}`
  if (a.type === 'postTest') return `Post-Test: ${testTitle(a.refId)}`
  return `${materiIcon(a.refId)} ${materiTitle(a.refId)}`
}

// ── Category overall progress ──
function catProgress(categoryId: string) {
  const acts = buildActivities(categoryId)
  if (!acts.length) return 0
  const done = acts.filter((a) => isCompleted(categoryId, a.type, a.refId)).length
  return Math.round((done / acts.length) * 100)
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <button
        @click="router.back()"
        class="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
      >
        ← Back
      </button>
      <h2 class="text-2xl font-bold text-gray-800">{{ inClass?.title ?? 'In-Class' }}</h2>
      <p class="text-sm text-gray-500 mt-0.5">{{ cls?.name }}</p>
    </div>

    <div v-if="!inClass" class="bg-white rounded-xl shadow p-12 text-center text-gray-400">
      In-class session not found.
    </div>

    <template v-else>
      <!-- Category tabs -->
      <div class="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          v-for="(cat, idx) in inClass.categories"
          :key="cat.id"
          @click="activeCatIndex = idx"
          :class="[
            'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition',
            activeCatIndex === idx
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300',
          ]"
        >
          <span>{{ cat.name }}</span>
          <span class="ml-2 text-xs opacity-75">{{ catProgress(cat.id) }}%</span>
        </button>
      </div>

      <!-- Active category content -->
      <div v-if="activeCategory">
        <!-- Progress bar -->
        <div class="bg-white rounded-xl shadow p-4 mb-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-700">{{ activeCategory.name }}</p>
            <span class="text-sm font-bold text-blue-600"
              >{{ catProgress(activeCategory.id) }}%</span
            >
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full transition-all duration-500"
              :style="{ width: catProgress(activeCategory.id) + '%' }"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1.5">Weight: {{ activeCategory.weight }}%</p>
        </div>

        <!-- Activity ladder -->
        <div class="relative">
          <div
            v-for="(activity, idx) in buildActivities(activeCategory.id)"
            :key="`${activeCategory.id}-${activity.refId}`"
            class="relative flex gap-4 mb-0"
          >
            <!-- Connector column -->
            <div class="flex flex-col items-center w-10 shrink-0">
              <!-- Circle -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 z-10 shadow-sm"
                :class="
                  isCompleted(activeCategory.id, activity.type, activity.refId)
                    ? 'bg-green-500 border-green-500 text-white'
                    : isUnlocked(buildActivities(activeCategory.id), activeCategory.id, activity)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                "
              >
                <span v-if="isCompleted(activeCategory.id, activity.type, activity.refId)">✓</span>
                <span
                  v-else-if="
                    !isUnlocked(buildActivities(activeCategory.id), activeCategory.id, activity)
                  "
                  >🔒</span
                >
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <!-- Connector line -->
              <div
                v-if="idx < buildActivities(activeCategory.id).length - 1"
                class="w-0.5 flex-1 min-h-4 mt-1"
                :class="
                  isCompleted(activeCategory.id, activity.type, activity.refId)
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                "
              />
            </div>

            <!-- Activity card -->
            <div class="flex-1 mb-4">
              <div
                class="rounded-xl border-2 shadow-sm transition-all"
                :class="
                  isCompleted(activeCategory.id, activity.type, activity.refId)
                    ? 'bg-green-50 border-green-200'
                    : isUnlocked(buildActivities(activeCategory.id), activeCategory.id, activity)
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-70'
                "
              >
                <div class="px-4 py-3 flex items-center justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-0.5">
                      <!-- Type badge -->
                      <span
                        :class="[
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          activity.type === 'preTest'
                            ? 'bg-indigo-100 text-indigo-700'
                            : activity.type === 'postTest'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-amber-100 text-amber-700',
                        ]"
                      >
                        {{
                          activity.type === 'preTest'
                            ? 'Pre-Test'
                            : activity.type === 'postTest'
                              ? 'Post-Test'
                              : 'Materi'
                        }}
                      </span>
                      <span
                        v-if="isCompleted(activeCategory.id, activity.type, activity.refId)"
                        class="text-xs text-green-600 font-medium"
                        >✓ Done</span
                      >
                    </div>
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ activityLabel(activity) }}
                    </p>
                  </div>

                  <!-- Action button -->
                  <div class="shrink-0">
                    <!-- Completed -->
                    <span
                      v-if="isCompleted(activeCategory.id, activity.type, activity.refId)"
                      class="text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg bg-green-50 border border-green-200"
                    >
                      Completed
                    </span>

                    <!-- Unlocked — test -->
                    <button
                      v-else-if="
                        isUnlocked(
                          buildActivities(activeCategory.id),
                          activeCategory.id,
                          activity,
                        ) &&
                        (activity.type === 'preTest' || activity.type === 'postTest')
                      "
                      @click="
                        goToTest(
                          activeCategory.id,
                          activity.refId,
                          activity.type as 'preTest' | 'postTest',
                          activity,
                        )
                      "
                      class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Start Test
                    </button>

                    <!-- Unlocked — materi -->
                    <button
                      v-else-if="
                        isUnlocked(
                          buildActivities(activeCategory.id),
                          activeCategory.id,
                          activity,
                        ) && activity.type === 'materi'
                      "
                      @click="completeMateri(activeCategory.id, activity.refId)"
                      class="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition font-medium"
                    >
                      Mark Done
                    </button>

                    <!-- Locked -->
                    <button
                      v-else
                      @click="openTokenModal(activeCategory.id, activity)"
                      class="text-xs bg-gray-100 text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition"
                    >
                      🔒 Enter Token
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Token Modal ── -->
    <Teleport to="body">
      <div
        v-if="showTokenModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showTokenModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-1">Enter Access Token</h3>
          <p class="text-sm text-gray-500 mb-4">
            This activity is locked. Enter the token provided by your instructor to unlock it.
          </p>
          <input
            v-model="tokenInput"
            @keyup.enter="redeemToken"
            placeholder="e.g. TK-A4F2"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            autocomplete="off"
          />
          <p v-if="tokenError" class="text-xs text-red-500 mb-3">{{ tokenError }}</p>
          <div class="flex gap-3 justify-end">
            <button
              @click="showTokenModal = false"
              class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="redeemToken"
              class="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
