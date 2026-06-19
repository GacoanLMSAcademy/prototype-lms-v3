<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { sectionTypes } from '@/data/mockData'
import type { SectionTypeEntity } from '@/types'

const router = useRouter()
const search = ref('')

const filtered = computed(() =>
  sectionTypes.filter(
    (s) =>
      s.name.toLowerCase().includes(search.value.toLowerCase()) ||
      s.description.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

function remove(id: string) {
  if (!confirm('Delete this section type?')) return
  const idx = sectionTypes.findIndex((s) => s.id === id)
  if (idx !== -1) sectionTypes.splice(idx, 1)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Section Types</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Manage the section types used in the Form Builder
        </p>
      </div>
      <button
        @click="router.push('/admin/section-types/new')"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
      >
        <span class="text-base leading-none">+</span>
        New Section Type
      </button>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="search"
        placeholder="Search section types…"
        class="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
            <th class="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
            <th class="text-left px-5 py-3 font-semibold text-gray-600">Created</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="st in filtered" :key="st.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-3 font-medium text-gray-800">
              <span class="inline-flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                {{ st.name }}
              </span>
            </td>
            <td class="px-5 py-3 text-gray-500">{{ st.description || '—' }}</td>
            <td class="px-5 py-3 text-gray-400">
              {{ new Date(st.createdAt).toLocaleDateString('id-ID') }}
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  @click="router.push('/admin/section-types/' + st.id)"
                  class="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                >
                  Edit
                </button>
                <button
                  @click="remove(st.id)"
                  class="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="4" class="px-5 py-10 text-center text-gray-400 italic">
              No section types found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-3 text-xs text-gray-400">{{ sectionTypes.length }} section type(s) total</p>
  </div>
</template>
