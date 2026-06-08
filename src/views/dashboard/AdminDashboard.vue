<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { users, auditLogs } from '@/data/mockData'
const auth = useAuthStore()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Admin Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Total Users</p>
        <p class="text-2xl font-bold">{{ users.length }}</p>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Audit Entries</p>
        <p class="text-2xl font-bold">{{ auditLogs.length }}</p>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Roles</p>
        <p class="text-2xl font-bold">5</p>
      </div>
    </div>
    <div class="bg-white p-6 rounded shadow">
      <p class="text-gray-700">Welcome, {{ auth.userName }}. Use the sidebar to manage users and view audit logs.</p>
    </div>
  </div>
</template>
