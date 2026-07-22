<script setup lang="ts"></script>

<template>
  <section class="center-wrap" data-testid="not-found-view">
    <div class="card state">
      <div class="state-icon">🧭</div>
      <div class="state-title">Page not found</div>
      <p class="state-text">The page you're looking for doesn't exist or has moved.</p>
      <RouterLink to="/bookmarks" class="btn btn-primary">Back to bookmarks</RouterLink>
    </div>
  </section>
</template>
