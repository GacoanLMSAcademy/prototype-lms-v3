<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyMethods, formAssessments } from '@/data/mockData'
import type { MethodCategory } from '@/types'
const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? verifyMethods.find(m => m.id === route.params.id) : null
const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const categories = ref<MethodCategory[]>(existing?.categories ?? [])
function addCategory() { categories.value.push({ id: 'rc' + Date.now(), name: '', weight: 0, formAssessmentId: '' }) }
function removeCategory(idx: number) { categories.value.splice(idx, 1) }
function save() { alert('Verify saved (mock)'); router.push('/admin/verify') }
</script>
<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Verify' : 'New Verify' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-4xl">
      <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2"/></div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2"/></div>
      <div>
        <div class="flex items-center justify-between mb-2"><h3 class="font-semibold">Categories</h3><button @click="addCategory" class="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Category</button></div>
        <div v-for="(cat, ci) in categories" :key="cat.id" class="border rounded p-4 mb-4 bg-gray-50">
          <div class="flex items-center justify-between mb-2"><span class="text-sm font-medium">Category {{ ci + 1 }}</span><button @click="removeCategory(ci)" class="text-red-500 text-sm">Remove</button></div>
          <div class="grid grid-cols-3 gap-3 mb-2">
            <div><label class="text-xs">Name</label><input v-model="cat.name" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">Weight (%)</label><input v-model.number="cat.weight" type="number" class="w-full border rounded px-2 py-1 text-sm"/></div>
            <div><label class="text-xs">Form Assessment</label><select v-model="cat.formAssessmentId" class="w-full border rounded px-2 py-1 text-sm"><option value="">-- Select --</option><option v-for="f in formAssessments" :key="f.id" :value="f.id">{{ f.title }}</option></select></div>
          </div>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
    </div>
  </div>
</template>