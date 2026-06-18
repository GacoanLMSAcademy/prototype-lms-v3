<script setup lang="ts">
import { formAssessments, trainingMethodTypes } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()

function typeName(typeId?: string) {
  if (!typeId) return ''
  const t = trainingMethodTypes.find(t => t.id === typeId)
  return t ? t.name : ''
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Form Builder</h2>
      <button @click="router.push('/admin/form-builder/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Form</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="f in formAssessments" :key="f.id" class="bg-white rounded shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">{{ f.title }}</h3>
          <button @click="router.push('/admin/form-builder/' + f.id)" class="text-blue-600 hover:underline text-sm">Edit</button>
        </div>
        <p class="text-sm text-gray-500 mb-2">{{ f.description }}</p>
        <div class="text-xs" v-if="f.typeId">
          <span class="text-blue-700 font-medium">Type:</span>
          <span class="text-gray-500 ml-1">{{ typeName(f.typeId) }}</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">{{ f.fields.length }} fields</div>
        <div class="flex flex-wrap gap-1 mt-2">
          <span v-for="field in f.fields" :key="field.id" class="text-xs bg-gray-200 px-2 py-0.5 rounded">{{ field.type }}: {{ field.label.substring(0, 20) }}{{ field.label.length > 20 ? '...' : '' }}</span>
        </div>
      </div>
      <div v-if="formAssessments.length === 0" class="col-span-2 text-center text-gray-400 py-12">No forms yet</div>
    </div>
  </div>
</template>
