const injectNavbar = () => {
  const target = document.querySelector('[data-component="navbar"]');
  if (!target) return;

  const currentUser = window.SF_UTILS && typeof SF_UTILS.getAuth === 'function' ? SF_UTILS.getAuth().user : null;
  const isLoggedIn = Boolean(currentUser);
  const profileIcon = `
    <span class="cart-nav-link__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c4.4 0 8 2.2 8 5a1 1 0 1 1-2 0c0-1.3-2.4-3-6-3s-6 1.7-6 3a1 1 0 1 1-2 0c0-2.8 3.6-5 8-5Z" fill="currentColor"/>
      </svg>
    </span>
  `;
  const desktopAuthAction = isLoggedIn
    ? `<a href="profile.html" class="cart-nav-link cart-nav-link--compact" aria-label="Open profile" title="My Profile">${profileIcon}</a>`
    : '<a href="auth.html" class="btn-outline">Login</a>';
  const mobileTopAuthAction = isLoggedIn
    ? `<a href="profile.html" class="cart-nav-link cart-nav-link--compact" aria-label="Open profile" title="My Profile">${profileIcon}</a>`
    : '';
  const mobileMenuAuthAction = isLoggedIn ? '' : '<a href="auth.html" class="btn-outline">Login</a>';

  target.innerHTML = `
    <nav class="nav-blur fixed top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-3">
          <span class="brand-logo-wrap">
            <img src="assets/images/logo.png" alt="SeaForestuna logo" class="brand-logo" />
          </span>
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-white/60">SeaForestuna</p>
            <p class="display text-lg">Restaurant Tourism</p>
          </div>
        </a>
        <div class="hidden lg:flex items-center gap-6">
          <a href="index.html" class="nav-link">Home</a>
          <a href="menu.html" class="nav-link">Menu</a>
          <a href="rooms.html" class="nav-link">Rooms</a>
          <a href="boat.html" class="nav-link">Boat Rides</a>
          <a href="about.html" class="nav-link">About</a>
          <a href="services.html" class="nav-link">Ratings</a>
          <a href="contact.html" class="nav-link">Contact</a>
          <a href="cart.html" class="cart-nav-link cart-nav-link--compact" aria-label="View cart">
            <span class="cart-nav-link__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M3 5a1 1 0 1 1 0-2h2.2a2 2 0 0 1 1.9 1.4L7.4 6H20a1 1 0 0 1 1 1.2l-1.3 6A2 2 0 0 1 17.8 15H9.2a2 2 0 0 1-1.9-1.4L5.2 6H3Zm5.2 3 1 4h8.6l.9-4H8.2ZM9 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="currentColor"/>
              </svg>
            </span>
          </a>
          ${desktopAuthAction}
        </div>
        <div class="lg:hidden flex items-center gap-3">
          <a href="cart.html" class="cart-nav-link cart-nav-link--compact" aria-label="View cart">
            <span class="cart-nav-link__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M3 5a1 1 0 1 1 0-2h2.2a2 2 0 0 1 1.9 1.4L7.4 6H20a1 1 0 0 1 1 1.2l-1.3 6A2 2 0 0 1 17.8 15H9.2a2 2 0 0 1-1.9-1.4L5.2 6H3Zm5.2 3 1 4h8.6l.9-4H8.2ZM9 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="currentColor"/>
              </svg>
            </span>
          </a>
          ${mobileTopAuthAction}
          <button class="lg:hidden" id="mobileMenuBtn" aria-label="Open menu">
            <span class="text-sand-100 text-xs uppercase tracking-[0.3em]">Menu</span>
          </button>
        </div>
      </div>
      <div id="mobileMenu" class="hidden lg:hidden px-6 pb-6">
        <div class="glass-card rounded-2xl p-4 flex flex-col gap-3">
          <a href="index.html" class="nav-link">Home</a>
          <a href="menu.html" class="nav-link">Menu</a>
          <a href="rooms.html" class="nav-link">Rooms</a>
          <a href="boat.html" class="nav-link">Boat Rides</a>
          <a href="about.html" class="nav-link">About</a>
          <a href="services.html" class="nav-link">Ratings</a>
          <a href="contact.html" class="nav-link">Contact</a>
          <a href="cart.html" class="cart-nav-link cart-nav-link--menu">
            <span class="cart-nav-link__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M3 5a1 1 0 1 1 0-2h2.2a2 2 0 0 1 1.9 1.4L7.4 6H20a1 1 0 0 1 1 1.2l-1.3 6A2 2 0 0 1 17.8 15H9.2a2 2 0 0 1-1.9-1.4L5.2 6H3Zm5.2 3 1 4h8.6l.9-4H8.2ZM9 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="currentColor"/>
              </svg>
            </span>
            <span class="cart-nav-link__label">Cart</span>
            <span class="cart-nav-link__count" data-cart-count>0</span>
          </a>
          ${mobileMenuAuthAction}
        </div>
      </div>
    </nav>
  `;

  initCartNav();
};

