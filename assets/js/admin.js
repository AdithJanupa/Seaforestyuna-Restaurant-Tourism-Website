const state = {
  menu: [],
  orders: [],
  notifications: [],
  rooms: [],
  roomBookings: [],
  boats: [],
  boatBookings: [],
  inquiries: [],
  ratings: [],
  content: []
};

const filteredViews = {
  orders: [],
  notifications: [],
  roomBookings: [],
  boatBookings: [],
  inquiries: [],
  ratings: []
};

const pagination = {
  menu: 1,
  orders: 1,
  notifications: 1,
  rooms: 1,
  roomBookings: 1,
  boats: 1,
  boatBookings: 1,
  inquiries: 1,
  ratings: 1
};

const PAGE_SIZE = 6;
const ORDER_STATUSES = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
const ROOM_BOOKING_STATUSES = ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'];
const BOAT_BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
const INQUIRY_STATUSES = ['New', 'In Progress', 'Replied', 'Closed'];
const INQUIRY_TYPES = ['General Inquiry', 'Dining', 'Stay', 'Boat Ride', 'Private Event', 'Website'];
const INQUIRY_SOURCES = ['Contact Page', 'Ratings Page', 'Admin Dashboard', 'Walk-in', 'WhatsApp'];
const RATING_STATUSES = ['Pending', 'Published', 'Hidden'];
const RATING_VISIT_TYPES = ['Dining', 'Stay', 'Boat Ride', 'Website', 'General'];
const RATING_SOURCES = ['Ratings Page', 'Contact Page', 'Admin Dashboard', 'Manual Entry'];
const adminHeaderNotificationState = {
  open: false,
  status: 'idle'
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const truncateText = (value, max = 88) => {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-LK');
};

const formatNotificationTime = (value) => {
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

const formatDateOnly = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-LK');
};

const formatOrderType = (value) => {
  const label = String(value || 'pickup').replace(/-/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const sumBy = (items, accessor) => items.reduce((sum, item) => sum + (Number(accessor(item)) || 0), 0);

const toDateObject = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  let date = null;
  if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
};

const getFirstValidDate = (...values) => {
  for (const value of values) {
    const date = toDateObject(value);
    if (date) return date;
  }
  return null;
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value) || 0);

const formatCompactCurrency = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
  return SF_UTILS.formatCurrency(amount);
};

const getGuestLabel = (record, fallback = 'Guest') =>
  record?.userName || record?.userEmail || record?.userId || record?.name || record?.email || fallback;

const getActivityTarget = (referenceType) => {
  if (referenceType === 'order') return 'orders';
  if (referenceType === 'roomBooking') return 'roomBookings';
  if (referenceType === 'boatBooking') return 'boatBookings';
  if (referenceType === 'inquiry') return 'ratings';
  return 'dashboard';
};

const getActivityKindLabel = (referenceType) => {
  if (referenceType === 'order') return 'Food Order';
  if (referenceType === 'roomBooking') return 'Stay Booking';
  if (referenceType === 'boatBooking') return 'Boat Ride';
  if (referenceType === 'inquiry') return 'Inquiry';
  if (referenceType === 'rating') return 'Rating';
  return 'Activity';
};

const renderEmptyRow = (colspan, label) => `
  <tr>
    <td colspan="${colspan}" class="text-white/55">${escapeHtml(label)}</td>
  </tr>
`;

const renderStatusBadge = (label) => `<span class="badge">${escapeHtml(label || '--')}</span>`;

const renderStars = (value) => {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const stars = Array.from({ length: 5 }, (_, index) => (index < rating ? '&#9733;' : '&#9734;')).join('');
  return `<span class="text-sea-400 whitespace-nowrap tracking-[0.18em]">${stars}</span>`;
};

const renderAdminActions = (type, id) => `
  <button class="text-sea-400 text-sm" data-edit="${type}" data-id="${escapeHtml(id)}">Edit</button>
  <button class="text-red-300 text-sm ml-2" data-delete="${type}" data-id="${escapeHtml(id)}">Delete</button>
`;

const renderRatingAdminActions = (rating) => `
  <button class="text-sea-400 text-sm" data-rating-visibility="${escapeHtml(rating._id)}" data-next-status="${rating.status === 'Hidden' ? 'Published' : 'Hidden'}">
    ${rating.status === 'Hidden' ? 'Show' : 'Hide'}
  </button>
  <button class="text-red-300 text-sm ml-2" data-delete="rating" data-id="${escapeHtml(rating._id)}">Delete</button>
`;

const adminApiFetch = (path, options = {}) => SF_UTILS.apiFetch(path, { ...options, authMode: 'admin' });

const getAdminHeaderNotificationElements = () => ({
  container: document.getElementById('adminHeaderNotifications'),
  toggle: document.getElementById('adminHeaderNotificationToggle'),
  panel: document.getElementById('adminHeaderNotificationPanel'),
  countBadge: document.getElementById('adminHeaderNotificationCount'),
  unreadLabel: document.getElementById('adminHeaderNotificationUnreadCount'),
  list: document.getElementById('adminHeaderNotificationList'),
  refreshBtn: document.getElementById('adminHeaderNotificationRefresh'),
  readAllBtn: document.getElementById('adminHeaderNotificationReadAll')
});

const syncAdminHeaderNotificationBadges = () => {
  const { countBadge, unreadLabel } = getAdminHeaderNotificationElements();
  const unread = state.notifications.filter((notification) => !notification.isRead).length;

  if (countBadge) {
    countBadge.textContent = String(unread);
    countBadge.hidden = unread === 0;
  }

  if (unreadLabel) {
    unreadLabel.textContent = `${unread} unread`;
  }
};

