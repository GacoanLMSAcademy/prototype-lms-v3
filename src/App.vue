<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const auth = useAuthStore()
auth.init()

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <AppLayout v-if="!isLoginPage && auth.isAuthenticated" />
  <router-view v-else />
</template>
