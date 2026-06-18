<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, trainingMethods, trainingMethodTypes, submissions as allSubmissions } from '@/data/mockData'

const auth = useAuthStore()

const myClasses = computed(() => classes.filter(c => c.participants.includes(auth.userId)))

interface SubmissionForm { trainingMethodId: string; classId: string; fileUrl: string; description: string }

const forms = ref<SubmissionForm[]>([])

const pendingMethods = computed(() => {
  const result: { methodId: string; methodTitle: string; className: string; classId: string }[] = []
  myClasses.value.forEach(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    curriculum?.items.forEach(item => {
      if (item.trainingMethodType === 'inClass') return
      const method = trainingMethods.find(m => m.id === item.contentId)
      if (!method) return
      const allComponents = method.categories.flatMap(c => c.components ?? [])
      if (!allComponents.length) return
      allComponents.forEach(comp => {
        const existing = allSubmissions.find(s => s.participantId === auth.userId && s.classId === cls.id && s.trainingMethodId === item.id)
        if (!existing) {
          const key = item.id + '-' + cls.id
          if (!forms.value.find(f => f.trainingMethodId + f.classId === key)) {
            forms.value.push({ trainingMethodId: item.id, classId: cls.id, fileUrl: '', description: '' })
          }
          result.push({ methodId: item.id, methodTitle: component.title, className: cls.name, classId: cls.id })
        }
      })
    })
  })
  return result
})

const mySubmissions = computed(() =>
  allSubmissions.filter(s => s.participantId === auth.userId)
)

function submitForm(f: SubmissionForm) {
  allSubmissions.push({
    id: 's' + Date.now(),
    trainingMethodId: f.trainingMethodId,
    participantId: auth.userId,
    classId: f.classId,
    fileUrl: f.fileUrl,
    description: f.description,
    submittedAt: new Date().toISOString(),
  })
  const idx = forms.value.indexOf(f)
  if (idx >= 0) forms.value.splice(idx, 1)
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">My Submissions</h2>

    <h3 class="font-semibold mb-3">Pending Submissions</h3>
    <div v-if="pendingMethods.length === 0" class="text-gray-400 text-sm mb-6">No pending submissions</div>
    <div v-for="f in forms" :key="f.trainingMethodId + f.classId" class="bg-white rounded shadow p-4 mb-4 max-w-2xl">
      <p class="font-medium mb-2">{{ pendingMethods.find(p => p.methodId === f.trainingMethodId && p.classId === f.classId)?.methodTitle ?? 'Unknown' }}</p>
      <p class="text-xs text-gray-500 mb-3">{{ pendingMethods.find(p => p.methodId === f.trainingMethodId && p.classId === f.classId)?.className ?? '' }}</p>
      <div class="space-y-3">
        <div><label class="text-xs font-medium">Slide / File URL</label><input v-model="f.fileUrl" class="w-full border rounded px-3 py-2 text-sm" placeholder="https://docs.google.com/presentation/d/..." /></div>
        <div><label class="text-xs font-medium">Description</label><textarea v-model="f.description" class="w-full border rounded px-3 py-2 text-sm" rows="2" placeholder="Describe your submission" /></div>
        <button @click="submitForm(f)" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm" :disabled="!f.fileUrl">Submit</button>
      </div>
    </div>

    <h3 class="font-semibold mb-3 mt-8">Submitted</h3>
    <div v-if="mySubmissions.length === 0" class="text-gray-400 text-sm">No submissions yet</div>
    <div v-for="s in mySubmissions" :key="s.id" class="bg-white rounded shadow p-4 mb-3 max-w-2xl">
      <div class="flex items-center justify-between mb-1">
        <p class="font-medium text-sm">{{ s.description }}</p>
        <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Submitted</span>
      </div>
      <a v-if="s.fileUrl" :href="s.fileUrl" target="_blank" class="text-blue-600 text-xs hover:underline">View file</a>
      <p class="text-xs text-gray-400 mt-1">{{ new Date(s.submittedAt).toLocaleDateString() }}</p>
    </div>
  </div>
</template>