const renderAdminHeaderNotifications = () => {
  const { list, refreshBtn, readAllBtn } = getAdminHeaderNotificationElements();
  if (!list) return;

  syncAdminHeaderNotificationBadges();

  const unread = state.notifications.filter((notification) => !notification.isRead).length;
  if (refreshBtn) refreshBtn.disabled = adminHeaderNotificationState.status === 'loading';
  if (readAllBtn) readAllBtn.disabled = adminHeaderNotificationState.status === 'loading' || unread === 0;

  if (adminHeaderNotificationState.status === 'loading') {
    list.innerHTML = '<div class="nav-notification-panel__message">Loading notifications...</div>';
    return;
  }

  if (adminHeaderNotificationState.status === 'error') {
    list.innerHTML = '<div class="nav-notification-panel__message nav-notification-panel__message--error">Unable to load notifications right now.</div>';
    return;
  }

  if (!state.notifications.length) {
    list.innerHTML = '<div class="nav-notification-panel__message">No notifications yet. New orders, room bookings, and boat bookings will appear here.</div>';
    return;
  }

  list.innerHTML = state.notifications
    .slice(0, 8)
    .map(
      (notification) => `
        <article class="nav-notification-item ${notification.isRead ? 'is-read' : ''}">
          <div class="nav-notification-item__top">
            <span class="nav-notification-item__type">${escapeHtml(notification.referenceType || 'Update')}</span>
            <span class="nav-notification-item__time">${escapeHtml(formatNotificationTime(notification.createdAt || notification.updatedAt))}</span>
          </div>
          <h4 class="nav-notification-item__title">${escapeHtml(notification.title || 'Notification')}</h4>
          <p class="nav-notification-item__copy">${escapeHtml(truncateText(notification.message, 140))}</p>
          <div class="nav-notification-item__foot">
            <span class="nav-notification-item__label">${escapeHtml(notification.referenceLabel || '--')}</span>
            ${
              notification.isRead
                ? '<span class="nav-notification-item__status">Read</span>'
                : `<button type="button" class="nav-notification-item__read" data-admin-header-notification-read="${escapeHtml(
                    notification._id
                  )}">Mark Read</button>`
            }
          </div>
        </article>
      `
    )
    .join('');
};

const setAdminHeaderNotificationsVisible = (isVisible) => {
  const { container } = getAdminHeaderNotificationElements();
  if (container) container.classList.toggle('hidden', !isVisible);
  if (!isVisible) {
    adminHeaderNotificationState.open = false;
    const { panel, toggle } = getAdminHeaderNotificationElements();
    if (panel) {
      panel.classList.add('hidden');
      panel.setAttribute('aria-hidden', 'true');
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
};

const setAdminHeaderNotificationsOpen = (isOpen) => {
  const { panel, toggle } = getAdminHeaderNotificationElements();
  if (!panel || !toggle) return;

  adminHeaderNotificationState.open = isOpen;
  panel.classList.toggle('hidden', !isOpen);
  panel.setAttribute('aria-hidden', String(!isOpen));
  toggle.setAttribute('aria-expanded', String(isOpen));
};

const renderNotificationSurfaces = () => {
  renderDashboardSection();
  renderNotificationsSection();
  renderAdminHeaderNotifications();
};

const paginate = (items, page) => {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { data: items.slice(start, start + PAGE_SIZE), totalPages, page: safePage };
};

const renderPagination = (containerId, key, totalPages, onChange) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const page = pagination[key];
  container.innerHTML = `
    <div class="flex items-center gap-3">
      <button class="btn-outline text-sm" data-page="prev" ${page === 1 ? 'disabled' : ''}>Prev</button>
      <span class="text-sm text-white/70">Page ${page} of ${totalPages}</span>
      <button class="btn-outline text-sm" data-page="next" ${page === totalPages ? 'disabled' : ''}>Next</button>
    </div>
  `;

  container.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.page === 'prev' && pagination[key] > 1) pagination[key] -= 1;
      if (button.dataset.page === 'next' && pagination[key] < totalPages) pagination[key] += 1;
      onChange();
    });
  });
};

const setActiveSection = (id) => {
  document.querySelectorAll('[data-section]').forEach((section) => {
    section.classList.toggle('hidden', section.dataset.section !== id);
  });
  document.querySelectorAll('[data-tab-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tabBtn === id);
  });
};

const initTabs = () => {
  document.querySelectorAll('[data-tab-btn]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.tabBtn));
  });
  setActiveSection('dashboard');
};

const ensureAdmin = async () => {
  try {
    const data = await adminApiFetch('/api/auth/me');
    if (data.user.role !== 'admin') throw new Error('Admin access required');
    document.getElementById('adminGate').classList.add('hidden');
    document.getElementById('adminContent').classList.remove('hidden');
    setAdminHeaderNotificationsVisible(true);
    return true;
  } catch (error) {
    SF_UI.showToast('Admin access required', 'error');
    document.getElementById('adminGate').classList.remove('hidden');
    document.getElementById('adminContent').classList.add('hidden');
    setAdminHeaderNotificationsVisible(false);
    return false;
  }
};

const loadAll = async () => {
  try {
    SF_UI.showLoader();
    adminHeaderNotificationState.status = 'loading';
    renderAdminHeaderNotifications();
    const [menu, orders, notifications, rooms, roomBookings, boats, boatBookings, inquiries, ratings, content] = await Promise.all([
      adminApiFetch('/api/menu'),
      adminApiFetch('/api/orders'),
      adminApiFetch('/api/notifications/admin'),
      adminApiFetch('/api/rooms'),
      adminApiFetch('/api/room-bookings'),
      adminApiFetch('/api/boats'),
      adminApiFetch('/api/boat-bookings'),
      adminApiFetch('/api/inquiries/admin'),
      adminApiFetch('/api/ratings/admin'),
      adminApiFetch('/api/content')
    ]);

    state.menu = menu;
    state.orders = orders;
    state.notifications = notifications;
    state.rooms = rooms;
    state.roomBookings = roomBookings;
    state.boats = boats;
    state.boatBookings = boatBookings;
    state.inquiries = inquiries;
    state.ratings = ratings;
    state.content = content;
    adminHeaderNotificationState.status = 'ready';
    renderAll();
  } catch (error) {
    adminHeaderNotificationState.status = 'error';
    renderAdminHeaderNotifications();
    SF_UI.showToast(error.message || 'Unable to load admin data', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const loadAdminNotifications = async ({ silent = false } = {}) => {
  const { list } = getAdminHeaderNotificationElements();
  if (!list) return;

  adminHeaderNotificationState.status = 'loading';
  renderAdminHeaderNotifications();

  try {
    state.notifications = await adminApiFetch('/api/notifications/admin');
    adminHeaderNotificationState.status = 'ready';
    renderNotificationSurfaces();
  } catch (error) {
    adminHeaderNotificationState.status = 'error';
    renderAdminHeaderNotifications();
    if (!silent) {
      SF_UI.showToast(error.message || 'Unable to load notifications', 'error');
    }
  }
};

const renderDashboardMetricCard = (metric) => {
  const tag = metric.target ? 'button' : 'div';
  const targetAttr = metric.target ? `data-dashboard-target="${escapeHtml(metric.target)}"` : '';
  const typeAttr = metric.target ? 'type="button"' : '';
  const interactiveClass = metric.target ? 'dashboard-kpi-card--interactive' : '';

  return `
    <${tag} class="dashboard-kpi-card ${interactiveClass}" ${targetAttr} ${typeAttr}>
      <span class="dashboard-kpi-card__label">${escapeHtml(metric.label)}</span>
      <span class="dashboard-kpi-card__value">${escapeHtml(metric.value)}</span>
      <span class="dashboard-kpi-card__meta">${escapeHtml(metric.meta)}</span>
    </${tag}>
  `;
};

const renderDashboardBarList = (containerId, items, emptyLabel) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<p class="dashboard-empty">${escapeHtml(emptyLabel)}</p>`;
    return;
  }

  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  container.innerHTML = items
    .map((item) => {
      const value = Number(item.value) || 0;
      const width = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;

      return `
        <div class="dashboard-bar-row">
          <div class="dashboard-bar-row__head">
            <div>
              <p class="dashboard-bar-row__label">${escapeHtml(item.label)}</p>
              <p class="dashboard-bar-row__meta">${escapeHtml(item.meta || '')}</p>
            </div>
            <span class="dashboard-bar-row__value">${escapeHtml(item.valueLabel || formatCompactNumber(value))}</span>
          </div>
          <div class="dashboard-bar-track">
            <span class="dashboard-bar-fill" style="width: ${width}%"></span>
          </div>
        </div>
      `;
    })
    .join('');
};

