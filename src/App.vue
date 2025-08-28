<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()

// Hide header and footer on login page
const showHeaderFooter = computed(() => route.name !== 'login')
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <AppHeader v-if="showHeaderFooter" />
    <main :class="showHeaderFooter ? 'flex-1' : ''">
      <RouterView />
    </main>
    <AppFooter v-if="showHeaderFooter" />
  </div>
</template>
