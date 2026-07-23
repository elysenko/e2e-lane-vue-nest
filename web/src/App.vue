<script setup lang="ts">
// Keep data-testid="app-ready" on the shell root — the mockup gate waits for it.
</script>

<template>
  <div class="app-shell" data-testid="app-ready">
    <header class="app-header">
      <RouterLink to="/bookmarks" class="brand" aria-label="Bookmarks home">
        <span class="brand-mark">🔖</span>
        <span>Bookmarks</span>
      </RouterLink>

      <nav class="nav-desktop" aria-label="Primary">
        <RouterLink to="/bookmarks" class="nav-link">Bookmarks</RouterLink>
        <RouterLink to="/about" class="nav-link">About</RouterLink>
        <RouterLink to="/login" class="nav-link">Log in</RouterLink>
      </nav>

      <RouterLink to="/bookmarks/new" class="btn btn-primary header-cta">
        <span>＋</span> Add Bookmark
      </RouterLink>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>Bookmarks · a fully-public reading list · <RouterLink to="/admin/login">Admin</RouterLink></p>
    </footer>

    <!-- Mobile bottom navigation -->
    <nav class="tabbar" aria-label="Mobile">
      <RouterLink to="/bookmarks" class="tab">
        <span class="tab-ico">📑</span>
        <span>Bookmarks</span>
      </RouterLink>
      <RouterLink to="/bookmarks/new" class="tab tab-add" aria-label="Add bookmark">
        <span class="tab-ico">＋</span>
        <span>Add</span>
      </RouterLink>
      <RouterLink to="/about" class="tab">
        <span class="tab-ico">ℹ️</span>
        <span>About</span>
      </RouterLink>
      <RouterLink to="/login" class="tab">
        <span class="tab-ico">👤</span>
        <span>Account</span>
      </RouterLink>
    </nav>
  </div>
</template>