const renderDashboardWeeklyActivity = () => {
  const container = document.getElementById('dashboardWeeklyActivity');
  if (!container) return;

  const dayFormatter = new Intl.DateTimeFormat('en-LK', { weekday: 'short' });
  const dateFormatter = new Intl.DateTimeFormat('en-LK', { month: 'short', day: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = [
    ...state.orders.map((order) => getFirstValidDate(order.createdAt, order.updatedAt, order.scheduledAt)),
    ...state.roomBookings.map((booking) => getFirstValidDate(booking.createdAt, booking.updatedAt, booking.checkIn)),
    ...state.boatBookings.map((booking) => getFirstValidDate(booking.createdAt, booking.updatedAt, booking.date)),
    ...state.inquiries.map((inquiry) => getFirstValidDate(inquiry.createdAt, inquiry.updatedAt)),
    ...state.ratings.map((rating) => getFirstValidDate(rating.createdAt, rating.updatedAt))
  ].filter(Boolean);

  const series = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    const count = records.filter((recordDate) => {
      const normalized = new Date(recordDate);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime() === date.getTime();
    }).length;

    return {
      day: dayFormatter.format(date),
      date: dateFormatter.format(date),
      value: count
    };
  });

  const maxValue = Math.max(...series.map((entry) => entry.value), 1);

  container.innerHTML = `
    <div class="dashboard-activity-chart__bars">
      ${series
        .map((entry) => {
          const height = entry.value > 0 ? Math.max((entry.value / maxValue) * 100, 8) : 0;
          return `
            <div class="dashboard-activity-bar">
              <span class="dashboard-activity-bar__value">${escapeHtml(String(entry.value))}</span>
              <div class="dashboard-activity-bar__track">
                <span class="dashboard-activity-bar__fill" style="height: ${height}%"></span>
              </div>
              <span class="dashboard-activity-bar__day">${escapeHtml(entry.day)}</span>
              <span class="dashboard-activity-bar__date">${escapeHtml(entry.date)}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
};

const buildDashboardRecentActivities = () => {
  const activities = [
    ...state.notifications.map((notification) => ({
      kind: getActivityKindLabel(notification.referenceType),
      title: notification.title || 'Notification',
      meta: notification.message || 'New activity recorded in the system.',
      time: getFirstValidDate(notification.updatedAt, notification.createdAt),
      target: getActivityTarget(notification.referenceType)
    })),
    ...state.ratings.map((rating) => ({
      kind: 'Rating',
      title: rating.title || `Guest rating from ${getGuestLabel(rating)}`,
      meta: `${getGuestLabel(rating)} rated ${Number(rating.rating) || 0}/5 for ${rating.visitType || 'General'} experience.`,
      time: getFirstValidDate(rating.updatedAt, rating.createdAt),
      target: 'ratings'
    }))
  ]
    .filter((item) => item.time)
    .sort((a, b) => b.time - a.time)
    .slice(0, 8);

  if (activities.length) return activities;

  return [
    ...state.orders.map((order) => ({
      kind: 'Food Order',
      title: order.orderNumber || 'Order placed',
      meta: `${formatOrderType(order.orderType)} booking for ${getGuestLabel(order)} is ${order.status || 'Pending'}.`,
      time: getFirstValidDate(order.updatedAt, order.createdAt, order.scheduledAt),
      target: 'orders'
    })),
    ...state.roomBookings.map((booking) => ({
      kind: 'Stay Booking',
      title: booking.bookingRef || 'Room booking created',
      meta: `${booking.roomName || 'Room'} reserved by ${getGuestLabel(booking)} for ${booking.status || 'Pending'}.`,
      time: getFirstValidDate(booking.updatedAt, booking.createdAt, booking.checkIn),
      target: 'roomBookings'
    })),
    ...state.boatBookings.map((booking) => ({
      kind: 'Boat Ride',
      title: booking.bookingRef || 'Boat booking created',
      meta: `${booking.boatName || 'Boat ride'} reserved by ${getGuestLabel(booking)} for ${booking.status || 'Pending'}.`,
      time: getFirstValidDate(booking.updatedAt, booking.createdAt, booking.date),
      target: 'boatBookings'
    })),
    ...state.inquiries.map((inquiry) => ({
      kind: 'Inquiry',
      title: inquiry.subject || 'Guest inquiry received',
      meta: `${inquiry.name || inquiry.email || 'Guest'} sent a ${inquiry.status || 'New'} inquiry.`,
      time: getFirstValidDate(inquiry.updatedAt, inquiry.createdAt),
      target: 'ratings'
    })),
    ...state.ratings.map((rating) => ({
      kind: 'Rating',
      title: rating.title || `Guest rating from ${getGuestLabel(rating)}`,
      meta: `${getGuestLabel(rating)} rated ${Number(rating.rating) || 0}/5 for ${rating.visitType || 'General'} experience.`,
      time: getFirstValidDate(rating.updatedAt, rating.createdAt),
      target: 'ratings'
    }))
  ]
    .filter((item) => item.time)
    .sort((a, b) => b.time - a.time)
    .slice(0, 8);
};

const renderDashboardRecentActivities = () => {
  const container = document.getElementById('dashboardRecentActivities');
  if (!container) return;

  const activities = buildDashboardRecentActivities();
  if (!activities.length) {
    container.innerHTML = `<p class="dashboard-empty">Recent activities will appear here once orders, bookings, and inquiries start flowing in.</p>`;
    return;
  }

  container.innerHTML = activities
    .map(
      (activity) => `
        <article class="dashboard-activity-item">
          <div class="dashboard-activity-item__top">
            <span class="badge">${escapeHtml(activity.kind)}</span>
            <span class="dashboard-activity-item__time">${escapeHtml(formatDateTime(activity.time))}</span>
          </div>
          <h4 class="dashboard-activity-item__title">${escapeHtml(activity.title)}</h4>
          <p class="dashboard-activity-item__meta">${escapeHtml(truncateText(activity.meta, 120))}</p>
          <button class="dashboard-link-btn" type="button" data-dashboard-target="${escapeHtml(activity.target)}">Open Section</button>
        </article>
      `
    )
    .join('');
};

const renderDashboardQuickLinks = () => {
  const container = document.getElementById('dashboardQuickLinks');
  if (!container) return;

  const quickLinks = [
    {
      label: 'Orders',
      value: `${state.orders.length} total`,
      target: 'orders'
    },
    {
      label: 'Notifications',
      value: `${state.notifications.filter((item) => !item.isRead).length} unread`,
      target: 'notifications'
    },
    {
      label: 'Room Bookings',
      value: `${state.roomBookings.length} reservations`,
      target: 'roomBookings'
    },
    {
      label: 'Boat Bookings',
      value: `${state.boatBookings.length} reservations`,
      target: 'boatBookings'
    },
    {
      label: 'Ratings and Inquiries',
      value: `${state.inquiries.length + state.ratings.length} records`,
      target: 'ratings'
    }
  ];

  container.innerHTML = quickLinks
    .map(
      (link) => `
        <button class="dashboard-quick-link" type="button" data-dashboard-target="${escapeHtml(link.target)}">
          <span class="dashboard-quick-link__label">${escapeHtml(link.label)}</span>
          <span class="dashboard-quick-link__value">${escapeHtml(link.value)}</span>
        </button>
      `
    )
    .join('');
};

