<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  inClasses,
  formAssessments,
  feedbackSubmissions,
  testAttempts,
} from '@/data/mockData'
import type { FormField } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formId = route.params.formId as string
const classId = (route.query.classId as string) || ''
const inClassId = (route.query.inClassId as string) || ''
const categoryId = (route.query.categoryId as string) || ''

const form = computed(() => formAssessments.find((f) => f.id === formId))
const cls = computed(() => classes.find((c) => c.id === classId))
const inClass = computed(() => inClasses.find((ic) => ic.id === inClassId))
const category = computed(() =>
  inClass.value?.categories.find((c) => c.id === categoryId),
)

const existing = computed(() =>
  feedbackSubmissions.find(
    (f) =>
      f.participantId === auth.userId &&
      f.classId === classId &&
      f.inClassId === inClassId &&
      f.categoryId === categoryId &&
      f.formAssessmentId === formId,
  ),
)

// ── Gate: require post-test completion before allowing feedback ──
const postTestPassed = computed(() => {
  if (!category.value?.postTestId) return true
  return testAttempts.some(
    (a) =>
      a.participantId === auth.userId &&
      a.classId === classId &&
      a.inClassId === inClassId &&
      a.categoryId === categoryId &&
      a.testType === 'postTest' &&
      a.status === 'completed',
  )
})

// ── Form state (only used when not yet submitted) ──
type AnswerValue = string | number
const answers = reactive<Record<string, AnswerValue>>({})

function valueFor(fieldId: string): AnswerValue {
  if (fieldId in answers) return answers[fieldId]!
  return ''
}

function setValue(fieldId: string, v: AnswerValue) {
  answers[fieldId] = v
}

const submitError = ref('')

function validate(): boolean {
  if (!form.value) return false
  for (const f of form.value.fields) {
    if (!f.required) continue
    const v = answers[f.id]
    if (v === undefined || v === '' || v === null) {
      submitError.value = `Field "${f.label}" is required.`
      return false
    }
  }
  submitError.value = ''
  return true
}

function submit() {
  if (!validate()) return
  feedbackSubmissions.push({
    id: 'fb' + Date.now(),
    classId,
    inClassId,
    categoryId,
    formAssessmentId: formId,
    participantId: auth.userId,
    answers: form.value!.fields.map((f) => ({
      fieldId: f.id,
      value: answers[f.id] ?? '',
    })),
    submittedAt: new Date().toISOString(),
  })
  router.push(`/participant/inclass/${classId}/${inClassId}`)
}

function back() {
  router.push(`/participant/inclass/${classId}/${inClassId}`)
}

function ratingValue(f: FormField, v: AnswerValue) {
  return Number(v) >= (f.ratingMin ?? 1) && Number(v) <= (f.ratingMax ?? 5)
    ? Number(v)
    : null
}

