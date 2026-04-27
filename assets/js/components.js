const injectNavbar = () => {
  const target = document.querySelector('[data-component="navbar"]');
  if (!target) return;

  const currentUser = window.SF_UTILS && typeof SF_UTILS.getAuth === 'function' ? SF_UTILS.getAuth().user : null;
  const isLoggedIn = Boolean(currentUser);
  const notificationAction = isLoggedIn
    ? `
        <button
          class="nav-notification-btn"
          type="button"
          data-nav-notification-toggle
          aria-label="Open notifications"
          aria-controls="navNotificationPanel"
          aria-expanded="false"
        >
          <span class="nav-notification-btn__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M12 3a5 5 0 0 1 5 5v2.1c0 .9.3 1.8.9 2.5l1 1.3A2 2 0 0 1 17.3 17H6.7a2 2 0 0 1-1.6-3.1l1-1.3c.6-.7.9-1.6.9-2.5V8a5 5 0 0 1 5-5Zm0 19a3 3 0 0 1-2.8-2h5.6A3 3 0 0 1 12 22Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="nav-notification-btn__count" data-nav-notification-count hidden>0</span>
        </button>
      `
    : '';
  const profileIcon = `
    <span class="cart-nav-link__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 12c4.4 0 8 2.2 8 5a1 1 0 1 1-2 0c0-1.3-2.4-3-6-3s-6 1.7-6 3a1 1 0 1 1-2 0c0-2.8 3.6-5 8-5Z" fill="currentColor"/>
      </svg>
    </span>
  `;
  const logoutIcon = `
    <span class="cart-nav-link__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d="M15 3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V5H8v14h6v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8Zm1.3 5.3a1 1 0 0 1 1.4 0l3.99 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4l2.3-2.3H11a1 1 0 1 1 0-2h7.6l-2.3-2.3a1 1 0 0 1 0-1.4Z" fill="currentColor"/>
      </svg>
    </span>
  `;
  const desktopAuthAction = isLoggedIn
    ? `
        <a href="profile.html" class="cart-nav-link cart-nav-link--compact" aria-label="Open profile" title="My Profile">${profileIcon}</a>
        <button type="button" class="cart-nav-link cart-nav-link--compact" data-nav-logout aria-label="Logout" title="Logout">${logoutIcon}</button>
      `
    : '<a href="auth.html" class="btn-outline">Login</a>';
  const mobileTopAuthAction = isLoggedIn
    ? `
        <a href="profile.html" class="cart-nav-link cart-nav-link--compact" aria-label="Open profile" title="My Profile">${profileIcon}</a>
        <button type="button" class="cart-nav-link cart-nav-link--compact" data-nav-logout aria-label="Logout" title="Logout">${logoutIcon}</button>
      `
    : '';
  const mobileMenuAuthAction = isLoggedIn
    ? `
        <a href="profile.html" class="cart-nav-link cart-nav-link--menu">
          ${profileIcon}
          <span class="cart-nav-link__label">Profile</span>
        </a>
      `
    : '<a href="auth.html" class="btn-outline">Login</a>';

  target.innerHTML = `
    <nav class="nav-blur fixed top-0 left-0 right-0 z-50">
      <div class="site-nav__inner max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="index.html" class="site-nav__brand flex items-center gap-3">
          <span class="brand-logo-wrap">
            <img src="assets/images/logo.png" alt="SeaForestuna logo" class="brand-logo" />
          </span>
          <div class="site-nav__brand-copy">
            <p class="site-nav__eyebrow text-xs uppercase tracking-[0.3em] text-white/60">SeaForestuna</p>
            <p class="site-nav__title display text-lg">Restaurant Tourism</p>
          </div>
        </a>
        <div class="site-nav__desktop-actions hidden lg:flex items-center gap-6">
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
          ${notificationAction}
          ${desktopAuthAction}
        </div>
        <div class="site-nav__mobile-actions lg:hidden flex items-center gap-3">
          <a href="cart.html" class="cart-nav-link cart-nav-link--compact" aria-label="View cart">
            <span class="cart-nav-link__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M3 5a1 1 0 1 1 0-2h2.2a2 2 0 0 1 1.9 1.4L7.4 6H20a1 1 0 0 1 1 1.2l-1.3 6A2 2 0 0 1 17.8 15H9.2a2 2 0 0 1-1.9-1.4L5.2 6H3Zm5.2 3 1 4h8.6l.9-4H8.2ZM9 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fill="currentColor"/>
              </svg>
            </span>
          </a>
          ${notificationAction}
          ${mobileTopAuthAction}
          <button class="mobile-menu-btn lg:hidden" id="mobileMenuBtn" aria-label="Open menu" aria-controls="mobileMenu" aria-expanded="false">
            <span class="mobile-menu-btn__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5A1 1 0 0 1 4 7Zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z" fill="currentColor"/>
              </svg>
            </span>
            <span class="mobile-menu-btn__label">Menu</span>
          </button>
        </div>
      </div>
      <div id="mobileMenu" class="site-nav__menu hidden lg:hidden px-6 pb-6">
        <div class="site-nav__menu-panel glass-card rounded-2xl p-4 flex flex-col gap-3">
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
      ${
        isLoggedIn
          ? `
            <div class="site-nav__notifications-shell">
              <div class="max-w-7xl mx-auto px-6">
                <div id="navNotificationPanel" class="nav-notification-panel hidden" aria-hidden="true">
                  <div class="nav-notification-panel__head">
                    <div>
                      <p class="nav-notification-panel__eyebrow">Updates</p>
                      <h3 class="nav-notification-panel__title">Notifications</h3>
                    </div>
                    <span class="nav-notification-panel__badge" id="navNotificationUnreadCount">0 unread</span>
                  </div>
                  <div class="nav-notification-panel__actions">
                    <button type="button" class="btn-outline nav-notification-panel__action" id="navNotificationRefresh">Refresh</button>
                    <button type="button" class="btn-primary nav-notification-panel__action" id="navNotificationReadAll">Mark All Read</button>
                  </div>
                  <div id="navNotificationList" class="nav-notification-panel__list"></div>
                </div>
              </div>
            </div>
          `
          : ''
      }
    </nav>
  `;

  initCartNav();
  initNavbarAuthActions();
  initNavbarNotifications({ silent: true });
};

