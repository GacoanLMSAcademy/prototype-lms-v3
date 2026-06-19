<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  inClasses,
  users,
  tests,
  materis,
  inClassActivityCompletions,
  materiAccessTokens,
  testAttempts,
} from '@/data/mockData'
import type { MateriAccessToken, InClassActivity } from '@/types'

const auth = useAuthStore()

// ── Filters ──
const selectedClassId = ref('')
const selectedInClassId = ref('')

const classOptions = computed(() => classes)
const inClassOptions = computed(() => inClasses)

const selectedClass = computed(() => classes.find((c) => c.id === selectedClassId.value))
const selectedInClass = computed(() => inClasses.find((ic) => ic.id === selectedInClassId.value))

const participants = computed(() => {
  if (!selectedClass.value) return []
  return users.filter((u) => selectedClass.value!.participants.includes(u.id))
})

// ── Helpers ──
function userName(id: string) {
  return users.find((u) => u.id === id)?.name ?? id
}
function testTitle(id: string) {
  return tests.find((t) => t.id === id)?.title ?? id
}
function materiTitle(id: string) {
  return materis.find((m) => m.id === id)?.title ?? id
}
function activityLabel(type: InClassActivity['type'], refId: string) {
  if (type === 'preTest') return `Pre-Test: ${testTitle(refId)}`
  if (type === 'postTest') return `Post-Test: ${testTitle(refId)}`
  return `Materi: ${materiTitle(refId)}`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Check completion ──
function isCompleted(
  participantId: string,
  categoryId: string,
  type: InClassActivity['type'],
  refId: string,
) {
  if (type === 'preTest' || type === 'postTest') {
    return testAttempts.some(
      (a) =>
        a.participantId === participantId &&
        a.classId === selectedClassId.value &&
        a.inClassId === selectedInClassId.value &&
        a.categoryId === categoryId &&
        a.testType === type &&
        a.status === 'completed',
    )
  }
  return inClassActivityCompletions.some(
    (c) =>
      c.participantId === participantId &&
      c.classId === selectedClassId.value &&
      c.inClassId === selectedInClassId.value &&
      c.categoryId === categoryId &&
      c.activityType === 'materi' &&
      c.refId === refId,
  )
}

// ── Build activity sequence ──
function buildActivities(categoryId: string): InClassActivity[] {
  const cat = selectedInClass.value?.categories.find((c) => c.id === categoryId)
  if (!cat) return []
  const seq: InClassActivity[] = []
  let order = 0
  if (cat.preTestId) seq.push({ type: 'preTest', refId: cat.preTestId, order: order++ })
  for (const mId of cat.materiIds) seq.push({ type: 'materi', refId: mId, order: order++ })
  if (cat.postTestId) seq.push({ type: 'postTest', refId: cat.postTestId, order: order++ })
  return seq
}

// ── Token generation ──
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TK-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Issue token modal ──
const showModal = ref(false)
const modalNote = ref('')
const modalPid = ref('')
const modalCatId = ref('')
const modalActivity = ref<InClassActivity | null>(null)

function openIssue(participantId: string, categoryId: string, activity: InClassActivity) {
  modalPid.value = participantId
  modalCatId.value = categoryId
  modalActivity.value = activity
  modalNote.value = ''
  showModal.value = true
}

function confirmIssue() {
  if (!modalActivity.value) return
  const token = generateToken()
  materiAccessTokens.push({
    id: 'mat' + Date.now(),
    token,
    classId: selectedClassId.value,
    inClassId: selectedInClassId.value,
    categoryId: modalCatId.value,
    participantId: modalPid.value,
    activityType: modalActivity.value.type,
    refId: modalActivity.value.refId,
    issuedBy: auth.userId,
    issuedAt: new Date().toISOString(),
    note: modalNote.value.trim() || undefined,
  })
  showModal.value = false
}

// ── Token log ──
const tokenLog = computed(() =>
  materiAccessTokens
    .filter((t) => t.classId === selectedClassId.value && t.inClassId === selectedInClassId.value)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
)

function revokeToken(id: string) {
  const idx = materiAccessTokens.findIndex((t) => t.id === id)
  if (idx !== -1) materiAccessTokens.splice(idx, 1)
}

// ── Modal computed helpers ──
const modalParticipantName = computed(() => userName(modalPid.value))
const modalActivityLabel = computed(() =>
  modalActivity.value ? activityLabel(modalActivity.value.type, modalActivity.value.refId) : '',
)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">InClass Access Tokens</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        Issue tokens to let participants skip locked materi or tests in an in-class session.
      </p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
        <select
          v-model="selectedClassId"
          @change="selectedInClassId = ''"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Class --</option>
          <option v-for="c in classOptions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">In-Class Session</label>
        <select
          v-model="selectedInClassId"
          :disabled="!selectedClassId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select In-Class --</option>
          <option v-for="ic in inClassOptions" :key="ic.id" :value="ic.id">{{ ic.title }}</option>
        </select>
      </div>
    </div>

    <!-- Placeholder -->
    <div
      v-if="!selectedClassId || !selectedInClassId"
      class="bg-white rounded-xl shadow p-16 text-center text-gray-400"
    >
      <span class="text-4xl block mb-3">🔑</span>
      Select a class and in-class session to manage access tokens.
    </div>

    <template v-else-if="selectedInClass">
      <!-- Per-category activity matrix -->
      <div
        v-for="category in selectedInClass.categories"
        :key="category.id"
        class="bg-white rounded-xl shadow mb-5 overflow-hidden"
      >
        <!-- Category header -->
        <div class="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <h3 class="font-semibold text-gray-800">{{ category.name }}</h3>
          <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full"
            >{{ category.weight }}%</span
          >
        </div>

        <!-- Activity columns header -->
        <div
          class="grid border-b border-gray-100 bg-gray-50"
          :style="{
            gridTemplateColumns: `160px repeat(${buildActivities(category.id).length}, 1fr)`,
          }"
        >
          <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Participant
          </div>
          <div
            v-for="act in buildActivities(category.id)"
            :key="act.refId"
            class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide truncate border-l border-gray-100"
          >
            <span
              :class="
                act.type === 'preTest'
                  ? 'text-indigo-600'
                  : act.type === 'postTest'
                    ? 'text-teal-600'
                    : 'text-amber-600'
              "
            >
              {{ act.type === 'preTest' ? '📝 Pre' : act.type === 'postTest' ? '📋 Post' : '📚' }}
            </span>
            <span class="block truncate text-gray-600 font-normal normal-case mt-0.5">
              {{ act.type === 'materi' ? materiTitle(act.refId) : testTitle(act.refId) }}
            </span>
          </div>
        </div>

        <!-- Participant rows -->
        <div v-if="participants.length === 0" class="px-5 py-4 text-sm text-gray-400 italic">
          No participants in this class.
        </div>

        <div
          v-for="participant in participants"
          :key="participant.id"
          class="grid border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
          :style="{
            gridTemplateColumns: `160px repeat(${buildActivities(category.id).length}, 1fr)`,
          }"
        >
          <!-- Participant name -->
          <div class="px-4 py-3 flex flex-col justify-center">
            <p class="text-sm font-medium text-gray-800">{{ participant.name }}</p>
            <p class="text-xs text-gray-400">{{ participant.nip }}</p>
          </div>

          <!-- Activity cells -->
          <div
            v-for="act in buildActivities(category.id)"
            :key="act.refId"
            class="px-3 py-3 border-l border-gray-100 flex flex-col gap-1.5 justify-center"
          >
            <!-- Status -->
            <div
              v-if="isCompleted(participant.id, category.id, act.type, act.refId)"
              class="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full w-fit"
            >
              ✓ Done
            </div>
            <div
              v-else
              class="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full w-fit"
            >
              ○ Pending
            </div>

            <!-- Active token badge -->
            <div
              v-for="tok in materiAccessTokens.filter(
                (t) =>
                  t.participantId === participant.id &&
                  t.classId === selectedClassId &&
                  t.inClassId === selectedInClassId &&
                  t.categoryId === category.id &&
                  t.activityType === act.type &&
                  t.refId === act.refId,
              )"
              :key="tok.id"
              class="flex items-center gap-1"
            >
              <span
                :class="[
                  'text-xs px-2 py-0.5 rounded-full border font-mono font-semibold',
                  tok.usedAt
                    ? 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                    : 'bg-blue-50 text-blue-700 border-blue-200',
                ]"
              >
                {{ tok.token }}
              </span>
              <span v-if="tok.usedAt" class="text-xs text-gray-400">used</span>
              <button
                v-else
                @click="revokeToken(tok.id)"
                class="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>

            <!-- Issue token button (only if not completed) -->
            <button
              v-if="!isCompleted(participant.id, category.id, act.type, act.refId)"
              @click="openIssue(participant.id, category.id, act)"
              class="text-xs text-blue-600 hover:text-blue-800 border border-dashed border-blue-200 hover:border-blue-400 px-2 py-0.5 rounded-lg transition w-fit"
            >
              + Token
            </button>
          </div>
        </div>
      </div>

      <!-- Token log -->
      <div class="bg-white rounded-xl shadow overflow-hidden mt-6">
        <div class="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <h3 class="font-semibold text-gray-800">Token Log</h3>
          <p class="text-xs text-gray-500 mt-0.5">All tokens issued for this in-class session</p>
        </div>

        <div
          v-if="tokenLog.length === 0"
          class="px-5 py-8 text-center text-sm text-gray-400 italic"
        >
          No tokens issued yet.
        </div>

        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th class="text-left px-4 py-2.5">Token</th>
              <th class="text-left px-4 py-2.5">Participant</th>
              <th class="text-left px-4 py-2.5">Activity</th>
              <th class="text-left px-4 py-2.5">Issued</th>
              <th class="text-left px-4 py-2.5">Status</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="tok in tokenLog" :key="tok.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-semibold text-blue-700">{{ tok.token }}</td>
              <td class="px-4 py-3 text-gray-700">{{ userName(tok.participantId) }}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">
                {{ activityLabel(tok.activityType, tok.refId) }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(tok.issuedAt) }}</td>
              <td class="px-4 py-3">
                <span
                  v-if="tok.usedAt"
                  class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                >
                  Used {{ formatDate(tok.usedAt) }}
                </span>
                <span v-else class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                  >Active</span
                >
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="!tok.usedAt"
                  @click="revokeToken(tok.id)"
                  class="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-0.5 rounded transition"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── Issue Token Modal ── -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-1">Issue Access Token</h3>
          <p class="text-sm text-gray-500 mb-4">
            A new token will be generated for
            <strong>{{ modalParticipantName }}</strong> to unlock:
            <em class="text-gray-700">{{ modalActivityLabel }}</em>
          </p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Note <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              v-model="modalNote"
              rows="2"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Participant missed this session due to absence."
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              @click="showModal = false"
              class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="confirmIssue"
              class="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Issue Token
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
