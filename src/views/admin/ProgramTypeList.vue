<script setup lang="ts">
import { programTypes, programCategories } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()

function categoryName(categoryId: string) {
  const c = programCategories.find(c => c.id === categoryId)
  return c ? c.name : categoryId
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Program Types</h2>
      <button @click="router.push('/admin/program-type/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Type</button>
    </div>
    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Description</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in programTypes" :key="t.id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium">{{ t.name }}</td>
            <td class="px-4 py-3">
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{{ categoryName(t.programCategoryId) }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ t.description }}</td>
            <td class="px-4 py-3">
              <button @click="router.push('/admin/program-type/' + t.id)" class="text-blue-600 hover:underline text-sm">Edit</button>
            </td>
          </tr>
          <tr v-if="programTypes.length === 0">
            <td colspan="4" class="text-center text-gray-400 py-8">No types yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