const injectFooter = () => {
  const target = document.querySelector('[data-component="footer"]');
  if (!target) return;

  target.innerHTML = `
    <footer class="site-footer mt-20 border-t border-white/10">
      <div class="site-footer__shell max-w-7xl mx-auto px-6 py-12">
        <div class="site-footer__grid">
          <div class="site-footer__brand">
            <span class="badge site-footer__badge">Coastal Hospitality</span>
            <h3 class="display text-2xl">SeaForestuna</h3>
            <p class="site-footer__copy">A coastal hospitality atlas blending dining, stays, and sea journeys.</p>
          </div>

          <div class="site-footer__links">
            <section class="site-footer__group" aria-labelledby="footerJourneys">
              <h4 id="footerJourneys" class="site-footer__heading">Journeys</h4>
              <ul class="site-footer__list">
                <li><a href="menu.html" class="site-footer__link">Dining</a></li>
                <li><a href="rooms.html" class="site-footer__link">Stay</a></li>
                <li><a href="boat.html" class="site-footer__link">Boat Rides</a></li>
              </ul>
            </section>

            <section class="site-footer__group" aria-labelledby="footerPlan">
              <h4 id="footerPlan" class="site-footer__heading">Plan</h4>
              <ul class="site-footer__list">
                <li><a href="services.html" class="site-footer__link">Ratings</a></li>
                <li><a href="about.html" class="site-footer__link">Our Story</a></li>
                <li><a href="contact.html" class="site-footer__link">Contact</a></li>
              </ul>
            </section>
          </div>

          <section class="site-footer__contact-card" aria-labelledby="footerContact">
            <h4 id="footerContact" class="site-footer__heading">Contact Details</h4>
            <ul class="site-footer__contact-list">
              <li>${SF_CONFIG.SITE.address}</li>
              <li><a href="tel:${SF_CONFIG.SITE.phone.replace(/\\s+/g, '')}" class="site-footer__contact-link">Phone/WhatsApp: ${SF_CONFIG.SITE.phone}</a></li>
              <li>${SF_CONFIG.SITE.hours || ''}</li>
              <li><a href="mailto:${SF_CONFIG.SITE.email}" class="site-footer__contact-link">E-Mail: ${SF_CONFIG.SITE.email}</a></li>
            </ul>
          </section>
        </div>

        <div class="site-footer__bottom">
          <p class="site-footer__bottom-note">(c) 2026 SeaForestuna Restaurant Tourism</p>
        </div>
      </div>
    </footer>
  `;
};

