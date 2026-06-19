<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formAssessments, trainingMethodTypes, sectionTypes } from '@/data/mockData'
import type { FormSection, FormSectionItem } from '@/types'

const route = useRoute()
const router = useRouter()

const isEdit = !!(route.params.id && route.params.id !== 'new')
const existing = isEdit ? formAssessments.find((f) => f.id === route.params.id) : null

// ── Top-level form fields ──
const title = ref(existing?.title ?? '')
const description = ref(existing?.description ?? '')
const typeId = ref(existing?.typeId ?? '')

// ── Section types config ──
const sectionTypeOptions = computed(() => sectionTypes.map((s) => ({ value: s.id, label: s.name })))

// ── Sections state ──
function createSection(index: number): FormSection {
  return {
    id: crypto.randomUUID(),
    title: `Section ${index}`,
    sectionTypeId: sectionTypes[0]?.id ?? '',
    weight: 0,
    items: [],
  }
}

function createItem(): FormSectionItem {
  return { id: crypto.randomUUID(), label: '', weight: 0, point: 0 }
}

const initialSections: FormSection[] =
  existing?.sections && existing.sections.length > 0 ? existing.sections : [createSection(1)]

const sections = ref<FormSection[]>(initialSections)
const activeIndex = ref(0)
const slideDirection = ref<'left' | 'right'>('right')
const isAnimating = ref(false)

// ── Computed ──
const totalWeight = computed(() => sections.value.reduce((sum, s) => sum + (s.weight || 0), 0))

const activeSection = computed(() => sections.value[activeIndex.value])

// ── Navigation ──
function goTo(index: number) {
  if (index === activeIndex.value || isAnimating.value) return
  slideDirection.value = index > activeIndex.value ? 'right' : 'left'
  isAnimating.value = true
  activeIndex.value = index
  setTimeout(() => {
    isAnimating.value = false
  }, 320)
}

function goPrev() {
  if (activeIndex.value > 0) goTo(activeIndex.value - 1)
}

function goNext() {
  if (activeIndex.value < sections.value.length - 1) goTo(activeIndex.value + 1)
}

// ── Section management ──
function addSection() {
  const newSection = createSection(sections.value.length + 1)
  sections.value.push(newSection)
  goTo(sections.value.length - 1)
}

function removeSection(index: number) {
  if (sections.value.length <= 1) return
  sections.value.splice(index, 1)
  if (activeIndex.value >= sections.value.length) {
    activeIndex.value = sections.value.length - 1
  }
}

// ── Item management ──
function addItem(section: FormSection) {
  section.items.push(createItem())
}

function removeItem(section: FormSection, itemIndex: number) {
  section.items.splice(itemIndex, 1)
}

