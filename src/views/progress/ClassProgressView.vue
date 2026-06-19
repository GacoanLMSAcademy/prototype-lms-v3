<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  curricula,
  trainingMethods,
  trainingMethodTypes,
  inClasses,
  tests,
  materis,
  users,
  testAttempts,
  assessments,
  uploadedFiles,
  participantProgress as progressData,
} from '@/data/mockData'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Support both /participant/progress and /admin/classes/:id/progress?participantId=
const isAdmin = auth.userRole === 'admin' || auth.userRole === 'instructor'
const classIdParam = route.params.id as string | undefined
const participantIdParam = route.query.participantId as string | undefined

// ── Select class & participant ──
const selectedClassId = ref(classIdParam ?? '')
const selectedParticipantId = ref(participantIdParam ?? (isAdmin ? '' : auth.userId))

const myClasses = computed(() =>
  isAdmin ? classes : classes.filter((c) => c.participants.includes(auth.userId)),
)

const participantsOfClass = computed(() => {
  const cls = classes.find((c) => c.id === selectedClassId.value)
  if (!cls) return []
  return users.filter((u) => cls.participants.includes(u.id))
})

const cls = computed(() => classes.find((c) => c.id === selectedClassId.value))
const curriculum = computed(() => curricula.find((c) => c.id === cls.value?.curriculumId))
const pid = computed(() => selectedParticipantId.value)

// ── Status helpers ──
type StepStatus = 'locked' | 'pending' | 'inProgress' | 'passed' | 'failed'

function getTestAttempts(testId: string, inClassId?: string, categoryId?: string) {
  return testAttempts.filter(
    (a) =>
      a.testId === testId &&
      a.participantId === pid.value &&
      a.classId === selectedClassId.value &&
      (inClassId ? a.inClassId === inClassId : true) &&
      (categoryId ? a.categoryId === categoryId : true) &&
      a.status === 'completed',
  )
}

function bestAttemptScore(testId: string, inClassId?: string, categoryId?: string): number | null {
  const atts = getTestAttempts(testId, inClassId, categoryId)
  if (!atts.length) return null
  return Math.max(...atts.map((a) => a.normalizedScore))
}

function getAssessmentScore(trainingMethodId: string): number | null {
  const ass = assessments.filter(
    (a) =>
      a.participantId === pid.value &&
      a.classId === selectedClassId.value &&
      a.trainingMethodId === trainingMethodId &&
      a.completedAt,
  )
  if (!ass.length) return null
  return Math.round(ass.reduce((s, a) => s + a.normalizedScore, 0) / ass.length)
}

function getUploadStatus(curriculumItemId: string): 'submitted' | 'pending' {
  const uploaded = uploadedFiles.some(
    (f) =>
      f.participantId === pid.value &&
      f.classId === selectedClassId.value &&
      f.curriculumItemId === curriculumItemId,
  )
  return uploaded ? 'submitted' : 'pending'
}

function getProgressStatus(methodId: string): ParticipantProgress['status'] | null {
  const p = progressData.find(
    (pr) =>
      pr.participantId === pid.value &&
      pr.classId === selectedClassId.value &&
      pr.methodId === methodId,
  )
  return p?.status ?? null
}

// ── Build the ladder steps ──
interface LadderStep {
  id: string
  order: number
  label: string
  type: string
  typeLabel: string
  weight: number
  passingScore: number
  status: StepStatus
  score: number | null
  locked: boolean // cannot start until previous step is passed
  children: LadderChild[]
}

interface LadderChild {
  id: string
  label: string
  kind: 'inClassCategory' | 'methodCategory' | 'component' | 'upload'
  weight: number
  status: StepStatus
  score: number | null
  subChildren?: LadderSubChild[]
}

interface LadderSubChild {
  id: string
  label: string
  kind: 'preTest' | 'postTest' | 'materi' | 'subComponent'
  status: StepStatus
  score: number | null
  attemptCount: number
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    inClass: 'In-Class',
    technicaltest: 'Technical Test',
    uploadFile: 'Upload File',
    multirater: 'Multirater',
    presentation: 'Presentation',
    validation: 'Validation',
    skillTest: 'Skill Test',
    verify: 'Verify',
    accounting: 'Accounting',
  }
  return map[type] ?? type
}

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    inClass: '🏫',
    technicaltest: '🔬',
    uploadFile: '📤',
    multirater: '👥',
    presentation: '🎤',
    validation: '✅',
    skillTest: '🛠️',
    verify: '🔍',
    accounting: '📊',
  }
  return map[type] ?? '📋'
}

