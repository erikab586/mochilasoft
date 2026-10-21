<script setup>
import { onMounted, reactive, ref } from 'vue'

const user = ref('')
const checkingSession = ref(true)
const isSubmitting = ref(false)
const isLoadingProspects = ref(false)
const errorMessage = ref('')
const username = ref('')
const password = ref('')
const prospectos = ref([])
const total = ref(0)
const page = ref(1)
const pages = ref(1)
const searchInput = ref('')
const activeSearch = ref('')
const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/prospectos\/?$/, '')
  : '/api'

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const responseText = await response.text()
  let result = null
  try {
    result = responseText ? JSON.parse(responseText) : null
  } catch {
    throw new Error('El servidor respondió en un formato no válido.')
  }
  if (!response.ok) {
    const error = new Error(result?.error || 'No se pudo completar la solicitud.')
    error.status = response.status
    throw error
  }
  return result
}

const loadProspects = async (requestedPage = 1) => {
  isLoadingProspects.value = true
  errorMessage.value = ''
  try {
    const params = new URLSearchParams({
      pagina: String(requestedPage),
      buscar: activeSearch.value,
    })
    const result = await request(`${apiBase}/admin/prospectos?${params}`)
    prospectos.value = result.prospectos
    total.value = result.total
    page.value = result.pagina
    pages.value = result.paginas
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoadingProspects.value = false
  }
}

const checkSession = async () => {
  try {
    const result = await request(`${apiBase}/admin/session`)
    user.value = result.usuario
    await loadProspects()
  } catch (error) {
    if (error.status !== 401) errorMessage.value = error.message
  } finally {
    checkingSession.value = false
  }
}