function fieldAnswer(fieldId: string): AnswerValue {
  if (!existing.value) return ''
  return existing.value.answers.find((a) => a.fieldId === fieldId)?.value ?? ''
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
</script>

<template>
  <div v-if="form" class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <button
        @click="back"
        class="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
      >
        ← Back to In-Class
      </button>
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <span
          class="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700"
        >
          Feedback
        </span>
        <span
          v-if="category"
          class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
        >
          {{ inClass?.title }} · {{ category.name }}
        </span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">{{ form.title }}</h2>
      <p v-if="form.description" class="text-sm text-gray-500 mt-1">
        {{ form.description }}
      </p>
    </div>

    <!-- Pre-condition: post-test not yet taken -->
    <div
      v-if="!postTestPassed && !existing"
      class="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center"
    >
      <p class="text-3xl mb-2">🔒</p>
      <p class="font-semibold text-amber-800 mb-1">Post-test belum selesai</p>
      <p class="text-sm text-amber-600">
        Anda harus menyelesaikan post-test terlebih dahulu sebelum mengisi
        feedback.
      </p>
      <button
        @click="back"
        class="mt-4 text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 font-medium transition"
      >
        Kembali
      </button>
    </div>

    <!-- Already submitted: read-only summary -->
    <div
      v-else-if="existing"
      class="bg-white rounded-xl shadow p-6 space-y-5"
    >
      <div
        class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2"
      >
        <span class="text-green-600 text-lg">✓</span>
        <div>
          <p class="text-sm font-semibold text-green-800">
            Feedback sudah dikirim
          </p>
          <p class="text-xs text-green-700">
            Dikirim pada {{ formatDateTime(existing.submittedAt) }}
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="f in form.fields"
          :key="f.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <p class="text-sm font-semibold text-gray-700 mb-1">
            {{ f.label }}
            <span v-if="f.required" class="text-red-500">*</span>
          </p>
          <p class="text-sm text-gray-600 whitespace-pre-line">
            {{ fieldAnswer(f.id) || '—' }}
          </p>
        </div>
      </div>

      <button
        @click="back"
        class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
      >
        Kembali
      </button>
    </div>

    <!-- Fill-out form -->
    <form
      v-else
      @submit.prevent="submit"
      class="bg-white rounded-xl shadow p-6 space-y-5"
    >
      <div
        v-for="f in form.fields"
        :key="f.id"
        class="border border-gray-200 rounded-lg p-4"
      >
        <p class="text-sm font-semibold text-gray-700 mb-2">
          {{ f.label }}
          <span v-if="f.required" class="text-red-500">*</span>
          <span
            v-if="f.type === 'rating' && f.ratingMin && f.ratingMax"
            class="text-xs text-gray-400 font-normal ml-1"
          >
            ({{ f.ratingMin }}–{{ f.ratingMax }})
          </span>
        </p>

        <!-- Rating -->
        <div v-if="f.type === 'rating' && f.ratingMin && f.ratingMax" class="flex gap-2 flex-wrap">
          <button
            v-for="n in f.ratingMax - f.ratingMin + 1"
            :key="n"
            type="button"
            @click="setValue(f.id, f.ratingMin! + n - 1)"
            :class="[
              'w-10 h-10 rounded-lg border-2 text-sm font-semibold transition',
              Number(valueFor(f.id)) === f.ratingMin! + n - 1
                ? 'bg-pink-500 border-pink-500 text-white'
                : 'bg-white border-gray-200 text-gray-500 hover:border-pink-300',
            ]"
          >
            {{ f.ratingMin! + n - 1 }}
          </button>
        </div>

        <!-- MCQ -->
        <div v-else-if="f.type === 'mcq' && f.options" class="space-y-2">
          <label
            v-for="opt in f.options"
            :key="opt"
            class="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="radio"
              :name="f.id"
              :value="opt"
              :checked="valueFor(f.id) === opt"
              @change="setValue(f.id, opt)"
              class="accent-pink-600"
            />
            <span>{{ opt }}</span>
          </label>
        </div>

        <!-- True/False -->
        <div v-else-if="f.type === 'trueFalse'" class="flex gap-2">
          <button
            type="button"
            @click="setValue(f.id, 'true')"
            :class="[
              'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition',
              valueFor(f.id) === 'true'
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-green-300',
            ]"
          >
            ✓ True
          </button>
          <button
            type="button"
            @click="setValue(f.id, 'false')"
            :class="[
              'flex-1 py-2 rounded-lg border-2 text-sm font-medium transition',
              valueFor(f.id) === 'false'
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'border-gray-200 text-gray-500 hover:border-red-300',
            ]"
          >
            ✕ False
          </button>
        </div>

        <!-- Essay -->
        <textarea
          v-else-if="f.type === 'essay'"
          :value="valueFor(f.id)"
          @input="setValue(f.id, ($event.target as HTMLTextAreaElement).value)"
          rows="4"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Type your answer..."
        ></textarea>

        <!-- Fallback text -->
        <input
          v-else
          :value="valueFor(f.id)"
          @input="setValue(f.id, ($event.target as HTMLInputElement).value)"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>

      <div class="flex gap-3 justify-end">
        <button
          type="button"
          @click="back"
          class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="text-sm bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 font-medium"
        >
          Submit Feedback
        </button>
      </div>
    </form>
  </div>
  <div v-else class="text-center py-12 text-gray-400">Feedback form not found.</div>
</template>