// ── Save ──
function save() {
  if (!title.value.trim()) {
    alert('Form title is required')
    return
  }
  if (sections.value.length === 0) {
    alert('At least one section is required')
    return
  }
  alert('Form saved (mock)')
  router.push('/admin/form-builder')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ isEdit ? 'Edit Form' : 'New Form' }}</h2>
      <div class="flex gap-2">
        <button
          @click="router.push('/admin/form-builder')"
          class="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          @click="save"
          class="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Form
        </button>
      </div>
    </div>

    <!-- Top-level form metadata -->
    <div class="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
        <input
          v-model="title"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Multirater - Kompetensi Karyawan"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          v-model="description"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="Form description..."
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Training Method Type</label>
        <select
          v-model="typeId"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Type --</option>
          <option v-for="t in trainingMethodTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
    </div>

    <!-- Section builder -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <!-- Section tabs + Add Section button -->
      <div
        class="border-b border-gray-200 bg-gray-50 px-4 pt-3 pb-0 flex items-end gap-2 overflow-x-auto"
      >
        <button
          v-for="(section, idx) in sections"
          :key="section.id"
          @click="goTo(idx)"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors whitespace-nowrap',
            activeIndex === idx
              ? 'bg-white border-gray-200 text-blue-700 -mb-px z-10'
              : 'bg-gray-100 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ section.title || `Section ${idx + 1}` }}
        </button>
        <button
          @click="addSection"
          class="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-t-lg border border-transparent whitespace-nowrap flex items-center gap-1 mb-0 self-end"
        >
          <span class="text-lg leading-none">+</span>
          <span>Add Section</span>
        </button>
      </div>

      <!-- Navigation arrows + section viewport -->
      <div class="relative overflow-hidden">
        <!-- Prev / Next arrows -->
        <button
          @click="goPrev"
          :disabled="activeIndex === 0"
          :class="[
            'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full shadow bg-white border border-gray-200 transition',
            activeIndex === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100 cursor-pointer',
          ]"
        >
          ←
        </button>
        <button
          @click="goNext"
          :disabled="activeIndex === sections.length - 1"
          :class="[
            'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full shadow bg-white border border-gray-200 transition',
            activeIndex === sections.length - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100 cursor-pointer',
          ]"
        >
          →
        </button>

        <!-- Section panels with slide transition -->
        <div class="overflow-hidden">
          <Transition
            :name="slideDirection === 'right' ? 'slide-left' : 'slide-right'"
            mode="out-in"
          >
            <div v-if="activeSection" :key="activeSection.id" class="px-10 py-6">
              <!-- Section header row -->
              <div class="flex items-center justify-between mb-5">
                <h3 class="text-base font-semibold text-gray-700">
                  Section {{ activeIndex + 1 }} of {{ sections.length }}
                </h3>
                <button
                  v-if="sections.length > 1"
                  @click="removeSection(activeIndex)"
                  class="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition"
                >
                  Remove Section
                </button>
              </div>

              <!-- Section fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <!-- Section Title -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                  <input
                    v-model="activeSection.title"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Reading Comprehension"
                  />
                </div>
                <!-- Section Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
                  <div class="flex gap-2">
                    <select
                      v-model="activeSection.sectionTypeId"
                      class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Type --</option>
                      <option v-for="opt in sectionTypeOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <a
                      href="/admin/section-types/new"
                      target="_blank"
                      class="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2.5 py-2 rounded-lg transition whitespace-nowrap flex items-center"
                      title="Manage section types"
                    >
                      + Type
                    </a>
                  </div>
                  <p v-if="sectionTypeOptions.length === 0" class="text-xs text-orange-500 mt-1">
                    No section types defined yet.
                    <a href="/admin/section-types/new" target="_blank" class="underline">Add one</a
                    >.
                  </p>
                </div>
                <!-- Section Weight -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Section Weight</label>
                  <input
                    v-model.number="activeSection.weight"
                    type="number"
                    min="0"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 40"
                  />
                </div>
              </div>

              <!-- Items list -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-semibold text-gray-600">Items</h4>
                  <button
                    @click="addItem(activeSection)"
                    class="text-xs bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                  >
                    + Add Item
                  </button>
                </div>

                <div
                  v-if="activeSection.items.length === 0"
                  class="text-sm text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-lg"
                >
                  No items yet. Click "Add Item" to get started.
                </div>

                <div
                  v-for="(item, itemIdx) in activeSection.items"
                  :key="item.id"
                  class="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50 hover:bg-white transition"
                >
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Item {{ itemIdx + 1 }}
                    </span>
                    <button
                      @click="removeItem(activeSection, itemIdx)"
                      class="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="md:col-span-3">
                      <label class="block text-xs font-medium text-gray-600 mb-1"
                        >Question / Label</label
                      >
                      <input
                        v-model="item.label"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter question or label..."
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1"
                        >Item Weight</label
                      >
                      <input
                        v-model.number="item.weight"
                        type="number"
                        min="0"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Item Point</label>
                      <input
                        v-model.number="item.point"
                        type="number"
                        min="0"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div class="flex items-end">
                      <div
                        class="w-full bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 font-medium"
                      >
                        Weighted:
                        {{
                          item.weight && item.point
                            ? ((item.weight * item.point) / 100).toFixed(2)
                            : '—'
                        }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Items summary -->
                <div
                  v-if="activeSection.items.length > 0"
                  class="mt-2 flex gap-4 text-xs text-gray-500"
                >
                  <span>{{ activeSection.items.length }} item(s)</span>
                  <span>
                    Total item weight:
                    <strong
                      :class="
                        activeSection.items.reduce((s, i) => s + (i.weight || 0), 0) === 100
                          ? 'text-green-600'
                          : 'text-orange-500'
                      "
                    >
                      {{ activeSection.items.reduce((s, i) => s + (i.weight || 0), 0) }}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Footer summary -->
      <div class="border-t border-gray-100 bg-gray-50 px-6 py-4 flex flex-wrap items-center gap-4">
        <!-- Section dots indicator -->
        <div class="flex gap-1.5">
          <button
            v-for="(_, idx) in sections"
            :key="idx"
            @click="goTo(idx)"
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all',
              activeIndex === idx ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400',
            ]"
          />
        </div>

        <div class="flex-1" />

        <!-- Total weight display -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Total Form Weight:</span>
          <span
            :class="[
              'text-sm font-bold px-3 py-1 rounded-full',
              totalWeight === 100
                ? 'bg-green-100 text-green-700'
                : totalWeight > 100
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700',
            ]"
          >
            {{ totalWeight }}%
            <span v-if="totalWeight === 100" class="ml-1">✓</span>
            <span v-else-if="totalWeight > 100" class="ml-1">↑ over</span>
            <span v-else class="ml-1">↓ under</span>
          </span>
        </div>

        <!-- Per-section weights mini summary -->
        <div class="w-full mt-1 flex flex-wrap gap-2">
          <div
            v-for="(section, idx) in sections"
            :key="section.id"
            @click="goTo(idx)"
            :class="[
              'text-xs px-2.5 py-1 rounded-full border cursor-pointer transition',
              activeIndex === idx
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300',
            ]"
          >
            {{ section.title || `Section ${idx + 1}` }}: {{ section.weight }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Slide from left (going backwards) */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.28s ease;
  position: relative;
}

/* slide-left: new section comes from the right (forward navigation) */
.slide-left-enter-from {
  transform: translateX(60px);
  opacity: 0;
}
.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-left-leave-to {
  transform: translateX(-60px);
  opacity: 0;
}

/* slide-right: new section comes from the left (backward navigation) */
.slide-right-enter-from {
  transform: translateX(-60px);
  opacity: 0;
}
.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(60px);
  opacity: 0;
}
</style>