const renderDashboardSection = () => {
  const metricsContainer = document.getElementById('dashboardKpis');
  if (!metricsContainer) return;

  const totalRevenue = sumBy(state.orders, (order) => order.total) +
    sumBy(state.roomBookings, (booking) => booking.totalPrice) +
    sumBy(state.boatBookings, (booking) => booking.totalPrice);
  const unreadAlerts = state.notifications.filter((notification) => !notification.isRead).length;
  const openInquiries = state.inquiries.filter((inquiry) => ['New', 'In Progress'].includes(inquiry.status)).length;
  const activeRooms = state.rooms.filter((room) => room.isActive !== false).length;
  const activeBoats = state.boats.filter((boat) => boat.isActive !== false).length;

  const metrics = [
    {
      label: 'Total Revenue',
      value: formatCompactCurrency(totalRevenue),
      meta: 'Combined food, room, and boat earnings',
      target: 'orders'
    },
    {
      label: 'Food Orders',
      value: formatCompactNumber(state.orders.length),
      meta: `${state.orders.filter((order) => !['Completed', 'Cancelled'].includes(order.status)).length} still in progress`,
      target: 'orders'
    },
    {
      label: 'Stay Bookings',
      value: formatCompactNumber(state.roomBookings.length),
      meta: `${activeRooms} active room plans available`,
      target: 'roomBookings'
    },
    {
      label: 'Boat Reservations',
      value: formatCompactNumber(state.boatBookings.length),
      meta: `${activeBoats} active ride plans available`,
      target: 'boatBookings'
    },
    {
      label: 'Unread Alerts',
      value: formatCompactNumber(unreadAlerts),
      meta: 'Admin notifications waiting to be reviewed',
      target: 'notifications'
    },
    {
      label: 'Open Inquiries',
      value: formatCompactNumber(openInquiries),
      meta: 'Guest messages needing a response',
      target: 'ratings'
    }
  ];

  metricsContainer.innerHTML = metrics.map(renderDashboardMetricCard).join('');

  renderDashboardBarList(
    'dashboardRevenueStreams',
    [
      {
        label: 'Food Orders',
        meta: `${state.orders.length} records`,
        value: sumBy(state.orders, (order) => order.total),
        valueLabel: formatCompactCurrency(sumBy(state.orders, (order) => order.total))
      },
      {
        label: 'Room Stays',
        meta: `${state.roomBookings.length} reservations`,
        value: sumBy(state.roomBookings, (booking) => booking.totalPrice),
        valueLabel: formatCompactCurrency(sumBy(state.roomBookings, (booking) => booking.totalPrice))
      },
      {
        label: 'Boat Rides',
        meta: `${state.boatBookings.length} reservations`,
        value: sumBy(state.boatBookings, (booking) => booking.totalPrice),
        valueLabel: formatCompactCurrency(sumBy(state.boatBookings, (booking) => booking.totalPrice))
      }
    ],
    'Revenue data will appear here once paid records are available.'
  );

  renderDashboardBarList(
    'dashboardStatusOverview',
    [
      {
        label: 'Food Orders in Progress',
        meta: 'Pending, accepted, preparing, or ready orders',
        value: state.orders.filter((order) => !['Completed', 'Cancelled'].includes(order.status)).length
      },
      {
        label: 'Active Stay Bookings',
        meta: 'Pending, confirmed, or checked-in stays',
        value: state.roomBookings.filter((booking) => !['Checked-out', 'Cancelled'].includes(booking.status)).length
      },
      {
        label: 'Upcoming Boat Rides',
        meta: 'Pending or confirmed ride reservations',
        value: state.boatBookings.filter((booking) => ['Pending', 'Confirmed'].includes(booking.status)).length
      },
      {
        label: 'Unread Notifications',
        meta: 'Alerts that still need admin review',
        value: unreadAlerts
      },
      {
        label: 'Open Inquiries',
        meta: 'Guest messages waiting for follow-up',
        value: openInquiries
      }
    ],
    'Operational status rows will appear once records are available.'
  );

  renderDashboardWeeklyActivity();
  renderDashboardRecentActivities();
  renderDashboardQuickLinks();
};

const openModal = (title, fields, onSubmit) => {
  const modal = document.getElementById('adminModal');
  const content = document.getElementById('adminModalContent');
  if (!modal || !content) return;

  const renderField = (field) => {
    const requiredAttr = field.required ? 'required' : '';
    const minAttr = field.min !== undefined ? `min="${escapeHtml(field.min)}"` : '';
    const maxAttr = field.max !== undefined ? `max="${escapeHtml(field.max)}"` : '';
    const stepAttr = field.step !== undefined ? `step="${escapeHtml(field.step)}"` : '';
    const placeholderAttr = field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : '';
    const rowsAttr = field.rows !== undefined ? field.rows : 3;

    if (field.type === 'textarea') {
      return `
        <div>
          <label class="text-sm text-white/70">${escapeHtml(field.label)}</label>
          <textarea name="${escapeHtml(field.name)}" class="input-field mt-1" rows="${rowsAttr}" ${requiredAttr} ${placeholderAttr}>${escapeHtml(
            field.value || ''
          )}</textarea>
        </div>
      `;
    }

    if (field.type === 'checkbox') {
      return `
        <label class="flex items-center gap-3 text-sm">
          <input type="checkbox" name="${escapeHtml(field.name)}" ${field.value ? 'checked' : ''} />
          ${escapeHtml(field.label)}
        </label>
      `;
    }

    if (field.type === 'select') {
      const options = (field.options || [])
        .map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return `<option value="${escapeHtml(optionValue)}" ${String(optionValue) === String(field.value) ? 'selected' : ''}>${escapeHtml(
            optionLabel
          )}</option>`;
        })
        .join('');

      return `
        <div>
          <label class="text-sm text-white/70">${escapeHtml(field.label)}</label>
          <select name="${escapeHtml(field.name)}" class="input-field select-field mt-1" ${requiredAttr}>
            ${options}
          </select>
        </div>
      `;
    }

    return `
      <div>
        <label class="text-sm text-white/70">${escapeHtml(field.label)}</label>
        <input
          type="${escapeHtml(field.type || 'text')}"
          name="${escapeHtml(field.name)}"
          class="input-field mt-1"
          value="${escapeHtml(field.value || '')}"
          ${requiredAttr}
          ${minAttr}
          ${maxAttr}
          ${stepAttr}
          ${placeholderAttr}
        />
      </div>
    `;
  };

  const closeModal = () => {
    modal.classList.remove('active');
    content.innerHTML = '';
  };

  content.innerHTML = `
    <h3 class="text-2xl mb-4">${escapeHtml(title)}</h3>
    <form id="adminModalForm" class="space-y-4">
      ${fields.map(renderField).join('')}
      <div class="flex justify-end gap-3">
        <button type="button" class="btn-outline" id="modalCancel">Cancel</button>
        <button type="submit" class="btn-primary">Save</button>
      </div>
    </form>
  `;

  modal.classList.add('active');
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('adminModalForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target).entries());
    fields
      .filter((field) => field.type === 'checkbox')
      .forEach((field) => {
        formData[field.name] = event.target[field.name].checked;
      });
    await onSubmit(formData, closeModal);
  });
};