const injectFooter = () => {
  const target = document.querySelector('[data-component="footer"]');
  if (!target) return;

  target.innerHTML = `
    <footer class="mt-20 border-t border-white/10">
      <div class="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <h3 class="display text-2xl mb-3">SeaForestuna</h3>
          <p class="text-sm text-white/70">A coastal hospitality atlas blending dining, stays, and sea journeys.</p>
        </div>
        <div>
          <h4 class="text-white/80 font-semibold mb-3">Journeys</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="menu.html" class="nav-link">Dining</a></li>
            <li><a href="rooms.html" class="nav-link">Stay</a></li>
            <li><a href="boat.html" class="nav-link">Boat Rides</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white/80 font-semibold mb-3">Plan</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="services.html" class="nav-link">Ratings</a></li>
            <li><a href="about.html" class="nav-link">Our Story</a></li>
            <li><a href="contact.html" class="nav-link">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white/80 font-semibold mb-3">Contact Details</h4>
          <ul class="space-y-2 text-sm text-white/70">
            <li>${SF_CONFIG.SITE.address}</li>
            <li>Phone/WhatsApp: ${SF_CONFIG.SITE.phone}</li>
            <li>${SF_CONFIG.SITE.hours || ''}</li>
            <li>E-Mail: ${SF_CONFIG.SITE.email}</li>
          </ul>
        </div>
      </div>
      <div class="text-center text-xs text-white/50 pb-6">(c) 2026 SeaForestuna Restaurant Tourism</div>
    </footer>
  `;
};

const initMobileMenu = () => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
};

let cartNavEventsBound = false;

const syncCartNavCount = () => {
  const count = window.SF_UTILS && typeof SF_UTILS.getCartCount === 'function' ? SF_UTILS.getCartCount() : 0;
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count;
  });
};

const initCartNav = () => {
  syncCartNavCount();

  if (cartNavEventsBound) return;
  cartNavEventsBound = true;

  window.addEventListener('sf:cart-updated', syncCartNavCount);
  window.addEventListener('storage', (event) => {
    if (event.key === 'sf_cart') {
      syncCartNavCount();
    }
  });
};

const setActiveNav = () => {
  const rawPath = window.location.pathname.split('/').pop();
  const path = rawPath || 'index.html';
  document.querySelectorAll('.nav-link, .cart-nav-link').forEach((link) => {
    if (link.getAttribute('href') === path) {
      if (link.classList.contains('cart-nav-link')) {
        link.classList.add('is-active');
      } else {
        link.classList.add('text-sea-400');
      }
    }
  });
};

const initToasts = () => {
  if (document.getElementById('toastContainer')) return;
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'fixed bottom-6 right-6 z-50 space-y-3';
  document.body.appendChild(container);
};

const showToast = (message, type = 'info') => {
  initToasts();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (type === 'success') toast.style.borderColor = 'rgba(200, 164, 106, 0.6)';
  if (type === 'error') toast.style.borderColor = 'rgba(244, 114, 122, 0.6)';
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};

