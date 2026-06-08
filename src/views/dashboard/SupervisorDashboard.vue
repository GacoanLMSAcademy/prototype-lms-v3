<script setup lang="ts">
import { classes, auditLogs, remedials } from '@/data/mockData'
const activeRemedials = remedials.filter(r => r.status !== 'completed')
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Supervisor Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Classes</p><p class="text-2xl font-bold">{{ classes.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Audit Entries</p><p class="text-2xl font-bold">{{ auditLogs.length }}</p></div>
      <div class="bg-white p-4 rounded shadow"><p class="text-gray-500 text-sm">Active Remedials</p><p class="text-2xl font-bold">{{ activeRemedials.length }}</p></div>
    </div>
    <div class="bg-white p-6 rounded shadow">
      <p class="text-gray-700">Monitor class activities, review audit logs, and track remedial progress.</p>
    </div>
  </div>
</template>
