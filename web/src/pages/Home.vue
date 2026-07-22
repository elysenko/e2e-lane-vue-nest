<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';

const health = ref('checking…');
onMounted(async () => {
  try {
    const h = await api<{ status: string }>('/api/health');
    health.value = h.status ?? 'ok';
  } catch {
    health.value = 'backend unreachable';
  }
});
</script>

<template>
  <main>
    <h1 data-testid="home-title">Welcome</h1>
    <p data-testid="health-status">API: {{ health }}</p>
  </main>
</template>