function scoreStatus(score: number | null, passingScore: number): StepStatus {
  if (score === null) return 'pending'
  return score >= passingScore ? 'passed' : 'failed'
}

const ladder = computed((): LadderStep[] => {
  if (!curriculum.value || !pid.value) return []
  const items = [...curriculum.value.items].sort((a, b) => a.order - b.order)
  const steps: LadderStep[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const prevStep = i > 0 ? steps[i - 1] : null
    const locked = prevStep !== null && prevStep.status !== 'passed' && item.passingScore > 0

    let stepStatus: StepStatus = 'pending'
    let stepScore: number | null = null
    const children: LadderChild[] = []

    // ── inClass ──
    if (item.trainingMethodType === 'inClass') {
      const ic = inClasses.find((ic) => ic.id === item.contentId)
      if (ic) {
        for (const cat of ic.categories) {
          const preScore = bestAttemptScore(cat.preTestId, ic.id, cat.id)
          const postScore = bestAttemptScore(cat.postTestId, ic.id, cat.id)
          const catStatus: StepStatus =
            postScore !== null && postScore >= item.passingScore
              ? 'passed'
              : postScore !== null
                ? 'failed'
                : preScore !== null
                  ? 'inProgress'
                  : 'pending'

          const subChildren: LadderSubChild[] = []
          subChildren.push({
            id: `${cat.id}-pre`,
            label: `Pre-Test: ${tests.find((t) => t.id === cat.preTestId)?.title ?? cat.preTestId}`,
            kind: 'preTest',
            status:
              preScore !== null ? (preScore >= item.passingScore ? 'passed' : 'failed') : 'pending',
            score: preScore,
            attemptCount: getTestAttempts(cat.preTestId, ic.id, cat.id).length,
          })
          for (const mId of cat.materiIds) {
            const m = materis.find((m) => m.id === mId)
            subChildren.push({
              id: mId,
              label: m?.title ?? mId,
              kind: 'materi',
              status: preScore !== null ? 'inProgress' : 'locked',
              score: null,
              attemptCount: 0,
            })
          }
          subChildren.push({
            id: `${cat.id}-post`,
            label: `Post-Test: ${tests.find((t) => t.id === cat.postTestId)?.title ?? cat.postTestId}`,
            kind: 'postTest',
            status:
              postScore !== null
                ? postScore >= item.passingScore
                  ? 'passed'
                  : 'failed'
                : preScore !== null
                  ? 'pending'
                  : 'locked',
            score: postScore,
            attemptCount: getTestAttempts(cat.postTestId, ic.id, cat.id).length,
          })

          const catScore = postScore ?? preScore
          children.push({
            id: cat.id,
            label: cat.name,
            kind: 'inClassCategory',
            weight: cat.weight,
            status: catStatus,
            score: catScore,
            subChildren,
          })
        }
        const allPassed = children.every((c) => c.status === 'passed')
        const anyFailed = children.some((c) => c.status === 'failed')
        const anyInProgress = children.some(
          (c) => c.status === 'inProgress' || c.status === 'pending',
        )
        stepStatus = allPassed
          ? 'passed'
          : anyFailed
            ? 'failed'
            : anyInProgress
              ? 'inProgress'
              : 'pending'
        stepScore = children.length
          ? Math.round(children.reduce((s, c) => s + (c.score ?? 0), 0) / children.length)
          : null
      }
    }
    // ── technicaltest / training method ──
    else if (
      item.trainingMethodType === 'technicaltest' ||
      item.trainingMethodType === 'multirater' ||
      item.trainingMethodType === 'presentation'
    ) {
      const method = trainingMethods.find((m) => m.id === item.contentId)
      if (method) {
        for (const cat of method.categories) {
          const subChildren: LadderSubChild[] = []
          if (cat.components?.length) {
            for (const comp of cat.components) {
              const subMethod = trainingMethods.find((m) => m.id === comp.contentId)
              const compScore = getAssessmentScore(comp.contentId)
              subChildren.push({
                id: comp.id,
                label: subMethod?.title ?? comp.contentId,
                kind: 'subComponent',
                status: scoreStatus(compScore, comp.passingScore),
                score: compScore,
                attemptCount: 0,
              })
            }
          }
          const catScore = getAssessmentScore(item.id)
          const catStatus = scoreStatus(catScore, item.passingScore)
          children.push({
            id: cat.id,
            label: cat.name,
            kind: 'methodCategory',
            weight: cat.weight,
            status: catStatus,
            score: catScore,
            subChildren: subChildren.length ? subChildren : undefined,
          })
        }
        stepScore = getAssessmentScore(item.id)
        stepStatus = scoreStatus(stepScore, item.passingScore)
      }
    }
    // ── uploadFile ──
    else if (item.trainingMethodType === 'uploadFile') {
      const uploadStatus = getUploadStatus(item.id)
      stepStatus = uploadStatus === 'submitted' ? 'passed' : 'pending'
      stepScore = uploadStatus === 'submitted' ? 100 : null
    }
    // ── other / fallback ──
    else {
      const progStatus = getProgressStatus(item.id)
      stepStatus =
        progStatus === 'passed' || progStatus === 'completed'
          ? 'passed'
          : progStatus === 'failed'
            ? 'failed'
            : progStatus === 'inProgress'
              ? 'inProgress'
              : 'pending'
    }

    if (locked) stepStatus = 'locked'

    steps.push({
      id: item.id,
      order: item.order,
      label:
        typeLabel(item.trainingMethodType) +
        (item.trainingMethodType === 'inClass'
          ? ` — ${inClasses.find((ic) => ic.id === item.contentId)?.title ?? ''}`
          : item.trainingMethodType === 'uploadFile'
            ? ` — ${item.contentId}`
            : item.trainingMethodType === 'technicaltest'
              ? ` — ${trainingMethods.find((m) => m.id === item.contentId)?.title ?? ''}`
              : ''),
      type: item.trainingMethodType,
      typeLabel: typeLabel(item.trainingMethodType),
      weight: item.weight,
      passingScore: item.passingScore,
      status: stepStatus,
      score: stepScore,
      locked,
      children,
    })
  }
  return steps
})

