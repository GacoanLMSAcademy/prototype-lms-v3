<script setup lang="ts">
import { materis } from '@/data/mockData'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Materi Bank</h2>
      <button @click="router.push('/admin/materi/new')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New Materi</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="m in materis" :key="m.id" class="bg-white rounded shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">{{ m.title }}</h3>
          <span class="text-xs bg-gray-200 px-2 py-0.5 rounded uppercase">{{ m.type }}</span>
        </div>
        <p class="text-sm text-gray-500 mb-2">{{ m.description }}</p>
        <div class="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
          <iframe :src="m.embedUrl" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
        </div>
        <button @click="router.push('/admin/materi/' + m.id)" class="text-blue-600 text-sm hover:underline">Edit</button>
      </div>
      <div v-if="materis.length === 0" class="col-span-full text-center text-gray-400 py-12">No materi items yet</div>
    </div>
  </div>
</template>
