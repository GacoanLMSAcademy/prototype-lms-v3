<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sectionTypes } from '@/data/mockData'

const route = useRoute()
const router = useRouter()

const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? sectionTypes.find((s) => s.id === route.params.id) : null

const name = ref(existing?.name ?? '')
const description = ref(existing?.description ?? '')

const errors = ref<{ name?: string }>({})

function validate() {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = 'Name is required'
  return Object.keys(errors.value).length === 0
}

function save() {
  if (!validate()) return

  if (isEdit && existing) {
    existing.name = name.value.trim()
    existing.description = description.value.trim()
  } else {
    sectionTypes.push({
      id: crypto.randomUUID(),
      name: name.value.trim(),
      description: description.value.trim(),
      createdBy: 'u5',
      createdAt: new Date().toISOString(),
    })
  }

  router.push('/admin/section-types')
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          {{ isEdit ? 'Edit Section Type' : 'New Section Type' }}
        </h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Section types are assigned to sections inside the Form Builder
        </p>
      </div>
      <button
        @click="router.push('/admin/section-types')"
        class="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition"
      >
        ← Back
      </button>
    </div>

    <!-- Form card -->
    <div class="bg-white rounded-xl shadow p-6 space-y-5">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="name"
          class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="errors.name ? 'border-red-400' : 'border-gray-300'"
          placeholder="e.g. Multiple Choice"
        />
        <p v-if="errors.name" class="text-xs text-red-500 mt-1">{{ errors.name }}</p>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description of this section type…"
        />
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2">
        <button
          @click="router.push('/admin/section-types')"
          class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          @click="save"
          class="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {{ isEdit ? 'Save Changes' : 'Create Section Type' }}
        </button>
      </div>
    </div>
  </div>
</template>
