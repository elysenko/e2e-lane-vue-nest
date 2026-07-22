<script setup lang="ts">
// Keep data-testid="app-ready" on the shell root — the mockup gate waits for it.
</script>

<template>
  <div data-testid="app-ready">
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>
