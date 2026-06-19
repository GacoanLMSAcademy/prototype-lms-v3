<script setup lang="ts">
import { programCategories } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Program Categories</h2>
      <button @click="router.push('/admin/program-category/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Category</button>
    </div>
    <div class="bg-white rounded shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 text-left">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Description</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in programCategories" :key="c.id" class="border-t hover:bg-gray-50">
            <td class="px-4 py-3 font-medium">{{ c.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ c.description }}</td>
            <td class="px-4 py-3">
              <button @click="router.push('/admin/program-category/' + c.id)" class="text-blue-600 hover:underline text-sm">Edit</button>
            </td>
          </tr>
          <tr v-if="programCategories.length === 0">
            <td colspan="3" class="text-center text-gray-400 py-8">No categories yet</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
