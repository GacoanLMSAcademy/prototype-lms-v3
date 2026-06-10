<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  technicalTestMethods,
  multiraterMethods,
  presentationMethods,
  validationMethods,
  skillTestMethods,
  verifyMethods,
} from '@/data/mockData'
import type { TechnicalTestItem, FormBasedMethodType } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? technicalTestMethods.find((m) => m.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const items = ref<TechnicalTestItem[]>(existing?.categories?.[0]?.items ?? [])

const itemsTotalWeight = computed(() => items.value.reduce((s, i) => s + i.weight, 0))
const itemsValid = computed(() => itemsTotalWeight.value === 100 && items.value.length > 0)

const formBasedTypes: { value: FormBasedMethodType; label: string; contentLabel: string }[] = [
  { value: 'multirater', label: 'Multirater', contentLabel: 'Multirater Method' },
  { value: 'presentation', label: 'Presentation', contentLabel: 'Presentation Method' },
  { value: 'validation', label: 'Validation', contentLabel: 'Validation Method' },
  { value: 'skillTest', label: 'Skill Test', contentLabel: 'Skill Test Method' },
  { value: 'verify', label: 'Verify', contentLabel: 'Verify Method' },
]

function getContentList(type: FormBasedMethodType) {
  if (type === 'multirater') return multiraterMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'presentation') return presentationMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'validation') return validationMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'skillTest') return skillTestMethods.map((m) => ({ id: m.id, title: m.title }))
  if (type === 'verify') return verifyMethods.map((m) => ({ id: m.id, title: m.title }))
  return []
}

function addItem() {
  items.value.push({
    id: 'tti' + Date.now(),
    order: items.value.length + 1,
    trainingMethodType: 'multirater',
    contentId: '',
    weight: 0,
    passingScore: 70,
  })
}

function removeItem(ii: number) {
  items.value.splice(ii, 1)
  items.value.forEach((it, idx) => (it.order = idx + 1))
}

function moveItemUp(ii: number) {
  if (ii === 0) return
  const a = items.value[ii - 1]; const b = items.value[ii]
  if (!a || !b) return
  items.value[ii - 1] = b; items.value[ii] = a
  items.value.forEach((it, idx) => (it.order = idx + 1))
}

function moveItemDown(ii: number) {
  if (ii === items.value.length - 1) return
  const a = items.value[ii]; const b = items.value[ii + 1]
  if (!a || !b) return
  items.value[ii] = b; items.value[ii + 1] = a
  items.value.forEach((it, idx) => (it.order = idx + 1))
}

function save() {
  if (!itemsValid.value) {
    alert('Total items weight must equal 100%')
    return
  }
  if (items.value.length === 0) {
    alert('At least one method is required')
    return
  }
  alert('Technical Test saved (mock)')
  router.push('/admin/technical-test')
}
</script>
<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Technical Test' : 'New Technical Test' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-4xl">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2"/></div>
      </div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2"/></div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Methods</h3>
          <button @click="addItem" class="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Add Method</button>
        </div>
        <p class="text-xs text-gray-500 mb-2">Add assessment methods and their weights. Total weight must equal 100%.</p>
        <div v-for="(item, ii) in items" :key="item.id" class="border rounded p-4 mb-4 bg-gray-50">
          <div class="flex items-center justify-between mb-2">
            <div class="flex gap-1">
              <button @click="moveItemUp(ii)" :disabled="ii === 0" class="text-xs px-1" :class="ii === 0 ? 'text-gray-300' : 'hover:bg-gray-200'">▲</button>
              <button @click="moveItemDown(ii)" :disabled="ii === items.length - 1" class="text-xs px-1" :class="ii === items.length - 1 ? 'text-gray-300' : 'hover:bg-gray-200'">▼</button>
              <span class="text-xs font-medium ml-1">#{{ ii + 1 }}</span>
            </div>
            <button @click="removeItem(ii)" class="text-red-500 text-sm">Remove</button>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div>
              <label class="text-xs">Method Type</label>
              <select v-model="item.trainingMethodType" class="w-full border rounded px-2 py-1 text-sm">
                <option v-for="mt in formBasedTypes" :key="mt.value" :value="mt.value">{{ mt.label }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs">{{ formBasedTypes.find((mt) => mt.value === item.trainingMethodType)?.contentLabel ?? 'Content' }}</label>
              <select v-model="item.contentId" class="w-full border rounded px-2 py-1 text-sm">
                <option value="">-- Select --</option>
                <option v-for="c in getContentList(item.trainingMethodType)" :key="c.id" :value="c.id">{{ c.title }}</option>
              </select>
            </div>
            <div><label class="text-xs">Weight (%)</label><input v-model.number="item.weight" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">Pass Score</label><input v-model.number="item.passingScore" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
          </div>
        </div>
        <div class="text-sm font-medium mt-2">
          Total Items Weight: {{ itemsTotalWeight }}%
          <span v-if="itemsTotalWeight !== 100" class="text-red-500">(must be 100%)</span>
          <span v-else class="text-green-600">✓</span>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" :disabled="!itemsValid">Save</button>
    </div>
  </div>
</template>