const renderMenuSection = () => {
  const list = document.getElementById('menuTable');
  const search = document.getElementById('menuSearch');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const filtered = state.menu.filter(
    (item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );
  const { data, totalPages, page } = paginate(filtered, pagination.menu);
  pagination.menu = page;

  list.innerHTML = data.length
    ? data
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.name)}</td>
              <td>${escapeHtml(item.category)}</td>
              <td>${escapeHtml(SF_UTILS.formatCurrency(item.price))}</td>
              <td>${item.isAvailable ? 'Available' : 'Hidden'}</td>
              <td>${renderAdminActions('menu', item._id)}</td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No menu items found.');

  renderPagination('menuPagination', 'menu', totalPages, renderMenuSection);
};

const renderOrdersSection = () => {
  const list = document.getElementById('ordersTable');
  const search = document.getElementById('ordersSearch');
  const filter = document.getElementById('ordersFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';

  let filtered = state.orders.filter((order) => {
    const userLabel = order.userName || order.userEmail || order.userId || '';
    return `${order.orderNumber} ${order.orderType} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((order) => order.status === status);
  filteredViews.orders = filtered;

  const { data, totalPages, page } = paginate(filtered, pagination.orders);
  pagination.orders = page;

  list.innerHTML = data.length
    ? data
        .map(
          (order) => `
            <tr>
              <td>${escapeHtml(order.orderNumber)}</td>
              <td>${escapeHtml(order.userName || order.userEmail || order.userId || 'Guest')}</td>
              <td>${escapeHtml(formatOrderType(order.orderType))}</td>
              <td>${escapeHtml(formatDateTime(order.scheduledAt))}</td>
              <td>
                <select class="input-field" data-status="order" data-id="${escapeHtml(order._id)}">
                  ${ORDER_STATUSES.map(
                    (statusOption) =>
                      `<option value="${statusOption}" ${order.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
                  ).join('')}
                </select>
              </td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No orders found.');

  renderPagination('ordersPagination', 'orders', totalPages, renderOrdersSection);
};

const renderNotificationsSection = () => {
  const list = document.getElementById('notificationsTable');
  const filter = document.getElementById('notificationsFilter');
  const unreadCount = document.getElementById('adminNotificationsUnreadCount');
  const markAll = document.getElementById('notificationsMarkAll');
  if (!list) return;

  const status = filter?.value || 'All';
  let filtered = [...state.notifications];
  if (status === 'Unread') filtered = filtered.filter((notification) => !notification.isRead);
  if (status === 'Read') filtered = filtered.filter((notification) => notification.isRead);
  filteredViews.notifications = filtered;

  const unread = state.notifications.filter((notification) => !notification.isRead).length;
  if (unreadCount) unreadCount.textContent = String(unread);
  if (markAll) markAll.disabled = unread === 0;

  const { data, totalPages, page } = paginate(filtered, pagination.notifications);
  pagination.notifications = page;

  list.innerHTML = data.length
    ? data
        .map(
          (notification) => `
            <tr>
              <td>${escapeHtml(formatDateTime(notification.createdAt))}</td>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-sand-100">${escapeHtml(notification.referenceLabel || '--')}</p>
                  <p class="text-xs text-white/55">${escapeHtml(notification.referenceType || 'notification')}</p>
                </div>
              </td>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-sand-100">${escapeHtml(notification.title || 'Notification')}</p>
                  <p class="text-xs text-white/55">${escapeHtml(truncateText(notification.message, 84))}</p>
                </div>
              </td>
              <td>${renderStatusBadge(notification.isRead ? 'Read' : 'Unread')}</td>
              <td>
                ${
                  notification.isRead
                    ? '<span class="text-white/45 text-sm">Read</span>'
                    : `<button class="text-sea-400 text-sm" data-notification-read="${escapeHtml(notification._id)}">Mark Read</button>`
                }
              </td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No notifications found.');

  renderPagination('notificationsPagination', 'notifications', totalPages, renderNotificationsSection);
};

const renderRoomsSection = () => {
  const list = document.getElementById('roomsTable');
  const search = document.getElementById('roomsSearch');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const filtered = state.rooms.filter((room) => room.name.toLowerCase().includes(query));
  const { data, totalPages, page } = paginate(filtered, pagination.rooms);
  pagination.rooms = page;

  list.innerHTML = data.length
    ? data
        .map(
          (room) => `
            <tr>
              <td>${escapeHtml(room.name)}</td>
              <td>${escapeHtml(`${room.capacity} guests`)}</td>
              <td>${escapeHtml(SF_UTILS.formatCurrency(room.pricePerNight))}</td>
              <td>${room.isActive ? 'Active' : 'Hidden'}</td>
              <td>${renderAdminActions('room', room._id)}</td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No rooms found.');

  renderPagination('roomsPagination', 'rooms', totalPages, renderRoomsSection);
};

const renderRoomBookingsSection = () => {
  const list = document.getElementById('roomBookingsTable');
  const search = document.getElementById('roomBookingsSearch');
  const filter = document.getElementById('roomBookingsFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.roomBookings.filter((booking) => {
    const roomLabel = booking.roomName || '';
    const userLabel = booking.userName || booking.userEmail || booking.userId || '';
    return `${booking.bookingRef} ${roomLabel} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((booking) => booking.status === status);
  filteredViews.roomBookings = filtered;

  const { data, totalPages, page } = paginate(filtered, pagination.roomBookings);
  pagination.roomBookings = page;

  list.innerHTML = data.length
    ? data
        .map(
          (booking) => `
            <tr>
              <td>${escapeHtml(booking.bookingRef)}</td>
              <td>${escapeHtml(booking.roomName || '')}</td>
              <td>${escapeHtml(booking.userName || booking.userEmail || booking.userId || 'Guest')}</td>
              <td>${escapeHtml(`${formatDateOnly(booking.checkIn)} - ${formatDateOnly(booking.checkOut)}`)}</td>
              <td>
                <select class="input-field" data-status="room" data-id="${escapeHtml(booking._id)}">
                  ${ROOM_BOOKING_STATUSES.map(
                    (statusOption) =>
                      `<option value="${statusOption}" ${booking.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
                  ).join('')}
                </select>
              </td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No room bookings found.');

  renderPagination('roomBookingsPagination', 'roomBookings', totalPages, renderRoomBookingsSection);
};

const renderBoatsSection = () => {
  const list = document.getElementById('boatsTable');
  const search = document.getElementById('boatsSearch');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const filtered = state.boats.filter((boat) => boat.name.toLowerCase().includes(query));
  const { data, totalPages, page } = paginate(filtered, pagination.boats);
  pagination.boats = page;

  list.innerHTML = data.length
    ? data
        .map(
          (boat) => `
            <tr>
              <td>${escapeHtml(boat.name)}</td>
              <td>${escapeHtml(`${boat.durationHours} hrs`)}</td>
              <td>${escapeHtml(String(boat.maxCapacity))}</td>
              <td>${escapeHtml(SF_UTILS.formatCurrency(boat.price))}</td>
              <td>${renderAdminActions('boat', boat._id)}</td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No boat rides found.');

  renderPagination('boatsPagination', 'boats', totalPages, renderBoatsSection);
};

const renderBoatBookingsSection = () => {
  const list = document.getElementById('boatBookingsTable');
  const search = document.getElementById('boatBookingsSearch');
  const filter = document.getElementById('boatBookingsFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.boatBookings.filter((booking) => {
    const boatLabel = booking.boatName || '';
    const userLabel = booking.userName || booking.userEmail || booking.userId || '';
    return `${booking.bookingRef} ${boatLabel} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((booking) => booking.status === status);
  filteredViews.boatBookings = filtered;

  const { data, totalPages, page } = paginate(filtered, pagination.boatBookings);
  pagination.boatBookings = page;

  list.innerHTML = data.length
    ? data
        .map(
          (booking) => `
            <tr>
              <td>${escapeHtml(booking.bookingRef)}</td>
              <td>${escapeHtml(booking.boatName || '')}</td>
              <td>${escapeHtml(booking.userName || booking.userEmail || booking.userId || 'Guest')}</td>
              <td>${escapeHtml(`${formatDateOnly(booking.date)} @ ${booking.timeSlot || '--'}`)}</td>
              <td>
                <select class="input-field" data-status="boat" data-id="${escapeHtml(booking._id)}">
                  ${BOAT_BOOKING_STATUSES.map(
                    (statusOption) =>
                      `<option value="${statusOption}" ${booking.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
                  ).join('')}
                </select>
              </td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(5, 'No boat bookings found.');

  renderPagination('boatBookingsPagination', 'boatBookings', totalPages, renderBoatBookingsSection);
};

const renderRatingsSummaryCards = () => {
  const container = document.getElementById('ratingsSummaryCards');
  if (!container) return;

  const publishedRatings = state.ratings.filter((rating) => rating.status === 'Published');
  const averageRating = publishedRatings.length
    ? (publishedRatings.reduce((sum, rating) => sum + (Number(rating.rating) || 0), 0) / publishedRatings.length).toFixed(1)
    : '0.0';
  const featuredRatings = publishedRatings.filter((rating) => rating.isFeatured).length;
  const openInquiries = state.inquiries.filter((inquiry) => ['New', 'In Progress'].includes(inquiry.status)).length;

  container.innerHTML = `
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Average Rating</p>
      <div class="flex items-end justify-between gap-4 mt-3">
        <div>
          <p class="display text-4xl">${escapeHtml(averageRating)}</p>
          <p class="text-white/65 mt-1">${renderStars(Number(averageRating))}</p>
        </div>
        <span class="badge">${publishedRatings.length} live</span>
      </div>
    </div>
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Featured Ratings</p>
      <p class="display text-4xl mt-3">${featuredRatings}</p>
      <p class="text-white/65 mt-2">Highlighted on the guest-facing ratings experience.</p>
    </div>
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Open Inquiries</p>
      <p class="display text-4xl mt-3">${openInquiries}</p>
      <p class="text-white/65 mt-2">Messages still waiting for a reply or follow-up.</p>
    </div>
  `;
};

const renderInquiriesSection = () => {
  const list = document.getElementById('inquiriesTable');
  const search = document.getElementById('inquiriesSearch');
  const filter = document.getElementById('inquiriesFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.inquiries.filter((inquiry) =>
    `${inquiry.name || ''} ${inquiry.email || ''} ${inquiry.subject || ''} ${inquiry.message || ''}`.toLowerCase().includes(query)
  );
  if (status !== 'All') filtered = filtered.filter((inquiry) => inquiry.status === status);
  filteredViews.inquiries = filtered;

  const { data, totalPages, page } = paginate(filtered, pagination.inquiries);
  pagination.inquiries = page;

  list.innerHTML = data.length
    ? data
        .map(
          (inquiry) => `
            <tr>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-sand-100">${escapeHtml(inquiry.name)}</p>
                  <p class="text-xs text-white/55">${escapeHtml(inquiry.email)}</p>
                </div>
              </td>
              <td>${escapeHtml(inquiry.subject)}</td>
              <td>${escapeHtml(inquiry.source || '--')}</td>
              <td>${escapeHtml(truncateText(inquiry.message, 96))}</td>
              <td>${renderStatusBadge(inquiry.status || 'New')}</td>
              <td>${renderAdminActions('inquiry', inquiry._id)}</td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(6, 'No inquiries found.');

  renderPagination('inquiriesPagination', 'inquiries', totalPages, renderInquiriesSection);
};

const renderRatingsSection = () => {
  const list = document.getElementById('ratingsTable');
  const search = document.getElementById('ratingsSearch');
  const filter = document.getElementById('ratingsFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.ratings.filter((rating) =>
    `${rating.name || ''} ${rating.email || ''} ${rating.title || ''} ${rating.visitType || ''} ${rating.message || ''}`
      .toLowerCase()
      .includes(query)
  );
  if (status !== 'All') filtered = filtered.filter((rating) => rating.status === status);
  filteredViews.ratings = filtered;

  const { data, totalPages, page } = paginate(filtered, pagination.ratings);
  pagination.ratings = page;

  list.innerHTML = data.length
    ? data
        .map(
          (rating) => `
            <tr>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-sand-100">${escapeHtml(rating.name)}</p>
                  <p class="text-xs text-white/55">${escapeHtml(rating.email)}</p>
                </div>
              </td>
              <td>
                <div class="space-y-1">
                  <p class="font-semibold text-sand-100">${escapeHtml(rating.title)}</p>
                  <p class="text-xs text-white/55">${escapeHtml(truncateText(rating.message, 78))}</p>
                </div>
              </td>
              <td>
                <div class="space-y-1">
                  <p>${renderStars(rating.rating)}</p>
                  <p class="text-xs text-white/55">${escapeHtml(`${rating.rating || 0}/5 - ${rating.visitType || 'General'}`)}</p>
                </div>
              </td>
              <td>${renderStatusBadge(rating.status || 'Published')}</td>
              <td>${rating.isFeatured ? '<span class="text-sea-400 font-semibold">Featured</span>' : '<span class="text-white/45">No</span>'}</td>
              <td>${renderRatingAdminActions(rating)}</td>
            </tr>
          `
        )
        .join('')
    : renderEmptyRow(6, 'No ratings found.');

  renderPagination('ratingsPagination', 'ratings', totalPages, renderRatingsSection);
};

const renderContentSection = () => {
  const about = state.content.find((block) => block.key === 'about');
  const ratings = state.content.find((block) => block.key === 'ratings') || state.content.find((block) => block.key === 'services');
  const aboutTitle = document.getElementById('aboutTitle');
  const aboutBody = document.getElementById('aboutBody');
  const ratingsTitle = document.getElementById('ratingsTitle');
  const ratingsBody = document.getElementById('ratingsBody');

  if (about) {
    if (aboutTitle) aboutTitle.value = about.title || '';
    if (aboutBody) aboutBody.value = about.body || '';
  }

  if (ratings) {
    if (ratingsTitle) ratingsTitle.value = ratings.title || '';
    if (ratingsBody) ratingsBody.value = ratings.body || '';
  }
};

const renderAll = () => {
  renderDashboardSection();
  renderMenuSection();
  renderOrdersSection();
  renderNotificationsSection();
  renderRoomsSection();
  renderRoomBookingsSection();
  renderBoatsSection();
  renderBoatBookingsSection();
  renderRatingsSummaryCards();
  renderInquiriesSection();
  renderRatingsSection();
  renderContentSection();
  renderAdminHeaderNotifications();
};

const updateStatus = async (basePath, id, status) => {
  try {
    await adminApiFetch(`${basePath}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    SF_UI.showToast('Status updated', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update status', 'error');
  }
};

const updateRatingVisibility = async (id, status) => {
  try {
    SF_UI.showLoader();
    await adminApiFetch(`/api/ratings/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    SF_UI.showToast(status === 'Hidden' ? 'Rating hidden from website' : 'Rating shown on website', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update rating visibility', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const markNotificationRead = async (notificationId) => {
  try {
    await adminApiFetch(`/api/notifications/${notificationId}/read`, {
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
    renderNotificationSurfaces();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update notification', 'error');
  }
};

const markAllNotificationsRead = async () => {
  try {
    await adminApiFetch('/api/notifications/read-all?scope=admin', {
      method: 'PATCH'
    });
    state.notifications = state.notifications.map((notification) => ({
      ...notification,
      isRead: true
    }));
    renderNotificationSurfaces();
    SF_UI.showToast('All notifications marked as read', 'success');
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update notifications', 'error');
  }
};

const downloadReport = async (type) => {
  try {
    if (type === 'orders') return await SF_PDF.downloadOrderReport(filteredViews.orders);
    if (type === 'roomBookings') return await SF_PDF.downloadRoomBookingReport(filteredViews.roomBookings);
    if (type === 'boatBookings') return await SF_PDF.downloadBoatBookingReport(filteredViews.boatBookings);
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to generate PDF report', 'error');
  }
};

const openEdit = (type, id = null) => {
  let item = null;
  if (id) {
    if (type === 'menu') item = state.menu.find((entry) => entry._id === id);
    if (type === 'room') item = state.rooms.find((entry) => entry._id === id);
    if (type === 'boat') item = state.boats.find((entry) => entry._id === id);
    if (type === 'inquiry') item = state.inquiries.find((entry) => entry._id === id);
    if (type === 'rating') item = state.ratings.find((entry) => entry._id === id);
  }

  if (type === 'rating') {
    SF_UI.showToast('Admin can only hide or delete ratings', 'error');
    return;
  }

  if (type === 'menu') {
    openModal(id ? 'Edit Menu Item' : 'Add Menu Item', [
      { name: 'name', label: 'Name', value: item?.name, required: true },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description, required: true, rows: 4 },
      { name: 'price', label: 'Price', type: 'number', value: item?.price, required: true, min: 0, step: '0.01' },
      { name: 'category', label: 'Category', value: item?.category, required: true },
      { name: 'image', label: 'Image URL', value: item?.image },
      { name: 'tags', label: 'Tags (comma)', value: item?.tags?.join(', ') },
      { name: 'isAvailable', label: 'Available', type: 'checkbox', value: item?.isAvailable }
    ], (data, closeModal) => saveEntity(type, id, data, closeModal));
    return;
  }

  if (type === 'room') {
    openModal(id ? 'Edit Room' : 'Add Room', [
      { name: 'name', label: 'Name', value: item?.name, required: true },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description, required: true, rows: 4 },
      { name: 'pricePerNight', label: 'Price Per Night', type: 'number', value: item?.pricePerNight, required: true, min: 0, step: '0.01' },
      { name: 'capacity', label: 'Capacity', type: 'number', value: item?.capacity, required: true, min: 1, step: '1' },
      { name: 'amenities', label: 'Amenities (comma)', value: item?.amenities?.join(', ') },
      { name: 'images', label: 'Image URLs (comma)', value: item?.images?.join(', ') },
      { name: 'isActive', label: 'Active', type: 'checkbox', value: item?.isActive }
    ], (data, closeModal) => saveEntity(type, id, data, closeModal));
    return;
  }

  if (type === 'boat') {
    openModal(id ? 'Edit Boat Ride' : 'Add Boat Ride', [
      { name: 'name', label: 'Name', value: item?.name, required: true },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description, required: true, rows: 4 },
      { name: 'durationHours', label: 'Duration (hours)', type: 'number', value: item?.durationHours, required: true, min: 0.5, step: '0.5' },
      { name: 'maxCapacity', label: 'Max Capacity', type: 'number', value: item?.maxCapacity, required: true, min: 1, step: '1' },
      { name: 'price', label: 'Price per guest', type: 'number', value: item?.price, required: true, min: 0, step: '0.01' },
      { name: 'timeSlots', label: 'Time slots (comma)', value: item?.timeSlots?.join(', ') },
      { name: 'images', label: 'Image URLs (comma)', value: item?.images?.join(', ') },
      { name: 'isActive', label: 'Active', type: 'checkbox', value: item?.isActive }
    ], (data, closeModal) => saveEntity(type, id, data, closeModal));
    return;
  }

  if (type === 'inquiry') {
    openModal(id ? 'Edit Inquiry' : 'Add Inquiry', [
      { name: 'name', label: 'Guest Name', value: item?.name, required: true },
      { name: 'email', label: 'Email', type: 'email', value: item?.email, required: true },
      { name: 'phone', label: 'Phone', type: 'tel', value: item?.phone },
      { name: 'subject', label: 'Subject', value: item?.subject, required: true },
      { name: 'type', label: 'Inquiry Type', type: 'select', value: item?.type || 'General Inquiry', options: INQUIRY_TYPES, required: true },
      { name: 'source', label: 'Source', type: 'select', value: item?.source || 'Admin Dashboard', options: INQUIRY_SOURCES, required: true },
      { name: 'message', label: 'Message', type: 'textarea', value: item?.message, required: true, rows: 5 },
      { name: 'status', label: 'Status', type: 'select', value: item?.status || 'New', options: INQUIRY_STATUSES, required: true }
    ], (data, closeModal) => saveEntity(type, id, data, closeModal));
  }
};

const saveEntity = async (type, id, data, closeModal) => {
  const payload = { ...data };
  if (payload.tags !== undefined) payload.tags = payload.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (payload.amenities !== undefined) payload.amenities = payload.amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean);
  if (payload.images !== undefined) payload.images = payload.images.split(',').map((image) => image.trim()).filter(Boolean);
  if (payload.timeSlots !== undefined) payload.timeSlots = payload.timeSlots.split(',').map((slot) => slot.trim()).filter(Boolean);

  if (payload.price !== undefined && payload.price !== '') payload.price = Number(payload.price);
  if (payload.pricePerNight !== undefined && payload.pricePerNight !== '') payload.pricePerNight = Number(payload.pricePerNight);
  if (payload.capacity !== undefined && payload.capacity !== '') payload.capacity = Number(payload.capacity);
  if (payload.durationHours !== undefined && payload.durationHours !== '') payload.durationHours = Number(payload.durationHours);
  if (payload.maxCapacity !== undefined && payload.maxCapacity !== '') payload.maxCapacity = Number(payload.maxCapacity);
  if (payload.rating !== undefined && payload.rating !== '') payload.rating = Number(payload.rating);

  let endpoint = '';
  if (type === 'menu') endpoint = '/api/menu';
  if (type === 'room') endpoint = '/api/rooms';
  if (type === 'boat') endpoint = '/api/boats';
  if (type === 'inquiry') endpoint = id ? `/api/inquiries/${id}` : '/api/inquiries/admin';

  try {
    SF_UI.showLoader();
    await adminApiFetch(id && ['menu', 'room', 'boat'].includes(type) ? `${endpoint}/${id}` : endpoint, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    if (closeModal) closeModal();
    SF_UI.showToast('Saved successfully', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to save record', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const handleDelete = async (type, id) => {
  if (!confirm('Delete this item?')) return;

  let endpoint = '';
  if (type === 'menu') endpoint = '/api/menu';
  if (type === 'room') endpoint = '/api/rooms';
  if (type === 'boat') endpoint = '/api/boats';
  if (type === 'inquiry') endpoint = '/api/inquiries';
  if (type === 'rating') endpoint = '/api/ratings';

  try {
    SF_UI.showLoader();
    await adminApiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
    SF_UI.showToast('Deleted', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to delete record', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const bindActions = () => {
  const bindIfPresent = (id, eventName, handler) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener(eventName, handler);
  };

  bindIfPresent('menuSearch', 'input', renderMenuSection);
  bindIfPresent('ordersSearch', 'input', renderOrdersSection);
  bindIfPresent('ordersFilter', 'change', renderOrdersSection);
  bindIfPresent('notificationsFilter', 'change', renderNotificationsSection);
  bindIfPresent('notificationsRefresh', 'click', loadAll);
  bindIfPresent('notificationsMarkAll', 'click', markAllNotificationsRead);
  bindIfPresent('dashboardRefresh', 'click', loadAll);
  bindIfPresent('adminHeaderNotificationRefresh', 'click', () => loadAdminNotifications());
  bindIfPresent('adminHeaderNotificationReadAll', 'click', markAllNotificationsRead);
  bindIfPresent('roomsSearch', 'input', renderRoomsSection);
  bindIfPresent('roomBookingsSearch', 'input', renderRoomBookingsSection);
  bindIfPresent('roomBookingsFilter', 'change', renderRoomBookingsSection);
  bindIfPresent('boatsSearch', 'input', renderBoatsSection);
  bindIfPresent('boatBookingsSearch', 'input', renderBoatBookingsSection);
  bindIfPresent('boatBookingsFilter', 'change', renderBoatBookingsSection);
  bindIfPresent('inquiriesSearch', 'input', renderInquiriesSection);
  bindIfPresent('inquiriesFilter', 'change', renderInquiriesSection);
  bindIfPresent('ratingsSearch', 'input', renderRatingsSection);
  bindIfPresent('ratingsFilter', 'change', renderRatingsSection);

  bindIfPresent('ordersReportBtn', 'click', () => downloadReport('orders'));
  bindIfPresent('roomBookingsReportBtn', 'click', () => downloadReport('roomBookings'));
  bindIfPresent('boatBookingsReportBtn', 'click', () => downloadReport('boatBookings'));

  bindIfPresent('menuAdd', 'click', () => openEdit('menu'));
  bindIfPresent('roomsAdd', 'click', () => openEdit('room'));
  bindIfPresent('boatsAdd', 'click', () => openEdit('boat'));
  bindIfPresent('inquiryAdd', 'click', () => openEdit('inquiry'));

  const adminContent = document.getElementById('adminContent');
  if (adminContent) {
    adminContent.addEventListener('click', (event) => {
      const dashboardTrigger = event.target.closest('[data-dashboard-target]');
      const editTrigger = event.target.closest('[data-edit]');
      const deleteTrigger = event.target.closest('[data-delete]');
      const visibilityTrigger = event.target.closest('[data-rating-visibility]');
      const notificationTrigger = event.target.closest('[data-notification-read]');
      const headerNotificationTrigger = event.target.closest('[data-admin-header-notification-read]');

      if (dashboardTrigger) {
        setActiveSection(dashboardTrigger.dataset.dashboardTarget);
      }

      if (editTrigger) {
        openEdit(editTrigger.dataset.edit, editTrigger.dataset.id);
      }

      if (deleteTrigger) {
        handleDelete(deleteTrigger.dataset.delete, deleteTrigger.dataset.id);
      }

      if (visibilityTrigger) {
        updateRatingVisibility(visibilityTrigger.dataset.ratingVisibility, visibilityTrigger.dataset.nextStatus);
      }

      if (notificationTrigger) {
        markNotificationRead(notificationTrigger.dataset.notificationRead);
      }

      if (headerNotificationTrigger) {
        markNotificationRead(headerNotificationTrigger.dataset.adminHeaderNotificationRead);
      }
    });

    adminContent.addEventListener('change', (event) => {
      const target = event.target;
      if (target.dataset.status === 'order') updateStatus('/api/orders', target.dataset.id, target.value);
      if (target.dataset.status === 'room') updateStatus('/api/room-bookings', target.dataset.id, target.value);
      if (target.dataset.status === 'boat') updateStatus('/api/boat-bookings', target.dataset.id, target.value);
    });
  }

  const adminHeaderToggle = document.getElementById('adminHeaderNotificationToggle');
  if (adminHeaderToggle) {
    adminHeaderToggle.addEventListener('click', () => {
      const nextOpen = adminHeaderToggle.getAttribute('aria-expanded') !== 'true';
      setAdminHeaderNotificationsOpen(nextOpen);
      if (nextOpen && adminHeaderNotificationState.status === 'idle') {
        loadAdminNotifications({ silent: true });
      }
    });

    document.addEventListener('click', (event) => {
      const { container, panel } = getAdminHeaderNotificationElements();
      const headerNotificationTrigger = event.target.closest('[data-admin-header-notification-read]');

      if (headerNotificationTrigger) {
        markNotificationRead(headerNotificationTrigger.dataset.adminHeaderNotificationRead);
        return;
      }

      if (!panel || !adminHeaderNotificationState.open) return;
      if (container?.contains(event.target)) return;
      setAdminHeaderNotificationsOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && adminHeaderNotificationState.open) {
        setAdminHeaderNotificationsOpen(false);
      }
    });
  }

  bindIfPresent('contentForm', 'submit', async (event) => {
    event.preventDefault();

    const aboutTitle = document.getElementById('aboutTitle');
    const aboutBody = document.getElementById('aboutBody');
    const ratingsTitle = document.getElementById('ratingsTitle');
    const ratingsBody = document.getElementById('ratingsBody');
    const payload = {
      blocks: [
        {
          key: 'about',
          title: aboutTitle?.value || '',
          body: aboutBody?.value || ''
        },
        {
          key: 'ratings',
          title: ratingsTitle?.value || '',
          body: ratingsBody?.value || ''
        }
      ]
    };

    try {
      SF_UI.showLoader();
      await adminApiFetch('/api/content', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Content updated', 'success');
      await loadAll();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to update content', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const initAdminPage = async () => {
  const logoutBtn = document.getElementById('adminLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        SF_UTILS.clearAdminAuth();
        SF_UI.showToast('Admin session closed', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } catch (error) {
        SF_UI.showToast('Unable to logout', 'error');
      }
    });
  }

  initTabs();
  bindActions();

  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('active');
    });
  }

  const isAdmin = await ensureAdmin();
  if (isAdmin) {
    await loadAll();
  }
};

document.addEventListener('DOMContentLoaded', initAdminPage);
