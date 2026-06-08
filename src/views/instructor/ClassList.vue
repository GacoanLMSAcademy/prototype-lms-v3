<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, users } from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()
const myClasses = computed(() => classes.filter(c => c.instructorId === auth.userId || (c.inClassInstructorAssignments ?? []).some(a => a.instructorId === auth.userId)))
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Classes</h2>
    <div v-if="myClasses.length === 0" class="text-center py-12 text-gray-400">No classes assigned to you.</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-else>
      <div v-for="cls in myClasses" :key="cls.id" class="bg-white rounded shadow p-4">
        <h3 class="font-semibold text-lg">{{ cls.name }}</h3>
        <p class="text-sm text-gray-500">{{ curricula.find(c => c.id === cls.curriculumId)?.title }}</p>
        <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>📅 {{ cls.startDate }} — {{ cls.endDate }}</span>
          <span class="capitalize px-2 py-0.5 rounded text-xs" :class="cls.status === 'active' ? 'bg-green-100 text-green-800' : cls.status === 'completed' ? 'bg-gray-100' : 'bg-yellow-100'">{{ cls.status }}</span>
        </div>
        <div class="mt-3 flex gap-2">
          <button @click="router.push('/instructor/classes/' + cls.id)" class="text-blue-600 hover:underline text-sm">View Participants</button>
          <button @click="router.push('/instructor/classes/' + cls.id + '/scores')" class="text-green-600 hover:underline text-sm">Scores</button>
        </div>
      </div>
    </div>
  </div>
</template>
