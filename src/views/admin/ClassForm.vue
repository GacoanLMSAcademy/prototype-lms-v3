<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  classes,
  curricula,
  inClasses,
  knowledgeTestClasses,
  materis,
  trainingMethods,
  trainingMethodTypes,
  programTypes,
  programCategories,
  users as allUsers,
} from '@/data/mockData'
import type { ClassStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? classes.find((c) => c.id === route.params.id) : null

// ── Basic fields ──
const name = ref(existing?.name ?? '')
const programTypeId = ref(existing?.programTypeId ?? '')
const curriculumId = ref(existing?.curriculumId ?? '')
const knowledgeTestClassId = ref(existing?.knowledgeTestClassId ?? '')
const instructorId = ref(existing?.instructorId ?? '')
const startDate = ref(existing?.startDate ?? '')
const endDate = ref(existing?.endDate ?? '')
const status = ref<ClassStatus>(existing?.status ?? 'pending')
const participants = ref<string[]>(existing?.participants ?? [])
const inClassInstructorAssignments = ref(existing?.inClassInstructorAssignments ?? [])
const assessmentAssessorAssignments = ref(existing?.assessmentAssessorAssignments ?? [])

const categoryClass = ref<'assessment-test' | 'regular'>(
  isEdit ? (existing?.curriculumId ? 'regular' : 'assessment-test') : 'regular',
)

// ── Pools ──
const instructors = allUsers.filter((u) => u.role === 'instructor')
const participantPool = allUsers.filter((u) => u.role === 'participant')
const raterPool = allUsers.filter((u) => u.role === 'rater')

// ── Derived ──
const selectedCurriculum = computed(() => curricula.find((c) => c.id === curriculumId.value))
const selectedCategoryName = computed(() => {
  const pt = programTypes.find((p) => p.id === programTypeId.value)
  if (!pt) return ''
  return programCategories.find((c) => c.id === pt.programCategoryId)?.name ?? ''
})

const journeyItems = computed(() =>
  selectedCurriculum.value
    ? [...selectedCurriculum.value.items].sort((a, b) => a.order - b.order)
    : [],
)

// ── Horizontal slider for Training Journey ──
const activeJourneyIndex = ref(0)
const journeySlideDir = ref<'left' | 'right'>('right')
const journeyAnimating = ref(false)

function goToJourney(idx: number) {
  if (idx === activeJourneyIndex.value || journeyAnimating.value) return
  journeySlideDir.value = idx > activeJourneyIndex.value ? 'right' : 'left'
  journeyAnimating.value = true
  activeJourneyIndex.value = idx
  setTimeout(() => {
    journeyAnimating.value = false
  }, 280)
}
function journeyPrev() {
  if (activeJourneyIndex.value > 0) goToJourney(activeJourneyIndex.value - 1)
}
function journeyNext() {
  if (activeJourneyIndex.value < journeyItems.value.length - 1)
    goToJourney(activeJourneyIndex.value + 1)
}

const activeJourneyItem = computed(() => journeyItems.value[activeJourneyIndex.value])

function typeLabel(type: string) {
  const map: Record<string, string> = {
    inClass: 'In-Class',
    technicaltest: 'Technical Test',
    uploadFile: 'Upload File',
    multirater: 'Multirater',
    presentation: 'Presentation',
    validation: 'Validation',
    skilltest: 'Skill Test',
    verify: 'Verify',
    accounting: 'Accounting',
  }
  return map[type.toLowerCase()] ?? type
}
function typeIcon(type: string) {
  const map: Record<string, string> = {
    inClass: '🏫',
    technicaltest: '🔬',
    uploadFile: '📤',
    multirater: '👥',
    presentation: '🎤',
    validation: '✅',
    skilltest: '🛠️',
    verify: '🔍',
    accounting: '📊',
  }
  return map[type.toLowerCase()] ?? '📋'
}

function getMethodTitle(type: string, contentId: string) {
  if (type === 'inClass') return inClasses.find((ic) => ic.id === contentId)?.title ?? contentId
  return trainingMethods.find((tm) => tm.id === contentId)?.title ?? contentId
}

// ── Participants ──
function toggleParticipant(id: string) {
  const idx = participants.value.indexOf(id)
  if (idx >= 0) participants.value.splice(idx, 1)
  else participants.value.push(id)
}

// ── InClass instructor assignment ──
function assignedInstructorId(
  trainingMethodId: string,
  inClassId: string,
  categoryId: string,
  materiId: string,
) {
  return (
    inClassInstructorAssignments.value.find(
      (a) =>
        a.trainingMethodId === trainingMethodId &&
        a.inClassId === inClassId &&
        a.categoryId === categoryId &&
        a.materiId === materiId,
    )?.instructorId ?? ''
  )
}
function setInstructor(
  trainingMethodId: string,
  inClassId: string,
  categoryId: string,
  materiId: string,
  instructor: string,
) {
  const idx = inClassInstructorAssignments.value.findIndex(
    (a) =>
      a.trainingMethodId === trainingMethodId &&
      a.inClassId === inClassId &&
      a.categoryId === categoryId &&
      a.materiId === materiId,
  )
  if (idx >= 0) {
    const a = inClassInstructorAssignments.value[idx]
    if (instructor && a) a.instructorId = instructor
    else inClassInstructorAssignments.value.splice(idx, 1)
  } else if (instructor) {
    inClassInstructorAssignments.value.push({
      trainingMethodId,
      inClassId,
      categoryId,
      materiId,
      instructorId: instructor,
    })
  }
}

// ── Assessor assignment (search) ──
const assessorSearchQueries = ref<Record<string, string>>({})
function searchKey(trainingMethodId: string, participantId: string) {
  return `${trainingMethodId}_${participantId}`
}
function getFilteredRaters(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return raterPool.filter((u) => u.name.toLowerCase().includes(q) || (u.nip ?? '').includes(q))
}
function addAssessor(trainingMethodId: string, participantId: string, raterId: string) {
  let a = assessmentAssessorAssignments.value.find(
    (a) => a.trainingMethodId === trainingMethodId && a.participantId === participantId,
  )
  if (!a) {
    a = { trainingMethodId, participantId, raterIds: [] }
    assessmentAssessorAssignments.value.push(a)
  }
  if (!a.raterIds.includes(raterId)) a.raterIds.push(raterId)
}
function removeAssessor(trainingMethodId: string, participantId: string, raterId: string) {
  const a = assessmentAssessorAssignments.value.find(
    (a) => a.trainingMethodId === trainingMethodId && a.participantId === participantId,
  )
  if (a) {
    const i = a.raterIds.indexOf(raterId)
    if (i >= 0) a.raterIds.splice(i, 1)
  }
}
function assignedRaterIds(trainingMethodId: string, participantId: string) {
  return (
    assessmentAssessorAssignments.value.find(
      (a) => a.trainingMethodId === trainingMethodId && a.participantId === participantId,
    )?.raterIds ?? []
  )
}

// ── Component tree helpers ──
// Returns a flat list of "leaf" assignment targets for an assessor-type curriculum item.
// Each leaf has: categoryId, categoryName, componentId (may equal categoryId if no components),
// componentName, methodId (the TrainingMethod id to key assignments against)
interface AssignLeaf {
  categoryId: string
  categoryName: string
  categoryWeight: number
  componentId: string // TrainingMethodComponent.id or same as categoryId when no components
  componentName: string // sub-method title or category name
  componentWeight: number
  methodId: string // the TrainingMethod.id to use as trainingMethodId for assignments
  hasComponents: boolean
}

function getAssignLeaves(curriculumItemId: string, contentId: string): AssignLeaf[] {
  const method = trainingMethods.find((m) => m.id === contentId)
  if (!method) return []
  const leaves: AssignLeaf[] = []
  for (const cat of method.categories) {
    if (cat.components && cat.components.length > 0) {
      for (const comp of cat.components) {
        const subMethod = trainingMethods.find((m) => m.id === comp.contentId)
        leaves.push({
          categoryId: cat.id,
          categoryName: cat.name,
          categoryWeight: cat.weight,
          componentId: comp.id,
          componentName: subMethod?.title ?? comp.contentId,
          componentWeight: comp.weight,
          methodId: comp.contentId, // assign against the sub-method id
          hasComponents: true,
        })
      }
    } else {
      // No components — the category itself is the leaf
      leaves.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryWeight: cat.weight,
        componentId: cat.id,
        componentName: cat.name,
        componentWeight: cat.weight,
        methodId: curriculumItemId, // fall back to curriculum item id
        hasComponents: false,
      })
    }
  }
  return leaves
}

