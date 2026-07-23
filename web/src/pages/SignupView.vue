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
    error.value = 'Enter an email and password.';
    return;
  }
  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters.';
    return;
  }
  submitting.value = true;
  try {
    const res = await api<{ token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    localStorage.setItem('token', res.token);
    router.push('/bookmarks');
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      error.value = 'An account with this email already exists.';
    } else {
      // Real failure (network / server error) — show an error, never fabricate a session.
      error.value = 'Unable to create your account right now. Please try again.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="center-wrap" data-testid="signup-view">
    <div class="card auth-card">
      <h1 class="auth-title">Create your account</h1>
      <p class="auth-sub">The first account created becomes the administrator.</p>

      <div v-if="error" class="banner banner-error" data-testid="signup-error">
        <span>⚠️</span><span>{{ error }}</span>
      </div>

      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label class="label" for="su-email">Email</label>
          <input id="su-email" v-model="form.email" class="input" type="email" autocomplete="username" placeholder="you@example.com" data-testid="signup-email" />
        </div>
        <div class="field">
          <label class="label" for="su-password">Password</label>
          <input id="su-password" v-model="form.password" class="input" type="password" autocomplete="new-password" placeholder="At least 8 characters" data-testid="signup-password" />
          <span class="hint">Use at least 8 characters.</span>
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="submitting" data-testid="signup-btn">
          {{ submitting ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="auth-alt">Already have an account? <RouterLink to="/login">Log in</RouterLink></p>
    </div>
  </section>
</template>