const login = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const result = await request(`${apiBase}/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ usuario: username.value, password: password.value }),
    })
    user.value = result.usuario
    password.value = ''
    await loadProspects()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isSubmitting.value = false
  }
}

const logout = async () => {
  errorMessage.value = ''
  try {
    await request(`${apiBase}/admin/logout`, { method: 'POST' })
    user.value = ''
    prospectos.value = []
    username.value = ''
    password.value = ''
  } catch (error) {
    errorMessage.value = error.message
  }
}

const search = async () => {
  activeSearch.value = searchInput.value.trim()
  await loadProspects(1)
}

const formatDate = (value) => new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

const fullName = (prospecto) => [prospecto.nombre, prospecto.apellido].filter(Boolean).join(' ')

onMounted(checkSession)
</script>

<template>
  <main class="admin-shell">
    <div class="admin-orb admin-orb-one" aria-hidden="true"></div>
    <div class="admin-orb admin-orb-two" aria-hidden="true"></div>

    <section v-if="checkingSession" class="admin-status">
      <span class="admin-spinner" aria-hidden="true"></span>
      <p>Verificando acceso seguro…</p>
    </section>

    <section v-else-if="!user" class="admin-login-panel">
      <a class="admin-brand" href="/">
        <img src="/mochilasoft-logo.png" alt="MochilaSoft" />
      </a>
      <p class="admin-eyebrow">Área privada</p>
      <h1>Acceso de administración</h1>
      <p class="admin-intro">Ingresa con tu usuario para revisar las consultas de proyectos.</p>

      <form class="admin-login-form" @submit.prevent="login">
        <label for="admin-username">Usuario</label>
        <input
          id="admin-username"
          v-model.trim="username"
          name="username"
          autocomplete="username"
          required
          autofocus
        />
        <label for="admin-password">Contraseña</label>
        <input
          id="admin-password"
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
        <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
        <button class="admin-button" type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Ingresando…' : 'Iniciar sesión' }}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <p class="admin-setup-hint">Las cuentas se crean de forma segura desde el servidor con <code>npm run admin:create</code>.</p>
      <a class="admin-back-link" href="/">← Volver al sitio</a>
    </section>

    <section v-else class="admin-dashboard">
      <header class="admin-header">
        <a class="admin-brand" href="/" aria-label="MochilaSoft, volver al sitio">
          <img src="/mochilasoft-logo.png" alt="MochilaSoft" />
        </a>
        <div class="admin-user">
          <span>Sesión: <strong>{{ user }}</strong></span>
          <button class="admin-logout" type="button" @click="logout">Cerrar sesión</button>
        </div>
      </header>

      <div class="admin-heading">
        <div>
          <p class="admin-eyebrow">Panel de administración</p>
          <h1>Solicitudes de proyectos</h1>
          <p class="admin-intro">Revisa y gestiona la información enviada por tus potenciales clientes.</p>
        </div>
        <div class="admin-total">
          <strong>{{ total }}</strong>
          <span>{{ total === 1 ? 'solicitud' : 'solicitudes' }}</span>
        </div>
      </div>

      <form class="admin-search" @submit.prevent="search">
        <label class="visually-hidden" for="prospect-search">Buscar solicitudes</label>
        <input
          id="prospect-search"
          v-model="searchInput"
          type="search"
          placeholder="Buscar por cliente, proyecto, teléfono o email"
        />
        <button class="admin-button" type="submit">Buscar</button>
        <button
          v-if="activeSearch"
          class="admin-clear-search"
          type="button"
          @click="searchInput = ''; search()"
        >
          Limpiar
        </button>
        <button
          class="admin-refresh"
          type="button"
          :disabled="isLoadingProspects"
          aria-label="Actualizar solicitudes"
          @click="loadProspects(page)"
        >
          ↻
        </button>
      </form>

      <p v-if="errorMessage" class="admin-error admin-page-error" role="alert">{{ errorMessage }}</p>
      <div v-if="isLoadingProspects" class="admin-status admin-loading">
        <span class="admin-spinner" aria-hidden="true"></span>
        <p>Cargando solicitudes…</p>
      </div>
      <div v-else-if="prospectos.length" class="admin-prospect-list">
        <article v-for="prospecto in prospectos" :key="prospecto.id" class="admin-prospect-card">
          <div class="prospect-card-heading">
            <div>
              <p class="prospect-date">{{ formatDate(prospecto.creado_en) }}</p>
              <h2>{{ prospecto.nombre_proyecto }}</h2>
              <p class="prospect-client">{{ fullName(prospecto) }}</p>
            </div>
            <span v-if="prospecto.nicho" class="prospect-tag">{{ prospecto.nicho }}</span>
          </div>

          <div class="prospect-contact">
            <a :href="`tel:${prospecto.telefono}`">{{ prospecto.telefono }}</a>
            <a v-if="prospecto.email" :href="`mailto:${prospecto.email}`">{{ prospecto.email }}</a>
          </div>

          <p v-if="prospecto.descripcion" class="prospect-description">{{ prospecto.descripcion }}</p>
          <a
            v-if="prospecto.archivo_ruta"
            class="prospect-attachment"
            :href="`${apiBase}/admin/prospectos/${prospecto.id}/archivo`"
          >
            <span aria-hidden="true">↳</span>
            Descargar adjunto: {{ prospecto.archivo_nombre || 'archivo' }}
          </a>
        </article>
      </div>
      <div v-else class="admin-empty">
        <span aria-hidden="true">◇</span>
        <h2>{{ activeSearch ? 'No encontramos resultados' : 'Aún no hay solicitudes' }}</h2>
        <p>{{ activeSearch ? 'Prueba con otro nombre, email o proyecto.' : 'Las nuevas solicitudes aparecerán aquí cuando alguien complete el formulario.' }}</p>
      </div>

      <nav v-if="pages > 1" class="admin-pagination" aria-label="Paginación de solicitudes">
        <button type="button" :disabled="page <= 1 || isLoadingProspects" @click="loadProspects(page - 1)">
          ← Anterior
        </button>
        <span>Página {{ page }} de {{ pages }}</span>
        <button type="button" :disabled="page >= pages || isLoadingProspects" @click="loadProspects(page + 1)">
          Siguiente →
        </button>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.admin-shell {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 32px 20px;
  color: #f5f8ff;
  background:
    radial-gradient(ellipse at 78% 16%, rgba(0, 107, 255, .16), transparent 38%),
    linear-gradient(135deg, #050b18, #0b1220 58%, #07172b);
  isolation: isolate;
}

.admin-orb {
  position: absolute;
  z-index: -1;
  width: 400px;
  height: 250px;
  border: 1px solid rgba(0, 207, 255, .15);
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

.admin-orb-one { top: 8%; right: -180px; transform: rotate(-28deg); }
.admin-orb-two { bottom: -160px; left: -180px; transform: rotate(24deg); }

.admin-login-panel {
  width: min(100%, 440px);
  padding: 42px;
  border: 1px solid rgba(100, 170, 255, .2);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(14, 29, 51, .96), rgba(7, 16, 31, .96));
  box-shadow: 0 24px 80px rgba(0, 0, 0, .35), 0 0 35px rgba(0, 107, 255, .1);
}

.admin-brand { display: inline-flex; margin-bottom: 34px; }
.admin-brand img { display: block; width: 180px; height: auto; }
.admin-eyebrow { margin: 0 0 8px; color: #52baff; font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.admin-login-panel h1, .admin-heading h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.4rem); line-height: 1.14; letter-spacing: -.04em; }
.admin-intro { margin: 12px 0 0; color: #a9b8d0; line-height: 1.6; }
.admin-login-form { display: grid; gap: 10px; margin-top: 28px; }
.admin-login-form label { margin-top: 8px; color: #dbe7f7; font-size: .875rem; font-weight: 600; }
.admin-login-form input, .admin-search input {
  width: 100%;
  min-height: 46px;
  padding: 10px 13px;
  border: 1px solid rgba(100, 170, 255, .25);
  border-radius: 9px;
  outline: none;
  color: #f5f8ff;
  background: rgba(3, 10, 21, .62);
}
.admin-login-form input:focus, .admin-search input:focus { border-color: #1685ff; box-shadow: 0 0 0 3px rgba(22, 133, 255, .16); }
.admin-button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  border: 1px solid rgba(129, 195, 255, .35);
  border-radius: 9px;
  color: white;
  background: linear-gradient(110deg, #1263e7, #1685ff);
  box-shadow: 0 6px 22px rgba(0, 107, 255, .22);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
}
.admin-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0, 107, 255, .34); }
.admin-button:disabled { cursor: wait; opacity: .7; }
.admin-error { margin: 4px 0; color: #ffb2b2; font-size: .875rem; line-height: 1.5; }
.admin-back-link { display: inline-block; margin-top: 24px; color: #a9b8d0; font-size: .875rem; }
.admin-back-link:hover, .admin-logout:hover { color: #69c7ff; }
.admin-setup-hint { margin: 18px 0 0; color: #8095b2; font-size: .75rem; line-height: 1.5; }
.admin-setup-hint code { color: #a6dfff; }

.admin-dashboard { width: min(100%, 1020px); align-self: start; }
.admin-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid rgba(100, 170, 255, .16); }
.admin-header .admin-brand { margin: 0; }
.admin-header .admin-brand img { width: 155px; }
.admin-user { display: flex; align-items: center; gap: 20px; color: #a9b8d0; font-size: .875rem; }
.admin-user strong { color: #f5f8ff; }
.admin-logout, .admin-clear-search, .admin-refresh {
  padding: 8px 12px;
  border: 1px solid rgba(100, 170, 255, .2);
  border-radius: 8px;
  color: #dbe7f7;
  background: rgba(11, 23, 42, .7);
  font: inherit;
  cursor: pointer;
}
.admin-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding: 34px 0 25px; }
.admin-heading .admin-intro { margin-top: 8px; }
.admin-total { display: grid; min-width: 112px; padding: 12px 18px; border: 1px solid rgba(100, 170, 255, .2); border-radius: 12px; background: rgba(12, 28, 50, .7); text-align: center; }
.admin-total strong { color: #65c5ff; font-size: 1.7rem; line-height: 1.1; }
.admin-total span { margin-top: 4px; color: #a9b8d0; font-size: .8rem; }
.admin-search { display: flex; gap: 10px; margin-bottom: 20px; }
.admin-search input { flex: 1; }
.admin-clear-search { white-space: nowrap; }
.admin-refresh { width: 46px; font-size: 1.5rem; line-height: 1; }
.admin-refresh:disabled { cursor: wait; opacity: .6; }
.admin-page-error { margin: 0 0 16px; padding: 12px 14px; border: 1px solid rgba(255, 111, 111, .25); border-radius: 8px; background: rgba(117, 25, 35, .2); }
.admin-prospect-list { display: grid; gap: 14px; }
.admin-prospect-card { padding: 22px 24px; border: 1px solid rgba(100, 170, 255, .18); border-radius: 14px; background: linear-gradient(135deg, rgba(12, 27, 48, .94), rgba(8, 18, 34, .94)); box-shadow: 0 10px 30px rgba(0, 0, 0, .12); }
.prospect-card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.prospect-date { margin: 0 0 7px; color: #81a0c6; font-size: .78rem; }
.prospect-card-heading h2 { margin: 0; color: #f5f8ff; font-size: 1.25rem; line-height: 1.3; }
.prospect-client { margin: 4px 0 0; color: #b3c2d7; }
.prospect-tag { max-width: 45%; padding: 6px 10px; border: 1px solid rgba(0, 207, 255, .22); border-radius: 999px; color: #85ddf7; background: rgba(0, 207, 255, .07); font-size: .75rem; text-align: center; }
.prospect-contact { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 16px; color: #90cfff; font-size: .9rem; }
.prospect-contact a:hover, .prospect-attachment:hover { text-decoration: underline; }
.prospect-description { margin: 16px 0 0; padding-top: 14px; border-top: 1px solid rgba(100, 170, 255, .12); color: #c0cee1; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.prospect-attachment { display: inline-flex; align-items: center; gap: 7px; margin-top: 16px; color: #65c5ff; font-size: .875rem; overflow-wrap: anywhere; }
.admin-empty, .admin-status { display: grid; min-height: 250px; place-content: center; justify-items: center; color: #a9b8d0; text-align: center; }
.admin-empty > span { color: #52baff; font-size: 2rem; }
.admin-empty h2 { margin: 10px 0 6px; color: #f5f8ff; font-size: 1.25rem; }
.admin-empty p { max-width: 430px; margin: 0; line-height: 1.6; }
.admin-status { min-height: 100vh; }
.admin-loading { min-height: 180px; }
.admin-status p { margin: 12px 0 0; }
.admin-spinner { width: 30px; height: 30px; border: 2px solid rgba(100, 170, 255, .2); border-top-color: #52baff; border-radius: 50%; animation: admin-spin .8s linear infinite; }
.admin-pagination { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 24px; color: #a9b8d0; font-size: .875rem; }
.admin-pagination button { padding: 9px 12px; border: 1px solid rgba(100, 170, 255, .2); border-radius: 8px; color: #dbe7f7; background: rgba(11, 23, 42, .7); font: inherit; cursor: pointer; }
.admin-pagination button:disabled { cursor: default; opacity: .45; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }

@keyframes admin-spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) {
  .admin-shell { align-items: start; padding: 20px 14px; }
  .admin-login-panel { margin-block: auto; padding: 30px 24px; }
  .admin-brand img { width: 150px; }
  .admin-header { align-items: flex-start; gap: 12px; }
  .admin-header .admin-brand img { width: 125px; }
  .admin-user { align-items: flex-end; flex-direction: column; gap: 8px; font-size: .78rem; }
  .admin-heading { align-items: flex-start; padding: 28px 0 20px; }
  .admin-heading h1 { font-size: 1.8rem; }
  .admin-heading .admin-intro { font-size: .9rem; }
  .admin-total { min-width: 80px; padding: 9px; }
  .admin-search { flex-wrap: wrap; }
  .admin-search input { flex-basis: calc(100% - 58px); }
  .admin-search > .admin-button { flex: 1; }
  .admin-prospect-card { padding: 18px; }
  .prospect-card-heading { flex-direction: column-reverse; gap: 10px; }
  .prospect-tag { max-width: 100%; }
  .admin-pagination { gap: 8px; font-size: .78rem; }
  .admin-pagination button { padding: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .admin-spinner { animation-duration: 1.8s; }
  .admin-button { transition: none; }
}
</style>