// needs assessor assignment
const assessorTypes = [
  'multirater',
  'presentation',
  'validation',
  'skilltest',
  'verify',
  'accounting',
  'technicaltest',
]

function save() {
  alert('Class saved (mock)')
  router.push('/admin/classes')
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Class' : 'New Class' }}</h2>
    <div class="bg-white p-6 rounded-xl shadow space-y-5 max-w-3xl">
      <!-- Basic info grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium mb-1">Class Name</label>
          <input
            v-model="name"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. Frontliner Angkatan 1 - Reguler A"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Program Type</label>
          <select v-model="programTypeId" class="w-full border rounded-lg px-3 py-2">
            <option value="">-- Select --</option>
            <option v-for="pt in programTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
          </select>
          <p v-if="selectedCategoryName" class="text-xs text-gray-500 mt-1">
            Category: {{ selectedCategoryName }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select v-model="status" class="w-full border rounded-lg px-3 py-2">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <!-- Category class -->
      <div>
        <label class="block text-sm font-medium mb-2">Category Class</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input
              type="radio"
              v-model="categoryClass"
              value="assessment-test"
              :disabled="isEdit"
            />
            Assessment Test
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="categoryClass" value="regular" :disabled="isEdit" />
            Regular
          </label>
        </div>
      </div>

      <!-- Curriculum -->
      <div>
        <label class="block text-sm font-medium mb-1"
          >Curriculum
          <span class="text-gray-400 font-normal text-xs">(locked after save)</span></label
        >
        <select
          v-model="curriculumId"
          class="w-full border rounded-lg px-3 py-2"
          :disabled="isEdit"
        >
          <option value="">-- Select --</option>
          <option v-for="c in curricula" :key="c.id" :value="c.id">{{ c.title }}</option>
        </select>
        <p v-if="isEdit" class="text-xs text-gray-400 mt-1">
          Curriculum is immutable once class is created.
        </p>
      </div>

      <!-- Knowledge test + instructor -->
      <div class="grid grid-cols-2 gap-4">
        <div v-if="categoryClass === 'regular'">
          <label class="block text-sm font-medium mb-1"
            >Knowledge Test <span class="text-gray-400 font-normal text-xs">(optional)</span></label
          >
          <select v-model="knowledgeTestClassId" class="w-full border rounded-lg px-3 py-2">
            <option value="">-- None --</option>
            <option v-for="kt in knowledgeTestClasses" :key="kt.id" :value="kt.id">
              {{ kt.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Default Instructor</label>
          <select v-model="instructorId" class="w-full border rounded-lg px-3 py-2">
            <option value="">-- Select --</option>
            <option v-for="inst in instructors" :key="inst.id" :value="inst.id">
              {{ inst.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Start Date</label>
          <input v-model="startDate" type="date" class="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">End Date</label>
          <input v-model="endDate" type="date" class="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <!-- Participants -->
      <div>
        <label class="block text-sm font-medium mb-2">Participants</label>
        <div class="border rounded-lg max-h-44 overflow-y-auto p-2 space-y-1">
          <label
            v-for="p in participantPool"
            :key="p.id"
            class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="participants.includes(p.id)"
              @change="toggleParticipant(p.id)"
              class="accent-blue-600"
            />
            <span class="text-sm">{{ p.name }}</span>
            <span class="text-xs text-gray-400">{{ p.nip }}</span>
          </label>
        </div>
        <p class="text-xs text-gray-400 mt-1">{{ participants.length }} selected</p>
      </div>

      <!-- ── Training Journey Assignments (horizontal slider) ── -->
      <div>
        <label class="block text-sm font-medium mb-2">Training Journey Assignments</label>

        <div
          v-if="!selectedCurriculum"
          class="border rounded-xl p-8 text-center text-sm text-gray-400 bg-gray-50"
        >
          Select a curriculum above to configure assignments.
        </div>

        <div v-else class="border rounded-xl overflow-hidden shadow-sm">
          <!-- Step tabs -->
          <div
            class="bg-gray-50 border-b border-gray-200 px-3 pt-3 pb-0 flex items-end gap-1.5 overflow-x-auto"
          >
            <button
              v-for="(item, idx) in journeyItems"
              :key="item.id"
              @click="goToJourney(idx)"
              :class="[
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border border-b-0 whitespace-nowrap transition-colors shrink-0',
                activeJourneyIndex === idx
                  ? 'bg-white border-gray-200 text-blue-700 -mb-px z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700',
              ]"
            >
              <span>{{ typeIcon(item.trainingMethodType) }}</span>
              <span>{{ item.order }}. {{ typeLabel(item.trainingMethodType) }}</span>
            </button>
          </div>

          <!-- Slide viewport -->
          <div class="relative overflow-hidden bg-white">
            <!-- Prev / Next arrows -->
            <button
              @click="journeyPrev"
              :disabled="activeJourneyIndex === 0"
              :class="[
                'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center rounded-full shadow bg-white border border-gray-200 text-sm transition',
                activeJourneyIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100',
              ]"
            >
              ←
            </button>
            <button
              @click="journeyNext"
              :disabled="activeJourneyIndex === journeyItems.length - 1"
              :class="[
                'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center rounded-full shadow bg-white border border-gray-200 text-sm transition',
                activeJourneyIndex === journeyItems.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-100',
              ]"
            >
              →
            </button>

            <Transition
              :name="journeySlideDir === 'right' ? 'jslide-left' : 'jslide-right'"
              mode="out-in"
            >
              <div v-if="activeJourneyItem" :key="activeJourneyItem.id" class="px-10 py-5">
                <!-- Item header -->
                <div class="flex items-start justify-between mb-4 gap-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xl">{{
                        typeIcon(activeJourneyItem.trainingMethodType)
                      }}</span>
                      <h3 class="font-semibold text-gray-800">
                        {{ typeLabel(activeJourneyItem.trainingMethodType) }}
                      </h3>
                    </div>
                    <p class="text-sm text-gray-500">
                      {{
                        getMethodTitle(
                          activeJourneyItem.trainingMethodType,
                          activeJourneyItem.contentId,
                        )
                      }}
                    </p>
                  </div>
                  <div class="flex gap-2 shrink-0 text-xs">
                    <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >Weight {{ activeJourneyItem.weight }}%</span
                    >
                    <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >Pass {{ activeJourneyItem.passingScore }}%</span
                    >
                  </div>
                </div>

                <!-- ── inClass: assign instructor per materi ── -->
                <div v-if="activeJourneyItem.trainingMethodType === 'inClass'" class="space-y-3">
                  <div
                    v-for="cat in inClasses.find((ic) => ic.id === activeJourneyItem.contentId)
                      ?.categories ?? []"
                    :key="cat.id"
                    class="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <p class="text-sm font-semibold text-gray-700 mb-2">
                      {{ cat.name }}
                      <span class="text-xs font-normal text-gray-400 ml-1">{{ cat.weight }}%</span>
                    </p>
                    <div
                      v-for="materiId in cat.materiIds"
                      :key="materiId"
                      class="grid grid-cols-2 gap-3 items-center mb-2"
                    >
                      <span class="text-sm text-gray-600 truncate">{{
                        materis.find((m) => m.id === materiId)?.title ?? materiId
                      }}</span>
                      <select
                        :value="
                          assignedInstructorId(
                            activeJourneyItem.id,
                            activeJourneyItem.contentId,
                            cat.id,
                            materiId,
                          )
                        "
                        @change="
                          setInstructor(
                            activeJourneyItem.id,
                            activeJourneyItem.contentId,
                            cat.id,
                            materiId,
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Instructor --</option>
                        <option v-for="inst in instructors" :key="inst.id" :value="inst.id">
                          {{ inst.name }}
                        </option>
                      </select>
                    </div>
                    <p v-if="cat.materiIds.length === 0" class="text-xs text-gray-400 italic">
                      No materi in this category.
                    </p>
                  </div>
                  <p
                    v-if="
                      (
                        inClasses.find((ic) => ic.id === activeJourneyItem.contentId)?.categories ??
                        []
                      ).length === 0
                    "
                    class="text-sm text-gray-400 italic"
                  >
                    No categories found for this in-class session.
                  </p>
                </div>

                <!-- ── Assessment types: assign rater per participant, drilled to component ── -->
                <div
                  v-else-if="
                    assessorTypes.includes(activeJourneyItem.trainingMethodType.toLowerCase())
                  "
                  class="space-y-4"
                >
                  <div
                    v-if="participants.length === 0"
                    class="py-4 text-sm text-orange-500 text-center border border-dashed border-orange-200 rounded-lg"
                  >
                    ⚠ Add participants first, then come back to assign assessors.
                  </div>

                  <template v-else>
                    <!-- Group leaves by category -->
                    <div
                      v-for="cat in [
                        ...new Map(
                          getAssignLeaves(activeJourneyItem.id, activeJourneyItem.contentId).map(
                            (l) => [l.categoryId, l],
                          ),
                        ).values(),
                      ]"
                      :key="cat.categoryId"
                      class="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <!-- Category header -->
                      <div
                        class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2"
                      >
                        <span class="text-sm font-semibold text-gray-700">{{
                          cat.categoryName
                        }}</span>
                        <span class="text-xs text-gray-400">{{ cat.categoryWeight }}%</span>
                      </div>

                      <!-- Components inside this category -->
                      <div class="divide-y divide-gray-100">
                        <div
                          v-for="leaf in getAssignLeaves(
                            activeJourneyItem.id,
                            activeJourneyItem.contentId,
                          ).filter((l) => l.categoryId === cat.categoryId)"
                          :key="leaf.componentId"
                          class="px-4 py-3"
                        >
                          <!-- Component label (only show if category has components) -->
                          <div v-if="leaf.hasComponents" class="flex items-center gap-2 mb-3">
                            <span
                              class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium"
                            >
                              🔧 {{ leaf.componentName }}
                            </span>
                            <span class="text-xs text-gray-400">{{ leaf.componentWeight }}%</span>
                          </div>

                          <!-- Per-participant row -->
                          <div class="space-y-2">
                            <div
                              v-for="pid in participants"
                              :key="pid"
                              class="bg-gray-50 rounded-lg p-3 border border-gray-100"
                            >
                              <p class="text-xs font-semibold text-gray-600 mb-2">
                                {{ allUsers.find((u) => u.id === pid)?.name ?? pid }}
                              </p>

                              <!-- Search -->
                              <div class="relative mb-2">
                                <input
                                  :value="
                                    assessorSearchQueries[searchKey(leaf.methodId, pid)] ?? ''
                                  "
                                  @input="
                                    assessorSearchQueries[searchKey(leaf.methodId, pid)] = (
                                      $event.target as HTMLInputElement
                                    ).value
                                  "
                                  placeholder="Search assessor by name or NIP…"
                                  class="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div
                                  v-if="
                                    (
                                      assessorSearchQueries[searchKey(leaf.methodId, pid)] ?? ''
                                    ).trim()
                                  "
                                  class="absolute z-10 top-full left-0 right-0 bg-white border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto"
                                >
                                  <button
                                    v-for="r in getFilteredRaters(
                                      assessorSearchQueries[searchKey(leaf.methodId, pid)] ?? '',
                                    )"
                                    :key="r.id"
                                    @click="
                                      () => {
                                        addAssessor(leaf.methodId, pid, r.id)
                                        assessorSearchQueries[searchKey(leaf.methodId, pid)] = ''
                                      }
                                    "
                                    class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between"
                                  >
                                    <span>{{ r.name }}</span>
                                    <span v-if="r.nip" class="text-xs text-gray-400">{{
                                      r.nip
                                    }}</span>
                                  </button>
                                  <p
                                    v-if="
                                      getFilteredRaters(
                                        assessorSearchQueries[searchKey(leaf.methodId, pid)] ?? '',
                                      ).length === 0
                                    "
                                    class="px-3 py-2 text-sm text-gray-400 italic"
                                  >
                                    No matching assessors
                                  </p>
                                </div>
                              </div>

                              <!-- Assigned raters -->
                              <div class="flex flex-wrap gap-1.5">
                                <span
                                  v-for="raterId in assignedRaterIds(leaf.methodId, pid)"
                                  :key="raterId"
                                  class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full"
                                >
                                  {{ allUsers.find((u) => u.id === raterId)?.name ?? raterId }}
                                  <button
                                    @click="removeAssessor(leaf.methodId, pid, raterId)"
                                    class="text-blue-500 hover:text-blue-800 ml-0.5 leading-none"
                                  >
                                    ✕
                                  </button>
                                </span>
                                <span
                                  v-if="assignedRaterIds(leaf.methodId, pid).length === 0"
                                  class="text-xs text-gray-400 italic"
                                  >No assessors assigned yet.</span
                                >
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Fallback if method not found -->
                    <p
                      v-if="
                        getAssignLeaves(activeJourneyItem.id, activeJourneyItem.contentId)
                          .length === 0
                      "
                      class="text-sm text-gray-400 italic text-center py-4"
                    >
                      No training method categories found for this step.
                    </p>
                  </template>
                </div>

                <!-- ── Upload file / other ── -->
                <div
                  v-else
                  class="py-6 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg"
                >
                  No manual assignment needed for this step.
                </div>
              </div>
            </Transition>
          </div>

          <!-- Dot indicator -->
          <div class="bg-gray-50 border-t border-gray-100 px-4 py-2.5 flex items-center gap-2">
            <div class="flex gap-1.5">
              <button
                v-for="(_, idx) in journeyItems"
                :key="idx"
                @click="goToJourney(idx)"
                :class="[
                  'w-2 h-2 rounded-full transition-all',
                  activeJourneyIndex === idx
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400',
                ]"
              />
            </div>
            <span class="text-xs text-gray-400 ml-1">
              Step {{ activeJourneyIndex + 1 }} of {{ journeyItems.length }}
            </span>
          </div>
        </div>
      </div>

      <button
        @click="save"
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
      >
        Save Class
      </button>
    </div>
  </div>
</template>

<style scoped>
.jslide-left-enter-active,
.jslide-left-leave-active,
.jslide-right-enter-active,
.jslide-right-leave-active {
  transition:
    transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.26s ease;
  position: relative;
}
.jslide-left-enter-from {
  transform: translateX(50px);
  opacity: 0;
}
.jslide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.jslide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.jslide-left-leave-to {
  transform: translateX(-50px);
  opacity: 0;
}
.jslide-right-enter-from {
  transform: translateX(-50px);
  opacity: 0;
}
.jslide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.jslide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.jslide-right-leave-to {
  transform: translateX(50px);
  opacity: 0;
}
</style>
