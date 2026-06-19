<script setup lang="ts">
import { formAssessments, trainingMethodTypes } from '@/data/mockData'
import { useRouter } from 'vue-router'

const router = useRouter()

function typeName(typeId?: string) {
  if (!typeId) return ''
  const t = trainingMethodTypes.find((t) => t.id === typeId)
  return t ? t.name : ''
}

function sectionCount(f: (typeof formAssessments)[0]) {
  return f.sections?.length ?? 0
}

function totalWeight(f: (typeof formAssessments)[0]) {
  return f.sections?.reduce((s, sec) => s + (sec.weight || 0), 0) ?? 0
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Form Builder</h2>
      <button
        @click="router.push('/admin/form-builder/new')"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + New Form
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="f in formAssessments"
        :key="f.id"
        class="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-gray-800">{{ f.title }}</h3>
          <button
            @click="router.push('/admin/form-builder/' + f.id)"
            class="text-blue-600 hover:underline text-sm ml-2 shrink-0"
          >
            Edit
          </button>
        </div>
        <p class="text-sm text-gray-500 mb-3">{{ f.description }}</p>

        <div class="flex flex-wrap gap-2 text-xs">
          <span
            v-if="f.typeId"
            class="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
          >
            {{ typeName(f.typeId) }}
          </span>

          <!-- Section info (new system) -->
          <template v-if="sectionCount(f) > 0">
            <span
              class="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full"
            >
              {{ sectionCount(f) }} section(s)
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full border',
                totalWeight(f) === 100
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-orange-50 text-orange-700 border-orange-100',
              ]"
            >
              Total weight: {{ totalWeight(f) }}%
            </span>
          </template>

          <!-- Legacy fields info -->
          <template v-else>
            <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {{ f.fields.length }} field(s)
            </span>
          </template>
        </div>

        <!-- Section badges -->
        <div v-if="sectionCount(f) > 0" class="flex flex-wrap gap-1 mt-3">
          <span
            v-for="section in f.sections"
            :key="section.id"
            class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
          >
            {{ section.title }}: {{ section.weight }}%
          </span>
        </div>
        <!-- Legacy field badges -->
        <div v-else class="flex flex-wrap gap-1 mt-3">
          <span
            v-for="field in f.fields"
            :key="field.id"
            class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
          >
            {{ field.type }}: {{ field.label.substring(0, 18)
            }}{{ field.label.length > 18 ? '…' : '' }}
          </span>
        </div>
      </div>
      <div v-if="formAssessments.length === 0" class="col-span-2 text-center text-gray-400 py-12">
        No forms yet
      </div>
    </div>
  </div>
</template>
