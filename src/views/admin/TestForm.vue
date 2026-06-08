<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tests } from '@/data/mockData'
import type { Question, QuestionType, MCQOption } from '@/types'

const route = useRoute()
const router = useRouter()
const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? tests.find(t => t.id === route.params.id) : null

const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const timeLimit = ref(existing?.timeLimit ?? 30)
const randomize = ref(existing?.randomize ?? false)
const pickCount = ref(existing?.pickCount ?? 0)
const questions = ref<Question[]>(existing?.questions ?? [])

function addQuestion(type: QuestionType) {
  const q: Question = { id: 'q' + Date.now(), type, text: '', points: 10 }
  if (type === 'mcq') q.options = [{ id: 'opt1', text: '', isCorrect: false }, { id: 'opt2', text: '', isCorrect: false }]
  if (type === 'fillBlank') q.correctAnswer = ''
  if (type === 'dragDrop') q.items = []
  questions.value.push(q)
}
function removeQuestion(idx: number) { questions.value.splice(idx, 1) }
function addOption(qIdx: number) { const q = questions.value[qIdx]; if (q?.options) q.options.push({ id: 'opt' + Date.now(), text: '', isCorrect: false }) }
function addDragItem(qIdx: number) { const q = questions.value[qIdx]; if (q?.items) q.items.push({ id: 'item' + Date.now(), text: '', correctOrder: (q.items.length + 1) }) }
function save() { alert('Test saved (mock)'); router.push('/admin/tests') }
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Test' : 'New Test' }}</h2>
    <div class="bg-white p-6 rounded shadow space-y-4 max-w-3xl">
      <div><label class="block text-sm font-medium mb-1">Title</label><input v-model="title" class="w-full border rounded px-3 py-2"/></div>
      <div><label class="block text-sm font-medium mb-1">Description</label><textarea v-model="description" class="w-full border rounded px-3 py-2"/></div>
      <div class="grid grid-cols-3 gap-4">
        <div><label class="block text-sm font-medium mb-1">Time Limit (min)</label><input v-model.number="timeLimit" type="number" class="w-full border rounded px-3 py-2"/></div>
        <div><label class="block text-sm font-medium mb-1">Randomize</label><label class="flex items-center gap-2 mt-2"><input type="checkbox" v-model="randomize" class="accent-blue-600"/> Enable</label></div>
        <div v-if="randomize"><label class="block text-sm font-medium mb-1">Pick N questions</label><input v-model.number="pickCount" type="number" class="w-full border rounded px-3 py-2" placeholder="0 = all"/></div>
      </div>
      <div>
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">Questions</h3>
          <div class="flex gap-2 flex-wrap">
            <button @click="addQuestion('mcq')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ MCQ</button>
            <button @click="addQuestion('essay')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Essay</button>
            <button @click="addQuestion('fillBlank')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Fill Blank</button>
            <button @click="addQuestion('dragDrop')" class="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">+ Drag Drop</button>
          </div>
        </div>
        <div v-for="(q, idx) in questions" :key="q.id" class="border rounded p-4 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium bg-gray-200 px-2 py-0.5 rounded">{{ q.type }}</span>
            <button @click="removeQuestion(idx)" class="text-red-500 text-sm">Remove</button>
          </div>
          <div class="mb-2"><input v-model="q.text" placeholder="Question text" class="w-full border rounded px-2 py-1 text-sm"/></div>
          <div class="mb-2"><label class="text-xs">Points:</label><input v-model.number="q.points" type="number" class="w-20 border rounded px-2 py-1 text-sm ml-2"/></div>
          <div v-if="q.type === 'mcq' && q.options">
            <div v-for="(opt, oi) in q.options" :key="opt.id" class="flex items-center gap-2 mb-1">
              <input v-model="opt.text" placeholder="Option" class="flex-1 border rounded px-2 py-1 text-sm"/>
              <label class="text-xs"><input type="radio" :name="'c_' + q.id" :checked="opt.isCorrect" @change="q.options?.forEach(o => o.isCorrect = false); opt.isCorrect = true"/> Correct</label>
              <button @click="q.options?.splice(oi, 1)" class="text-red-400 text-xs">x</button>
            </div>
            <button @click="addOption(idx)" class="text-xs text-blue-600 mt-1">+ Option</button>
          </div>
          <div v-if="q.type === 'fillBlank'"><label class="text-xs">Correct Answer:</label><input v-model="q.correctAnswer" class="border rounded px-2 py-1 text-sm ml-2 w-64"/></div>
          <div v-if="q.type === 'dragDrop' && q.items">
            <div v-for="(item, ii) in q.items" :key="item.id" class="flex items-center gap-2 mb-1">
              <input v-model="item.text" placeholder="Item" class="flex-1 border rounded px-2 py-1 text-sm"/>
              <label class="text-xs">Order: <input v-model.number="item.correctOrder" type="number" class="w-16 border rounded px-1 py-0.5 text-xs"/></label>
              <button @click="q.items?.splice(ii, 1)" class="text-red-400 text-xs">x</button>
            </div>
            <button @click="addDragItem(idx)" class="text-xs text-blue-600 mt-1">+ Item</button>
          </div>
        </div>
      </div>
      <button @click="save" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save Test</button>
    </div>
  </div>
</template>
