import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, Role } from '@/types'
import { users } from '@/data/mockData'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)
  const userRole = computed<Role | null>(() => currentUser.value?.role ?? null)
  const userName = computed(() => currentUser.value?.name ?? '')
  const userId = computed(() => currentUser.value?.id ?? '')

  function login(email: string, password: string): boolean {
    const user = users.find(u => u.email === email && u.password === password)
    if (user) {
      currentUser.value = { ...user }
      localStorage.setItem('lms_user', JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role }))
      return true
    }
    return false
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('lms_user')
  }

  function init() {
    const stored = localStorage.getItem('lms_user')
    if (stored) {
      const data = JSON.parse(stored)
      const user = users.find(u => u.id === data.id)
      if (user) currentUser.value = { ...user }
    }
  }

  return { currentUser, isAuthenticated, userRole, userName, userId, login, logout, init }
})
