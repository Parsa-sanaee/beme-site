// js/app.js (ES module)

/* =========================
   DOM Elements
   ========================= */
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menu-btn');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');

let sidebarOpen = false;
let chatbotScriptLoaded = false;
let cleanupFocusTrap = null;

/* =========================
   Accessibility: Focus Trap
   ========================= */
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return null;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handle(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

/* =========================
   Sidebar Controls
   ========================= */
function openSidebar() {
  sidebar.classList.add('active');
  overlay.classList.add('active');
  menuBtn.classList.add('active');

  sidebar.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');

  sidebarOpen = true;
  cleanupFocusTrap = trapFocus(sidebar);

  sidebar.querySelector('button')?.focus();
}

function closeSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  menuBtn.classList.remove('active');

  sidebar.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');

  sidebarOpen = false;
  cleanupFocusTrap?.();
  menuBtn.focus();
}

menuBtn.addEventListener('click', () => {
  sidebarOpen ? closeSidebar() : openSidebar();
});
overlay.addEventListener('click', closeSidebar);

window.addEventListener('resize', () => {
  if (window.innerWidth > 1024 && sidebarOpen) closeSidebar();
});

/* =========================
   Theme System (Persisted)
   ========================= */
const THEME_KEY = 'spa_theme_v1';

function applyTheme(theme) {
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 300);

  if (theme === 'light') {
    document.body.setAttribute('data-theme', 'light');
  } else if (theme === 'dark') {
    document.body.removeAttribute('data-theme');
  } else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    prefersLight
      ? document.body.setAttribute('data-theme', 'light')
      : document.body.removeAttribute('data-theme');
  }

  themeToggle.setAttribute(
    'aria-pressed',
    (document.body.getAttribute('data-theme') === 'light').toString()
  );
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);
}

themeToggle.addEventListener('click', () => {
  const cur = localStorage.getItem(THEME_KEY) || 'system';
  const next = cur === 'system' ? 'dark' : cur === 'dark' ? 'light' : 'system';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

initTheme();

window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') {
    applyTheme('system');
  }
});

/* =========================
   SPA Loader
   ========================= */
async function loadSection(section, push = true) {
  section = section.replace(/[^a-z0-9\-_]/gi, '');

  content.innerHTML = `
    <div class="container card">
      <p class="lead">در حال بارگذاری...</p>
    </div>
  `;

  try {
    const res = await fetch(`sections/${section}.html`, { cache: 'no-store' });
    if (!res.ok) throw new Error('404');

    const html = await res.text();
    content.innerHTML = `<div class="container">${html}</div>`;

    if (push) history.pushState({ section }, '', `#${section}`);

    if (section === 'chatbot') {
      await loadChatbot();
    }

    requestAnimationFrame(() => {
      content.querySelectorAll('.card, .chat-container').forEach(el => {
        el.classList.add('fade-in');
        setTimeout(() => el.classList.remove('fade-in'), 800);
      });
    });

  } catch {
    content.innerHTML = `
      <div class="container card">
        <h3>بخش پیدا نشد</h3>
        <p class="small">لطفاً از منو استفاده کنید.</p>
      </div>
    `;
  }
}

/* =========================
   Prefetch (NO projects)
   ========================= */
['about', 'chatbot'].forEach(name => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => fetch(`sections/${name}.html`).catch(() => {}));
  } else {
    fetch(`sections/${name}.html`).catch(() => {});
  }
});

/* =========================
   Menu Navigation
   ========================= */
document.querySelectorAll('.sidebar .menu button').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    loadSection(section);
    closeSidebar();
  });
});

/* =========================
   History Navigation
   ========================= */
window.addEventListener('popstate', e => {
  if (e.state?.section) {
    loadSection(e.state.section, false);
  } else {
    content.innerHTML = `
      <div class="container card">
        <h2>خوش آمدید 👋</h2>
        <p class="lead">برای شروع از منو استفاده کنید.</p>
      </div>
    `;
  }
});

/* Deep link */
document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  if (hash) loadSection(hash, false);
});

/* =========================
   Keyboard Shortcuts
   ========================= */
window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    sidebarOpen ? closeSidebar() : openSidebar();
  }
  if (e.key === 'Escape' && sidebarOpen) closeSidebar();
});

/* =========================
   Chatbot Lazy Loader
   ========================= */
async function loadChatbot() {
  if (chatbotScriptLoaded) return;

  try {
    // منتظر بارگذاری DOM
    await new Promise(resolve => setTimeout(resolve, 100));

    const { initChatbot } = await import('./chatbot.js');

    // بررسی وجود المنت‌های چت
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) {
      console.warn("عنصر chat-box یافت نشد");
      return;
    }

    initChatbot();
    chatbotScriptLoaded = true;
  } catch (error) {
    console.error('خطا در لود چت بات:', error);
  }
}

/* =========================
   Insurance Actions
   ========================= */
document.addEventListener('click', e => {
  if (e.target.classList.contains('buy-btn')) {
    alert('🎉 شما می‌توانید همین حالا این بیمه را خریداری کنید.');
  }
});

/* expose for debug */
window._spa = { loadSection, openSidebar, closeSidebar };
