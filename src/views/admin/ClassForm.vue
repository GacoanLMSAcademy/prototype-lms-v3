<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  accountingMethods,
  classes,
  curricula,
  inClasses,
  knowledgeTestClasses,
  materis,
  multiraterMethods,
  presentationMethods,
  skillTestMethods,
  users as allUsers,
  validationMethods,
  verifyMethods,
} from '@/data/mockData'
import type { ClassStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? classes.find(c => c.id === route.params.id) : null

const name = ref(existing?.name ?? '')
const curriculumId = ref(existing?.curriculumId ?? '')
const knowledgeTestClassId = ref(existing?.knowledgeTestClassId ?? '')
const instructorId = ref(existing?.instructorId ?? '')
const startDate = ref(existing?.startDate ?? '')
const endDate = ref(existing?.endDate ?? '')
const status = ref<ClassStatus>(existing?.status ?? 'pending')
const participants = ref<string[]>(existing?.participants ?? [])
const raters = ref<string[]>(existing?.raters ?? [])
const inClassInstructorAssignments = ref(existing?.inClassInstructorAssignments ?? [])
const assessmentAssessorAssignments = ref(existing?.assessmentAssessorAssignments ?? [])

const categoryClass = ref<'assessment-test' | 'regular'>(
  isEdit ? (existing?.curriculumId ? 'regular' : 'assessment-test') : 'regular'
)

const assessorSearchQueries = ref<Record<string, string>>({})

function getAssessorSearchKey(trainingMethodId: string, participantId: string) {
  return `${trainingMethodId}_${participantId}`
}

function updateAssessorSearch(trainingMethodId: string, participantId: string, query: string) {
  assessorSearchQueries.value[getAssessorSearchKey(trainingMethodId, participantId)] = query
}

function getFilteredRaters(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return raterPool.filter(
    u => u.name.toLowerCase().includes(q) || (u.nip ?? '').toLowerCase().includes(q)
  )
}

function addAssessor(trainingMethodId: string, participantId: string, raterId: string) {
  let assignment = assessmentAssessorAssignments.value.find(
    a => a.trainingMethodId === trainingMethodId && a.participantId === participantId
  )
  if (!assignment) {
    assignment = { trainingMethodId, participantId, raterIds: [] }
    assessmentAssessorAssignments.value.push(assignment)
  }
  if (!assignment.raterIds.includes(raterId)) {
    assignment.raterIds.push(raterId)
  }
}

function removeAssessor(trainingMethodId: string, participantId: string, raterId: string) {
  const assignment = assessmentAssessorAssignments.value.find(
    a => a.trainingMethodId === trainingMethodId && a.participantId === participantId
  )
  if (assignment) {
    const idx = assignment.raterIds.indexOf(raterId)
    if (idx >= 0) assignment.raterIds.splice(idx, 1)
  }
}

const instructors = allUsers.filter(u => u.role === 'instructor')
const participantPool = allUsers.filter(u => u.role === 'participant')
const raterPool = allUsers.filter(u => u.role === 'rater')
const selectedCurriculum = computed(() => curricula.find(c => c.id === curriculumId.value))
const formAssessmentTypes = ['multirater', 'presentation', 'validation', 'skillTest', 'verify', 'accounting']

function toggleParticipant(id: string) {
  const idx = participants.value.indexOf(id)
  if (idx >= 0) participants.value.splice(idx, 1); else participants.value.push(id)
}
function toggleRater(id: string) {
  const idx = raters.value.indexOf(id)
  if (idx >= 0) raters.value.splice(idx, 1); else raters.value.push(id)
}

function getMethodTitle(type: string, contentId: string) {
  if (type === 'inClass') return inClasses.find(ic => ic.id === contentId)?.title
  if (type === 'multirater') return multiraterMethods.find(m => m.id === contentId)?.title
  if (type === 'presentation') return presentationMethods.find(m => m.id === contentId)?.title
  if (type === 'validation') return validationMethods.find(m => m.id === contentId)?.title
  if (type === 'skillTest') return skillTestMethods.find(m => m.id === contentId)?.title
  if (type === 'verify') return verifyMethods.find(m => m.id === contentId)?.title
  if (type === 'accounting') return accountingMethods.find(m => m.id === contentId)?.title
  return contentId
}

function assignedInstructorId(trainingMethodId: string, inClassId: string, categoryId: string, materiId: string) {
  return inClassInstructorAssignments.value.find(a =>
    a.trainingMethodId === trainingMethodId &&
    a.inClassId === inClassId &&
    a.categoryId === categoryId &&
    a.materiId === materiId
  )?.instructorId ?? ''
}

function setInstructor(trainingMethodId: string, inClassId: string, categoryId: string, materiId: string, instructor: string) {
  const idx = inClassInstructorAssignments.value.findIndex(a =>
    a.trainingMethodId === trainingMethodId &&
    a.inClassId === inClassId &&
    a.categoryId === categoryId &&
    a.materiId === materiId
  )
  if (idx >= 0) {
    const assignment = inClassInstructorAssignments.value[idx]
    if (instructor && assignment) assignment.instructorId = instructor
    else inClassInstructorAssignments.value.splice(idx, 1)
  } else if (instructor) {
    inClassInstructorAssignments.value.push({ trainingMethodId, inClassId, categoryId, materiId, instructorId: instructor })
  }
}

function assignedRaterIds(trainingMethodId: string, participantId: string) {
  return assessmentAssessorAssignments.value.find(a => a.trainingMethodId === trainingMethodId && a.participantId === participantId)?.raterIds ?? []
}

function toggleAssessor(trainingMethodId: string, participantId: string, raterId: string) {
  let assignment = assessmentAssessorAssignments.value.find(a => a.trainingMethodId === trainingMethodId && a.participantId === participantId)
  if (!assignment) {
    assignment = { trainingMethodId, participantId, raterIds: [] }
    assessmentAssessorAssignments.value.push(assignment)
  }
  const idx = assignment.raterIds.indexOf(raterId)
  if (idx >= 0) assignment.raterIds.splice(idx, 1)
  else assignment.raterIds.push(raterId)
}

function save() { alert('Class saved (mock)'); router.push('/admin/classes') }
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Class' : 'New Class' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-3xl">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1">Name</label><input v-model="name" class="w-full border rounded px-3 py-2"/></div>
        <div><label class="block text-sm font-medium mb-1">Status</label>
          <select v-model="status" class="w-full border rounded px-3 py-2">
            <option value="pending">Pending</option><option value="active">Active</option><option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div><label class="block text-sm font-medium mb-1">Category Class</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="categoryClass" value="assessment-test" :disabled="isEdit" />
            Assessment Test
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="categoryClass" value="regular" :disabled="isEdit" />
            Regular
          </label>
        </div>
      </div>
      <div><label class="block text-sm font-medium mb-1">Curriculum (locks after save)</label>
        <select v-model="curriculumId" class="w-full border rounded px-3 py-2" :disabled="isEdit">
          <option value="">-- Select --</option><option v-for="c in curricula" :key="c.id" :value="c.id">{{ c.title }}</option>
        </select>
        <p v-if="isEdit" class="text-xs text-gray-400 mt-1">Curriculum is immutable once class is created.</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div v-if="categoryClass === 'regular'"><label class="block text-sm font-medium mb-1">Knowledge Test Class <span class="text-gray-400">(optional)</span></label>
          <select v-model="knowledgeTestClassId" class="w-full border rounded px-3 py-2">
            <option value="">-- None --</option><option v-for="kt in knowledgeTestClasses" :key="kt.id" :value="kt.id">{{ kt.name }}</option>
          </select>
        </div>
        <div><label class="block text-sm font-medium mb-1">Default Instructor</label>
          <select v-model="instructorId" class="w-full border rounded px-3 py-2">
            <option value="">-- Select --</option><option v-for="inst in instructors" :key="inst.id" :value="inst.id">{{ inst.name }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="block text-sm font-medium mb-1">Start Date</label><input v-model="startDate" type="date" class="w-full border rounded px-3 py-2"/></div>
        <div><label class="block text-sm font-medium mb-1">End Date</label><input v-model="endDate" type="date" class="w-full border rounded px-3 py-2"/></div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Participants</label>
        <div class="border rounded max-h-40 overflow-y-auto p-2 space-y-1">
          <div v-for="p in participantPool" :key="p.id" class="flex items-center gap-2">
            <input type="checkbox" :checked="participants.includes(p.id) ? true : false" @change="toggleParticipant(p.id)"/>
            <span class="text-sm">{{ p.name }}</span>
          </div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Default Raters</label>
        <div class="border rounded max-h-40 overflow-y-auto p-2 space-y-1">
          <div v-for="r in raterPool" :key="r.id" class="flex items-center gap-2">
            <input type="checkbox" :checked="raters.includes(r.id) ? true : false" @change="toggleRater(r.id)"/>
            <span class="text-sm">{{ r.name }}</span>
          </div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Training Journey Assignments</label>
        <div v-if="!selectedCurriculum" class="border rounded p-4 text-sm text-gray-400">Select a curriculum to configure assignments.</div>
        <div v-else class="space-y-4">
          <div v-for="item in selectedCurriculum.items" :key="item.id" class="border rounded p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-medium capitalize">{{ item.order }}. {{ item.trainingMethodType }}</p>
                <p class="text-xs text-gray-500">{{ getMethodTitle(item.trainingMethodType, item.contentId) }}</p>
              </div>
              <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">Weight {{ item.weight }}%</span>
            </div>

            <div v-if="item.trainingMethodType === 'inClass'" class="space-y-3">
              <div v-for="cat in inClasses.find(ic => ic.id === item.contentId)?.categories ?? []" :key="cat.id" class="bg-gray-50 rounded p-3">
                <p class="text-sm font-medium mb-2">{{ cat.name }}</p>
                <div v-for="materiId in cat.materiIds" :key="materiId" class="grid grid-cols-2 gap-3 items-center mb-2">
                  <span class="text-sm">{{ materis.find(m => m.id === materiId)?.title ?? materiId }}</span>
                  <select
                    :value="assignedInstructorId(item.id, item.contentId, cat.id, materiId)"
                    @change="setInstructor(item.id, item.contentId, cat.id, materiId, ($event.target as HTMLSelectElement).value)"
                    class="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">-- Instructor --</option>
                    <option v-for="inst in instructors" :key="inst.id" :value="inst.id">{{ inst.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-else-if="formAssessmentTypes.includes(item.trainingMethodType)" class="space-y-3">
              <div v-for="pid in participants" :key="pid" class="bg-gray-50 rounded p-3">
                <p class="text-sm font-medium mb-2">{{ allUsers.find(u => u.id === pid)?.name ?? pid }}</p>
                <div class="space-y-2">
                  <div class="relative">
                    <input
                      :value="assessorSearchQueries[getAssessorSearchKey(item.id, pid)] ?? ''"
                      @input="updateAssessorSearch(item.id, pid, ($event.target as HTMLInputElement).value)"
                      placeholder="Search assessor by name or NIP..."
                      class="w-full border rounded px-3 py-1.5 text-sm"
                    />
                    <div
                      v-if="(assessorSearchQueries[getAssessorSearchKey(item.id, pid)] ?? '').trim()"
                      class="absolute z-10 top-full left-0 right-0 bg-white border rounded mt-1 shadow max-h-40 overflow-y-auto"
                    >
                      <button
                        v-for="r in getFilteredRaters(assessorSearchQueries[getAssessorSearchKey(item.id, pid)] ?? '')"
                        :key="r.id"
                        @click="addAssessor(item.id, pid, r.id); updateAssessorSearch(item.id, pid, '')"
                        class="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50"
                      >
                        <span>{{ r.name }}</span>
                        <span v-if="r.nip" class="text-gray-400 ml-2">({{ r.nip }})</span>
                      </button>
                      <p v-if="getFilteredRaters(assessorSearchQueries[getAssessorSearchKey(item.id, pid)] ?? '').length === 0" class="px-3 py-1.5 text-sm text-gray-400">No matching assessors</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="raterId in assignedRaterIds(item.id, pid)"
                      :key="raterId"
                      class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                    >
                      {{ allUsers.find(u => u.id === raterId)?.name ?? raterId }}
                      <button @click="removeAssessor(item.id, pid, raterId)" class="text-blue-600 hover:text-blue-800">&times;</button>
                    </span>
                  </div>
                </div>
              </div>
              <p v-if="participants.length === 0" class="text-sm text-gray-400">Select participants before assigning assessors.</p>
            </div>

            <p v-else class="text-sm text-gray-400">No manual assessor assignment needed for this journey.</p>
          </div>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save Class</button>
    </div>
  </div>
</template>
