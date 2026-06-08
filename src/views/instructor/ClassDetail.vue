<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, users, curricula, inClasses } from '@/data/mockData'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cls = classes.find(c => c.id === route.params.id && (c.instructorId === auth.userId || (c.inClassInstructorAssignments ?? []).some(a => a.instructorId === auth.userId)))

const participantDetails = computed(() => (cls?.participants.map(pid => users.find(u => u.id === pid)).filter(Boolean) as NonNullable<typeof users[number]>[]) ?? [])
const curriculumDetail = computed(() => curricula.find(c => c.id === cls?.curriculumId))
</script>

<template>
  <div v-if="cls">
    <h2 class="text-2xl font-bold mb-2">{{ cls.name }}</h2>
    <p class="text-gray-500 text-sm mb-4">{{ curriculumDetail?.title ?? 'No curriculum' }}</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Period</p><p>{{ cls.startDate }} — {{ cls.endDate }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Status</p><p class="capitalize">{{ cls.status }}</p></div>
    </div>
    <div class="bg-white rounded shadow p-4">
      <h3 class="font-semibold mb-3">Participants ({{ participantDetails.length }})</h3>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-2">Name</th><th class="p-2">Email</th></tr></thead>
        <tbody>
          <tr v-for="p in participantDetails" :key="p.id" class="border-t text-sm"><td class="p-2">{{ p.name }}</td><td class="p-2">{{ p.email }}</td></tr>
          <tr v-if="participantDetails.length === 0"><td colspan="2" class="p-4 text-center text-gray-400">No participants</td></tr>
        </tbody>
      </table>
    </div>
    <div class="mt-6">
      <button @click="router.push('/instructor/classes/' + cls.id + '/scores')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Score Assessments</button>
    </div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Class not found or not assigned to you.</div>
</template>
