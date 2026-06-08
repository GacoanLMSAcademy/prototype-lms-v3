<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-800">LMS Academy Gacoan</h1>
    <div class="flex items-center gap-4">
      <span class="text-sm text-gray-600">{{ auth.userName }}</span>
      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded capitalize">{{ auth.userRole }}</span>
      <button @click="handleLogout"
        class="text-sm text-red-600 hover:text-red-800 transition-colors">Logout</button>
    </div>
  </header>
</template>
