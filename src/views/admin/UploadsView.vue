<script setup lang="ts">
import { ref, computed } from 'vue'
import { classes, users, curricula, uploadedFiles as allUploadedFiles } from '@/data/mockData'

const expandedClasses = ref<Set<string>>(new Set())
const expandedParticipants = ref<Set<string>>(new Set())

function toggleClass(id: string) {
  if (expandedClasses.value.has(id)) expandedClasses.value.delete(id)
  else expandedClasses.value.add(id)
}

function toggleParticipant(key: string) {
  if (expandedParticipants.value.has(key)) expandedParticipants.value.delete(key)
  else expandedParticipants.value.add(key)
}

const classesWithUploadFile = computed(() =>
  classes.filter(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    return curriculum?.items.some(i => i.trainingMethodType === 'uploadFile')
  })
)

function getUploadFileItems(cls: typeof classes[number]) {
  const curriculum = curricula.find(c => c.id === cls.curriculumId)
  return curriculum?.items.filter(i => i.trainingMethodType === 'uploadFile') ?? []
}

function getParticipantName(id: string) {
  return users.find(u => u.id === id)?.name ?? id
}

function getUploadsForParticipant(clsId: string, participantId: string, itemId: string) {
  return allUploadedFiles.filter(f => f.classId === clsId && f.participantId === participantId && f.curriculumItemId === itemId)
}

function hasUploadForTask(clsId: string, participantId: string, itemId: string) {
  return allUploadedFiles.some(f => f.classId === clsId && f.participantId === participantId && f.curriculumItemId === itemId)
}

function uploadedTaskCount(clsId: string, participantId: string) {
  const cls = classes.find(c => c.id === clsId)
  if (!cls) return 0
  return getUploadFileItems(cls).filter(item => hasUploadForTask(clsId, participantId, item.id)).length
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Upload File Monitoring</h2>

    <div v-if="classesWithUploadFile.length === 0" class="text-center py-12 text-gray-400">
      Tidak ada kelas dengan tugas upload file
    </div>

    <div v-for="cls in classesWithUploadFile" :key="cls.id" class="bg-white rounded shadow mb-4">
      <button @click="toggleClass(cls.id)" class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
        <div class="text-left">
          <h3 class="font-semibold">{{ cls.name }}</h3>
          <p class="text-xs text-gray-500">{{ cls.participants.length }} peserta</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            {{ allUploadedFiles.filter(f => f.classId === cls.id).length }} file terupload
          </span>
          <span class="text-xs transition-transform" :class="expandedClasses.has(cls.id) ? 'rotate-90' : ''">▶</span>
        </div>
      </button>

      <div v-if="expandedClasses.has(cls.id)" class="border-t px-4 py-3 space-y-3">
        <div v-for="pid in cls.participants" :key="pid" class="border rounded mb-2">
          <button @click="toggleParticipant(cls.id + '-' + pid)" class="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm">
            <span>{{ getParticipantName(pid) }}</span>
            <div class="flex items-center gap-2">
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {{ uploadedTaskCount(cls.id, pid) }}/{{ getUploadFileItems(cls).length }} tugas
              </span>
              <span class="text-xs transition-transform" :class="expandedParticipants.has(cls.id + '-' + pid) ? 'rotate-90' : ''">▶</span>
            </div>
          </button>

          <div v-if="expandedParticipants.has(cls.id + '-' + pid)" class="border-t px-3 py-2 space-y-3">
            <div v-for="item in getUploadFileItems(cls)" :key="item.id" class="mb-2">
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm font-medium text-gray-700">{{ item.contentId || 'Upload File' }}</p>
                <span
                  v-if="hasUploadForTask(cls.id, pid, item.id)"
                  class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                >Uploaded</span>
                <span v-else class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Belum upload</span>
              </div>
              <div v-for="uf in getUploadsForParticipant(cls.id, pid, item.id)" :key="uf.id" class="bg-gray-50 rounded p-3 text-sm ml-2">
                <div class="flex items-center justify-between mb-1">
                  <p class="font-medium">{{ uf.fileName }}</p>
                  <span class="text-xs capitalize bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{{ uf.fileType }}</span>
                </div>
                <a :href="uf.fileUrl" target="_blank" class="text-blue-600 text-xs hover:underline">Lihat file</a>
                <p v-if="uf.description" class="text-gray-500 text-xs mt-1">{{ uf.description }}</p>
                <p class="text-gray-400 text-xs mt-1">{{ new Date(uf.submittedAt).toLocaleDateString() }}</p>
              </div>
              <p v-if="getUploadsForParticipant(cls.id, pid, item.id).length === 0" class="text-gray-400 text-xs ml-2">Belum ada upload</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
