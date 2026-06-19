<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { materis } from '@/data/mockData'
import type { MateriMediaType } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? materis.find(m => m.id === route.params.id) : null
const title = ref(existing?.title ?? '')
const type = ref<MateriMediaType>(existing?.type ?? 'pdf')
const embedUrl = ref(existing?.embedUrl ?? '')
const description = ref(existing?.description ?? '')

function save() { alert('Materi saved (mock)'); router.push('/admin/materi') }
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Materi' : 'New Materi' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
      <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2"/></div>
      <div><label class="block text-sm font-medium mb-1">Type</label>
        <select v-model="type" class="border rounded px-3 py-2 w-48">
          <option value="pdf">PDF</option><option value="slide">Slide</option><option value="video">Video</option><option value="h5p">H5P</option>
        </select>
      </div>
      <div><label class="block text-sm font-medium mb-1">Embed URL</label><input v-model="embedUrl" class="w-full border rounded px-3 py-2" placeholder="https://..."/></div>
      <div class="aspect-video bg-gray-100 rounded overflow-hidden" v-if="embedUrl"><iframe :src="embedUrl" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe></div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2"/></div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
    </div>
  </div>
</template>
