<script setup lang="ts">
import { curricula, programTypes, programCategories } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()

function programTypeName(id: string) {
  const pt = programTypes.find(pt => pt.id === id)
  return pt ? pt.name : id
}

function programCategoryName(programTypeId: string) {
  const pt = programTypes.find(pt => pt.id === programTypeId)
  if (!pt) return '-'
  const cat = programCategories.find(c => c.id === pt.programCategoryId)
  return cat ? cat.name : '-'
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Curricula</h2>
      <button @click="router.push('/admin/curriculum/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Curriculum</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">Title</th><th class="p-3">Program Type</th><th class="p-3">Category</th><th class="p-3">Methods</th><th class="p-3">Pass Threshold</th><th class="p-3">Immutable</th><th class="p-3">Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in curricula" :key="c.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ c.title }}</td>
            <td class="p-3">{{ programTypeName(c.programTypeId) }}</td>
            <td class="p-3"><span class="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{{ programCategoryName(c.programTypeId) }}</span></td>
            <td class="p-3">{{ c.items.length }}</td>
            <td class="p-3">{{ c.passingThreshold }}%</td>
            <td class="p-3">{{ c.immutable ? 'Yes' : 'No' }}</td>
            <td class="p-3"><button @click="router.push('/admin/curriculum/' + c.id)" class="text-blue-600 hover:underline text-sm">Edit</button></td>
          </tr>
          <tr v-if="curricula.length === 0"><td colspan="7" class="p-6 text-center text-gray-400">No curricula yet</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
