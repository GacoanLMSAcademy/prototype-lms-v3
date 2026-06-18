<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, formAssessments, users, assessments, trainingMethods, submissions } from '@/data/mockData'
import type { FormScoreEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const classId = route.query.classId as string
const methodId = route.params.id as string

const cls = classes.find(c => c.id === classId)
const curriculum = curricula.find(c => c.id === cls?.curriculumId)
const item = curriculum?.items.find(i => i.id === methodId)

interface FormBlock {
  key: string
  label: string
  weight: number
  form: typeof formAssessments[number]
  categoryId: string
  componentId?: string
}

const formBlocks = computed<FormBlock[]>(() => {
  if (!item) return []
  const method = trainingMethods.find(m => m.id === item.contentId)
  const cats = method?.categories ?? []
  const blocks: FormBlock[] = []
  cats.forEach(cat => {
    if (cat.components?.length) {
      cat.components.forEach(comp => {
        const compMethod = trainingMethods.find(m => m.id === comp.contentId)
        compMethod?.categories.forEach(subCat => {
          const form = formAssessments.find(f => f.id === subCat.formAssessmentId)
          if (form) {
            blocks.push({
              key: `${cat.id}_${comp.id}_${subCat.id}`,
              label: `${cat.name} > ${compMethod.title} > ${subCat.name}`,
              weight: Math.round((cat.weight * comp.weight * subCat.weight) / 100),
              form,
              categoryId: subCat.id,
              componentId: comp.id,
            })
          }
        })
      })
    } else if (cat.formAssessmentId) {
      const form = formAssessments.find(f => f.id === cat.formAssessmentId)
      if (form) {
        blocks.push({
          key: cat.id,
          label: cat.name,
          weight: cat.weight,
          form,
          categoryId: cat.id,
        })
      }
    }
  })
  return blocks
})

const participants = cls?.participants ?? []

const scoreMap = ref<Record<string, Record<string, FormScoreEntry[]>>>({})

function initScores(pid: string, blockKey: string, fields: { id: string; type: string }[]) {
  if (!scoreMap.value[pid]) scoreMap.value[pid] = {}
  if (!scoreMap.value[pid][blockKey]) {
    scoreMap.value[pid][blockKey] = fields.map(f => ({ fieldId: f.id, value: f.type === 'rating' ? 0 : '' }))
  }
  return scoreMap.value[pid][blockKey]
}

function setScore(pid: string, blockKey: string, fieldId: string, value: string | number) {
  const entry = scoreMap.value[pid]?.[blockKey]?.find(s => s.fieldId === fieldId)
  if (entry) entry.value = value
}

function submitAll() {
  Object.entries(scoreMap.value).forEach(([pid, blockMap]) => {
    Object.entries(blockMap).forEach(([blockKey, scores]) => {
      const block = formBlocks.value.find(b => b.key === blockKey)
      if (!block) return
      const form = block.form
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
        id: 'a' + Date.now() + pid + blockKey, classId, trainingMethodId: methodId,
        methodEntityId: item!.contentId, categoryId: block.categoryId,
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
  <div v-if="cls && item && formBlocks.length > 0">
    <h2 class="text-2xl font-bold mb-2">{{ trainingMethods.find(m => m.id === item?.contentId)?.title ?? item?.trainingMethodType }} Assessment</h2>
    <p class="text-gray-500 mb-6">{{ cls.name }}</p>
    <div v-for="pid in participants" :key="pid" class="bg-white rounded shadow p-4 mb-4">
      <h3 class="font-semibold mb-1">{{ users.find(u => u.id === pid)?.name }}</h3>
      <div v-if="item" class="text-xs text-gray-500 mb-3">
        <template v-for="s in submissions.filter(s => s.participantId === pid && s.classId === classId && s.trainingMethodId === methodId)" :key="s.id">
          <span class="text-green-600">Submission: </span>
          <a v-if="s.fileUrl" :href="s.fileUrl" target="_blank" class="text-blue-600 hover:underline">View Slide</a>
          <span v-if="s.description" class="ml-2">{{ s.description }}</span>
        </template>
      </div>
      <div v-for="block in formBlocks" :key="block.key" class="mb-4 border rounded p-3 bg-gray-50">
        <h4 class="text-sm font-medium mb-2 text-blue-700">{{ block.label }} ({{ block.weight }}%)</h4>
        <div v-for="field in block.form.fields" :key="field.id" class="mb-3">
          <label class="block text-sm font-medium mb-1">{{ field.label }} <span v-if="field.required" class="text-red-500">*</span> ({{ field.points }}pts)</label>
          <div v-if="field.type === 'rating'">
            <input type="range" :min="field.ratingMin ?? 1" :max="field.ratingMax ?? 5" class="w-full" @input="(e) => setScore(pid, block.key, field.id, Number((e.target as HTMLInputElement).value))"/>
            <div class="flex justify-between text-xs text-gray-500"><span>{{ field.ratingMin ?? 1 }}</span><span>{{ field.ratingMax ?? 5 }}</span></div>
          </div>
          <div v-else-if="field.type === 'mcq' && field.options">
            <select class="w-full border rounded px-2 py-1 text-sm" @change="(e: any) => setScore(pid, block.key, field.id, e.target.value)"><option value="">--</option><option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option></select>
          </div>
          <div v-else-if="field.type === 'trueFalse'">
            <label class="mr-4 text-sm"><input type="radio" :name="field.id + '_' + pid + '_' + block.key" value="True" @change="setScore(pid, block.key, field.id, 'True')" class="accent-blue-600"/> True</label>
            <label class="text-sm"><input type="radio" :name="field.id + '_' + pid + '_' + block.key" value="False" @change="setScore(pid, block.key, field.id, 'False')" class="accent-blue-600"/> False</label>
          </div>
          <div v-else-if="field.type === 'essay'">
            <textarea class="w-full border rounded px-2 py-1 text-sm" rows="3" @input="(e: any) => setScore(pid, block.key, field.id, e.target.value)"></textarea>
          </div>
        </div>
      </div>
    </div>
    <button @click="submitAll" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Submit All Assessments</button>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Assessment not found</div>
</template>