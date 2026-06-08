<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <div v-show="sidebarOpen" class="flex-shrink-0">
      <Sidebar />
    </div>
    <div class="flex-1 flex flex-col min-w-0">
      <Navbar />
      <button @click="toggleSidebar" class="absolute top-3 left-2 z-10 bg-gray-200 p-1 rounded text-xs">
        {{ sidebarOpen ? '◀' : '▶' }}
      </button>
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
