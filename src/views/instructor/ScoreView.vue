<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, inClasses, tests, formAssessments, users, assessments, testAttempts, presentationMethods, skillTestMethods, verifyMethods, accountingMethods, materis } from '@/data/mockData'

const route = useRoute()
const auth = useAuthStore()
const cls = classes.find(c => c.id === route.params.id && (c.instructorId === auth.userId || (c.inClassInstructorAssignments ?? []).some(a => a.instructorId === auth.userId)))
const curriculum = curricula.find(c => c.id === cls?.curriculumId)

// Group curriculum items by method type for tabbed scoring
function findEntity(type: string, contentId: string) {
  if (type === 'inClass') return inClasses.find(ic => ic.id === contentId)
  if (type === 'presentation') return presentationMethods.find(m => m.id === contentId)
  if (type === 'skillTest') return skillTestMethods.find(m => m.id === contentId)
  if (type === 'verify') return verifyMethods.find(m => m.id === contentId)
  if (type === 'accounting') return accountingMethods.find(m => m.id === contentId)
  return undefined
}

const formScaledMethods = ['presentation', 'skillTest', 'verify'] as const
const instructorMethods = curriculum?.items.filter(i => {
  if (!['inClass', 'presentation', 'skillTest', 'verify', 'accounting'].includes(i.trainingMethodType)) return false
  if (i.trainingMethodType === 'inClass') return cls?.instructorId === auth.userId || (cls?.inClassInstructorAssignments ?? []).some(a => a.trainingMethodId === i.id && a.instructorId === auth.userId)
  return cls?.instructorId === auth.userId
}) ?? []

const selectedItemId = ref('')
const selectedParticipant = ref('')

const selectedItem = computed(() => curriculum?.items.find(i => i.id === selectedItemId.value))
const selectedEntity = computed(() => selectedItem.value ? findEntity(selectedItem.value.trainingMethodType, selectedItem.value.contentId) : undefined)
const selectedInClass = computed(() => selectedEntity.value && selectedItem.value?.trainingMethodType === 'inClass' ? selectedEntity.value as typeof inClasses[number] : undefined)
const assignedMateriIds = computed(() => {
  if (!selectedItem.value || selectedItem.value.trainingMethodType !== 'inClass') return []
  if (cls?.instructorId === auth.userId && !(cls.inClassInstructorAssignments ?? []).some(a => a.trainingMethodId === selectedItem.value?.id)) {
    return selectedInClass.value?.categories.flatMap(cat => cat.materiIds) ?? []
  }
  return (cls?.inClassInstructorAssignments ?? [])
    .filter(a => a.trainingMethodId === selectedItem.value?.id && a.instructorId === auth.userId)
    .map(a => a.materiId)
})

const participantUsers = computed(() => (cls?.participants.map(pid => users.find(u => u.id === pid)).filter((x): x is NonNullable<typeof x> => !!x) ?? []))

function submitInClassScore(categoryId: string, pid: string, preScore: number, postScore: number) { alert('In-Class score submitted (mock)') }
function submitFormScore(pid: string, formAssessmentId: string) { alert('Form score submitted (mock)') }
function submitAccountingScore(pid: string, testId: string) { alert('Accounting score submitted (mock)') }
</script>

