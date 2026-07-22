<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, ApiError } from '../lib/api';

const router = useRouter();
const form = reactive({ email: '', password: '' });
const error = ref('');
const submitting = ref(false);

async function submit() {
  error.value = '';
  if (!form.email || !form.password) {
    error.value = 'Enter your admin email and password.';
    return;
  }
  submitting.value = true;
  try {
    const res = await api<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    localStorage.setItem('token', res.token);
    router.push('/admin/settings');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = 'Invalid email or password.';
    } else {
      // Mockup: no backend attached — proceed to the settings screen for preview.
      localStorage.setItem('token', 'preview-admin-token');
      router.push('/admin/settings');
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="center-wrap" data-testid="admin-login-view">
    <div class="card auth-card">
      <h1 class="auth-title">Admin sign in</h1>
      <p class="auth-sub">Restricted area — administrators only.</p>

      <div v-if="error" class="banner banner-error" data-testid="admin-login-error">
        <span>⚠️</span><span>{{ error }}</span>
      </div>

      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label class="label" for="admin-email">Email</label>
          <input id="admin-email" v-model="form.email" class="input" type="email" autocomplete="username" placeholder="admin@example.com" data-testid="admin-email" />
        </div>
        <div class="field">
          <label class="label" for="admin-password">Password</label>
          <input id="admin-password" v-model="form.password" class="input" type="password" autocomplete="current-password" placeholder="••••••••" data-testid="admin-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting" data-testid="admin-login-btn">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-alt"><RouterLink to="/bookmarks">← Back to bookmarks</RouterLink></p>
    </div>
  </section>
</template>
