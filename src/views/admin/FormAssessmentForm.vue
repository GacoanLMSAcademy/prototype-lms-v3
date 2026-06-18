<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formAssessments, trainingMethodTypes } from '@/data/mockData'
import type { FormField, FormFieldType } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? formAssessments.find(f => f.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const typeId = ref(existing?.typeId ?? '')
const fields = ref<FormField[]>(existing?.fields ?? [])

const totalWeight = computed(() => fields.value.reduce((s, f) => s + f.points, 0))
const weightValid = computed(() => totalWeight.value === 100 && fields.value.length > 0)

function addField(type: FormFieldType) {
  const field: FormField = { id: 'ff' + Date.now(), type, label: '', required: false, points: 10 }
  if (type === 'mcq') field.options = ['Option 1', 'Option 2']
  if (type === 'trueFalse') field.options = ['True', 'False']
  if (type === 'rating') { field.ratingMin = 1; field.ratingMax = 5 }
  fields.value.push(field)
}

function removeField(idx: number) { fields.value.splice(idx, 1) }

function moveField(from: number, to: number) {
  if (to < 0 || to >= fields.value.length) return
  const a = fields.value[from]; const b = fields.value[to]
  if (!a || !b) return
  fields.value[from] = b; fields.value[to] = a
}

function addOption(fIdx: number) {
  const f = fields.value[fIdx]
  if (f?.options) f.options.push('Option ' + (f.options.length + 1))
}

function removeOption(fIdx: number, oIdx: number) {
  const f = fields.value[fIdx]
  if (f?.options) f.options.splice(oIdx, 1)
}

function cloneForm() {
  alert('Form cloned (mock)')
}

function save() {
  if (!weightValid.value) {
    alert('Total field points must equal 100%')
    return
  }
  if (fields.value.length === 0) {
    alert('At least one field is required')
    return
  }
  alert('Form saved (mock)')
  router.push('/admin/form-builder')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ isEdit ? 'Edit Form' : 'New Form' }}</h2>
      <button @click="cloneForm" class="text-sm bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Clone Form</button>
    </div>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-3xl">
      <div><label class="block text-sm font-medium mb-1">Form Title</label><input v-model="title" class="w-full border rounded px-3 py-2" placeholder="e.g. Multirater - Kompetensi Karyawan"/></div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2" rows="2"/></div>
      <div>
        <label class="block text-sm font-medium mb-1">Training Method Type</label>
        <select v-model="typeId" class="w-full border rounded px-3 py-2">
          <option value="">-- Select Type --</option>
          <option v-for="t in trainingMethodTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Fields</h3>
          <div class="flex gap-2 flex-wrap">
            <button @click="addField('mcq')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ MCQ</button>
            <button @click="addField('essay')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Essay</button>
            <button @click="addField('trueFalse')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ True/False</button>
            <button @click="addField('rating')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Rating</button>
          </div>
        </div>
        <div v-for="(f, idx) in fields" :key="f.id" class="border rounded p-4 mb-3 bg-gray-50">
          <div class="flex items-center justify-between mb-2">
            <div class="flex gap-1">
              <button @click="moveField(idx, idx - 1)" :disabled="idx === 0" class="text-xs px-1" :class="idx === 0 ? 'text-gray-300' : 'hover:bg-gray-200'">▲</button>
              <button @click="moveField(idx, idx + 1)" :disabled="idx === fields.length - 1" class="text-xs px-1" :class="idx === fields.length - 1 ? 'text-gray-300' : 'hover:bg-gray-200'">▼</button>
            </div>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{{ f.type }}</span>
            <button @click="removeField(idx)" class="text-red-500 text-sm">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-2">
            <div class="col-span-2"><label class="text-xs">Label</label><input v-model="f.label" class="w-full border rounded px-2 py-1 text-sm" placeholder="Field label"/></div>
            <div><label class="text-xs">Weight (%)</label><input v-model.number="f.points" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs"><input type="checkbox" v-model="f.required" class="accent-blue-600 mr-1"/> Required</label></div>
          </div>
          <div v-if="f.type === 'mcq' && f.options">
            <label class="text-xs">Options</label>
            <div v-for="(opt, oi) in f.options" :key="oi" class="flex items-center gap-2 mb-1">
              <input v-model="f.options![oi]" class="flex-1 border rounded px-2 py-1 text-sm"/>
              <button @click="removeOption(idx, oi)" class="text-red-400 text-xs">x</button>
            </div>
            <button @click="addOption(idx)" class="text-xs text-blue-600 mt-1">+ Option</button>
          </div>
          <div v-if="f.type === 'trueFalse' && f.options">
            <label class="text-xs">Options (fixed):</label>
            <div v-for="(opt, oi) in f.options" :key="oi" class="text-sm text-gray-500 ml-2">- {{ opt }}</div>
          </div>
          <div v-if="f.type === 'rating'" class="grid grid-cols-2 gap-3">
            <div><label class="text-xs">Min</label><input v-model.number="f.ratingMin" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">Max</label><input v-model.number="f.ratingMax" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
          </div>
        </div>
        <div class="text-sm font-medium mt-2">
          Total Field Points: {{ totalWeight }}%
          <span v-if="totalWeight !== 100" class="text-red-500">(must be 100%)</span>
          <span v-else class="text-green-600">✓</span>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" :disabled="!weightValid">Save Form</button>
    </div>
  </div>
</template>
