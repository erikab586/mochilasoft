import { createApp } from 'vue'
import App from './App.vue'
import Admin from './Admin.vue'
import './style.css'

const isAdminPage = window.location.pathname.replace(/\/+$/, '') === '/admin'
document.title = isAdminPage
  ? 'Administración — MochilaSoft'
  : 'MochilaSoft — Ideas que se convierten en software'

createApp(isAdminPage ? Admin : App).mount('#app')
