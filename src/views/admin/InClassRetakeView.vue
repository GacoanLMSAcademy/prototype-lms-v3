<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  inClasses,
  classes,
  curricula,
  knowledgeTestClasses,
  users,
  tests,
  testAttempts,
  inClassRetakePermissions,
} from '@/data/mockData'
import type { InClassRetakePermission } from '@/types'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// ── Filters ──
const selectedClassId = ref('')
const selectedInClassId = ref('')
const selectedScope = ref<'inClass' | 'classActivity'>('inClass')

const classOptions = computed(() => classes)
const inClassOptions = computed(() =>
  selectedClassId.value
    ? inClasses.filter((ic) => {
        const cls = classes.find((c) => c.id === selectedClassId.value)
        // show all inClasses (in a real system you'd filter by class assignments)
        return !!ic && !!cls
      })
    : inClasses,
)

const selectedClass = computed(() => classes.find((c) => c.id === selectedClassId.value))
const selectedInClass = computed(() => inClasses.find((ic) => ic.id === selectedInClassId.value))
const classActivityTests = computed(() => {
  const cls = selectedClass.value
  if (!cls) return []
  const curriculum = curricula.find((c) => c.id === cls.curriculumId)
  if (!curriculum) return []
  return curriculum.items
    .filter((item) => item.trainingMethodType === 'knowledgeTest')
    .map((item) => {
      const knowledgeTest = knowledgeTestClasses.find((kt) => kt.id === item.contentId)
      const test = knowledgeTest
        ? tests.find((t) => t.id === knowledgeTest.testId)
        : tests.find((t) => t.id === item.contentId)
      return test
        ? {
            testId: test.id,
            title: knowledgeTest?.name ?? test.title,
            timeLimit: test.timeLimit,
            passingScore: knowledgeTest?.passingScore ?? item.passingScore,
          }
        : null
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
})

// ── Participants of selected class ──
const participants = computed(() => {
  if (!selectedClass.value) return []
  return users.filter((u) => selectedClass.value!.participants.includes(u.id))
})

// helpers
function userName(id: string) {
  return users.find((u) => u.id === id)?.name ?? id
}
function testTitle(id: string) {
  return tests.find((t) => t.id === id)?.title ?? id
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// ── Get all attempts for a participant + inClass category + testType ──
type RetakeTestType = 'preTest' | 'postTest' | 'knowledgeTest'

function getAttempts(participantId: string, categoryId: string, testType: 'preTest' | 'postTest') {
  return testAttempts
    .filter(
      (a) =>
        a.participantId === participantId &&
        a.categoryId === categoryId &&
        a.testType === testType &&
        a.classId === selectedClassId.value,
    )
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
}

function getClassActivityAttempts(participantId: string, testId: string) {
  return testAttempts
    .filter(
      (a) =>
        a.participantId === participantId &&
        a.testId === testId &&
        a.classId === selectedClassId.value &&
        !a.categoryId,
    )
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
}

// ── Check if a retake permission already exists (and unused) ──
function hasActivePermission(
  participantId: string,
  categoryId: string | undefined,
  testType: RetakeTestType,
  testId: string,
  inClassId = selectedInClassId.value,
) {
  return inClassRetakePermissions.some(
    (p) =>
      p.participantId === participantId &&
      (categoryId ? p.categoryId === categoryId : !p.categoryId) &&
      p.testType === testType &&
      p.testId === testId &&
      p.classId === selectedClassId.value &&
      (inClassId ? p.inClassId === inClassId : !p.inClassId) &&
      !p.usedAt,
  )
}

// ── Grant retake ──
const permissionNote = ref('')
const showPermissionModal = ref(false)
const pendingPermission = ref<Omit<
  InClassRetakePermission,
  'id' | 'grantedBy' | 'grantedAt' | 'note'
> | null>(null)

function openGrantModal(
  participantId: string,
  categoryId: string | undefined,
  testType: RetakeTestType,
  testId: string,
  inClassId = selectedInClassId.value,
) {
  pendingPermission.value = {
    classId: selectedClassId.value,
    inClassId: inClassId || undefined,
    categoryId: categoryId || undefined,
    participantId,
    testId,
    testType,
  }
  permissionNote.value = ''
  showPermissionModal.value = true
}

function confirmGrant() {
  if (!pendingPermission.value) return
  inClassRetakePermissions.push({
    id: 'rp' + Date.now(),
    ...pendingPermission.value,
    grantedBy: auth.userId,
    grantedAt: new Date().toISOString(),
    note: permissionNote.value.trim() || undefined,
  })
  showPermissionModal.value = false
  pendingPermission.value = null
}

// ── Revoke (remove unused permission) ──
function revokePermission(
  participantId: string,
  categoryId: string | undefined,
  testType: RetakeTestType,
  testId: string,
  inClassId = selectedInClassId.value,
) {
  const idx = inClassRetakePermissions.findIndex(
    (p) =>
      p.participantId === participantId &&
      (categoryId ? p.categoryId === categoryId : !p.categoryId) &&
      p.testType === testType &&
      p.testId === testId &&
      p.classId === selectedClassId.value &&
      (inClassId ? p.inClassId === inClassId : !p.inClassId) &&
      !p.usedAt,
  )
  if (idx !== -1) inClassRetakePermissions.splice(idx, 1)
}

// ── Attempt log modal ──
const showLogModal = ref(false)
const logTitle = ref('')
const logAttempts = ref<typeof testAttempts>([])

function openLog(
  participantId: string,
  participantName: string,
  categoryId: string | undefined,
  testType: RetakeTestType,
  testId: string,
) {
  logTitle.value = `${participantName} — ${testType === 'preTest' ? 'Pre-Test' : testType === 'postTest' ? 'Post-Test' : 'Knowledge Test'} log for "${testTitle(testId)}"`
  logAttempts.value =
    testType === 'knowledgeTest'
      ? getClassActivityAttempts(participantId, testId)
      : getAttempts(participantId, categoryId ?? '', testType)
  showLogModal.value = true
}

// pending modal helper
const pendingParticipant = computed(() =>
  pendingPermission.value ? userName(pendingPermission.value.participantId) : '',
)
const pendingTestTitle = computed(() =>
  pendingPermission.value ? testTitle(pendingPermission.value.testId) : '',
)
const pendingTestType = computed(() =>
  pendingPermission.value
    ? pendingPermission.value.testType === 'preTest'
      ? 'Pre-Test'
      : pendingPermission.value.testType === 'postTest'
        ? 'Post-Test'
        : 'Knowledge Test'
    : '',
)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Test Retake</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        Grant participants permission to retake in-class tests or class activity knowledge tests.
        Previous attempts are preserved in the log.
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
        <select
          v-model="selectedClassId"
          @change="selectedInClassId = ''"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Class --</option>
          <option v-for="c in classOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Retake Type</label>
        <select
          v-model="selectedScope"
          :disabled="!selectedClassId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="inClass">In-Class Session Test</option>
          <option value="classActivity">Class Activity Knowledge Test</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">In-Class Session</label>
        <select
          v-model="selectedInClassId"
          :disabled="!selectedClassId || selectedScope !== 'inClass'"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select In-Class --</option>
          <option v-for="ic in inClassOptions" :key="ic.id" :value="ic.id">
            {{ ic.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Placeholder when nothing selected -->
    <div
      v-if="!selectedClassId || (selectedScope === 'inClass' && !selectedInClassId)"
      class="bg-white rounded-xl shadow p-12 text-center text-gray-400"
    >
      <span class="text-4xl block mb-3">🔁</span>
      Select a class{{ selectedScope === 'inClass' ? ' and an in-class session' : '' }} to manage
      retakes.
    </div>

    <!-- Main content -->
    <template v-else-if="selectedScope === 'inClass' && selectedInClass">
      <!-- Category tabs / sections -->
      <div
        v-for="category in selectedInClass.categories"
        :key="category.id"
        class="bg-white rounded-xl shadow mb-5 overflow-hidden"
      >
        <!-- Category header -->
        <div class="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <h3 class="font-semibold text-gray-800">{{ category.name }}</h3>
          <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Weight: {{ category.weight }}%
          </span>
        </div>

        <!-- Pre-Test & Post-Test columns header -->
        <div
          class="grid grid-cols-2 divide-x divide-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-2 bg-gray-50 border-b"
        >
          <div class="pr-4">
            Pre-Test:
            <span class="text-gray-700 normal-case font-medium">{{
              testTitle(category.preTestId)
            }}</span>
          </div>
          <div class="pl-4">
            Post-Test:
            <span class="text-gray-700 normal-case font-medium">{{
              testTitle(category.postTestId)
            }}</span>
          </div>
        </div>

        <!-- Participant rows -->
        <div v-if="participants.length === 0" class="px-5 py-6 text-sm text-gray-400 italic">
          No participants in this class.
        </div>

        <div
          v-for="participant in participants"
          :key="participant.id"
          class="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0"
        >
          <!-- Pre-Test cell -->
          <div class="px-5 py-4 pr-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ participant.name }}</p>
                <p class="text-xs text-gray-400">{{ participant.nip }}</p>
              </div>
              <!-- Score badge -->
              <div class="shrink-0">
                <template v-if="getAttempts(participant.id, category.id, 'preTest').length > 0">
                  <div class="flex flex-col items-end gap-1">
                    <span
                      v-for="(att, ai) in getAttempts(participant.id, category.id, 'preTest')"
                      :key="att.id"
                      :class="[
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        att.normalizedScore >= 70
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600',
                      ]"
                    >
                      #{{ ai + 1 }} {{ att.normalizedScore }}%
                    </span>
                  </div>
                </template>
                <span v-else class="text-xs text-gray-400 italic">No attempt</span>
              </div>
            </div>

            <!-- Actions row -->
            <div class="flex items-center gap-2 mt-2">
              <!-- Log button -->
              <button
                v-if="getAttempts(participant.id, category.id, 'preTest').length > 0"
                @click="
                  openLog(
                    participant.id,
                    participant.name,
                    category.id,
                    'preTest',
                    category.preTestId,
                  )
                "
                class="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View log
              </button>

              <!-- Retake grant/revoke -->
              <template v-if="getAttempts(participant.id, category.id, 'preTest').length > 0">
                <button
                  v-if="
                    !hasActivePermission(participant.id, category.id, 'preTest', category.preTestId)
                  "
                  @click="
                    openGrantModal(participant.id, category.id, 'preTest', category.preTestId)
                  "
                  class="text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
                >
                  + Permit Retake
                </button>
                <div v-else class="flex items-center gap-1">
                  <span
                    class="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg"
                  >
                    ✓ Retake Permitted
                  </span>
                  <button
                    @click="
                      revokePermission(participant.id, category.id, 'preTest', category.preTestId)
                    "
                    class="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Revoke
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Post-Test cell -->
          <div class="px-5 py-4 pl-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ participant.name }}</p>
                <p class="text-xs text-gray-400">{{ participant.nip }}</p>
              </div>
              <div class="shrink-0">
                <template v-if="getAttempts(participant.id, category.id, 'postTest').length > 0">
                  <div class="flex flex-col items-end gap-1">
                    <span
                      v-for="(att, ai) in getAttempts(participant.id, category.id, 'postTest')"
                      :key="att.id"
                      :class="[
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        att.normalizedScore >= 70
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600',
                      ]"
                    >
                      #{{ ai + 1 }} {{ att.normalizedScore }}%
                    </span>
                  </div>
                </template>
                <span v-else class="text-xs text-gray-400 italic">No attempt</span>
              </div>
            </div>

            <div class="flex items-center gap-2 mt-2">
              <button
                v-if="getAttempts(participant.id, category.id, 'postTest').length > 0"
                @click="
                  openLog(
                    participant.id,
                    participant.name,
                    category.id,
                    'postTest',
                    category.postTestId,
                  )
                "
                class="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View log
              </button>

              <template v-if="getAttempts(participant.id, category.id, 'postTest').length > 0">
                <button
                  v-if="
                    !hasActivePermission(
                      participant.id,
                      category.id,
                      'postTest',
                      category.postTestId,
                    )
                  "
                  @click="
                    openGrantModal(participant.id, category.id, 'postTest', category.postTestId)
                  "
                  class="text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
                >
                  + Permit Retake
                </button>
                <div v-else class="flex items-center gap-1">
                  <span
                    class="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg"
                  >
                    ✓ Retake Permitted
                  </span>
                  <button
                    @click="
                      revokePermission(participant.id, category.id, 'postTest', category.postTestId)
                    "
                    class="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Revoke
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="selectedScope === 'classActivity'">
      <div
        v-if="classActivityTests.length === 0"
        class="bg-white rounded-xl shadow p-12 text-center text-gray-400"
      >
        <span class="text-4xl block mb-3">📝</span>
        No class activity knowledge tests found for this class.
      </div>

      <div
        v-for="activityTest in classActivityTests"
        :key="activityTest.testId"
        class="bg-white rounded-xl shadow mb-5 overflow-hidden"
      >
        <div class="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <h3 class="font-semibold text-gray-800">{{ activityTest.title }}</h3>
          <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Knowledge Test
          </span>
          <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Pass: {{ activityTest.passingScore }}%
          </span>
        </div>

        <div v-if="participants.length === 0" class="px-5 py-6 text-sm text-gray-400 italic">
          No participants in this class.
        </div>

        <div
          v-for="participant in participants"
          :key="participant.id"
          class="border-b border-gray-50 px-5 py-4 hover:bg-gray-50 transition-colors last:border-b-0"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ participant.name }}</p>
              <p class="text-xs text-gray-400">{{ participant.nip }}</p>
            </div>
            <div class="shrink-0">
              <template v-if="getClassActivityAttempts(participant.id, activityTest.testId).length">
                <div class="flex flex-col items-end gap-1">
                  <span
                    v-for="(att, ai) in getClassActivityAttempts(
                      participant.id,
                      activityTest.testId,
                    )"
                    :key="att.id"
                    :class="[
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      att.normalizedScore >= activityTest.passingScore
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600',
                    ]"
                  >
                    #{{ ai + 1 }} {{ att.normalizedScore }}%
                  </span>
                </div>
              </template>
              <span v-else class="text-xs text-gray-400 italic">No attempt</span>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <button
              v-if="getClassActivityAttempts(participant.id, activityTest.testId).length > 0"
              @click="
                openLog(
                  participant.id,
                  participant.name,
                  undefined,
                  'knowledgeTest',
                  activityTest.testId,
                )
              "
              class="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              View log
            </button>

            <template v-if="getClassActivityAttempts(participant.id, activityTest.testId).length">
              <button
                v-if="
                  !hasActivePermission(
                    participant.id,
                    undefined,
                    'knowledgeTest',
                    activityTest.testId,
                    '',
                  )
                "
                @click="
                  openGrantModal(
                    participant.id,
                    undefined,
                    'knowledgeTest',
                    activityTest.testId,
                    '',
                  )
                "
                class="text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
              >
                + Permit Retake
              </button>
              <div v-else class="flex items-center gap-1">
                <span
                  class="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg"
                >
                  ✓ Retake Permitted
                </span>
                <button
                  @click="
                    revokePermission(
                      participant.id,
                      undefined,
                      'knowledgeTest',
                      activityTest.testId,
                      '',
                    )
                  "
                  class="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Revoke
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Grant Permission Modal ── -->
    <Teleport to="body">
      <div
        v-if="showPermissionModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showPermissionModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-1">Permit Retake</h3>
          <p class="text-sm text-gray-500 mb-4">
            You are granting
            <strong>{{ pendingParticipant }}</strong> a retake on the
            <strong>{{ pendingTestType }}</strong
            >:
            <em>{{ pendingTestTitle }}</em>
          </p>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Note <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              v-model="permissionNote"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Scored below passing threshold, permitted one retake."
            />
          </div>

          <div class="flex justify-end gap-3">
            <button
              @click="showPermissionModal = false"
              class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="confirmGrant"
              class="text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 font-medium"
            >
              Grant Permission
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Attempt Log Modal ── -->
    <Teleport to="body">
      <div
        v-if="showLogModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showLogModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-base font-bold text-gray-800 leading-tight max-w-xs">
              {{ logTitle }}
            </h3>
            <button
              @click="showLogModal = false"
              class="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
            >
              ✕
            </button>
          </div>

          <div
            v-if="logAttempts.length === 0"
            class="text-sm text-gray-400 italic py-4 text-center"
          >
            No attempts recorded.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(att, idx) in logAttempts"
              :key="att.id"
              class="border border-gray-200 rounded-xl p-4 bg-gray-50"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-700">Attempt #{{ idx + 1 }}</span>
                <span
                  :class="[
                    'text-sm font-bold px-3 py-0.5 rounded-full',
                    att.normalizedScore >= 70
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600',
                  ]"
                >
                  {{ att.normalizedScore }}%
                </span>
              </div>
              <div class="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
                <div><span class="font-medium">Started:</span> {{ formatDate(att.startedAt) }}</div>
                <div>
                  <span class="font-medium">Completed:</span>
                  {{ att.completedAt ? formatDate(att.completedAt) : '—' }}
                </div>
                <div class="mt-1">
                  <span class="font-medium">Raw score:</span> {{ att.score }} /
                  {{ att.totalPoints }}
                </div>
                <div class="mt-1">
                  <span class="font-medium">Status:</span>
                  <span :class="att.status === 'completed' ? 'text-green-600' : 'text-orange-500'">
                    {{ att.status }}
                  </span>
                </div>
              </div>
              <div v-if="idx > 0" class="mt-1.5">
                <span
                  class="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full"
                >
                  Retake
                </span>
              </div>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              @click="showLogModal = false"
              class="text-sm bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