// ── Computed overall stats ──
const overallProgress = computed(() => {
  const steps = ladder.value
  if (!steps.length) return 0
  const passed = steps.filter((s) => s.status === 'passed').length
  return Math.round((passed / steps.length) * 100)
})

const passedSteps = computed(() => ladder.value.filter((s) => s.status === 'passed').length)

// ── Type imports needed ──
import type { ParticipantProgress } from '@/types'

// ── Expanded steps ──
const expandedSteps = ref<Set<string>>(new Set())
function toggleStep(id: string) {
  if (expandedSteps.value.has(id)) expandedSteps.value.delete(id)
  else expandedSteps.value.add(id)
}

// ── Status styling helpers ──
function stepBg(status: StepStatus) {
  return {
    locked: 'bg-gray-100 border-gray-200 opacity-60',
    pending: 'bg-white border-gray-200',
    inProgress: 'bg-blue-50 border-blue-300',
    passed: 'bg-green-50 border-green-300',
    failed: 'bg-red-50 border-red-300',
  }[status]
}
function stepDot(status: StepStatus) {
  return {
    locked: 'bg-gray-300 text-gray-500',
    pending: 'bg-gray-200 text-gray-600',
    inProgress: 'bg-blue-500 text-white',
    passed: 'bg-green-500 text-white',
    failed: 'bg-red-500 text-white',
  }[status]
}
function stepConnector(status: StepStatus) {
  return status === 'passed' ? 'bg-green-400' : status === 'locked' ? 'bg-gray-200' : 'bg-gray-300'
}
function statusLabel(status: StepStatus) {
  return {
    locked: 'Locked',
    pending: 'Pending',
    inProgress: 'In Progress',
    passed: 'Passed',
    failed: 'Failed',
  }[status]
}
function statusBadge(status: StepStatus) {
  return {
    locked: 'bg-gray-100 text-gray-500',
    pending: 'bg-gray-100 text-gray-600',
    inProgress: 'bg-blue-100 text-blue-700',
    passed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-600',
  }[status]
}
function childDot(status: StepStatus) {
  return {
    locked: 'bg-gray-200 border-gray-300',
    pending: 'bg-white border-gray-300',
    inProgress: 'bg-blue-400 border-blue-400',
    passed: 'bg-green-400 border-green-400',
    failed: 'bg-red-400 border-red-400',
  }[status]
}
function subKindIcon(kind: string) {
  return { preTest: '📝', postTest: '📋', materi: '📚', subComponent: '🔧' }[kind] ?? '▸'
}

