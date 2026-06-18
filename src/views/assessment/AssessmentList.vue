<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, formAssessments, assessments, trainingMethods, trainingMethodTypes, submissions } from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()
const myClasses = classes.filter(c => c.raters.includes(auth.userId) || (c.assessmentAssessorAssignments ?? []).some(a => a.raterIds.includes(auth.userId)))

const formMethodTypes = trainingMethodTypes
  .filter(t => !['inClass', 'knowledgeTest'].includes(t.name.toLowerCase().replace(/\s+/g, '')))
  .map(t => t.name.toLowerCase().replace(/\s+/g, ''))

function findMethodEntity(_type: string, contentId: string) {
  return trainingMethods.find(m => m.id === contentId)
}

interface PendingItem { methodId: string; entityTitle: string; className: string; classId: string }
const pending = computed<PendingItem[]>(() => {
  const result: PendingItem[] = []
  myClasses.forEach(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    curriculum?.items.forEach(item => {
      if (!formMethodTypes.includes(item.trainingMethodType as any)) return
      const assignedParticipants = (cls.assessmentAssessorAssignments ?? []).filter(a => a.trainingMethodId === item.id && a.raterIds.includes(auth.userId))
      if (cls.assessmentAssessorAssignments?.length && assignedParticipants.length === 0) return
      const done = assessments.some(a => a.raterId === auth.userId && a.classId === cls.id && a.trainingMethodId === item.id)
      if (!done) {
        const entity = findMethodEntity(item.trainingMethodType, item.contentId)
        if (entity) result.push({ methodId: item.id, entityTitle: entity.title, className: cls.name, classId: cls.id })
      }
    })
  })
  return result
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Assessments</h2>
    <h3 class="font-semibold mb-3">Pending</h3>
    <div v-if="pending.length === 0" class="text-gray-400 text-sm mb-6">No pending assessments</div>
    <div v-for="s in pending" :key="s.methodId + s.classId" class="bg-white rounded shadow p-4 mb-3 flex items-center justify-between">
      <div><p class="font-medium">{{ s.entityTitle }}</p><p class="text-sm text-gray-500">{{ s.className }}</p>
        <span v-if="submissions.filter(sub => sub.trainingMethodId === s.methodId && sub.classId === s.classId).length" class="text-xs text-green-600">Has submissions</span>
      </div>
      <button @click="router.push(`/rater/assessments/${s.methodId}?classId=${s.classId}`)" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">Assess</button>
    </div>
    <h3 class="font-semibold mb-3 mt-6">Completed</h3>
    <div v-for="a in assessments.filter(ass => ass.raterId === auth.userId)" :key="a.id" class="bg-white rounded shadow p-4">
      <p class="font-medium">{{ formAssessments.find(f => f.id === a.formAssessmentId)?.title ?? 'Assessment' }}</p>
      <p class="text-sm text-gray-500">{{ a.scores.length }} fields scored</p>
    </div>
  </div>
</template>
