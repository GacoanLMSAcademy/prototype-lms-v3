<script setup lang="ts">
import { users } from '@/data/mockData'
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">User Management</h2>
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-gray-600 text-sm"><tr><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Role</th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-t hover:bg-gray-50">
            <td class="p-3 font-medium">{{ u.name }}</td><td class="p-3">{{ u.email }}</td>
            <td class="p-3"><span class="text-xs px-2 py-0.5 rounded capitalize" :class="u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'instructor' ? 'bg-blue-100 text-blue-800' : u.role === 'rater' ? 'bg-green-100 text-green-800' : u.role === 'supervisor' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'">{{ u.role }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
