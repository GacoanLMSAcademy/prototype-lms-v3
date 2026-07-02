<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { instructorRaports, users } from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()

const myRaports = computed(() => {
  return instructorRaports.filter(r => r.instructorId === auth.userId && r.status === 'published')
})

function viewDetail(id: string) {
  router.push(`/instructor/raport/${id}`)
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Instructor Raports</h2>

    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr>
            <th class="p-4 border-b">Period</th>
            <th class="p-4 border-b">Status</th>
            <th class="p-4 border-b text-right">Action</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="raport in myRaports" :key="raport.id" class="hover:bg-gray-50 border-b">
            <td class="p-4 font-medium">
              {{ new Date(2026, raport.month - 1).toLocaleString('default', { month: 'long' }) }} {{ raport.year }}
            </td>
            <td class="p-4">
              <span class="px-2 py-1 rounded text-xs font-semibold uppercase bg-green-100 text-green-800">
                Published
              </span>
            </td>
            <td class="p-4 text-right">
              <button @click="viewDetail(raport.id)" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium transition">
                View Detail &rarr;
              </button>
            </td>
          </tr>
          <tr v-if="myRaports.length === 0">
            <td colspan="3" class="p-8 text-center text-gray-400">
              No published raports available.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>