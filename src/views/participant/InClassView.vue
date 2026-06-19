<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  inClasses,
  tests,
  materis,
  materiTypes,
  testAttempts,
  inClassActivityCompletions,
  materiAccessTokens,
} from '@/data/mockData'
import type { InClassActivity } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const classId = route.params.classId as string
const inClassId = route.params.inClassId as string

const cls = classes.find((c) => c.id === classId)
const inClass = inClasses.find((ic) => ic.id === inClassId)

// ── Active category tab ──
const activeCatIndex = ref(0)
const activeCategory = computed(() => inClass?.categories[activeCatIndex.value])

// ── MateriType name ──
function materiTypeName(id?: string) {
  if (!id) return ''
  return materiTypes.find((mt) => mt.id === id)?.name ?? ''
}

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

// ── Category lock: locked if previous category not fully done AND no redeemed token ──
function isCategoryUnlocked(catIndex: number): boolean {
  if (catIndex === 0) return true // first category is always open
  const cat = inClass!.categories[catIndex]!
  // Check if a token exists and has been redeemed for this category
  const tok = materiAccessTokens.find(
    (t) =>
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === cat.id &&
      t.firstRedeemedAt, // redeemed = open for everyone
  )
  if (tok) return true
  // Otherwise require previous category to be fully completed
  const prevCat = inClass!.categories[catIndex - 1]!
  return isCategoryComplete(prevCat.id)
}

// ── Category fully complete (all activities done) ──
function isCategoryComplete(categoryId: string): boolean {
  const acts = buildActivities(categoryId)
  return acts.length > 0 && acts.every((a) => isActivityDone(categoryId, a.type, a.refId))
}