const initMobileMenu = () => {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const setOpen = (isOpen) => {
    menu.classList.toggle('hidden', !isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      setNavbarNotificationsOpen(false);
    }
  };

  btn.addEventListener('click', () => {
    setOpen(menu.classList.contains('hidden'));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      setOpen(false);
    }
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

const navbarNotificationsState = {
  items: [],
  status: 'idle',
  open: false,
  scope: 'user'
};

let navbarNotificationsBound = false;
let navbarAuthBound = false;

const escapeNotificationHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatNavbarNotificationTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-LK', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getNavbarCurrentUser = () =>
  window.SF_UTILS && typeof SF_UTILS.getAuth === 'function' ? SF_UTILS.getAuth().user : null;

const getNavbarNotificationScope = () => (String(getNavbarCurrentUser()?.role || '').toLowerCase() === 'admin' ? 'admin' : 'user');

const getNavbarNotificationEndpoint = () =>
  getNavbarNotificationScope() === 'admin' ? '/api/notifications/admin' : '/api/notifications/my';

const getNavbarNotificationElements = () => ({
  panel: document.getElementById('navNotificationPanel'),
  list: document.getElementById('navNotificationList'),
  unreadLabel: document.getElementById('navNotificationUnreadCount'),
  refreshBtn: document.getElementById('navNotificationRefresh'),
  readAllBtn: document.getElementById('navNotificationReadAll'),
  toggles: document.querySelectorAll('[data-nav-notification-toggle]'),
  countBadges: document.querySelectorAll('[data-nav-notification-count]')
});

const syncNavbarNotificationBadges = () => {
  const { countBadges, unreadLabel } = getNavbarNotificationElements();
  const unread = navbarNotificationsState.items.filter((notification) => !notification.isRead).length;

  countBadges.forEach((badge) => {
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  });

  if (unreadLabel) {
    unreadLabel.textContent = `${unread} unread`;
  }
};

const renderNavbarNotifications = () => {
  const { list, refreshBtn, readAllBtn } = getNavbarNotificationElements();
  if (!list) return;

  syncNavbarNotificationBadges();

  const unread = navbarNotificationsState.items.filter((notification) => !notification.isRead).length;
  if (refreshBtn) refreshBtn.disabled = navbarNotificationsState.status === 'loading';
  if (readAllBtn) readAllBtn.disabled = navbarNotificationsState.status === 'loading' || unread === 0;

  if (navbarNotificationsState.status === 'loading') {
    list.innerHTML = '<div class="nav-notification-panel__message">Loading notifications...</div>';
    return;
  }

  if (navbarNotificationsState.status === 'error') {
    list.innerHTML = '<div class="nav-notification-panel__message nav-notification-panel__message--error">Unable to load notifications right now.</div>';
    return;
  }

  if (!navbarNotificationsState.items.length) {
    list.innerHTML = '<div class="nav-notification-panel__message">No notifications yet. Your updates will appear here.</div>';
    return;
  }

  list.innerHTML = navbarNotificationsState.items
    .slice(0, 8)
    .map(
      (notification) => `
        <article class="nav-notification-item ${notification.isRead ? 'is-read' : ''}">
          <div class="nav-notification-item__top">
            <span class="nav-notification-item__type">${escapeNotificationHtml(notification.referenceType || 'Update')}</span>
            <span class="nav-notification-item__time">${escapeNotificationHtml(formatNavbarNotificationTime(notification.createdAt))}</span>
          </div>
          <h4 class="nav-notification-item__title">${escapeNotificationHtml(notification.title || 'Notification')}</h4>
          <p class="nav-notification-item__copy">${escapeNotificationHtml(notification.message || 'No details available.')}</p>
          <div class="nav-notification-item__foot">
            <span class="nav-notification-item__label">${escapeNotificationHtml(notification.referenceLabel || '--')}</span>
            ${
              notification.isRead
                ? '<span class="nav-notification-item__status">Read</span>'
                : `<button type="button" class="nav-notification-item__read" data-nav-notification-read="${escapeNotificationHtml(
                    notification._id
                  )}">Mark Read</button>`
            }
          </div>
        </article>
      `
    )
    .join('');
};

const loadNavbarNotifications = async ({ silent = false, force = false } = {}) => {
  const user = getNavbarCurrentUser();
  const { panel } = getNavbarNotificationElements();
  if (!user || !panel) return;
  if (navbarNotificationsState.status === 'loading' && !force) return;

  navbarNotificationsState.scope = getNavbarNotificationScope();
  navbarNotificationsState.status = 'loading';
  renderNavbarNotifications();

  try {
    navbarNotificationsState.items = await SF_UTILS.apiFetch(getNavbarNotificationEndpoint());
    navbarNotificationsState.status = 'ready';
  } catch (error) {
    navbarNotificationsState.items = [];
    navbarNotificationsState.status = 'error';
    if (!silent && navbarNotificationsState.open && window.SF_UI && typeof SF_UI.showToast === 'function') {
      SF_UI.showToast(error.message || 'Unable to load notifications', 'error');
    }
  }

  renderNavbarNotifications();
};

const setNavbarNotificationsOpen = (isOpen) => {
  const { panel, toggles } = getNavbarNotificationElements();
  if (!panel) return;

  navbarNotificationsState.open = isOpen;
  panel.classList.toggle('hidden', !isOpen);
  panel.setAttribute('aria-hidden', String(!isOpen));
  toggles.forEach((toggle) => toggle.setAttribute('aria-expanded', String(isOpen)));

  if (isOpen && navbarNotificationsState.status === 'idle') {
    loadNavbarNotifications({ silent: true });
  }
};

const markNavbarNotificationRead = async (notificationId) => {
  try {
    await SF_UTILS.apiFetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });

    navbarNotificationsState.items = navbarNotificationsState.items.map((notification) =>
      notification._id === notificationId
        ? {
            ...notification,
            isRead: true
          }
        : notification
    );

    renderNavbarNotifications();
  } catch (error) {
    if (window.SF_UI && typeof SF_UI.showToast === 'function') {
      SF_UI.showToast(error.message || 'Unable to update notification', 'error');
    }
  }
};

const markAllNavbarNotificationsRead = async () => {
  try {
    const scopeQuery = navbarNotificationsState.scope === 'admin' ? '?scope=admin' : '';
    await SF_UTILS.apiFetch(`/api/notifications/read-all${scopeQuery}`, {
      method: 'PATCH'
    });

    navbarNotificationsState.items = navbarNotificationsState.items.map((notification) => ({
      ...notification,
      isRead: true
    }));

    renderNavbarNotifications();
  } catch (error) {
    if (window.SF_UI && typeof SF_UI.showToast === 'function') {
      SF_UI.showToast(error.message || 'Unable to update notifications', 'error');
    }
  }
};

const initNavbarNotifications = ({ silent = true } = {}) => {
  const { panel } = getNavbarNotificationElements();
  if (!panel) return;

  renderNavbarNotifications();
  loadNavbarNotifications({ silent, force: true });

  if (navbarNotificationsBound) return;
  navbarNotificationsBound = true;

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-nav-notification-toggle]');
    const readButton = event.target.closest('[data-nav-notification-read]');
    const panelEl = document.getElementById('navNotificationPanel');
    const refreshButton = event.target.closest('#navNotificationRefresh');
    const readAllButton = event.target.closest('#navNotificationReadAll');

    if (toggle) {
      event.preventDefault();
      const nextOpen = toggle.getAttribute('aria-expanded') !== 'true';
      const mobileMenu = document.getElementById('mobileMenu');
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      if (nextOpen && mobileMenu && mobileMenuBtn) {
        mobileMenu.classList.add('hidden');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      }
      setNavbarNotificationsOpen(nextOpen);
      return;
    }

    if (readButton) {
      event.preventDefault();
      markNavbarNotificationRead(readButton.dataset.navNotificationRead);
      return;
    }

    if (refreshButton) {
      event.preventDefault();
      loadNavbarNotifications({ force: true });
      return;
    }

    if (readAllButton) {
      event.preventDefault();
      markAllNavbarNotificationsRead();
      return;
    }

    if (panelEl && navbarNotificationsState.open && !panelEl.contains(event.target)) {
      setNavbarNotificationsOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navbarNotificationsState.open) {
      setNavbarNotificationsOpen(false);
    }
  });
};

const handleNavbarLogout = async () => {
  try {
    if (window.SF_FIREBASE && typeof window.SF_FIREBASE.signOut === 'function') {
      await window.SF_FIREBASE.signOut();
    } else if (window.SF_UTILS && typeof SF_UTILS.clearAuth === 'function') {
      SF_UTILS.clearAuth();
    }

    if (window.SF_UTILS && typeof SF_UTILS.clearAdminAuth === 'function') {
      SF_UTILS.clearAdminAuth();
    }

    window.location.href = 'auth.html#login';
  } catch (error) {
    if (window.SF_UI && typeof SF_UI.showToast === 'function') {
      SF_UI.showToast('Unable to logout', 'error');
    }
  }
};

const initNavbarAuthActions = () => {
  if (navbarAuthBound) return;
  navbarAuthBound = true;

  document.addEventListener('click', (event) => {
    const logoutButton = event.target.closest('[data-nav-logout]');
    if (!logoutButton) return;
    event.preventDefault();
    handleNavbarLogout();
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

const createDatePickerButton = () => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'date-picker-field__button';
  button.setAttribute('data-date-picker-trigger', '');
  button.setAttribute('aria-label', 'Open calendar');
  button.setAttribute('title', 'Open calendar');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1h-1v1a1 1 0 1 1-2 0V6H8v1a1 1 0 1 1-2 0V6Z" fill="currentColor"/>
    </svg>
  `;
  return button;
};

