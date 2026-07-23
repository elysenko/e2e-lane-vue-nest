<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, ApiError } from '../lib/api';

// Rows come straight from GET /api/admin/settings — nothing is hardcoded or simulated.
interface SettingRow {
  key: string;
  label: string;
  kind: 'service' | 'integration';
  configured: boolean;
  masked: string;
  source: 'env' | 'db' | null;
}

const router = useRouter();
const items = ref<SettingRow[]>([]);
const edits = reactive<Record<string, string>>({});
const loading = ref(true);
const error = ref('');
const savingKey = ref('');
const savedKey = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await api<SettingRow[]>('/admin/settings');
    items.value = data;
    for (const row of data) {
      if (!(row.key in edits)) edits[row.key] = '';
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      router.push('/admin/login');
      return;
    }
    error.value = 'Unable to load settings right now. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function save(item: SettingRow) {
  const value = (edits[item.key] ?? '').trim();
  if (!value) return;
  error.value = '';
  savedKey.value = '';
  savingKey.value = item.key;
  try {
    // Real PATCH to the backend; state is refreshed from the server response only.
    await api('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ [item.key]: value }),
    });
    edits[item.key] = '';
    savedKey.value = item.key;
    await load();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      router.push('/admin/login');
      return;
    }
    error.value = `Could not save ${item.label}. Please try again.`;
  } finally {
    savingKey.value = '';
  }
}

onMounted(load);

const services = () => items.value.filter((i) => i.kind === 'service');
const integrations = () => items.value.filter((i) => i.kind === 'integration');
const unconfiguredIntegrations = () => integrations().filter((i) => !i.configured);
</script>

<template>
  <section data-testid="admin-settings-view">
    <div class="page-head">
      <div>
        <h1 class="page-title">Admin Settings</h1>
        <p class="page-sub">Configure services and integration credentials.</p>
      </div>
      <RouterLink to="/bookmarks" class="btn btn-ghost">Done</RouterLink>
    </div>

    <div v-if="error" class="banner banner-error" data-testid="settings-error">
      <span>⚠️</span><span>{{ error }}</span>
    </div>

    <div v-if="loading" class="card state" data-testid="settings-loading">
      <div class="state-title">Loading settings…</div>
    </div>

    <template v-else>
      <div
        v-if="unconfiguredIntegrations().length"
        class="banner banner-warning"
        data-testid="needs-credentials-banner"
      >
        <span>🔌</span>
        <span>
          <strong>The following need credentials to activate:</strong>
          {{ unconfiguredIntegrations().map((i) => i.label).join(', ') }}
        </span>
      </div>

      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-faint); margin: 8px 0 12px;">Services</h2>
      <div class="settings-group">
        <div v-for="item in services()" :key="item.key" class="card svc-card" data-testid="service-card">
          <div class="svc-head">
            <div>
              <div class="svc-name">{{ item.label }}</div>
              <div class="svc-key">{{ item.key }}</div>
            </div>
            <span class="badge" :class="item.configured ? 'badge-ok' : 'badge-off'">
              <span class="dot"></span>{{ item.configured ? 'Configured' : 'Not configured' }}
            </span>
          </div>
          <div class="field">
            <label class="label" :for="item.key">Credential</label>
            <input
              :id="item.key"
              v-model="edits[item.key]"
              class="input"
              type="text"
              :placeholder="item.masked || 'Enter value…'"
              data-testid="setting-input"
            />
          </div>
          <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-primary" :disabled="savingKey === item.key" @click="save(item)" data-testid="save-setting">
              {{ savingKey === item.key ? 'Saving…' : 'Save' }}
            </button>
            <span v-if="savedKey === item.key" class="badge badge-ok"><span class="dot"></span>Saved</span>
          </div>
        </div>
      </div>

      <h2 style="font-size: 15px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-faint); margin: 26px 0 12px;">Integrations</h2>
      <div class="settings-group">
        <div v-for="item in integrations()" :key="item.key" class="card svc-card" data-testid="integration-card">
          <div class="svc-head">
            <div>
              <div class="svc-name">{{ item.label }}</div>
              <div class="svc-key">{{ item.key }}</div>
            </div>
            <span class="badge" :class="item.configured ? 'badge-ok' : 'badge-off'">
              <span class="dot"></span>{{ item.configured ? 'Active' : 'Needs credentials' }}
            </span>
          </div>
          <div class="field">
            <label class="label" :for="item.key">API key</label>
            <input
              :id="item.key"
              v-model="edits[item.key]"
              class="input"
              type="text"
              :placeholder="item.masked || 'Enter value…'"
              data-testid="setting-input"
            />
          </div>
          <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-primary" :disabled="savingKey === item.key" @click="save(item)" data-testid="save-setting">
              {{ savingKey === item.key ? 'Saving…' : 'Save' }}
            </button>
            <span v-if="savedKey === item.key" class="badge badge-ok"><span class="dot"></span>Saved</span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
