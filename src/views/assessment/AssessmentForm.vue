<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, formAssessments, users, assessments, multiraterMethods, presentationMethods, validationMethods, skillTestMethods, verifyMethods } from '@/data/mockData'
import type { FormScoreEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const classId = route.query.classId as string
const methodId = route.params.id as string

const cls = classes.find(c => c.id === classId)
const curriculum = curricula.find(c => c.id === cls?.curriculumId)
const item = curriculum?.items.find(i => i.id === methodId)

interface CategoryWithForm { categoryId: string; categoryName: string; categoryWeight: number; form: typeof formAssessments[number] }

const categoriesWithForms = computed<CategoryWithForm[]>(() => {
  if (!item) return []
  const type = item.trainingMethodType
  const cid = item.contentId
  let cats: { id: string; name: string; weight: number; formAssessmentId: string }[] | undefined
  if (type === 'multirater') cats = multiraterMethods.find(m => m.id === cid)?.categories
  else if (type === 'presentation') cats = presentationMethods.find(m => m.id === cid)?.categories
  else if (type === 'validation') cats = validationMethods.find(m => m.id === cid)?.categories
  else if (type === 'skillTest') cats = skillTestMethods.find(m => m.id === cid)?.categories
  else if (type === 'verify') cats = verifyMethods.find(m => m.id === cid)?.categories
  return (cats ?? []).map(c => {
    const form = formAssessments.find(f => f.id === c.formAssessmentId)
    return form ? { categoryId: c.id, categoryName: c.name, categoryWeight: c.weight, form } : undefined
  }).filter((x): x is CategoryWithForm => !!x)
})

const participants = cls?.participants ?? []

// scoreMap: participantId -> categoryId -> FormScoreEntry[]
const scoreMap = ref<Record<string, Record<string, FormScoreEntry[]>>>({})

function initScores(pid: string, catId: string, fields: { id: string; type: string }[]) {
  if (!scoreMap.value[pid]) scoreMap.value[pid] = {}
  if (!scoreMap.value[pid][catId]) {
    scoreMap.value[pid][catId] = fields.map(f => ({ fieldId: f.id, value: f.type === 'rating' ? 0 : '' }))
  }
  return scoreMap.value[pid][catId]
}

function setScore(pid: string, catId: string, fieldId: string, value: string | number) {
  const entry = scoreMap.value[pid]?.[catId]?.find(s => s.fieldId === fieldId)
  if (entry) entry.value = value
}

function submitAll() {
  Object.entries(scoreMap.value).forEach(([pid, catMap]) => {
    Object.entries(catMap).forEach(([catId, scores]) => {
      const cwf = categoriesWithForms.value.find(c => c.categoryId === catId)
      if (!cwf) return
      const form = cwf.form
      const total = scores.reduce((s, sc) => {
        const field = form.fields.find(f => f.id === sc.fieldId)
        if (!field) return s
        if (field.type === 'rating') return s + (Number(sc.value) / (field.ratingMax ?? 5)) * field.points
        if (field.type === 'trueFalse') return s + ((sc.value === 'True' || sc.value === 'T') ? field.points : 0)
        if (field.type === 'mcq' && field.options) {
          const idx = field.options.indexOf(sc.value as string)
          const totalOpts = field.options.length
          return s + (idx >= 0 ? Math.round((totalOpts - idx) / totalOpts * field.points) : 0)
        }
        return s + (sc.value ? field.points : 0)
      }, 0)
      const maxPoints = form.fields.reduce((s, f) => s + f.points, 0) ?? 1
      assessments.push({
        id: 'a' + Date.now() + pid + catId, classId, trainingMethodId: methodId,
        methodEntityId: item!.contentId, categoryId: catId,
        raterId: auth.userId, participantId: pid, formAssessmentId: form.id,
        scores, notes: '', normalizedScore: Math.round((total / maxPoints) * 100),
        createdAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      })
    })
  })
  alert('Assessments submitted!')
  router.push('/rater/assessments')
}
</script>

<template>
  <div v-if="cls && item && categoriesWithForms.length > 0">
    <h2 class="text-2xl font-bold mb-2">{{ item.trainingMethodType }} Assessment</h2>
    <p class="text-gray-500 mb-6">{{ cls.name }}</p>
    <div v-for="pid in participants" :key="pid" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-3">{{ users.find(u => u.id === pid)?.name }}</h3>
      <div v-for="cwf in categoriesWithForms" :key="cwf.categoryId" class="mb-4 border rounded p-3 bg-gray-50">
        <h4 class="text-sm font-medium mb-2 text-blue-700">{{ cwf.categoryName }} ({{ cwf.categoryWeight }}%)</h4>
        <div v-for="field in cwf.form.fields" :key="field.id" class="mb-3">
          <label class="block text-sm font-medium mb-1">{{ field.label }} <span v-if="field.required" class="text-red-500">*</span> ({{ field.points }}pts)</label>
          <div v-if="field.type === 'rating'">
            <input type="range" :min="field.ratingMin ?? 1" :max="field.ratingMax ?? 5" class="w-full" @input="(e) => setScore(pid, cwf.categoryId, field.id, Number((e.target as HTMLInputElement).value))"/>
            <div class="flex justify-between text-xs text-gray-500"><span>{{ field.ratingMin ?? 1 }}</span><span>{{ field.ratingMax ?? 5 }}</span></div>
          </div>
          <div v-else-if="field.type === 'mcq' && field.options">
            <select class="w-full border rounded px-2 py-1 text-sm" @change="(e: any) => setScore(pid, cwf.categoryId, field.id, e.target.value)"><option value="">--</option><option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option></select>
          </div>
          <div v-else-if="field.type === 'trueFalse'">
            <label class="mr-4 text-sm"><input type="radio" :name="field.id + '_' + pid + '_' + cwf.categoryId" value="True" @change="setScore(pid, cwf.categoryId, field.id, 'True')" class="accent-blue-600"/> True</label>
            <label class="text-sm"><input type="radio" :name="field.id + '_' + pid + '_' + cwf.categoryId" value="False" @change="setScore(pid, cwf.categoryId, field.id, 'False')" class="accent-blue-600"/> False</label>
          </div>
          <div v-else-if="field.type === 'essay'">
            <textarea class="w-full border rounded px-2 py-1 text-sm" rows="3" @input="(e: any) => setScore(pid, cwf.categoryId, field.id, e.target.value)"></textarea>
          </div>
        </div>
      </div>
    </div>
    <button @click="submitAll" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Submit All Assessments</button>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Assessment not found</div>
</template>