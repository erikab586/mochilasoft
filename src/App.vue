<script setup>
import { nextTick, reactive, ref } from 'vue'

const menuOpen = ref(false)
const projectDialog = ref(null)
const projectForm = ref(null)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitError = ref(false)
const selectedFile = ref(null)
const form = reactive({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  nombre_proyecto: '',
  nicho: '',
  descripcion: '',
})
const apiEndpoint = import.meta.env.VITE_API_URL
  || '/api/prospectos'

const services = [
  {
    title: 'Páginas Web',
    description: 'Sitios modernos, rápidos y responsivos que representan tu marca y generan confianza.',
    icon: 'globe',
    tone: 'cyan',
  },
  {
    title: 'Sistemas a Medida',
    description: 'Soluciones personalizadas para optimizar tus procesos y hacer crecer tu negocio.',
    icon: 'monitor',
    tone: 'violet',
  },
  {
    title: 'Aplicaciones Web',
    description: 'Apps accesibles desde cualquier dispositivo, con una experiencia de usuario intuitiva y funcional.',
    icon: 'phone',
    tone: 'blue',
  },
  {
    title: 'Automatizaciones',
    description: 'Integramos y automatizamos tareas repetitivas para que tu equipo se enfoque en lo importante.',
    icon: 'settings',
    tone: 'purple',
  },
]

const values = [
  { title: 'Experiencia', detail: 'y profesionalismo', icon: 'star' },
  { title: 'Comunicación', detail: 'constante', icon: 'chat' },
  { title: 'Tecnología', detail: 'actualizada', icon: 'code' },
  { title: 'Soporte', detail: 'post-lanzamiento', icon: 'support' },
]

const steps = [
  { title: 'Consulta y análisis', detail: 'Conversamos sobre tus objetivos y definimos el mejor enfoque.', icon: 'chat' },
  { title: 'Diseño y planificación', detail: 'Creamos la arquitectura y el diseño para que apruebes antes de desarrollar.', icon: 'pen' },
  { title: 'Desarrollo y pruebas', detail: 'Construimos tu solución con las mejores tecnologías y la probamos en cada etapa.', icon: 'code' },
  { title: 'Entrega y soporte', detail: 'Lanzamos tu proyecto y te acompañamos en todo el proceso.', icon: 'rocket' },
]

const projects = [
  {
    category: 'Página Web',
    title: 'Tienda Online',
    image: 'photo-1556742049-0cfed4f6a45d',
    position: 'center 54%',
  },
  {
    category: 'Sistema a Medida',
    title: 'Gestión Empresarial',
    image: 'photo-1460925895917-afdab827c52f',
    position: 'center',
  },
  {
    category: 'Aplicación Web',
    title: 'App de Reservas',
    image: 'photo-1512941937669-90a1b58e7e9c',
    position: 'center',
  },
  {
    category: 'Automatización',
    title: 'Flujos de Trabajo',
    image: 'photo-1518770660439-4636190af475',
    position: 'center',
  },
]

const testimonials = [
  {
    quote: 'El equipo entendió exactamente lo que necesitábamos. La página web quedó increíble y superó nuestras expectativas. ¡Totalmente recomendados!',
    name: 'Camila Torres',
    role: 'Dueña de tienda online',
    avatar: 'photo-1534528741775-53994a69daeb',
  },
  {
    quote: 'Gracias a su sistema a medida, logramos optimizar nuestros procesos y reducir el tiempo de trabajo en un 60%. Excelente servicio y soporte.',
    name: 'Diego Ramírez',
    role: 'Gerente de operaciones',
    avatar: 'photo-1500648767791-00dcc994a43e',
  },
  {
    quote: 'La automatización de tareas nos ha permitido enfocarnos en lo más importante: nuestros clientes. Profesionales, responsables y siempre disponibles.',
    name: 'Valentina Gómez',
    role: 'Emprendedora',
    avatar: 'photo-1531123897727-8f129e1688ce',
  },
]

const closeMenu = () => {
  menuOpen.value = false
}

const openProjectForm = async () => {
  closeMenu()
  submitMessage.value = ''
  submitError.value = false
  projectDialog.value?.showModal()
  await nextTick()
  projectDialog.value?.querySelector('#prospecto-nombre')?.focus()
}

