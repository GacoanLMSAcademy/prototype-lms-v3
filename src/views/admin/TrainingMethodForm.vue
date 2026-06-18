<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trainingMethods, trainingMethodTypes, formAssessments } from '@/data/mockData'
import type { MethodCategory, TrainingMethodComponent } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? trainingMethods.find(m => m.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const typeId = ref(existing?.typeId ?? (trainingMethodTypes[0]?.id ?? ''))
const categories = ref<MethodCategory[]>(existing?.categories ?? [])

const componentMethods = computed(() => trainingMethods.filter(m => m.id !== route.params.id))

function addCategory() {
  categories.value.push({ id: 'mc' + Date.now(), name: '', weight: 0, formAssessmentId: '' })
}
function removeCategory(idx: number) { categories.value.splice(idx, 1) }

function addComponent(cat: MethodCategory) {
  if (!cat.components) cat.components = []
  cat.components.push({ id: 'tc' + Date.now(), order: cat.components.length + 1, weight: 0, passingScore: 70, contentId: '' })
}
function removeComponent(cat: MethodCategory, idx: number) {
  cat.components?.splice(idx, 1)
  if (cat.components?.length === 0) cat.components = undefined
}
function moveComponent(cat: MethodCategory, from: number, to: number) {
  if (!cat.components) return
  if (to < 0 || to >= cat.components.length) return
  const a = cat.components[from]; const b = cat.components[to]
  if (!a || !b) return
  cat.components[from] = b; cat.components[to] = a
  cat.components.forEach((c, i) => c.order = i + 1)
}

function save() {
  alert('Training method saved (mock)')
  router.push('/admin/training-method')
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Training Method' : 'New Training Method' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-4xl">
      <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2" /></div>
      <div><label class="block text-sm font-medium mb-1">Type</label>
        <select v-model="typeId" class="w-full border rounded px-3 py-2">
          <option v-for="t in trainingMethodTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2" /></div>
      <div>
        <div class="flex items-center justify-between mb-2"><h3 class="font-semibold">Categories</h3><button @click="addCategory" class="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Category</button></div>
        <div v-for="(cat, ci) in categories" :key="cat.id" class="border rounded p-4 mb-4 bg-gray-50">
          <div class="flex items-center justify-between mb-2"><span class="text-sm font-medium">Category {{ ci + 1 }}</span><button @click="removeCategory(ci)" class="text-red-500 text-sm">Remove</button></div>
          <div class="grid grid-cols-3 gap-3 mb-2">
            <div><label class="text-xs">Name</label><input v-model="cat.name" class="w-full border rounded px-2 py-1 text-sm" /></div>
            <div><label class="text-xs">Weight (%)</label><input v-model.number="cat.weight" type="number" class="w-full border rounded px-2 py-1 text-sm" /></div>
            <div v-if="cat.components?.length">
              <label class="text-xs">Training Method Category</label>
              <select v-model="cat.typeId" class="w-full border rounded px-2 py-1 text-sm">
                <option value="">-- Tag --</option>
                <option v-for="t in trainingMethodTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div v-else>
              <label class="text-xs">Form Assessment</label>
              <select v-model="cat.formAssessmentId" class="w-full border rounded px-2 py-1 text-sm">
                <option value="">-- Select --</option>
                <option v-for="f in formAssessments" :key="f.id" :value="f.id">{{ f.title }}</option>
              </select>
            </div>
          </div>

          <div v-if="cat.components?.length" class="mt-3 border-t pt-3">
            <div class="flex items-center justify-between mb-2"><h4 class="text-xs font-semibold uppercase text-gray-500">Components</h4><button @click="addComponent(cat)" class="text-xs bg-gray-200 px-2 py-0.5 rounded hover:bg-gray-300">+ Component</button></div>
            <div v-for="(comp, cj) in cat.components" :key="comp.id" class="border rounded p-3 mb-2 bg-white">
              <div class="flex items-center justify-between mb-2">
                <div class="flex gap-1">
                  <button @click="moveComponent(cat, cj, cj - 1)" :disabled="cj === 0" class="text-xs px-1" :class="cj === 0 ? 'text-gray-300' : 'hover:bg-gray-200'">▲</button>
                  <button @click="moveComponent(cat, cj, cj + 1)" :disabled="cj === (cat.components?.length ?? 0) - 1" class="text-xs px-1" :class="cj === (cat.components?.length ?? 0) - 1 ? 'text-gray-300' : 'hover:bg-gray-200'">▼</button>
                </div>
                <span class="text-xs font-medium">Component {{ cj + 1 }}</span>
                <button @click="removeComponent(cat, cj)" class="text-red-500 text-xs">Remove</button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="col-span-1">
                  <label class="text-xs">Method</label>
                  <select v-model="comp.contentId" class="w-full border rounded px-2 py-1 text-sm">
                    <option value="">-- Select --</option>
                    <option v-for="cm in componentMethods" :key="cm.id" :value="cm.id">{{ cm.title }}</option>
                  </select>
                </div>
                <div><label class="text-xs">Weight (%)</label><input v-model.number="comp.weight" type="number" class="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label class="text-xs">Passing Score</label><input v-model.number="comp.passingScore" type="number" class="w-full border rounded px-2 py-1 text-sm" /></div>
              </div>
            </div>
          </div>
          <div v-else class="mt-2">
            <button @click="addComponent(cat)" class="text-xs bg-gray-200 px-2 py-0.5 rounded hover:bg-gray-300">+ Component</button>
          </div>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
    </div>
  </div>
</template>