const showLoader = () => {
  let loader = document.getElementById('pageLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'fixed inset-0 flex items-center justify-center bg-black/40 z-50';
    loader.innerHTML = '<div class="glass-card px-6 py-4">Loading...</div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
};

const hideLoader = () => {
  const loader = document.getElementById('pageLoader');
  if (loader) loader.style.display = 'none';
};

const initReveal = () => {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
};

const setBackgroundImages = () => {
  document.querySelectorAll('[data-bg]').forEach((el) => {
    const key = el.getAttribute('data-bg');
    if (SF_CONFIG.IMAGES[key]) {
      el.style.backgroundImage = `url('${SF_CONFIG.IMAGES[key]}')`;
    }
  });
};

const injectFloatingControls = () => {
  if (document.getElementById('floatingControls')) return;
  const container = document.createElement('div');
  container.id = 'floatingControls';
  container.className = 'floating-controls';
  container.innerHTML = `
    <button id="themeToggle" class="floating-btn" type="button" aria-label="Theme: System" title="Theme">
      <span class="floating-icon" data-theme-icon></span>
    </button>
    <button id="backToTop" class="floating-btn back-to-top" type="button" aria-label="Back to top" title="Back to top">
      <span class="floating-icon" data-top-icon></span>
    </button>
  `;
  document.body.appendChild(container);
};

const initThemeToggle = () => {
  const html = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const getStored = () => localStorage.getItem('sf_theme') || 'system';

  const applyTheme = (mode) => {
    const resolved = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
    html.setAttribute('data-theme', resolved);
    html.setAttribute('data-theme-mode', mode);
  };

  const iconMap = {
    system:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6v2h3a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h3v-2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v7h16V7H4Z" fill="currentColor"/></svg>',
    dark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.8 3.2a1 1 0 0 1 .9 1.4 7 7 0 1 0 7.7 9.8 1 1 0 0 1 1.6 1 9 9 0 1 1-10.2-12.2Z" fill="currentColor"/></svg>',
    light:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm6.4 2.6a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 1 1-1.4 1.4l-1.4-1.4a1 1 0 0 1 0-1.4ZM21 11a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1ZM6.2 4.6a1 1 0 0 1 0 1.4L4.8 7.4A1 1 0 0 1 3.4 6l1.4-1.4a1 1 0 0 1 1.4 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm9 6a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1ZM4 13a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1Zm15.4 4.6a1 1 0 0 1 0 1.4l-1.4 1.4a1 1 0 1 1-1.4-1.4l1.4-1.4a1 1 0 0 1 1.4 0ZM6.2 17.6a1 1 0 0 1 1.4 0l1.4 1.4a1 1 0 1 1-1.4 1.4l-1.4-1.4a1 1 0 0 1 0-1.4ZM12 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z" fill="currentColor"/></svg>'
  };

  const updateThemeButton = (mode) => {
    const btn = document.getElementById('themeToggle');
    const iconEl = document.querySelector('[data-theme-icon]');
    if (!btn || !iconEl) return;
    iconEl.innerHTML = iconMap[mode] || iconMap.system;
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    btn.setAttribute('aria-label', `Theme: ${label}`);
    btn.setAttribute('title', `Theme: ${label}`);
  };

  const cycleTheme = () => {
    const order = ['system', 'dark', 'light'];
    const current = getStored();
    const next = order[(order.indexOf(current) + 1) % order.length];
    localStorage.setItem('sf_theme', next);
    applyTheme(next);
    updateThemeButton(next);
  };

  const btn = document.getElementById('themeToggle');
  const stored = getStored();
  if (btn) {
    btn.addEventListener('click', cycleTheme);
  }
  applyTheme(stored);
  updateThemeButton(stored);

  media.addEventListener('change', () => {
    if (getStored() === 'system') {
      applyTheme('system');
      updateThemeButton('system');
    }
  });
};

const initBackToTop = () => {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  const toggle = () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', toggle);
  toggle();

  const icon = document.querySelector('[data-top-icon]');
  if (icon) {
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a1 1 0 0 1 .7.3l6 6a1 1 0 1 1-1.4 1.4L13 8.4V19a1 1 0 1 1-2 0V8.4l-4.3 4.3a1 1 0 1 1-1.4-1.4l6-6A1 1 0 0 1 12 5Z" fill="currentColor"/></svg>';
  }
};

window.SF_UI = {
  injectNavbar,
  injectFooter,
  initMobileMenu,
  setActiveNav,
  showToast,
  showLoader,
  hideLoader,
  initReveal,
  setBackgroundImages,
  initFloatingControls: () => {
    injectFloatingControls();
    initThemeToggle();
    initBackToTop();
  },
  setImageSources: () => {
    document.querySelectorAll('[data-img]').forEach((el) => {
      const key = el.getAttribute('data-img');
      if (SF_CONFIG.IMAGES[key]) {
        el.src = SF_CONFIG.IMAGES[key];
      }
    });
  }
};