const closeProjectForm = () => {
  if (!isSubmitting.value) projectDialog.value?.close()
}

const onDialogClose = () => {
  submitMessage.value = ''
  submitError.value = false
}

const onFileChange = (event) => {
  const file = event.target.files?.[0] ?? null
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (file && (file.size > 5 * 1024 * 1024 || !allowedTypes.includes(file.type))) {
    selectedFile.value = null
    event.target.value = ''
    submitError.value = true
    submitMessage.value = 'Adjunta un PDF, JPG, PNG o WebP de hasta 5 MB.'
    return
  }
  selectedFile.value = file
  submitMessage.value = ''
  submitError.value = false
}

const submitProjectForm = async () => {
  if (!projectForm.value?.reportValidity()) return

  isSubmitting.value = true
  submitMessage.value = ''
  submitError.value = false
  const data = new FormData(projectForm.value)

  try {
    const response = await fetch(apiEndpoint, { method: 'POST', body: data })
    let result
    try {
      const responseBody = await response.text()
      result = responseBody ? JSON.parse(responseBody) : null
    } catch {
      if (!response.ok) {
        throw new Error(`El servidor respondió con un error (HTTP ${response.status}). Comprueba que la API Node esté iniciada.`)
      }
      throw new Error('El servidor respondió en un formato no válido. Verifica la configuración de la API.')
    }
    if (!result || typeof result !== 'object') {
      throw new Error('El servidor respondió en un formato no válido. Verifica la configuración de la API.')
    }
    if (!response.ok) throw new Error(result.error || 'No pudimos enviar tu solicitud. Intenta nuevamente.')

    submitError.value = false
    submitMessage.value = result.message || '¡Gracias! Recibimos tu proyecto y pronto nos pondremos en contacto.'
    projectForm.value.reset()
    Object.keys(form).forEach((key) => { form[key] = '' })
    selectedFile.value = null
  } catch (error) {
    submitError.value = true
    submitMessage.value = error instanceof TypeError
      ? 'No pudimos conectar con el servidor. Intenta nuevamente en unos momentos.'
      : error.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main>
    <header class="site-header">
      <div class="site-header-inner page-wrap">
        <a class="brand" href="#inicio" aria-label="MochilaSoft, inicio" @click="closeMenu">
          <img class="brand-logo" src="/mochilasoft-logo.png" alt="MochilaSoft — Ideas que se convierten en software" />
        </a>
        <button class="menu-toggle" type="button" :aria-expanded="menuOpen" :aria-label="menuOpen ? 'Cerrar menú' : 'Abrir menú'" aria-controls="primary-navigation" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
        <nav id="primary-navigation" class="main-nav" :class="{ 'nav-open': menuOpen }" aria-label="Navegación principal">
          <a class="active" href="#inicio" @click="closeMenu">Inicio</a>
          <a href="#servicios" @click="closeMenu">Servicios</a>
          <a href="#portafolio" @click="closeMenu">Portafolio</a>
          <a href="#nosotros" @click="closeMenu">Nosotros</a>
          <a href="#contacto" @click="closeMenu">Contacto</a>
          <button class="button button-primary btn-primary mobile-menu-cta" type="button" @click="openProjectForm">Solicita tu proyecto <span>→</span></button>
        </nav>
        <button class="button button-primary btn-primary header-cta" type="button" @click="openProjectForm">Solicita tu proyecto <span>→</span></button>
      </div>
    </header>
    <section id="inicio" class="hero dark-section">
      <div class="hero-glow hero-glow-one"></div>
      <div class="hero-glow hero-glow-two"></div>
      <span class="section-glow section-glow--a" aria-hidden="true"></span>

      <div class="hero-content page-wrap">
        <div class="hero-copy">
          <p class="eyebrow">Agencia de ingeniería de software</p>
          <h1>Tu idea, nuestra<br />experiencia en <span>código</span></h1>
          <p class="hero-description">Desarrollamos soluciones digitales a medida para hacer crecer tu negocio. Páginas web, sistemas personalizados, aplicaciones web y automatizaciones que te ahorran tiempo y aumentan tu productividad.</p>
          <div class="hero-actions">
            <button class="button button-primary btn-primary" type="button" @click="openProjectForm">Hablemos de tu proyecto <span>→</span></button>
            <div class="trust-note">
              <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 2 29 7v10c0 8-5.6 13.7-13 17C8.6 30.7 3 25 3 17V7l13-5Z" stroke="currentColor" stroke-width="2"/><path d="m10 17 4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Calidad, seguridad<br />y soporte continuo</span>
            </div>
          </div>
        </div>
        <div class="hero-visual" role="group" aria-label="Vista de la solución en computadora y teléfono">
          <div class="ring" aria-hidden="true"></div>
          <img class="hero-computer" src="/computadora-hero.webp" alt="Página web y código en una computadora portátil" fetchpriority="high" />
          <img class="hero-phone" src="/telefono-transparente.webp" alt="Vista móvil de la solución digital" fetchpriority="low" />
          <div class="screen-glow halo"></div>
          <div class="hero-chip"><span class="chip-dot"></span> Tecnología que impulsa tu negocio</div>
        </div>
      </div>
      <a href="#servicios" class="scroll-cue" aria-label="Deslizar a servicios"><span></span></a>
    </section>

    <section id="servicios" class="services-section light-section section-pad">
      <span class="section-glow section-glow--b" aria-hidden="true"></span>
      <div class="page-wrap">
        <div class="section-heading">
          <p class="eyebrow">Nuestros servicios</p>
          <h2>Soluciones digitales a tu medida</h2>
          <p>Trabajamos contigo en cada etapa, desde la idea hasta la implementación,<br class="desktop-break" /> para ofrecerte productos funcionales, escalables y de alto rendimiento.</p>
        </div>
        <div class="service-grid">
          <article v-for="service in services" :key="service.title" class="service-card card">
            <div class="service-icon icon-tile" :class="`tone-${service.tone}`">
              <svg v-if="service.icon === 'globe'" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" stroke="currentColor" stroke-width="1.5"/></svg>
              <svg v-else-if="service.icon === 'monitor'" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 21h8m-4-4v4m-4-12 2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else-if="service.icon === 'phone'" viewBox="0 0 24 24" fill="none"><rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M10 5h4m-3.5 13h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none"><path d="m10 2-.7 2.6a7.8 7.8 0 0 0-1.8 1L5 4.7 3 8.2l2 1.8a8 8 0 0 0 0 2L3 13.8l2 3.5 2.5-.9c.5.4 1.1.8 1.8 1L10 20h4l.7-2.6a7.8 7.8 0 0 0 1.8-1l2.5.9 2-3.5-2-1.8a8 8 0 0 0 0-2l2-1.8-2-3.5-2.5.9a7.8 7.8 0 0 0-1.8-1L14 2h-4Z" transform="translate(1 1)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>
            </div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
            <a href="#contacto" class="card-arrow" :aria-label="`Conoce más sobre ${service.title}`">→</a>
          </article>
        </div>
      </div>
    </section>

    <section id="nosotros" class="why-section dark-section">
      <div class="why-photo" role="img" aria-label="Desarrolladora trabajando en su proyecto de software"></div>
      <div class="why-fade"></div>
      <div class="why-content page-wrap">
        <div class="why-copy">
          <p class="eyebrow">¿Por qué elegirnos?</p>
          <h2>Más que código,<br />creamos <span>soluciones</span></h2>
          <p>Somos un equipo apasionado por la tecnología y el desarrollo de software. Nos enfocamos en entender tus necesidades para ofrecerte soluciones eficientes, seguras y escalables.</p>
          <div class="values-grid">
            <div v-for="value in values" :key="value.title" class="value-item">
              <svg v-if="value.icon === 'star'" viewBox="0 0 24 24" fill="none"><path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1L12 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
              <svg v-else-if="value.icon === 'chat'" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
              <svg v-else-if="value.icon === 'code'" viewBox="0 0 24 24" fill="none"><path d="m8 8-5 4 5 4m8-8 5 4-5 4m-3-11-2 14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none"><path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-2v-6h4M4 13v6h4v-6H4Zm8 8h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>{{ value.title }}<br />{{ value.detail }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="process-section light-section section-pad">
      <div class="page-wrap">
        <div class="section-heading">
          <p class="eyebrow">Nuestro proceso</p>
          <h2>Así convertimos tu idea en realidad</h2>
        </div>
        <div class="steps-grid">
          <article v-for="(step, index) in steps" :key="step.title" class="step-card card">
            <div class="step-top">
              <span class="step-number">{{ index + 1 }}</span>
              <svg v-if="step.icon === 'chat'" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9h8m-8 3h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <svg v-else-if="step.icon === 'pen'" viewBox="0 0 24 24" fill="none"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <svg v-else-if="step.icon === 'code'" viewBox="0 0 24 24" fill="none"><path d="m8 8-5 4 5 4m8-8 5 4-5 4m-3-11-2 14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none"><path d="M5 16.5 3 21l5-2 9.5-9.5-3-3L5 16.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m13.5 8 3 3M14.5 6.5l2-2a2.1 2.1 0 0 1 3 3l-2 2M5 4v3M3.5 5.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.detail }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="portafolio" class="portfolio-section dark-section section-pad">
      <span class="section-glow section-glow--c" aria-hidden="true"></span>
      <div class="page-wrap">
        <div class="section-heading section-heading-dark section-heading-row">
          <div><p class="eyebrow">Proyectos</p><h2>Algunos de nuestros trabajos</h2><p>Cada proyecto es una nueva oportunidad para crear algo increíble.</p></div>
          <a class="button button-outline btn-ghost" href="#contacto">Ver más proyectos <span>→</span></a>
        </div>
        <div class="project-grid">
          <a v-for="project in projects" :key="project.title" class="project-card card" href="#contacto">
            <img :src="`https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=780&q=85`" :alt="`${project.title}, proyecto de ${project.category}`" :style="{ objectPosition: project.position }" loading="lazy" decoding="async" />
            <span class="project-overlay"></span>
            <span class="project-copy"><small>{{ project.category }}</small><strong>{{ project.title }}</strong></span>
            <span class="project-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <section class="testimonials-section light-section section-pad">
      <div class="page-wrap">
        <div class="section-heading">
          <p class="eyebrow">Lo que dicen nuestros clientes</p>
          <h2>Historias de éxito</h2>
        </div>
        <div class="testimonial-grid">
          <article v-for="testimonial in testimonials" :key="testimonial.name" class="testimonial-card card">
            <span class="quote-mark">“</span>
            <p class="quote-text">{{ testimonial.quote }}</p>
            <div class="client">
              <img :src="`https://images.unsplash.com/${testimonial.avatar}?auto=format&fit=crop&w=100&h=100&q=80`" :alt="testimonial.name" loading="lazy" decoding="async" />
              <div><strong>{{ testimonial.name }}</strong><span>{{ testimonial.role }}</span></div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-band dark-section">
      <span class="section-glow section-glow--d" aria-hidden="true"></span>
      <div class="cta-lines"></div>
      <div class="page-wrap cta-content">
        <div class="cta-rocket" aria-hidden="true">🚀</div>
        <div><h2>¿Listo para llevar tu proyecto al siguiente nivel?</h2><p>Cuéntanos tu idea y hagámosla realidad juntos.</p></div>
        <button class="button button-primary btn-primary" type="button" @click="openProjectForm">Contactarnos ahora <span>→</span></button>
      </div>
    </section>

    <footer id="contacto" class="site-footer dark-section">
      <div class="page-wrap footer-content">
        <a class="brand footer-brand" href="#inicio">
          <img class="brand-logo" src="/mochilasoft-logo.png" alt="MochilaSoft — Ideas que se convierten en software" loading="lazy" />
        </a>
        <nav class="footer-nav" aria-label="Navegación del pie de página"><a href="#inicio">Inicio</a><a href="#servicios">Servicios</a><a href="#portafolio">Portafolio</a><a href="#nosotros">Nosotros</a><button type="button" @click="openProjectForm">Contacto</button></nav>
        <div class="social-links" aria-label="Redes sociales"><a href="https://www.instagram.com/mochilasoft/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">◎</a></div>
        <small class="copyright">© 2025 MochilaSoft. Todos los derechos reservados.</small>
      </div>
    </footer>
    <dialog ref="projectDialog" class="project-modal" aria-labelledby="project-modal-title" @close="onDialogClose" @keydown.esc="closeProjectForm" @click.self="closeProjectForm">
      <div class="project-modal-panel">
        <button class="modal-close" type="button" aria-label="Cerrar formulario" @click="closeProjectForm">×</button>
        <p class="eyebrow">Hablemos de tu idea</p>
        <h2 id="project-modal-title">Cuéntanos sobre tu proyecto</h2>
        <p class="modal-intro">Completa tus datos y nuestro equipo se pondrá en contacto contigo.</p>
        <form ref="projectForm" class="prospect-form" enctype="multipart/form-data" @submit.prevent="submitProjectForm">
          <div class="form-grid">
            <label class="form-honey" aria-hidden="true">Website
              <input name="website" tabindex="-1" autocomplete="off" />
            </label>
            <label class="form-field">
              <span>Nombre <span class="required-mark">*</span></span>
              <input id="prospecto-nombre" v-model.trim="form.nombre" name="nombre" autocomplete="given-name" maxlength="100" required />
            </label>
            <label class="form-field">
              <span>Apellido</span>
              <input v-model.trim="form.apellido" name="apellido" autocomplete="family-name" maxlength="100" />
            </label>
            <label class="form-field">
              <span>Email</span>
              <input v-model.trim="form.email" name="email" type="email" autocomplete="email" maxlength="190" />
            </label>
            <label class="form-field">
              <span>Teléfono con código de país <span class="required-mark">*</span></span>
              <input v-model.trim="form.telefono" name="telefono" type="tel" autocomplete="tel" placeholder="+55 48 98878-7190" maxlength="25" pattern="\+[0-9 \(\)\-]{7,24}" title="Incluye el código del país, por ejemplo +55 48 98878-7190" required />
            </label>
            <label class="form-field form-field-wide">
              <span>Nombre del proyecto <span class="required-mark">*</span></span>
              <input v-model.trim="form.nombre_proyecto" name="nombre_proyecto" maxlength="150" required />
            </label>
            <label class="form-field form-field-wide">
              <span>Área de proyecto</span>
              <input v-model.trim="form.nicho" name="nicho" maxlength="150" placeholder="Ej.: comercio, salud, educación" />
            </label>
            <label class="form-field form-field-wide">
              <span>Descripción del proyecto</span>
              <textarea v-model.trim="form.descripcion" name="descripcion" rows="4" maxlength="5000" placeholder="Cuéntanos qué necesitas crear o mejorar."></textarea>
            </label>
            <label class="form-field form-field-wide">
              <span>Adjuntar archivo <span class="field-hint">(opcional, máximo 5 MB)</span></span>
              <input name="archivo" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" @change="onFileChange" />
            </label>
          </div>
          <p v-if="submitMessage" class="form-message" :class="{ 'form-message-error': submitError }" role="status" aria-live="polite">{{ submitMessage }}</p>
          <div class="form-actions">
            <button class="button button-outline btn-ghost modal-cancel" type="button" :disabled="isSubmitting" @click="closeProjectForm">Cancelar</button>
            <button class="button button-primary btn-primary modal-submit" type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Enviando…' : 'Enviar proyecto' }} <span v-if="!isSubmitting">→</span>
            </button>
          </div>
          <p class="required-note"><span class="required-mark">*</span> Campos obligatorios</p>
        </form>
      </div>
    </dialog>
    <a class="whatsapp-float" href="https://wa.me/5548988787190?text=Hola%2C%20quiero%20cotizar%20un%20proyecto%20con%20MochilaSoft." target="_blank" rel="noopener noreferrer" aria-label="Contactar a MochilaSoft por WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.5 0 .14 5.34.14 11.91c0 2.1.55 4.15 1.6 5.96L.04 24l6.3-1.65a11.96 11.96 0 0 0 5.73 1.46h.01c6.58 0 11.94-5.35 11.95-11.92a11.85 11.85 0 0 0-3.5-8.41ZM12.08 21.8a9.93 9.93 0 0 1-5.06-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.47 4.46-9.92 9.94-9.92a9.87 9.87 0 0 1 7.03 2.91 9.84 9.84 0 0 1 2.9 7.03c0 5.47-4.46 9.92-9.95 9.92Zm5.46-7.43c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.28.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.12 4.51.72.31 1.28.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z"/></svg>
    </a>
  </main>
</template>
