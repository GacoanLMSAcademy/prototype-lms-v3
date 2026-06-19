<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { classes, curricula, uploadedFiles as allUploadedFiles, participantProgress } from '@/data/mockData'
import type { UploadFileType } from '@/types'

const auth = useAuthStore()

const myClasses = computed(() => classes.filter(c => c.participants.includes(auth.userId)))

interface UploadForm {
  curriculumItemId: string
  classId: string
  fileName: string
  fileUrl: string
  fileType: UploadFileType
  description: string
}

const forms = ref<UploadForm[]>([])

const pendingUploads = computed(() => {
  const result: { curriculumItemId: string; taskName: string; className: string; classId: string }[] = []
  myClasses.value.forEach(cls => {
    const curriculum = curricula.find(c => c.id === cls.curriculumId)
    curriculum?.items.forEach(item => {
      if (item.trainingMethodType !== 'uploadFile') return
      const existing = allUploadedFiles.find(f => f.participantId === auth.userId && f.classId === cls.id && f.curriculumItemId === item.id)
      if (!existing) {
        const key = item.id + '-' + cls.id
        if (!forms.value.find(f => f.curriculumItemId + f.classId === key)) {
          forms.value.push({ curriculumItemId: item.id, classId: cls.id, fileName: '', fileUrl: '', fileType: 'link', description: '' })
        }
        result.push({
          curriculumItemId: item.id,
          taskName: item.contentId || 'Upload File',
          className: cls.name,
          classId: cls.id,
        })
      }
    })
  })
  return result
})

const myUploads = computed(() =>
  allUploadedFiles.filter(f => f.participantId === auth.userId)
)

function getFormMeta(f: UploadForm) {
  return pendingUploads.value.find(p => p.curriculumItemId === f.curriculumItemId && p.classId === f.classId)
}

function submitUpload(f: UploadForm) {
  allUploadedFiles.push({
    id: 'uf' + Date.now(),
    curriculumItemId: f.curriculumItemId,
    participantId: auth.userId,
    classId: f.classId,
    fileType: f.fileType,
    fileName: f.fileName,
    fileUrl: f.fileUrl,
    description: f.description,
    submittedAt: new Date().toISOString(),
  })
  const existing = participantProgress.find(p => p.participantId === auth.userId && p.classId === f.classId && p.methodId === f.curriculumItemId)
  if (existing) {
    existing.status = 'completed'
    existing.score = 100
  } else {
    participantProgress.push({
      participantId: auth.userId,
      classId: f.classId,
      methodId: f.curriculumItemId,
      methodType: 'uploadFile',
      status: 'completed',
      score: 100,
    })
  }
  const idx = forms.value.indexOf(f)
  if (idx >= 0) forms.value.splice(idx, 1)
}

function uploadedClassName(uf: typeof allUploadedFiles[number]) {
  return classes.find(c => c.id === uf.classId)?.name ?? uf.classId
}

function uploadedTaskName(uf: typeof allUploadedFiles[number]) {
  return curricula.flatMap(c => c.items).find(i => i.id === uf.curriculumItemId)?.contentId ?? 'Upload File'
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Upload File</h2>

    <div class="bg-white rounded shadow p-4 mb-6 max-w-2xl">
      <p class="font-semibold text-lg mb-4">{{ auth.userName }}</p>

      <h3 class="font-semibold mb-3">Tugas Upload File</h3>
      <div v-if="forms.length === 0" class="text-gray-400 text-sm mb-2">Tidak ada tugas upload file yang perlu dikerjakan</div>
      <div v-for="f in forms" :key="f.curriculumItemId + f.classId" class="border-t py-3 first:border-t-0 first:pt-0">
        <p class="font-medium mb-1">{{ getFormMeta(f)?.taskName ?? 'Upload File' }}</p>
        <p class="text-xs text-gray-500 mb-3">{{ getFormMeta(f)?.className ?? '' }}</p>
        <div class="space-y-3 ml-2">
          <div>
            <label class="text-xs font-medium">File Type</label>
            <select v-model="f.fileType" class="w-full border rounded px-3 py-2 text-sm">
              <option value="slide">Slide</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium">File Name</label>
            <input v-model="f.fileName" class="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Laporan_Tugas.pdf" />
          </div>
          <div>
            <label class="text-xs font-medium">File URL / Link</label>
            <input v-model="f.fileUrl" class="w-full border rounded px-3 py-2 text-sm" placeholder="https://drive.google.com/file/d/..." />
          </div>
          <div>
            <label class="text-xs font-medium">Description</label>
            <textarea v-model="f.description" class="w-full border rounded px-3 py-2 text-sm" rows="2" placeholder="Deskripsi file yang diupload" />
          </div>
          <button @click="submitUpload(f)" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm" :disabled="!f.fileName || !f.fileUrl">Upload</button>
        </div>
      </div>

      <h3 class="font-semibold mb-3 mt-6">Riwayat Upload</h3>
      <div v-if="myUploads.length === 0" class="text-gray-400 text-sm">Belum ada upload</div>
      <div v-for="uf in myUploads" :key="uf.id" class="border-t py-3">
        <p class="font-medium text-sm mb-1">{{ uploadedTaskName(uf) }}</p>
        <p class="text-xs text-gray-500 mb-2">{{ uploadedClassName(uf) }}</p>
        <div class="ml-2">
          <div class="flex items-center justify-between mb-1">
            <p class="font-medium text-sm">{{ uf.fileName }}</p>
            <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 capitalize">{{ uf.fileType }}</span>
          </div>
          <a v-if="uf.fileUrl" :href="uf.fileUrl" target="_blank" class="text-blue-600 text-xs hover:underline">Lihat file</a>
          <p class="text-xs text-gray-400 mt-1">{{ uf.description }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ new Date(uf.submittedAt).toLocaleDateString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
