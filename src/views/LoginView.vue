<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

function handleLogin() {
  error.value = ''
  const success = auth.login(email.value, password.value)
  if (success) {
    router.push(`/${auth.userRole}/dashboard`)
  } else {
    error.value = 'Invalid email or password'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800">LMS Academy Gacoan</h1>
        <p class="text-gray-500 mt-2">Sign in to your account</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="budi@gacoan.id">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input v-model="password" type="password" required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="password123">
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
          Sign In
        </button>
      </form>
      <div class="mt-6 text-xs text-gray-400">
        <p class="font-medium mb-1">Test Accounts:</p>
        <p>Participant: budi@gacoan.id</p>
        <p>Instructor: ani@gacoan.id</p>
        <p>Rater: hendra@gacoan.id</p>
        <p>Supervisor: ibu_siti@gacoan.id</p>
        <p>Admin: admin@gacoan.id</p>
        <p class="mt-1">Password: password123</p>
      </div>
    </div>
  </div>
</template>
