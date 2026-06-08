<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { classes, users, curricula, inClasses, materis } from '@/data/mockData'

const route = useRoute()
const router = useRouter()
const cls = classes.find(c => c.id === route.params.id)
const participantDetails = computed(() => (cls?.participants.map(pid => users.find(u => u.id === pid)).filter(Boolean) as NonNullable<typeof users[number]>[]) ?? [])
const raterDetails = computed(() => (cls?.raters.map(rid => users.find(u => u.id === rid)).filter(Boolean) as NonNullable<typeof users[number]>[]) ?? [])
const curriculumDetail = computed(() => curricula.find(c => c.id === cls?.curriculumId))

function instructorName(id: string) {
  return users.find(u => u.id === id)?.name ?? '-'
}

function raterNames(ids: string[]) {
  return ids.map(id => users.find(u => u.id === id)?.name ?? id).join(', ') || '-'
}
</script>

<template>
  <div v-if="cls">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">{{ cls.name }}</h2>
      <button @click="router.push('/admin/classes/new')" class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Edit</button>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Curriculum</p><p class="font-medium">{{ curriculumDetail?.title ?? 'Not assigned' }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Instructor</p><p class="font-medium">{{ users.find(u => u.id === cls!.instructorId)?.name ?? '-' }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Dates</p><p class="font-medium text-sm">{{ cls!.startDate }} — {{ cls!.endDate }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Status</p><p class="font-medium capitalize">{{ cls!.status }}</p></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded shadow p-4">
        <h3 class="font-semibold mb-3">Participants ({{ participantDetails.length }})</h3>
        <ul class="space-y-1"><li v-for="p in participantDetails" :key="p.id" class="text-sm">{{ p.name }} — {{ p.email }}</li><li v-if="participantDetails.length === 0" class="text-gray-400 text-sm">None</li></ul>
      </div>
      <div class="bg-white rounded shadow p-4">
        <h3 class="font-semibold mb-3">Raters ({{ raterDetails.length }})</h3>
        <ul class="space-y-1"><li v-for="r in raterDetails" :key="r.id" class="text-sm">{{ r.name }} — {{ r.email }}</li><li v-if="raterDetails.length === 0" class="text-gray-400 text-sm">None</li></ul>
      </div>
    </div>
    <div class="bg-white rounded shadow p-4 mt-6">
      <h3 class="font-semibold mb-3">Curriculum: {{ curriculumDetail?.title }}</h3>
      <div v-for="(item, idx) in curriculumDetail?.items ?? []" :key="item.id" class="border-t py-2 flex items-center justify-between text-sm">
        <span>{{ idx + 1 }}. {{ item.trainingMethodType }} ({{ item.contentId.substring(0, 8) }}...)</span>
        <span class="text-xs bg-gray-200 px-2 py-0.5 rounded">Weight: {{ item.weight }}% | Pass: {{ item.passingScore }}%</span>
      </div>
      <p v-if="!curriculumDetail" class="text-gray-400 text-sm">No curriculum assigned</p>
    </div>
    <div class="bg-white rounded shadow p-4 mt-6">
      <h3 class="font-semibold mb-3">Training Journey Assignments</h3>
      <div v-for="item in curriculumDetail?.items ?? []" :key="item.id" class="border-t py-3">
        <div class="flex items-center justify-between mb-2">
          <p class="font-medium capitalize text-sm">{{ item.trainingMethodType }}</p>
          <span class="text-xs text-gray-500">{{ item.id }}</span>
        </div>
        <div v-if="item.trainingMethodType === 'inClass'" class="space-y-2">
          <div
            v-for="assignment in (cls.inClassInstructorAssignments ?? []).filter(a => a.trainingMethodId === item.id)"
            :key="assignment.categoryId + assignment.materiId"
            class="text-sm bg-gray-50 rounded p-2 flex items-center justify-between"
          >
            <span>{{ materis.find(m => m.id === assignment.materiId)?.title ?? assignment.materiId }}</span>
            <span>{{ instructorName(assignment.instructorId) }}</span>
          </div>
          <p v-if="!(cls.inClassInstructorAssignments ?? []).some(a => a.trainingMethodId === item.id)" class="text-sm text-gray-400">No materi instructors assigned.</p>
        </div>
        <div v-else-if="['multirater', 'presentation', 'validation', 'skillTest', 'verify'].includes(item.trainingMethodType)" class="space-y-2">
          <div
            v-for="assignment in (cls.assessmentAssessorAssignments ?? []).filter(a => a.trainingMethodId === item.id)"
            :key="assignment.participantId"
            class="text-sm bg-gray-50 rounded p-2 flex items-center justify-between"
          >
            <span>{{ users.find(u => u.id === assignment.participantId)?.name ?? assignment.participantId }}</span>
            <span>{{ raterNames(assignment.raterIds) }}</span>
          </div>
          <p v-if="!(cls.assessmentAssessorAssignments ?? []).some(a => a.trainingMethodId === item.id)" class="text-sm text-gray-400">No participant assessors assigned.</p>
        </div>
        <p v-else class="text-sm text-gray-400">No manual assignment.</p>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Class not found</div>
</template>
