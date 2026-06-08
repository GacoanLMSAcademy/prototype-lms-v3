<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inClasses, tests, materis } from '@/data/mockData'
import type { MateriCategory } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? inClasses.find(ic => ic.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const categories = ref<MateriCategory[]>(existing?.categories ?? [])

function addCategory() {
  categories.value.push({ id: 'cat' + Date.now(), name: '', weight: 0, inClassId: '', preTestId: '', postTestId: '', materiIds: [] })
}
function removeCategory(idx: number) { categories.value.splice(idx, 1) }
function addMateriToCategory(catIdx: number, materiId: string) {
  const cat = categories.value[catIdx]; if (!cat) return
  if (!cat.materiIds.includes(materiId)) cat.materiIds.push(materiId)
}
function removeMateriFromCategory(catIdx: number, materiIdx: number) {
  const cat = categories.value[catIdx]; if (!cat) return; cat.materiIds.splice(materiIdx, 1)
}
function save() { alert('In-Class saved (mock)'); router.push('/admin/inclass') }
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit In-Class' : 'New In-Class' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-4xl">
      <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2"/></div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2"/></div>
      <div>
        <div class="flex items-center justify-between mb-2"><h3 class="font-semibold">Categories</h3><button @click="addCategory" class="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Category</button></div>
        <div v-for="(cat, ci) in categories" :key="cat.id" class="border rounded p-4 mb-4">
          <div class="flex items-center justify-between mb-2"><span class="text-sm font-medium">Category {{ ci + 1 }}</span><button @click="removeCategory(ci)" class="text-red-500 text-sm">Remove</button></div>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div><label class="text-xs">Name</label><input v-model="cat.name" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">Weight (%)</label><input v-model.number="cat.weight" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">In-Class ID</label><input v-model="cat.inClassId" class="w-full border rounded px-2 py-1 text-sm bg-gray-50"/></div>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div><label class="text-xs">Pre-Test</label><select v-model="cat.preTestId" class="w-full border rounded px-2 py-1 text-sm"><option value="">--</option><option v-for="t in tests" :key="t.id" :value="t.id">{{ t.title }}</option></select></div>
            <div><label class="text-xs">Post-Test</label><select v-model="cat.postTestId" class="w-full border rounded px-2 py-1 text-sm"><option value="">--</option><option v-for="t in tests" :key="t.id" :value="t.id">{{ t.title }}</option></select></div>
          </div>
          <div>
            <label class="text-xs">Materi Items</label>
            <div v-for="(mi, mii) in cat.materiIds" :key="mi" class="flex items-center gap-2 mb-1"><span class="text-sm">{{ materis.find(m => m.id === mi)?.title ?? mi }}</span><button @click="removeMateriFromCategory(ci, mii)" class="text-red-400 text-xs">x</button></div>
            <select @change="(e: any) => { addMateriToCategory(ci, e.target.value); e.target.value = '' }" class="w-full border rounded px-2 py-1 text-sm mt-1">
              <option value="">+ Add Materi</option><option v-for="m in materis.filter(mm => !cat.materiIds.includes(mm.id))" :key="m.id" :value="m.id">{{ m.title }}</option>
            </select>
          </div>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save In-Class</button>
    </div>
  </div>
</template>
