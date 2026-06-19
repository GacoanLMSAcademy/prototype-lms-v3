<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  inClasses,
  users,
  tests,
  materis,
  materiTypes,
  materiAccessTokens,
} from '@/data/mockData'

const auth = useAuthStore()

// ── Filters ──
const selectedClassId = ref('')
const selectedInClassId = ref('')

const selectedInClass = computed(() => inClasses.find((ic) => ic.id === selectedInClassId.value))

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
function materiTypeName(id?: string) {
  if (!id) return '—'
  return materiTypes.find((mt) => mt.id === id)?.name ?? id
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Token for a category ──
function tokenForCategory(categoryId: string) {
  return (
    materiAccessTokens.find(
      (t) =>
        t.classId === selectedClassId.value &&
        t.inClassId === selectedInClassId.value &&
        t.categoryId === categoryId,
    ) ?? null
  )
}

// ── Token generation ──
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TK-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Issue / revoke ──
function issueToken(categoryId: string) {
  // Don't duplicate
  if (tokenForCategory(categoryId)) return
  materiAccessTokens.push({
    id: 'mat' + Date.now(),
    token: generateToken(),
    classId: selectedClassId.value,
    inClassId: selectedInClassId.value,
    categoryId,
    issuedBy: auth.userId,
    issuedAt: new Date().toISOString(),
  })
}

function revokeToken(categoryId: string) {
  const idx = materiAccessTokens.findIndex(
    (t) =>
      t.classId === selectedClassId.value &&
      t.inClassId === selectedInClassId.value &&
      t.categoryId === categoryId &&
      !t.firstRedeemedAt, // can only revoke if not yet redeemed
  )
  if (idx !== -1) materiAccessTokens.splice(idx, 1)
}

// Token log for the selected session
const tokenLog = computed(() =>
  materiAccessTokens
    .filter((t) => t.classId === selectedClassId.value && t.inClassId === selectedInClassId.value)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
)

// Copy token to clipboard (visual feedback)
const copiedId = ref<string | null>(null)
function copyToken(token: string, id: string) {
  navigator.clipboard.writeText(token).catch(() => {})
  copiedId.value = id
  setTimeout(() => {
    copiedId.value = null
  }, 1500)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">InClass Access Tokens</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        Issue a token per MateriType category. Participants enter the token to unlock that
        category's activities. One token unlocks the category for the whole class.
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
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
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
          <option v-for="ic in inClasses" :key="ic.id" :value="ic.id">{{ ic.title }}</option>
        </select>
      </div>
    </div>

    <div
      v-if="!selectedClassId || !selectedInClassId"
      class="bg-white rounded-xl shadow p-16 text-center text-gray-400"
    >
      <span class="text-4xl block mb-3">🔑</span>
      Select a class and in-class session to manage access tokens.
    </div>

    <template v-else-if="selectedInClass">
      <!-- Category token cards -->
      <div class="grid grid-cols-1 gap-4 mb-8">
        <div
          v-for="(category, idx) in selectedInClass.categories"
          :key="category.id"
          class="bg-white rounded-xl shadow overflow-hidden"
        >
          <!-- Header row -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span
                  class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium"
                >
                  Category {{ idx + 1 }}
                </span>
                <span
                  v-if="idx > 0"
                  class="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
                >
                  🔒 Locked by default
                </span>
                <span
                  v-else
                  class="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
                >
                  ✓ Always open
                </span>
              </div>
              <h3 class="font-semibold text-gray-800">{{ category.name }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                MateriType:
                <span class="font-medium text-gray-600">{{
                  materiTypeName(category.materiTypeId)
                }}</span>
                · Weight: {{ category.weight }}%
              </p>
            </div>
            <!-- Issue / status -->
            <div class="shrink-0 ml-4">
              <button
                v-if="idx === 0"
                disabled
                class="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
              >
                No token needed
              </button>
              <button
                v-else-if="!tokenForCategory(category.id)"
                @click="issueToken(category.id)"
                class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                + Issue Token
              </button>
              <div v-else class="flex items-center gap-2">
                <!-- Token display -->
                <span
                  class="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm tracking-widest"
                >
                  {{ tokenForCategory(category.id)!.token }}
                </span>
                <!-- Copy -->
                <button
                  @click="copyToken(tokenForCategory(category.id)!.token, category.id)"
                  :class="[
                    'text-xs px-2.5 py-1.5 rounded-lg border transition',
                    copiedId === category.id
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600',
                  ]"
                >
                  {{ copiedId === category.id ? '✓ Copied' : 'Copy' }}
                </button>
                <!-- Revoke (only if not yet redeemed) -->
                <button
                  v-if="!tokenForCategory(category.id)!.firstRedeemedAt"
                  @click="revokeToken(category.id)"
                  class="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1.5 rounded-lg transition"
                >
                  Revoke
                </button>
                <span
                  v-else
                  class="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg border border-green-200"
                >
                  ✓ Redeemed
                </span>
              </div>
            </div>
          </div>

          <!-- Activity preview (collapsed summary) -->
          <div class="px-5 py-3 bg-gray-50 flex flex-wrap gap-2">
            <span
              class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
            >
              📝 Pre: {{ testTitle(category.preTestId) }}
            </span>
            <span
              v-for="mId in category.materiIds"
              :key="mId"
              class="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full"
            >
              📚 {{ materiTitle(mId) }}
            </span>
            <span
              class="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full"
            >
              📋 Post: {{ testTitle(category.postTestId) }}
            </span>
          </div>

          <!-- Redeemed info -->
          <div
            v-if="tokenForCategory(category.id)?.firstRedeemedAt"
            class="px-5 py-2 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5"
          >
            <span class="text-green-500">✓</span>
            First redeemed by
            <strong>{{ userName(tokenForCategory(category.id)!.firstRedeemedBy ?? '') }}</strong>
            on {{ formatDate(tokenForCategory(category.id)!.firstRedeemedAt!) }}
            — unlocked for all participants.
          </div>
        </div>
      </div>

      <!-- Token log -->
      <div class="bg-white rounded-xl shadow overflow-hidden">
        <div class="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <h3 class="font-semibold text-gray-800">Token Log</h3>
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
              <th class="text-left px-4 py-2.5">Category</th>
              <th class="text-left px-4 py-2.5">Issued by</th>
              <th class="text-left px-4 py-2.5">Issued at</th>
              <th class="text-left px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="tok in tokenLog" :key="tok.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-semibold text-blue-700">{{ tok.token }}</td>
              <td class="px-4 py-3 text-gray-700">
                {{
                  selectedInClass.categories.find((c) => c.id === tok.categoryId)?.name ??
                  tok.categoryId
                }}
              </td>
              <td class="px-4 py-3 text-gray-500">{{ userName(tok.issuedBy) }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(tok.issuedAt) }}</td>
              <td class="px-4 py-3">
                <span
                  v-if="tok.firstRedeemedAt"
                  class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                >
                  Redeemed {{ formatDate(tok.firstRedeemedAt) }}
                </span>
                <span v-else class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
