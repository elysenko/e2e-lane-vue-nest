<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../lib/api';

interface SettingItem {
  key: string;
  label: string;
  kind: 'service' | 'integration';
  hint: string;
  configured: boolean;
  masked: string;
  value: string; // local edit buffer
}

// Mirrors GET /api/admin/settings — service keys (postgresql, minio) + integration keys.
const items = reactive<SettingItem[]>([
  {
    key: 'DATABASE_URL',
    label: 'PostgreSQL',
    kind: 'service',
    hint: 'Primary datastore connection string.',
    configured: true,
    masked: 'postgres://••••••@db:5432/app',
    value: '',
  },
  {
    key: 'MINIO_ENDPOINT',
    label: 'MinIO',
    kind: 'service',
    hint: 'Object storage endpoint & credentials.',
    configured: false,
    masked: '',
    value: '',
  },
  {
    key: 'POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY',
    label: 'PostgreSQL via TypeORM (pg driver)',
    kind: 'integration',
    hint: 'Credential for the provisioned TypeORM/pg integration.',
    configured: false,
    masked: '',
    value: '',
  },
]);

const loading = ref(true);
const savedKey = ref('');

async function load() {
  loading.value = true;
  try {
    const data = await api<Array<{ key: string; configured: boolean; masked: string }>>('/admin/settings');
    for (const row of data) {
      const it = items.find((i) => i.key === row.key);
      if (it) {
        it.configured = row.configured;
        it.masked = row.masked;
      }
    }
  } catch {
    // Mockup: no backend — keep the seeded example state above.
  } finally {
    loading.value = false;
  }
}

async function save(item: SettingItem) {
  const value = item.value.trim();
  if (!value) return;
  try {
    await api('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ [item.key]: value }),
    });
  } catch {
    /* mockup: swallow — reflect optimistic state below */
  }
  item.configured = true;
  item.masked = value.slice(0, 4) + '••••••';
  item.value = '';
  savedKey.value = item.key;
  setTimeout(() => (savedKey.value = ''), 2500);
}

onMounted(load);

const services = () => items.filter((i) => i.kind === 'service');
const integrations = () => items.filter((i) => i.kind === 'integration');
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
            v-model="item.value"
            class="input"
            type="text"
            :placeholder="item.masked || 'Enter value…'"
            data-testid="setting-input"
          />
          <span class="hint">{{ item.hint }}</span>
        </div>
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
          <button class="btn btn-primary" @click="save(item)" data-testid="save-setting">Save</button>
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
            v-model="item.value"
            class="input"
            type="text"
            :placeholder="item.masked || 'PLACEHOLDER_CONFIGURE_IN_SETTINGS'"
            data-testid="setting-input"
          />
          <span class="hint">{{ item.hint }}</span>
        </div>
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
          <button class="btn btn-primary" @click="save(item)" data-testid="save-setting">Save</button>
          <span v-if="savedKey === item.key" class="badge badge-ok"><span class="dot"></span>Saved</span>
        </div>
      </div>
    </div>
  </section>
</template>
