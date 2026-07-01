<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  classes,
  users,
  curricula,
  inClasses,
  formAssessments,
  feedbackSubmissions,
} from '@/data/mockData'
import type { FormField } from '@/types'

// ── Expand state ──
const expandedClasses = ref<Set<string>>(new Set())
const expandedParticipants = ref<Set<string>>(new Set())
const selectedSubmissionId = ref<string | null>(null)

function toggleClass(id: string) {
  if (expandedClasses.value.has(id)) expandedClasses.value.delete(id)
  else expandedClasses.value.add(id)
}
function toggleParticipant(key: string) {
  if (expandedParticipants.value.has(key)) expandedParticipants.value.delete(key)
  else expandedParticipants.value.add(key)
}

// ── Classes that contain at least one in-class item with feedback configured ──
const classesWithFeedback = computed(() =>
  classes.filter((cls) => {
    const curriculum = curricula.find((c) => c.id === cls.curriculumId)
    if (!curriculum) return false
    return curriculum.items
      .filter((i) => i.trainingMethodType === 'inClass')
      .some((i) => {
        const ic = inClasses.find((ic) => ic.id === i.contentId)
        return ic?.categories.some((cat) => !!cat.feedbackFormId)
      })
  }),
)

interface FeedbackTarget {
  classId: string
  inClassId: string
  categoryId: string
  categoryName: string
  inClassTitle: string
  formId: string
  formTitle: string
}

function getFeedbackTargets(clsId: string): FeedbackTarget[] {
  const cls = classes.find((c) => c.id === clsId)
  if (!cls) return []
  const curriculum = curricula.find((c) => c.id === cls.curriculumId)
  if (!curriculum) return []
  const out: FeedbackTarget[] = []
  for (const item of curriculum.items) {
    if (item.trainingMethodType !== 'inClass') continue
    const ic = inClasses.find((ic) => ic.id === item.contentId)
    if (!ic) continue
    for (const cat of ic.categories) {
      if (!cat.feedbackFormId) continue
      const form = formAssessments.find((f) => f.id === cat.feedbackFormId)
      out.push({
        classId: clsId,
        inClassId: ic.id,
        categoryId: cat.id,
        categoryName: cat.name,
        inClassTitle: ic.title,
        formId: cat.feedbackFormId,
        formTitle: form?.title ?? cat.feedbackFormId,
      })
    }
  }
  return out
}

function getSubmissionsForTarget(
  clsId: string,
  participantId: string,
  target: FeedbackTarget,
) {
  return feedbackSubmissions.filter(
    (f) =>
      f.classId === clsId &&
      f.participantId === participantId &&
      f.inClassId === target.inClassId &&
      f.categoryId === target.categoryId &&
      f.formAssessmentId === target.formId,
  )
}

function submissionCount(clsId: string, participantId: string): number {
  const targets = getFeedbackTargets(clsId)
  return targets.reduce(
    (sum, t) => sum + getSubmissionsForTarget(clsId, participantId, t).length,
    0,
  )
}

function participantName(id: string) {
  return users.find((u) => u.id === id)?.name ?? id
}

const selectedSubmission = computed(() =>
  selectedSubmissionId.value
    ? feedbackSubmissions.find((f) => f.id === selectedSubmissionId.value)
    : null,
)

const selectedForm = computed(() => {
  if (!selectedSubmission.value) return null
  return formAssessments.find(
    (f) => f.id === selectedSubmission.value!.formAssessmentId,
  )
})

function selectedContext() {
  if (!selectedSubmission.value) return null
  const sub = selectedSubmission.value
  const ic = inClasses.find((ic) => ic.id === sub.inClassId)
  const cat = ic?.categories.find((c) => c.id === sub.categoryId)
  const cls = classes.find((c) => c.id === sub.classId)
  const p = users.find((u) => u.id === sub.participantId)
  const form = formAssessments.find((f) => f.id === sub.formAssessmentId)
  return {
    className: cls?.name ?? sub.classId,
    inClassTitle: ic?.title ?? sub.inClassId,
    categoryName: cat?.name ?? sub.categoryId,
    participantName: p?.name ?? sub.participantId,
    formTitle: form?.title ?? sub.formAssessmentId,
  }
}

function fieldAnswer(fieldId: string): string {
  if (!selectedSubmission.value) return ''
  return (
    selectedSubmission.value.answers.find((a) => a.fieldId === fieldId)?.value?.toString() ??
    ''
  )
}

function ratingSteps(f: FormField) {
  if (!f.ratingMin || !f.ratingMax) return []
  const out: number[] = []
  for (let i = f.ratingMin; i <= f.ratingMax; i++) out.push(i)
  return out
}

