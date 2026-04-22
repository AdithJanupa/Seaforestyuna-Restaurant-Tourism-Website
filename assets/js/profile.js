(() => {
const PROFILE_STORAGE_KEY = 'sf_profile_details';

const state = {
  notifications: [],
  notificationsStatus: 'idle',
  orders: [],
  ordersStatus: 'idle'
};

const getStoredProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const getProfileExtras = (userId) => {
  if (!userId) return {};
  return getStoredProfiles()[userId] || {};
};

const saveProfileExtras = (userId, details) => {
  if (!userId) return {};

  const profiles = getStoredProfiles();
  profiles[userId] = {
    ...(profiles[userId] || {}),
    ...details
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  return profiles[userId];
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getInitials = (name, email) => {
  const source = (name || email || 'Sea Forest').trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const formatRole = (role) => {
  const value = String(role || 'user').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatUpdatedAt = (value) => {
  if (!value) return 'Last updated: just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last updated: just now';

  return `Last updated: ${new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)}`;
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-LK');
};

const formatOrderType = (value) => {
  const label = String(value || 'pickup').replace(/-/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const getCurrentUser = () => SF_UTILS.getAuth().user;

const syncLocalUser = (updates) => {
  const current = getCurrentUser();
  if (!current) return null;

  const nextUser = {
    ...current,
    ...updates
  };
  localStorage.setItem('sf_user', JSON.stringify(nextUser));
  return nextUser;
};

const populateProfile = () => {
  const user = getCurrentUser();
  if (!user) return;

  const extras = getProfileExtras(user.id);
  const displayName = extras.displayName || user.name || user.email || 'SeaForestuna User';
  const phone = extras.phone || '';
  const location = extras.location || '';
  const bio = extras.bio || '';
  const updatedAt = extras.updatedAt || new Date().toISOString();

  const summaryMap = {
    profileAvatar: getInitials(displayName, user.email),
    profileSummaryName: displayName,
    profileSummaryRole: formatRole(user.role),
    profileSummaryEmail: user.email || '',
    profileSummaryUpdated: formatUpdatedAt(updatedAt),
    profileEmail: user.email || '',
    profileRole: formatRole(user.role),
    profileDisplayName: displayName,
    profilePhone: phone,
    profileLocation: location,
    profileBio: bio
  };

  Object.entries(summaryMap).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (!element) return;

    if ('value' in element) {
      element.value = value;
    } else {
      element.textContent = value;
    }
  });
};

const renderNotifications = () => {
  const list = document.getElementById('profileNotificationsList');
  const unreadCount = document.getElementById('profileNotificationsUnreadCount');
  const markAllBtn = document.getElementById('profileNotificationsReadAll');
  if (!list) return;

  const unread = state.notifications.filter((notification) => !notification.isRead).length;
  if (unreadCount) unreadCount.textContent = String(unread);
  if (markAllBtn) markAllBtn.disabled = unread === 0 || state.notificationsStatus === 'loading';

  if (state.notificationsStatus === 'loading') {
    list.innerHTML = `
      <div class="rounded-[24px] border border-white/10 bg-black/20 p-5 text-white/65">
        Loading your account notifications...
      </div>
    `;
    return;
  }

  if (state.notificationsStatus === 'error') {
    list.innerHTML = `
      <div class="rounded-[24px] border border-red-300/30 bg-black/20 p-5 text-red-200">
        We could not load your notifications right now.
      </div>
    `;
    return;
  }

  if (!state.notifications.length) {
    list.innerHTML = `
      <div class="rounded-[24px] border border-white/10 bg-black/20 p-5 text-white/65">
        No notifications yet. Your order and booking updates will appear here.
      </div>
    `;
    return;
  }

  list.innerHTML = state.notifications
    .map(
      (notification) => `
        <article class="rounded-[24px] border ${notification.isRead ? 'border-white/10' : 'border-sea-400/40'} bg-black/20 p-5">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <span class="badge">${escapeHtml(notification.referenceType || 'Update')}</span>
                <span class="text-xs uppercase tracking-[0.24em] ${notification.isRead ? 'text-white/45' : 'text-sea-400'}">
                  ${notification.isRead ? 'Read' : 'Unread'}
                </span>
              </div>
              <div>
                <h3 class="text-xl text-sand-100">${escapeHtml(notification.title || 'Notification')}</h3>
                <p class="text-white/70 mt-2">${escapeHtml(notification.message || 'No details available.')}</p>
              </div>
              <div class="flex flex-wrap gap-4 text-sm text-white/55">
                <span>${escapeHtml(notification.referenceLabel || '--')}</span>
                <span>${escapeHtml(formatDateTime(notification.createdAt))}</span>
              </div>
            </div>
            ${
              notification.isRead
                ? '<span class="text-sm text-white/45">Read</span>'
                : `<button type="button" class="btn-outline w-full sm:w-auto" data-profile-notification-read="${escapeHtml(
                    notification._id
                  )}">Mark Read</button>`
            }
          </div>
        </article>
      `
    )
    .join('');
};

const renderOrders = () => {
  const list = document.getElementById('profileOrdersList');
  if (!list) return;

  if (state.ordersStatus === 'loading') {
    list.innerHTML = `
      <div class="rounded-[24px] border border-white/10 bg-black/20 p-5 text-white/65">
        Loading your recent food orders...
      </div>
    `;
    return;
  }

  if (state.ordersStatus === 'error') {
    list.innerHTML = `
      <div class="rounded-[24px] border border-red-300/30 bg-black/20 p-5 text-red-200">
        We could not load your order history right now.
      </div>
    `;
    return;
  }

  if (!state.orders.length) {
    list.innerHTML = `
      <div class="rounded-[24px] border border-white/10 bg-black/20 p-5 text-white/65">
        No food orders yet. Place an order from the cart page and it will appear here.
      </div>
    `;
    return;
  }

  list.innerHTML = state.orders
    .map(
      (order) => `
        <article class="rounded-[24px] border border-white/10 bg-black/20 p-5 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <span class="badge">${escapeHtml(order.orderNumber || '--')}</span>
                <span class="text-sm text-white/55">${escapeHtml(order.status || 'Pending')}</span>
              </div>
              <h3 class="text-xl text-sand-100 mt-3">${escapeHtml(formatOrderType(order.orderType))}</h3>
              <p class="text-white/70 mt-2">Scheduled ${escapeHtml(formatDateTime(order.scheduledAt))}</p>
            </div>
            <div class="text-left lg:text-right">
              <p class="text-sm text-white/50 uppercase tracking-[0.24em]">Total</p>
              <p class="display text-3xl mt-2">${escapeHtml(SF_UTILS.formatPrice(order.total))}</p>
            </div>
          </div>
          <div class="space-y-2">
            ${(order.items || [])
              .map(
                (item) => `
                  <div class="flex items-center justify-between gap-4 text-sm text-white/70">
                    <span>${escapeHtml(item.name || 'Menu Item')} x ${escapeHtml(String(Number(item.quantity) || 0))}</span>
                    <span>${escapeHtml(
                      SF_UTILS.formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 0))
                    )}</span>
                  </div>
                `
              )
              .join('')}
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/10">
            <p class="text-sm text-white/55">Placed ${escapeHtml(formatDateTime(order.createdAt))}</p>
            <button type="button" class="btn-outline w-full sm:w-auto" data-order-receipt="${escapeHtml(order._id)}">
              Download Receipt PDF
            </button>
          </div>
        </article>
      `
    )
    .join('');
};

const loadNotifications = async ({ silent = false } = {}) => {
  state.notificationsStatus = 'loading';
  renderNotifications();

  try {
    state.notifications = await SF_UTILS.apiFetch('/api/notifications/my');
    state.notificationsStatus = 'ready';
  } catch (error) {
    state.notifications = [];
    state.notificationsStatus = 'error';
    if (!silent) {
      SF_UI.showToast(error.message || 'Unable to load notifications', 'error');
    }
  }

  renderNotifications();
};

const loadOrders = async ({ silent = false } = {}) => {
  state.ordersStatus = 'loading';
  renderOrders();

  try {
    state.orders = await SF_UTILS.apiFetch('/api/orders/my');
    state.ordersStatus = 'ready';
  } catch (error) {
    state.orders = [];
    state.ordersStatus = 'error';
    if (!silent) {
      SF_UI.showToast(error.message || 'Unable to load orders', 'error');
    }
  }

  renderOrders();
};

const markNotificationRead = async (notificationId) => {
  try {
    await SF_UTILS.apiFetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    state.notifications = state.notifications.map((notification) =>
      notification._id === notificationId
        ? {
            ...notification,
            isRead: true
          }
        : notification
    );
    renderNotifications();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update notification', 'error');
  }
};

const markAllNotificationsRead = async () => {
  try {
    await SF_UTILS.apiFetch('/api/notifications/read-all', {
      method: 'PATCH'
    });
    state.notifications = state.notifications.map((notification) => ({
      ...notification,
      isRead: true
    }));
    renderNotifications();
    SF_UI.showToast('All notifications marked as read', 'success');
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update notifications', 'error');
  }
};

const saveProfile = async (event) => {
  event.preventDefault();

  const user = getCurrentUser();
  const form = document.getElementById('profileForm');
  if (!user || !form) return;

  const formData = new FormData(form);
  const displayName = String(formData.get('displayName') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const bio = String(formData.get('bio') || '').trim();

  if (!displayName) {
    SF_UI.showToast('Display name is required', 'error');
    return;
  }

  try {
    SF_UI.showLoader();

    if (window.SF_FIREBASE && window.SF_FIREBASE.getUser) {
      const firebaseUser = window.SF_FIREBASE.getUser();
      if (firebaseUser && firebaseUser.displayName !== displayName) {
        await firebaseUser.updateProfile({ displayName });
      }
    }

    syncLocalUser({ name: displayName });
    saveProfileExtras(user.id, {
      displayName,
      phone,
      location,
      bio,
      updatedAt: new Date().toISOString()
    });

    populateProfile();
    SF_UI.showToast('Profile saved successfully', 'success');
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to save profile', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const handleLogout = async () => {
  try {
    if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
      await window.SF_FIREBASE.signOut();
    } else {
      SF_UTILS.clearAuth();
    }

    window.location.href = 'auth.html#login';
  } catch (error) {
    SF_UI.showToast('Unable to logout', 'error');
  }
};

const guardProfilePage = async () => {
  if (window.SF_FIREBASE && window.SF_FIREBASE.ready) {
    try {
      await window.SF_FIREBASE.ready();
    } catch (error) {
      // Keep local session fallback if Firebase ready fails.
    }
  }

  if (!getCurrentUser()) {
    window.location.href = 'auth.html#login';
    return false;
  }

  return true;
};

const bindActivityActions = () => {
  const notificationsList = document.getElementById('profileNotificationsList');
  if (notificationsList) {
    notificationsList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-profile-notification-read]');
      if (!button) return;
      markNotificationRead(button.dataset.profileNotificationRead);
    });
  }

  const ordersList = document.getElementById('profileOrdersList');
  if (ordersList) {
    ordersList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-order-receipt]');
      if (!button) return;

      const order = state.orders.find((entry) => entry._id === button.dataset.orderReceipt);
      if (!order) return;

      (async () => {
        try {
          await SF_PDF.downloadOrderReceipt(order);
        } catch (error) {
          SF_UI.showToast(error.message || 'Unable to generate receipt PDF', 'error');
        }
      })();
    });
  }

  const notificationsRefresh = document.getElementById('profileNotificationsRefresh');
  if (notificationsRefresh) {
    notificationsRefresh.addEventListener('click', () => loadNotifications());
  }

  const notificationsReadAll = document.getElementById('profileNotificationsReadAll');
  if (notificationsReadAll) {
    notificationsReadAll.addEventListener('click', markAllNotificationsRead);
  }

  const ordersRefresh = document.getElementById('profileOrdersRefresh');
  if (ordersRefresh) {
    ordersRefresh.addEventListener('click', () => loadOrders());
  }
};

const initProfilePage = async () => {
  SF_UI.injectNavbar();
  SF_UI.injectFooter();
  SF_UI.setActiveNav();
  SF_UI.initMobileMenu();
  SF_UI.initReveal();

  const canViewProfile = await guardProfilePage();
  if (!canViewProfile) return;

  populateProfile();
  renderNotifications();
  renderOrders();

  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', saveProfile);
  }

  const logoutBtn = document.getElementById('profileLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  bindActivityActions();
  await Promise.all([loadNotifications({ silent: true }), loadOrders({ silent: true })]);
};

document.addEventListener('DOMContentLoaded', initProfilePage);
})();
