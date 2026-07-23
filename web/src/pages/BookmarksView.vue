<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listBookmarks, type Bookmark } from '../lib/bookmarks';

const bookmarks = ref<Bookmark[]>([]);
const state = ref<'loading' | 'ready' | 'error'>('loading');

function initial(title: string): string {
  return (title.trim()[0] || '?').toUpperCase();
}

async function load() {
  state.value = 'loading';
  try {
    bookmarks.value = await listBookmarks();
    state.value = 'ready';
  } catch {
    // Backend down / network failure -> genuine error state (no fabricated data).
    state.value = 'error';
  }
}

onMounted(load);
</script>

<template>
  <section data-testid="bookmarks-view">
    <div class="page-head">
      <div>
        <h1 class="page-title" data-testid="bookmarks-title">My Bookmarks</h1>
        <p class="page-sub">Everything you've saved to read later.</p>
      </div>
      <RouterLink to="/bookmarks/new" class="btn btn-primary" data-testid="add-bookmark">
        <span>＋</span> Add
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="state === 'loading'" class="bm-list" data-testid="bookmarks-loading">
      <div v-for="n in 3" :key="n" class="bm-row">
        <div class="skeleton bm-favicon"></div>
        <div class="bm-body">
          <div class="skeleton" style="height: 14px; width: 55%; margin-bottom: 8px;"></div>
          <div class="skeleton" style="height: 12px; width: 35%;"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="state === 'error'" class="card state" data-testid="bookmarks-error">
      <div class="state-icon">🚧</div>
      <div class="state-title">Something went wrong</div>
      <p class="state-text">We couldn't load your bookmarks right now.</p>
      <button class="btn btn-primary" @click="load">Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="bookmarks.length === 0" class="card state" data-testid="bookmarks-empty">
      <div class="state-icon">🔖</div>
      <div class="state-title">No bookmarks yet</div>
      <p class="state-text">Save your first link to get started.</p>
      <RouterLink to="/bookmarks/new" class="btn btn-primary">Add your first bookmark</RouterLink>
    </div>

    <!-- List -->
    <div v-else class="bm-list" data-testid="bookmarks-list">
      <a
        v-for="b in bookmarks"
        :key="b.id"
        :href="b.url"
        target="_blank"
        rel="noopener noreferrer"
        class="bm-row"
        data-testid="bookmark-row"
      >
        <span class="bm-favicon">{{ initial(b.title) }}</span>
        <span class="bm-body">
          <span class="bm-title">{{ b.title }}</span>
          <span class="bm-url">{{ b.url }}</span>
        </span>
        <span class="bm-open" aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
</template>
