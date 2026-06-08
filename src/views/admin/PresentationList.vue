<script setup lang="ts">
import { presentationMethods } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Presentation Methods</h2>
      <button @click="router.push('/admin/presentation/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New</button>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-3">Title</th><th class="p-3">Categories</th><th class="p-3">Action</th></tr></thead>
        <tbody>
          <tr v-for="m in presentationMethods" :key="m.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ m.title }}</td>
            <td class="p-3">{{ m.categories.length }}</td>
            <td class="p-3"><button @click="router.push('/admin/presentation/' + m.id)" class="text-blue-600 hover:underline text-sm">Edit</button></td>
          </tr>
          <tr v-if="presentationMethods.length === 0"><td colspan="3" class="p-6 text-center text-gray-400">No methods yet</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>