const openDatePicker = (input) => {
  if (!input) return;

  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
  } catch (error) {
    // Fall back to focus/click for browsers without showPicker support.
  }

  input.focus();
  input.click();
};

const initDatePickers = (root = document) => {
  const wrappers = root.querySelectorAll ? root.querySelectorAll('.date-picker-field') : [];
  wrappers.forEach((wrapper) => {
    const input = wrapper.querySelector('input[type="date"]');
    if (!input) return;

    let button = wrapper.querySelector('[data-date-picker-trigger]');
    if (!button) {
      button = createDatePickerButton();
      wrapper.appendChild(button);
    }

    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openDatePicker(input);
    });
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

let footerAwareFloatingBound = false;

const syncFloatingControlsOffset = () => {
  const controls = document.getElementById('floatingControls');
  const footer = document.querySelector('.site-footer');
  if (!controls || !footer) return;

  const footerRect = footer.getBoundingClientRect();
  const overlap = Math.max(0, window.innerHeight - footerRect.top + 24);
  const lift = Math.min(overlap, Math.max(footerRect.height - 24, 0));
  controls.style.transform = lift > 0 ? `translateY(-${Math.round(lift)}px)` : 'translateY(0)';
};

const initFooterAwareFloatingControls = () => {
  if (footerAwareFloatingBound) {
    syncFloatingControlsOffset();
    return;
  }

  footerAwareFloatingBound = true;

  const sync = () => syncFloatingControlsOffset();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
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
  initDatePickers,
  initFloatingControls: () => {
    injectFloatingControls();
    initThemeToggle();
    initBackToTop();
    initFooterAwareFloatingControls();
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
