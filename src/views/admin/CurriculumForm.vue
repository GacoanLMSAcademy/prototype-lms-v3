<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  curricula,
  tests,
  inClasses,
  formAssessments,
  multiraterMethods,
  presentationMethods,
  validationMethods,
  skillTestMethods,
  verifyMethods,
  accountingMethods,
} from '@/data/mockData'
import type { CurriculumItem, TrainingMethodType } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? curricula.find((c) => c.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const programCategory = ref(existing?.programCategory ?? '')
const passingThreshold = ref(existing?.passingThreshold ?? 75)
const items = ref<CurriculumItem[]>(existing?.items ?? [])
const totalWeight = computed(() => items.value.reduce((s, i) => s + i.weight, 0))
const valid = computed(() => totalWeight.value === 100 && items.value.length > 0)

const methodTypes: { value: TrainingMethodType; label: string; contentLabel: string }[] = [
  // { value: 'knowledgeTest', label: 'Knowledge Test', contentLabel: 'Test' },
  { value: 'inClass', label: 'In-Class', contentLabel: 'In-Class' },
  { value: 'multirater', label: 'Multirater', contentLabel: 'Multirater Method' },
  { value: 'presentation', label: 'Presentation', contentLabel: 'Presentation Method' },
  { value: 'validation', label: 'Validation', contentLabel: 'Validation Method' },
  { value: 'skillTest', label: 'Skill Test', contentLabel: 'Skill Test Method' },
  { value: 'verify', label: 'Verify', contentLabel: 'Verify Method' },
  { value: 'accounting', label: 'Accounting', contentLabel: 'Accounting Method' },
]

function getContentList(type: TrainingMethodType) {
  if (type === 'knowledgeTest') return tests.map((t) => ({ id: t.id, title: t.title }))
  if (type === 'inClass') return inClasses.map((ic) => ({ id: ic.id, title: ic.title }))
  if (type === 'multirater') return multiraterMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'presentation') return presentationMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'validation') return validationMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'skillTest') return skillTestMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'verify') return verifyMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'accounting') return accountingMethods.map((m) => ({ id: m.id, title: m.title }))
  return []
}

function addItem() {
  items.value.push({
    id: 'ci' + Date.now(),
    order: items.value.length + 1,
    trainingMethodType: 'inClass',
    contentId: '',
    weight: 0,
    passingScore: 70,
  })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
  items.value.forEach((i, idx) => (i.order = idx + 1))
}

function moveUp(idx: number) {
  if (idx === 0) return
  const a = items.value[idx - 1]
  const b = items.value[idx]
  if (!a || !b) return
  items.value[idx - 1] = b
  items.value[idx] = a
  items.value.forEach((i, idx) => (i.order = idx + 1))
}

function moveDown(idx: number) {
  if (idx === items.value.length - 1) return
  const a = items.value[idx]
  const b = items.value[idx + 1]
  if (!a || !b) return
  items.value[idx] = b
  items.value[idx + 1] = a
  items.value.forEach((i, idx) => (i.order = idx + 1))
}

function save() {
  if (!valid.value) {
    alert('Total weight must equal 100%')
    return
  }
  alert('Curriculum saved (mock)')
  router.push('/admin/curriculum')
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Curriculum' : 'New Curriculum' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-4xl">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Title</label
          ><input v-model="title" class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Program Category</label
          ><input
            v-model="programCategory"
            class="w-full border rounded px-3 py-2"
            placeholder="e.g. Operasional"
          />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Description</label
        ><textarea v-model="description" class="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Passing Threshold (%)</label
        ><input
          v-model.number="passingThreshold"
          type="number"
          class="w-32 border rounded px-3 py-2"
        />
      </div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Training Journey (ordered)</h3>
          <button @click="addItem" class="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">
            + Add Method
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">
          Each item picks a training method type and its content. Total weight must be 100%.
        </p>
        <div v-for="(item, idx) in items" :key="item.id" class="border rounded p-4 mb-3 bg-gray-50">
          <div class="flex items-center justify-between mb-3">
            <div class="flex gap-1">
              <button
                @click="moveUp(idx)"
                :disabled="idx === 0"
                class="text-xs px-1"
                :class="idx === 0 ? 'text-gray-300' : 'hover:bg-gray-200'"
              >
                ▲
              </button>
              <button
                @click="moveDown(idx)"
                :disabled="idx === items.length - 1"
                class="text-xs px-1"
                :class="idx === items.length - 1 ? 'text-gray-300' : 'hover:bg-gray-200'"
              >
                ▼
              </button>
              <span class="text-sm font-medium ml-2">#{{ idx + 1 }}</span>
            </div>
            <button @click="removeItem(idx)" class="text-red-500 text-sm">Remove</button>
          </div>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="text-xs">Method Type</label>
              <select
                v-model="item.trainingMethodType"
                class="w-full border rounded px-2 py-1 text-sm"
              >
                <option v-for="mt in methodTypes" :key="mt.value" :value="mt.value">
                  {{ mt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs">{{
                methodTypes.find((mt) => mt.value === item.trainingMethodType)?.contentLabel ??
                'Content'
              }}</label>
              <select v-model="item.contentId" class="w-full border rounded px-2 py-1 text-sm">
                <option value="">-- Select --</option>
                <option
                  v-for="c in getContentList(item.trainingMethodType)"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.title }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs">Weight (%)</label>
              <input
                v-model.number="item.weight"
                type="number"
                class="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label class="text-xs">Pass Score</label>
              <input
                v-model.number="item.passingScore"
                type="number"
                class="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
        <div class="text-sm font-medium mt-2">
          Total Weight: {{ totalWeight }}%
          <span v-if="totalWeight !== 100" class="text-red-500">(must be 100%)</span
          ><span v-else class="text-green-600">✓</span>
        </div>
      </div>
      <button
        @click="save"
        class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        :disabled="!valid"
      >
        Save Curriculum
      </button>
    </div>
  </div>
</template>
