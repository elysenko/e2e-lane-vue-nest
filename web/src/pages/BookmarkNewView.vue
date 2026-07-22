<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createBookmark } from '../lib/bookmarks';

const router = useRouter();
const form = reactive({ title: '', url: '' });
const errors = reactive<{ title?: string; url?: string; general?: string }>({});
const submitting = ref(false);

function validate(): boolean {
  errors.title = undefined;
  errors.url = undefined;
  let ok = true;
  if (!form.title.trim()) {
    errors.title = 'Title is required.';
    ok = false;
  }
  if (!form.url.trim()) {
    errors.url = 'URL is required.';
    ok = false;
  } else if (!/^https?:\/\/.+/i.test(form.url.trim())) {
    errors.url = 'Enter a valid http:// or https:// URL.';
    ok = false;
  }
  return ok;
}

async function submit() {
  errors.general = undefined;
  if (!validate()) return;
  submitting.value = true;
  try {
    const res = await createBookmark({ title: form.title.trim(), url: form.url.trim() });
    if (res.ok) {
      router.push('/bookmarks');
    } else if (res.fieldErrors) {
      errors.title = res.fieldErrors.title ?? errors.title;
      errors.url = res.fieldErrors.url ?? errors.url;
      if (!res.fieldErrors.title && !res.fieldErrors.url) {
        errors.general = 'Please check the details and try again.';
      }
    }
  } catch {
    errors.general = 'The service is temporarily unavailable. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="center-wrap" data-testid="bookmark-new-view">
    <div class="page-head" style="margin-bottom: 16px;">
      <div>
        <h1 class="page-title">Add Bookmark</h1>
        <p class="page-sub">Save a link to your public list.</p>
      </div>
    </div>

    <div v-if="errors.general" class="banner banner-error" data-testid="form-error">
      <span>⚠️</span><span>{{ errors.general }}</span>
    </div>

    <form class="card auth-card form" novalidate @submit.prevent="submit" data-testid="bookmark-form">
      <div class="field">
        <label class="label" for="title">Title</label>
        <input
          id="title"
          v-model="form.title"
          class="input"
          :class="{ 'has-error': errors.title }"
          type="text"
          placeholder="e.g. Vue.js Documentation"
          autocomplete="off"
          data-testid="title-input"
        />
        <span v-if="errors.title" class="error-msg" data-testid="title-error">{{ errors.title }}</span>
      </div>

      <div class="field">
        <label class="label" for="url">URL</label>
        <input
          id="url"
          v-model="form.url"
          class="input"
          :class="{ 'has-error': errors.url }"
          type="url"
          inputmode="url"
          placeholder="https://example.com"
          data-testid="url-input"
        />
        <span v-if="errors.url" class="error-msg" data-testid="url-error">{{ errors.url }}</span>
        <span v-else class="hint">Must start with http:// or https://</span>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting" data-testid="create-btn">
          {{ submitting ? 'Saving…' : 'Create' }}
        </button>
        <RouterLink to="/bookmarks" class="btn btn-ghost">Cancel</RouterLink>
      </div>
    </form>
  </section>
</template>