// ── Single activity completion check ──
function isActivityDone(categoryId: string, type: InClassActivity['type'], refId: string): boolean {
  if (type === 'preTest' || type === 'postTest') {
    return testAttempts.some(
      (a) =>
        a.participantId === auth.userId &&
        a.classId === classId &&
        a.inClassId === inClassId &&
        a.categoryId === categoryId &&
        a.testType === type &&
        a.status === 'completed',
    )
  }
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

// ── Within an unlocked category, activities are still ordered ──
// Activity N is accessible only if all activities 0..N-1 are done
function isActivityUnlocked(
  activities: InClassActivity[],
  categoryId: string,
  activity: InClassActivity,
): boolean {
  if (activity.order === 0) return true
  return activities
    .filter((a) => a.order < activity.order)
    .every((a) => isActivityDone(categoryId, a.type, a.refId))
}

// ── Category progress ──
function catProgress(categoryId: string): number {
  const acts = buildActivities(categoryId)
  if (!acts.length) return 0
  return Math.round(
    (acts.filter((a) => isActivityDone(categoryId, a.type, a.refId)).length / acts.length) * 100,
  )
}

// ── Mark materi complete ──
function completeMateri(categoryId: string, materiId: string) {
  if (isActivityDone(categoryId, 'materi', materiId)) return
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

// ── Navigate to test ──
function goToTest(categoryId: string, testId: string, testType: 'preTest' | 'postTest') {
  const params = new URLSearchParams({ classId, inClassId, categoryId, testType })
  router.push(`/participant/tests/${testId}/take?${params.toString()}`)
}

// ── Token entry modal (to unlock a locked category) ──
const showTokenModal = ref(false)
const tokenInput = ref('')
const tokenError = ref('')
const pendingCatId = ref('')

function openTokenModal(categoryId: string) {
  pendingCatId.value = categoryId
  tokenInput.value = ''
  tokenError.value = ''
  showTokenModal.value = true
}

function redeemToken() {
  const match = materiAccessTokens.find(
    (t) =>
      t.token.toUpperCase() === tokenInput.value.trim().toUpperCase() &&
      t.classId === classId &&
      t.inClassId === inClassId &&
      t.categoryId === pendingCatId.value,
  )
  if (!match) {
    tokenError.value = 'Invalid token. Check with your instructor.'
    return
  }
  // Record first redemption (unlocks for everyone)
  if (!match.firstRedeemedAt) {
    match.firstRedeemedAt = new Date().toISOString()
    match.firstRedeemedBy = auth.userId
  }
  showTokenModal.value = false
  tokenInput.value = ''
}

// ── Helpers ──
function testTitle(id: string) {
  return tests.find((t) => t.id === id)?.title ?? id
}
function materiTitle(id: string) {
  return materis.find((m) => m.id === id)?.title ?? id
}
function materiIcon(id: string) {
  const t = materis.find((m) => m.id === id)?.type
  const map: Record<string, string> = { pdf: '📄', slide: '📊', video: '🎬', h5p: '🎮' }
  return t && map[t] ? map[t] : '📚'
}
function actLabel(a: InClassActivity) {
  if (a.type === 'preTest') return `Pre-Test: ${testTitle(a.refId)}`
  if (a.type === 'postTest') return `Post-Test: ${testTitle(a.refId)}`
  return `${materiIcon(a.refId)} ${materiTitle(a.refId)}`
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
            'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition',
            activeCatIndex === idx
              ? 'bg-blue-600 text-white border-blue-600'
              : isCategoryUnlocked(idx)
                ? 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-default',
          ]"
        >
          <span v-if="!isCategoryUnlocked(idx)">🔒</span>
          <span>{{ cat.name }}</span>
          <span class="text-xs opacity-75">{{ catProgress(cat.id) }}%</span>
        </button>
      </div>

      <!-- Active category -->
      <div v-if="activeCategory">
        <!-- Category header card -->
        <div class="bg-white rounded-xl shadow p-4 mb-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <p class="text-sm font-semibold text-gray-700">{{ activeCategory.name }}</p>
                <span
                  v-if="activeCategory.materiTypeId"
                  class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
                >
                  {{ materiTypeName(activeCategory.materiTypeId) }}
                </span>
                <span class="text-xs text-gray-400">{{ activeCategory.weight }}%</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="catProgress(activeCategory.id) === 100 ? 'bg-green-500' : 'bg-blue-500'"
                  :style="{ width: catProgress(activeCategory.id) + '%' }"
                />
              </div>
              <p class="text-xs text-gray-400 mt-1">
                {{ catProgress(activeCategory.id) }}% complete
              </p>
            </div>

            <!-- Locked state: show Enter Token button -->
            <div v-if="!isCategoryUnlocked(activeCatIndex)" class="shrink-0">
              <button
                @click="openTokenModal(activeCategory.id)"
                class="text-sm bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition font-medium flex items-center gap-2"
              >
                🔑 Enter Token
              </button>
            </div>
          </div>
        </div>

        <!-- Locked overlay -->
        <div
          v-if="!isCategoryUnlocked(activeCatIndex)"
          class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-5"
        >
          <p class="text-2xl mb-2">🔒</p>
          <p class="font-semibold text-amber-800">This category is locked</p>
          <p class="text-sm text-amber-600 mt-1">
            Complete the previous category, or enter the access token from your instructor.
          </p>
          <button
            @click="openTokenModal(activeCategory.id)"
            class="mt-4 text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 font-medium transition"
          >
            🔑 Enter Token to Unlock
          </button>
        </div>

        <!-- Activity ladder (only shown when unlocked) -->
        <div v-else class="relative">
          <div
            v-for="(activity, idx) in buildActivities(activeCategory.id)"
            :key="`${activeCategory.id}-${activity.refId}`"
            class="relative flex gap-4"
          >
            <!-- Connector column -->
            <div class="flex flex-col items-center w-10 shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 z-10 shadow-sm"
                :class="
                  isActivityDone(activeCategory.id, activity.type, activity.refId)
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActivityUnlocked(
                          buildActivities(activeCategory.id),
                          activeCategory.id,
                          activity,
                        )
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                "
              >
                <span v-if="isActivityDone(activeCategory.id, activity.type, activity.refId)"
                  >✓</span
                >
                <span
                  v-else-if="
                    !isActivityUnlocked(
                      buildActivities(activeCategory.id),
                      activeCategory.id,
                      activity,
                    )
                  "
                  >○</span
                >
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div
                v-if="idx < buildActivities(activeCategory.id).length - 1"
                class="w-0.5 flex-1 min-h-4 mt-1"
                :class="
                  isActivityDone(activeCategory.id, activity.type, activity.refId)
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
                  isActivityDone(activeCategory.id, activity.type, activity.refId)
                    ? 'bg-green-50 border-green-200'
                    : isActivityUnlocked(
                          buildActivities(activeCategory.id),
                          activeCategory.id,
                          activity,
                        )
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                "
              >
                <div class="px-4 py-3 flex items-center justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-0.5">
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
                        v-if="isActivityDone(activeCategory.id, activity.type, activity.refId)"
                        class="text-xs text-green-600 font-medium"
                        >✓ Done</span
                      >
                    </div>
                    <p class="text-sm font-semibold text-gray-800 truncate">
                      {{ actLabel(activity) }}
                    </p>
                  </div>

                  <!-- Action -->
                  <div class="shrink-0">
                    <span
                      v-if="isActivityDone(activeCategory.id, activity.type, activity.refId)"
                      class="text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg bg-green-50 border border-green-200"
                    >
                      Completed
                    </span>
                    <button
                      v-else-if="
                        isActivityUnlocked(
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
                        )
                      "
                      class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Start Test
                    </button>
                    <button
                      v-else-if="
                        isActivityUnlocked(
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
                    <span
                      v-else
                      class="text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200"
                    >
                      Waiting…
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Token Modal -->
    <Teleport to="body">
      <div
        v-if="showTokenModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showTokenModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-1">🔑 Enter Access Token</h3>
          <p class="text-sm text-gray-500 mb-4">
            Enter the token from your instructor to unlock this category for everyone in the class.
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
