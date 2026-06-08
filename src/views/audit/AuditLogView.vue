<script setup lang="ts">
import { ref, computed } from 'vue'
import { auditLogs } from '@/data/mockData'
import type { Role } from '@/types'

const filterAction = ref('')
const filterRole = ref('')
const roles: Role[] = ['admin', 'instructor', 'participant', 'rater', 'supervisor']
const actions = ['CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'ASSIGN', 'APPROVE']

const filtered = computed(() => {
  return auditLogs.filter(log => {
    if (filterAction.value && log.action !== filterAction.value) return false
    if (filterRole.value && log.userRole !== filterRole.value) return false
    return true
  })
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Audit Log</h2>
    <div class="flex gap-4 mb-4">
      <select v-model="filterAction" class="border rounded px-3 py-2 text-sm">
        <option value="">All Actions</option>
        <option v-for="a in actions" :key="a" :value="a">{{ a }}</option>
      </select>
      <select v-model="filterRole" class="border rounded px-3 py-2 text-sm">
        <option value="">All Roles</option>
        <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
      </select>
      <span class="text-sm text-gray-500 self-center">{{ filtered.length }} entries</span>
    </div>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm">
          <tr><th class="p-3">User</th><th class="p-3">Role</th><th class="p-3">Action</th><th class="p-3">Resource</th><th class="p-3">Details</th><th class="p-3">Date</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in filtered" :key="log.id" class="border-t text-sm hover:bg-gray-50">
            <td class="p-3">{{ log.userName }}</td>
            <td class="p-3 capitalize">{{ log.userRole }}</td>
            <td class="p-3"><span class="bg-gray-200 px-2 py-0.5 rounded text-xs">{{ log.action }}</span></td>
            <td class="p-3">{{ log.resource }}</td>
            <td class="p-3 text-gray-500">{{ log.details }}</td>
            <td class="p-3 text-gray-500">{{ new Date(log.timestamp).toLocaleDateString() }}</td>
          </tr>
          <tr v-if="filtered.length === 0"><td colspan="6" class="p-6 text-center text-gray-400">No audit entries match the filters</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