function openDetail(submissionId: string) {
  selectedSubmissionId.value = submissionId
}
function closeDetail() {
  selectedSubmissionId.value = null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Feedback Monitoring</h2>

    <div
      v-if="classesWithFeedback.length === 0"
      class="text-center py-12 text-gray-400"
    >
      Tidak ada kelas dengan feedback form yang dikonfigurasi.
    </div>

    <div
      v-for="cls in classesWithFeedback"
      :key="cls.id"
      class="bg-white rounded shadow mb-4"
    >
      <button
        @click="toggleClass(cls.id)"
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div class="text-left">
          <h3 class="font-semibold">{{ cls.name }}</h3>
          <p class="text-xs text-gray-500">
            {{ cls.participants.length }} peserta ·
            {{ getFeedbackTargets(cls.id).length }} feedback target
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
            {{
              feedbackSubmissions.filter((f) => f.classId === cls.id).length
            }}
            submission
          </span>
          <span
            class="text-xs transition-transform"
            :class="expandedClasses.has(cls.id) ? 'rotate-90' : ''"
            >▶</span
          >
        </div>
      </button>

      <div
        v-if="expandedClasses.has(cls.id)"
        class="border-t px-4 py-3 space-y-3"
      >
        <div
          v-for="pid in cls.participants"
          :key="pid"
          class="border rounded mb-2"
        >
          <button
            @click="toggleParticipant(cls.id + '-' + pid)"
            class="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm"
          >
            <span>{{ participantName(pid) }}</span>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-xs px-2 py-0.5 rounded',
                  submissionCount(cls.id, pid) > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500',
                ]"
              >
                {{ submissionCount(cls.id, pid) }}/{{
                  getFeedbackTargets(cls.id).length
                }}
                feedback
              </span>
              <span
                class="text-xs transition-transform"
                :class="
                  expandedParticipants.has(cls.id + '-' + pid) ? 'rotate-90' : ''
                "
                >▶</span
              >
            </div>
          </button>

          <div
            v-if="expandedParticipants.has(cls.id + '-' + pid)"
            class="border-t px-3 py-3 space-y-3"
          >
            <div
              v-for="target in getFeedbackTargets(cls.id)"
              :key="target.categoryId + '-' + target.formId"
              class="mb-3"
            >
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-medium text-gray-700">
                  {{ target.inClassTitle }} · {{ target.categoryName }}
                </p>
                <span class="text-xs text-gray-400">{{ target.formTitle }}</span>
              </div>
              <div
                v-for="sub in getSubmissionsForTarget(cls.id, pid, target)"
                :key="sub.id"
                class="bg-gray-50 rounded p-3 text-sm ml-2 mb-2 border border-gray-100"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-gray-500">
                      Dikirim {{ formatDateTime(sub.submittedAt) }}
                    </p>
                  </div>
                  <button
                    @click="openDetail(sub.id)"
                    class="text-xs bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 px-3 py-1 rounded transition"
                  >
                    Lihat detail
                  </button>
                </div>
              </div>
              <p
                v-if="getSubmissionsForTarget(cls.id, pid, target).length === 0"
                class="text-gray-400 text-xs ml-2"
              >
                Belum mengisi feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Detail modal ── -->
    <Teleport to="body">
      <div
        v-if="selectedSubmission && selectedForm"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        @click.self="closeDetail"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <div
            class="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between"
          >
            <div>
              <p class="text-xs text-pink-600 font-semibold mb-1">
                FEEDBACK DETAIL
              </p>
              <h3 class="text-lg font-bold text-gray-800">
                {{ selectedForm.title }}
              </h3>
              <p
                v-if="selectedContext()"
                class="text-xs text-gray-500 mt-1"
              >
                {{ selectedContext()!.participantName }} ·
                {{ selectedContext()!.className }} ·
                {{ selectedContext()!.inClassTitle }} ·
                {{ selectedContext()!.categoryName }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Dikirim {{ formatDateTime(selectedSubmission.submittedAt) }}
              </p>
            </div>
            <button
              @click="closeDetail"
              class="text-gray-400 hover:text-gray-700 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div
              v-for="f in selectedForm.fields"
              :key="f.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <p class="text-sm font-semibold text-gray-700 mb-1">
                {{ f.label }}
                <span v-if="f.required" class="text-red-500">*</span>
              </p>

              <!-- Rating -->
              <div
                v-if="f.type === 'rating' && f.ratingMin && f.ratingMax"
                class="flex gap-2 flex-wrap"
              >
                <div
                  v-for="n in ratingSteps(f)"
                  :key="n"
                  :class="[
                    'w-9 h-9 rounded-lg border-2 flex items-center justify-center text-sm font-semibold',
                    Number(fieldAnswer(f.id)) === n
                      ? 'bg-pink-500 border-pink-500 text-white'
                      : 'bg-white border-gray-200 text-gray-400',
                  ]"
                >
                  {{ n }}
                </div>
              </div>

              <!-- MCQ -->
              <p
                v-else-if="f.type === 'mcq'"
                class="text-sm text-gray-600"
              >
                {{ fieldAnswer(f.id) || '—' }}
              </p>

              <!-- True/False -->
              <p
                v-else-if="f.type === 'trueFalse'"
                class="text-sm text-gray-600"
              >
                {{ fieldAnswer(f.id) || '—' }}
              </p>

              <!-- Essay / others -->
              <p
                v-else
                class="text-sm text-gray-600 whitespace-pre-line"
              >
                {{ fieldAnswer(f.id) || '—' }}
              </p>
            </div>
          </div>

          <div class="border-t px-6 py-3 flex justify-end">
            <button
              @click="closeDetail"
              class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
