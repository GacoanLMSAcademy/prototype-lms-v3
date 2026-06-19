<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  classes,
  testAttempts,
  curricula,
  inClasses,
  inClassActivityCompletions,
} from '@/data/mockData'

const auth = useAuthStore()
const router = useRouter()

const myClasses = computed(() => classes.filter((c) => c.participants.includes(auth.userId)))
const myAttempts = computed(() => testAttempts.filter((a) => a.participantId === auth.userId))

// Build in-class session links for quick access
const myInClassSessions = computed(() => {
  const result: {
    classId: string
    className: string
    inClassId: string
    inClassTitle: string
    progress: number
  }[] = []
  myClasses.value.forEach((cls) => {
    const curriculum = curricula.find((c) => c.id === cls.curriculumId)
    curriculum?.items
      .filter((i) => i.trainingMethodType === 'inClass')
      .forEach((item) => {
        const ic = inClasses.find((ic) => ic.id === item.contentId)
        if (!ic) return
        // compute overall category progress
        let totalActs = 0,
          doneActs = 0
        ic.categories.forEach((cat) => {
          const acts = [
            ...(cat.preTestId ? [{ type: 'preTest', refId: cat.preTestId }] : []),
            ...cat.materiIds.map((mId) => ({ type: 'materi', refId: mId })),
            ...(cat.postTestId ? [{ type: 'postTest', refId: cat.postTestId }] : []),
          ]
          totalActs += acts.length
          acts.forEach((a) => {
            if (a.type === 'preTest' || a.type === 'postTest') {
              if (
                testAttempts.some(
                  (ta) =>
                    ta.participantId === auth.userId &&
                    ta.classId === cls.id &&
                    ta.inClassId === ic.id &&
                    ta.categoryId === cat.id &&
                    ta.testType === a.type &&
                    ta.status === 'completed',
                )
              )
                doneActs++
            } else {
              if (
                inClassActivityCompletions.some(
                  (c) =>
                    c.participantId === auth.userId &&
                    c.classId === cls.id &&
                    c.inClassId === ic.id &&
                    c.categoryId === cat.id &&
                    c.activityType === 'materi' &&
                    c.refId === a.refId,
                )
              )
                doneActs++
            }
          })
        })
        result.push({
          classId: cls.id,
          className: cls.name,
          inClassId: ic.id,
          inClassTitle: ic.title,
          progress: totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0,
        })
      })
  })
  return result
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Participant Dashboard</h2>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500 text-sm">My Classes</p>
        <p class="text-2xl font-bold">{{ myClasses.length }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl shadow">
        <p class="text-gray-500 text-sm">Tests Taken</p>
        <p class="text-2xl font-bold">{{ myAttempts.length }}</p>
      </div>
    </div>

    <!-- In-Class sessions quick access -->
    <div class="bg-white rounded-xl shadow p-5 mb-5">
      <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>🏫</span> My In-Class Sessions
      </h3>
      <div v-if="myInClassSessions.length === 0" class="text-sm text-gray-400 italic">
        No in-class sessions assigned yet.
      </div>
      <div class="space-y-3">
        <div
          v-for="s in myInClassSessions"
          :key="`${s.classId}-${s.inClassId}`"
          class="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ s.inClassTitle }}</p>
            <p class="text-xs text-gray-400">{{ s.className }}</p>
            <div class="mt-1.5 h-1.5 bg-gray-100 rounded-full w-32">
              <div
                class="h-full rounded-full transition-all"
                :class="s.progress === 100 ? 'bg-green-500' : 'bg-blue-500'"
                :style="{ width: s.progress + '%' }"
              />
            </div>
            <p class="text-xs text-gray-400 mt-0.5">{{ s.progress }}% complete</p>
          </div>
          <button
            @click="router.push(`/participant/inclass/${s.classId}/${s.inClassId}`)"
            :class="[
              'text-sm px-4 py-2 rounded-lg font-medium transition',
              s.progress === 100
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            ]"
          >
            {{ s.progress === 100 ? 'Review' : s.progress > 0 ? 'Continue' : 'Start' }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-xl shadow">
      <p class="text-gray-700">
        Welcome, <strong>{{ auth.userName }}</strong
        >! Access your tests, progress, and transcript from the sidebar.
      </p>
    </div>
  </div>
</template>