function stepIcon(status: StepStatus) {
  return { locked: '🔒', pending: '○', inProgress: '◑', passed: '✓', failed: '✕' }[status]
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Class Progress</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        Curriculum ladder — steps must be completed in order
      </p>
    </div>

    <!-- Filters -->
    <div
      class="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-1 gap-4"
      :class="isAdmin ? 'md:grid-cols-2' : ''"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
        <select
          v-model="selectedClassId"
          @change="selectedParticipantId = isAdmin ? '' : auth.userId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Class --</option>
          <option v-for="c in myClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div v-if="isAdmin">
        <label class="block text-sm font-medium text-gray-700 mb-1">Participant</label>
        <select
          v-model="selectedParticipantId"
          :disabled="!selectedClassId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">-- Select Participant --</option>
          <option v-for="u in participantsOfClass" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </div>
    </div>

    <!-- Placeholder -->
    <div
      v-if="!selectedClassId || !pid"
      class="bg-white rounded-xl shadow p-16 text-center text-gray-400"
    >
      <span class="text-5xl block mb-3">🪜</span>
      <p class="text-base font-medium">
        Select a class{{ isAdmin ? ' and participant' : '' }} to view the progress ladder
      </p>
    </div>

    <template v-else-if="ladder.length > 0">
      <!-- Overall summary bar -->
      <div class="bg-white rounded-xl shadow p-5 mb-6">
        <div class="flex items-center justify-between mb-2">
          <div>
            <p class="text-sm font-semibold text-gray-700">Overall Progress</p>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ passedSteps }} / {{ ladder.length }} steps passed
            </p>
          </div>
          <span
            class="text-2xl font-bold"
            :class="overallProgress === 100 ? 'text-green-600' : 'text-blue-600'"
          >
            {{ overallProgress }}%
          </span>
        </div>
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="overallProgress === 100 ? 'bg-green-500' : 'bg-blue-500'"
            :style="{ width: overallProgress + '%' }"
          />
        </div>
        <div class="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
          <span class="flex items-center gap-1"
            ><span class="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>Passed</span
          >
          <span class="flex items-center gap-1"
            ><span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>Failed</span
          >
          <span class="flex items-center gap-1"
            ><span class="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>In
            Progress</span
          >
          <span class="flex items-center gap-1"
            ><span class="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block"></span>Pending</span
          >
          <span class="flex items-center gap-1"
            ><span class="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block"></span>Locked</span
          >
        </div>
      </div>

      <!-- Ladder -->
      <div class="relative">
        <div v-for="(step, idx) in ladder" :key="step.id" class="relative flex gap-4 mb-0">
          <!-- Connector column -->
          <div class="flex flex-col items-center w-10 shrink-0">
            <!-- Step circle -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm border-2 z-10"
              :class="stepDot(step.status)"
            >
              <span v-if="step.status === 'passed'" class="text-base">✓</span>
              <span v-else-if="step.status === 'failed'" class="text-base">✕</span>
              <span v-else-if="step.status === 'locked'" class="text-base">🔒</span>
              <span v-else-if="step.status === 'inProgress'" class="text-base">◑</span>
              <span v-else class="text-sm font-bold">{{ idx + 1 }}</span>
            </div>
            <!-- Connector line to next step -->
            <div
              v-if="idx < ladder.length - 1"
              class="w-0.5 flex-1 min-h-6 mt-1"
              :class="stepConnector(step.status)"
            />
          </div>

          <!-- Step card -->
          <div class="flex-1 mb-5">
            <div class="rounded-xl border-2 shadow-sm transition-all" :class="stepBg(step.status)">
              <!-- Step header (clickable to expand) -->
              <button
                class="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                @click="toggleStep(step.id)"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="text-lg leading-none">{{ typeIcon(step.type) }}</span>
                    <span
                      class="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      Step {{ step.order }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full font-medium"
                      :class="statusBadge(step.status)"
                    >
                      {{ statusLabel(step.status) }}
                    </span>
                    <span
                      v-if="step.score !== null"
                      class="text-xs font-semibold"
                      :class="
                        step.status === 'passed'
                          ? 'text-green-700'
                          : step.status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      "
                    >
                      {{ step.score }}%
                    </span>
                  </div>
                  <p class="font-semibold text-gray-800 text-sm leading-tight">{{ step.label }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    Weight: {{ step.weight }}% · Passing: {{ step.passingScore }}%
                  </p>
                </div>
                <span
                  class="text-gray-400 shrink-0 mt-1 transition-transform text-sm"
                  :class="expandedSteps.has(step.id) ? 'rotate-180' : ''"
                  >▼</span
                >
              </button>

              <!-- Expanded detail: children -->
              <div
                v-if="expandedSteps.has(step.id) && step.children.length > 0"
                class="border-t border-inherit px-5 pb-4 pt-3 space-y-3"
              >
                <div
                  v-for="child in step.children"
                  :key="child.id"
                  class="rounded-lg border bg-white/70 overflow-hidden"
                >
                  <!-- Child header -->
                  <div class="flex items-center justify-between px-4 py-2.5 gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div
                        class="w-3 h-3 rounded-full border-2 shrink-0"
                        :class="childDot(child.status)"
                      />
                      <span class="text-sm font-medium text-gray-700 truncate">{{
                        child.label
                      }}</span>
                      <span class="text-xs text-gray-400 shrink-0">{{ child.weight }}%</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span
                        v-if="child.score !== null"
                        class="text-xs font-semibold"
                        :class="
                          child.status === 'passed'
                            ? 'text-green-700'
                            : child.status === 'failed'
                              ? 'text-red-500'
                              : 'text-gray-500'
                        "
                      >
                        {{ child.score }}%
                      </span>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="statusBadge(child.status)"
                      >
                        {{ statusLabel(child.status) }}
                      </span>
                    </div>
                  </div>

                  <!-- Sub-children (preTest, materials, postTest, components) -->
                  <div
                    v-if="child.subChildren?.length"
                    class="border-t divide-y divide-gray-100 bg-gray-50/50"
                  >
                    <div
                      v-for="sub in child.subChildren"
                      :key="sub.id"
                      class="flex items-center justify-between px-5 py-2 gap-3"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-xs shrink-0">{{ subKindIcon(sub.kind) }}</span>
                        <span class="text-xs text-gray-600 truncate">{{ sub.label }}</span>
                        <span v-if="sub.attemptCount > 0" class="text-xs text-gray-400 shrink-0">
                          ({{ sub.attemptCount }} attempt{{ sub.attemptCount > 1 ? 's' : '' }})
                        </span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <span
                          v-if="sub.score !== null"
                          class="text-xs font-medium"
                          :class="
                            sub.status === 'passed'
                              ? 'text-green-600'
                              : sub.status === 'failed'
                                ? 'text-red-500'
                                : 'text-gray-500'
                          "
                        >
                          {{ sub.score }}%
                        </span>
                        <span
                          class="text-xs px-1.5 py-0.5 rounded-full"
                          :class="statusBadge(sub.status)"
                        >
                          {{ statusLabel(sub.status) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Locked overlay message -->
              <div v-if="step.locked" class="border-t border-gray-200 px-5 py-2">
                <p class="text-xs text-gray-500 flex items-center gap-1.5">
                  <span>🔒</span>
                  Complete the previous step to unlock this one.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Finish line -->
        <div class="flex gap-4">
          <div class="w-10 flex justify-center shrink-0">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm',
                overallProgress === 100
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-400',
              ]"
            >
              🏆
            </div>
          </div>
          <div class="flex-1 flex items-center mb-5">
            <div
              :class="[
                'rounded-xl border-2 px-5 py-3 flex-1',
                overallProgress === 100
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200',
              ]"
            >
              <p
                :class="[
                  'font-semibold text-sm',
                  overallProgress === 100 ? 'text-green-700' : 'text-gray-500',
                ]"
              >
                {{
                  overallProgress === 100
                    ? '🎉 All steps completed! Curriculum finished.'
                    : `${ladder.length - passedSteps} step(s) remaining to complete the curriculum`
                }}
              </p>
              <p v-if="curriculum" class="text-xs text-gray-400 mt-0.5">
                Passing threshold: {{ curriculum.passingThreshold }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white rounded-xl shadow p-12 text-center text-gray-400">
      No curriculum data available for this class.
    </div>
  </div>
</template>