<template>
  <div v-if="cls">
    <h2 class="text-2xl font-bold mb-4">Scoring: {{ cls.name }}</h2>
    <div class="bg-white p-4 rounded shadow mb-6 flex items-center gap-4">
      <div>
        <label class="text-sm font-medium mr-2">Method</label>
        <select v-model="selectedItemId" class="border rounded px-2 py-1 text-sm">
          <option value="">Select method</option>
          <option v-for="item in instructorMethods" :key="item.id" :value="item.id" class="capitalize">{{ item.trainingMethodType }} — {{ findEntity(item.trainingMethodType, item.contentId)?.title ?? item.contentId }}</option>
        </select>
      </div>
      <div>
        <label class="text-sm font-medium mr-2">Participant</label>
        <select v-model="selectedParticipant" class="border rounded px-2 py-1 text-sm">
          <option value="">Select participant</option>
          <option v-for="p in participantUsers" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
    </div>

    <!-- In-Class Scoring -->
    <div v-if="selectedItem?.trainingMethodType === 'inClass' && selectedInClass && selectedParticipant" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-3">{{ selectedInClass.title }} — {{ users.find(u => u.id === selectedParticipant)?.name }}</h3>
      <div v-for="cat in selectedInClass.categories" :key="cat.id" class="border rounded p-3 mb-3 bg-gray-50">
        <h4 class="text-sm font-medium mb-2">{{ cat.name }} ({{ cat.weight }}%)</h4>
        <div class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="materiId in cat.materiIds.filter(id => assignedMateriIds.includes(id))"
            :key="materiId"
            class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
          >
            {{ materis.find(m => m.id === materiId)?.title ?? materiId }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><label class="block text-gray-500">Pre-Test Score</label><input type="number" min="0" max="100" class="w-full border rounded px-2 py-1 mt-1"/></div>
          <div><label class="block text-gray-500">Post-Test Score</label><input type="number" min="0" max="100" class="w-full border rounded px-2 py-1 mt-1"/></div>
        </div>
        <button @click="submitInClassScore(cat.id, selectedParticipant, 0, 0)" class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Submit</button>
      </div>
    </div>

    <!-- Form-based Scoring (Presentation, SkillTest, Verify) -->
    <div v-else-if="selectedItem && formScaledMethods.includes(selectedItem.trainingMethodType as any) && selectedEntity && selectedParticipant" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-3">{{ (selectedEntity as any).title }} — {{ users.find(u => u.id === selectedParticipant)?.name }}</h3>
      <div v-for="cat in (selectedEntity as any).categories ?? []" :key="cat.id" class="border rounded p-3 mb-3 bg-gray-50">
        <h4 class="text-sm font-medium mb-2 text-blue-700">{{ cat.name }} ({{ cat.weight }}%)</h4>
        <div v-for="field in formAssessments.find(f => f.id === cat.formAssessmentId)?.fields ?? []" :key="field.id" class="mb-3">
          <label class="block text-sm font-medium mb-1">{{ field.label }}</label>
          <div v-if="field.type === 'rating'">
            <input type="range" :min="field.ratingMin ?? 1" :max="field.ratingMax ?? 5" class="w-full"/>
            <div class="flex justify-between text-xs text-gray-500"><span>{{ field.ratingMin ?? 1 }}</span><span>{{ field.ratingMax ?? 5 }}</span></div>
          </div>
          <div v-else-if="field.type === 'mcq' && field.options">
            <select class="w-full border rounded px-2 py-1 text-sm"><option value="">--</option><option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option></select>
          </div>
          <div v-else-if="field.type === 'trueFalse'">
            <label class="mr-4 text-sm"><input type="radio" :name="'tf_' + field.id + '_' + cat.id" value="True" class="accent-blue-600"/> True</label>
            <label class="text-sm"><input type="radio" :name="'tf_' + field.id + '_' + cat.id" value="False" class="accent-blue-600"/> False</label>
          </div>
          <div v-else-if="field.type === 'essay'">
            <textarea class="w-full border rounded px-2 py-1 text-sm" rows="2"></textarea>
          </div>
        </div>
        <button @click="submitFormScore(selectedParticipant, cat.formAssessmentId)" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Submit Category Score</button>
      </div>
    </div>

    <!-- Accounting Scoring (test-based with categories) -->
    <div v-else-if="selectedItem?.trainingMethodType === 'accounting' && selectedEntity && selectedParticipant" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-3">{{ (selectedEntity as any).title }} — {{ users.find(u => u.id === selectedParticipant)?.name }}</h3>
      <div v-for="cat in (selectedEntity as any).categories ?? []" :key="cat.id" class="border rounded p-3 mb-3 bg-gray-50">
        <h4 class="text-sm font-medium mb-2 text-blue-700">{{ cat.name }} ({{ cat.weight }}%)</h4>
        <div v-for="q in tests.find(t => t.id === cat.testId)?.questions ?? []" :key="q.id" class="mb-3">
          <label class="block text-sm font-medium mb-1">{{ q.text }}</label>
          <textarea class="w-full border rounded px-2 py-1 text-sm" rows="3" placeholder="Participant's answer..."></textarea>
          <div class="mt-1"><label class="text-xs text-gray-500">Score (0-{{ q.points }})</label><input type="number" :max="q.points" class="w-24 border rounded px-2 py-0.5 text-sm ml-2"/></div>
        </div>
        <button @click="submitAccountingScore(selectedParticipant, cat.testId)" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Submit Score</button>
      </div>
    </div>

    <div v-else-if="selectedItemId && !selectedParticipant" class="text-center py-8 text-gray-400">Select a participant to score</div>
    <div v-else-if="!selectedItemId" class="text-center py-8 text-gray-400">Select a method and participant above to start scoring</div>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Class not found or not assigned to you.</div>
</template>
