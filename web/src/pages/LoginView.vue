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
    error.value = 'Enter your email and password.';
    return;
  }
  submitting.value = true;
  try {
    const res = await api<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    localStorage.setItem('token', res.token);
    router.push('/bookmarks');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = 'Invalid email or password.';
    } else {
      // Real failure (network / server error) — show an error, never fabricate a session.
      error.value = 'Unable to log in right now. Please try again.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="center-wrap" data-testid="login-view">
    <div class="card auth-card">
      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Log in to your account.</p>

      <div v-if="error" class="banner banner-error" data-testid="login-error">
        <span>⚠️</span><span>{{ error }}</span>
      </div>

      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label class="label" for="email">Email</label>
          <input id="email" v-model="form.email" class="input" type="email" autocomplete="username" placeholder="you@example.com" data-testid="login-email" />
        </div>
        <div class="field">
          <label class="label" for="password">Password</label>
          <input id="password" v-model="form.password" class="input" type="password" autocomplete="current-password" placeholder="••••••••" data-testid="login-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting" data-testid="login-btn">
          {{ submitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="auth-alt">New here? <RouterLink to="/signup">Create an account</RouterLink></p>
    </div>
  </section>
</template>
