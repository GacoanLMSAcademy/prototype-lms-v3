<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { programCategories } from '@/data/mockData'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? programCategories.find(c => c.id === route.params.id) : null

const name = ref(existing?.name ?? '')
const description = ref(existing?.description ?? '')

function save() {
  alert('Program category saved (mock)')
  router.push('/admin/program-category')
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Program Category' : 'New Program Category' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
      <div>
        <label class="block text-sm font-medium mb-1">Name</label>
        <input v-model="name" class="w-full border rounded px-3 py-2" placeholder="e.g. Operasional, Pengembangan & Kepemimpinan" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea v-model="description" class="w-full border rounded px-3 py-2" rows="3" />
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
    </div>
  </div>
</template>
