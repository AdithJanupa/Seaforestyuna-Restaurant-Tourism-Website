const state = {
  menu: [],
  orders: [],
  rooms: [],
  roomBookings: [],
  boats: [],
  boatBookings: [],
  inquiries: [],
  ratings: [],
  content: []
};

const pagination = {
  menu: 1,
  orders: 1,
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

const formatDateOnly = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-LK');
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
  setActiveSection('menu');
};

const ensureAdmin = async () => {
  try {
    const data = await adminApiFetch('/api/auth/me');
    if (data.user.role !== 'admin') throw new Error('Admin access required');
    document.getElementById('adminGate').classList.add('hidden');
    document.getElementById('adminContent').classList.remove('hidden');
    return true;
  } catch (error) {
    SF_UI.showToast('Admin access required', 'error');
    document.getElementById('adminGate').classList.remove('hidden');
    document.getElementById('adminContent').classList.add('hidden');
    return false;
  }
};

const loadAll = async () => {
  try {
    SF_UI.showLoader();
    const [menu, orders, rooms, roomBookings, boats, boatBookings, inquiries, ratings, content] = await Promise.all([
      adminApiFetch('/api/menu'),
      adminApiFetch('/api/orders'),
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
    state.rooms = rooms;
    state.roomBookings = roomBookings;
    state.boats = boats;
    state.boatBookings = boatBookings;
    state.inquiries = inquiries;
    state.ratings = ratings;
    state.content = content;
    renderAll();
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to load admin data', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const paginate = (items, page) => {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  return { data: items.slice(start, start + PAGE_SIZE), totalPages, page: safePage };
};

const renderPagination = (containerId, key, totalPages) => {
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

  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.page === 'prev' && pagination[key] > 1) pagination[key] -= 1;
      if (btn.dataset.page === 'next' && pagination[key] < totalPages) pagination[key] += 1;
      renderAll();
    });
  });
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
    (item) =>
      item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)
  );
  const { data, totalPages, page } = paginate(filtered, pagination.menu);
  pagination.menu = page;

  list.innerHTML = data
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${SF_UTILS.formatCurrency(item.price)}</td>
        <td>${item.isAvailable ? 'Available' : 'Hidden'}</td>
        <td>
          <button class="text-sea-400 text-sm" data-edit="menu" data-id="${item._id}">Edit</button>
          <button class="text-red-300 text-sm ml-2" data-delete="menu" data-id="${item._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');

  renderPagination('menuPagination', 'menu', totalPages);
};

const renderOrdersSection = () => {
  const list = document.getElementById('ordersTable');
  const search = document.getElementById('ordersSearch');
  const filter = document.getElementById('ordersFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';

  let filtered = state.orders.filter((order) => {
    const userLabel = order.user?.name || order.userName || order.userEmail || order.userId || '';
    return `${order.orderNumber} ${order.orderType} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((order) => order.status === status);

  const { data, totalPages, page } = paginate(filtered, pagination.orders);
  pagination.orders = page;

  list.innerHTML = data
    .map((order) => {
      const userLabel = order.user?.name || order.userName || order.userEmail || order.userId || 'Guest';
      return `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${userLabel}</td>
        <td>${order.orderType}</td>
        <td>${new Date(order.scheduledAt).toLocaleString()}</td>
        <td>
          <select class="input-field" data-status="order" data-id="${order._id}">
            ${['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled']
              .map((statusOption) =>
                `<option value="${statusOption}" ${order.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
              )
              .join('')}
          </select>
        </td>
      </tr>
    `;
    })
    .join('');

  renderPagination('ordersPagination', 'orders', totalPages);
};

const renderRoomsSection = () => {
  const list = document.getElementById('roomsTable');
  const search = document.getElementById('roomsSearch');
  if (!list) return;
  const query = (search?.value || '').toLowerCase();
  const filtered = state.rooms.filter((room) => room.name.toLowerCase().includes(query));
  const { data, totalPages, page } = paginate(filtered, pagination.rooms);
  pagination.rooms = page;

  list.innerHTML = data
    .map(
      (room) => `
      <tr>
        <td>${room.name}</td>
        <td>${room.capacity} guests</td>
        <td>${SF_UTILS.formatCurrency(room.pricePerNight)}</td>
        <td>${room.isActive ? 'Active' : 'Hidden'}</td>
        <td>
          <button class="text-sea-400 text-sm" data-edit="room" data-id="${room._id}">Edit</button>
          <button class="text-red-300 text-sm ml-2" data-delete="room" data-id="${room._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');

  renderPagination('roomsPagination', 'rooms', totalPages);
};

const renderRoomBookingsSection = () => {
  const list = document.getElementById('roomBookingsTable');
  const search = document.getElementById('roomBookingsSearch');
  const filter = document.getElementById('roomBookingsFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.roomBookings.filter((booking) => {
    const roomLabel = booking.room?.name || booking.roomName || '';
    const userLabel = booking.user?.name || booking.userName || booking.userEmail || booking.userId || '';
    return `${booking.bookingRef} ${roomLabel} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((booking) => booking.status === status);

  const { data, totalPages, page } = paginate(filtered, pagination.roomBookings);
  pagination.roomBookings = page;

  list.innerHTML = data
    .map((booking) => {
      const roomLabel = booking.room?.name || booking.roomName || '';
      const userLabel = booking.user?.name || booking.userName || booking.userEmail || booking.userId || '';
      return `
      <tr>
        <td>${booking.bookingRef}</td>
        <td>${roomLabel}</td>
        <td>${userLabel}</td>
        <td>${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}</td>
        <td>
          <select class="input-field" data-status="room" data-id="${booking._id}">
            ${['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled']
              .map((statusOption) =>
                `<option value="${statusOption}" ${booking.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
              )
              .join('')}
          </select>
        </td>
      </tr>
    `;
    })
    .join('');

  renderPagination('roomBookingsPagination', 'roomBookings', totalPages);
};

const renderBoatsSection = () => {
  const list = document.getElementById('boatsTable');
  const search = document.getElementById('boatsSearch');
  if (!list) return;
  const query = (search?.value || '').toLowerCase();
  const filtered = state.boats.filter((boat) => boat.name.toLowerCase().includes(query));
  const { data, totalPages, page } = paginate(filtered, pagination.boats);
  pagination.boats = page;

  list.innerHTML = data
    .map(
      (boat) => `
      <tr>
        <td>${boat.name}</td>
        <td>${boat.durationHours} hrs</td>
        <td>${boat.maxCapacity}</td>
        <td>${SF_UTILS.formatCurrency(boat.price)}</td>
        <td>
          <button class="text-sea-400 text-sm" data-edit="boat" data-id="${boat._id}">Edit</button>
          <button class="text-red-300 text-sm ml-2" data-delete="boat" data-id="${boat._id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join('');

  renderPagination('boatsPagination', 'boats', totalPages);
};

const renderBoatBookingsSection = () => {
  const list = document.getElementById('boatBookingsTable');
  const search = document.getElementById('boatBookingsSearch');
  const filter = document.getElementById('boatBookingsFilter');
  if (!list) return;

  const query = (search?.value || '').toLowerCase();
  const status = filter?.value || 'All';
  let filtered = state.boatBookings.filter((booking) => {
    const boatLabel = booking.boat?.name || booking.boatName || '';
    const userLabel = booking.user?.name || booking.userName || booking.userEmail || booking.userId || '';
    return `${booking.bookingRef} ${boatLabel} ${userLabel}`.toLowerCase().includes(query);
  });
  if (status !== 'All') filtered = filtered.filter((booking) => booking.status === status);

  const { data, totalPages, page } = paginate(filtered, pagination.boatBookings);
  pagination.boatBookings = page;

  list.innerHTML = data
    .map((booking) => {
      const boatLabel = booking.boat?.name || booking.boatName || '';
      const userLabel = booking.user?.name || booking.userName || booking.userEmail || booking.userId || '';
      return `
      <tr>
        <td>${booking.bookingRef}</td>
        <td>${boatLabel}</td>
        <td>${userLabel}</td>
        <td>${new Date(booking.date).toLocaleDateString()} @ ${booking.timeSlot}</td>
        <td>
          <select class="input-field" data-status="boat" data-id="${booking._id}">
            ${['Pending', 'Confirmed', 'Completed', 'Cancelled']
              .map((statusOption) =>
                `<option value="${statusOption}" ${booking.status === statusOption ? 'selected' : ''}>${statusOption}</option>`
              )
              .join('')}
          </select>
        </td>
      </tr>
    `;
    })
    .join('');

  renderPagination('boatBookingsPagination', 'boatBookings', totalPages);
};

const renderRatingsSummaryCards = () => {
  const container = document.getElementById('ratingsSummaryCards');
  if (!container) return;

  const publishedRatings = state.ratings.filter((rating) => rating.status === 'Published');
  const averageRating = publishedRatings.length
    ? (publishedRatings.reduce((sum, rating) => sum + (Number(rating.rating) || 0), 0) / publishedRatings.length).toFixed(1)
    : '0.0';
  const featuredRatings = publishedRatings.filter((rating) => rating.isFeatured).length;
  const openInquiries = state.inquiries.filter((inquiry) => inquiry.status === 'New' || inquiry.status === 'In Progress').length;

  container.innerHTML = `
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Average Rating</p>
      <div class="flex items-end justify-between gap-4 mt-3">
        <div>
          <p class="display text-4xl">${escapeHtml(averageRating)}</p>
          <p class="text-white/65 mt-1">${renderStars(Number(averageRating))}</p>
        </div>
        <p class="text-sm text-white/55">${escapeHtml(`${publishedRatings.length} published`)}</p>
      </div>
    </div>
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Inquiry Queue</p>
      <p class="display text-4xl mt-3">${escapeHtml(String(openInquiries))}</p>
      <p class="text-white/65 mt-2">Guest inquiries waiting for follow-up or active replies.</p>
    </div>
    <div class="glass-card p-5">
      <p class="text-xs uppercase tracking-[0.26em] text-white/55">Featured Reviews</p>
      <p class="display text-4xl mt-3">${escapeHtml(String(featuredRatings))}</p>
      <p class="text-white/65 mt-2">Published ratings currently highlighted on the public ratings page.</p>
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
    `${inquiry.name || ''} ${inquiry.email || ''} ${inquiry.subject || ''} ${inquiry.type || ''} ${inquiry.source || ''} ${
      inquiry.message || ''
    }`
      .toLowerCase()
      .includes(query)
  );
  if (status !== 'All') filtered = filtered.filter((inquiry) => inquiry.status === status);

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
          <td>
            <div class="space-y-1">
              <p class="font-semibold text-sand-100">${escapeHtml(inquiry.subject)}</p>
              <p class="text-xs text-white/55">${escapeHtml(inquiry.type || 'General Inquiry')}</p>
            </div>
          </td>
          <td>
            <div class="space-y-1">
              <p>${escapeHtml(inquiry.source || 'Contact Page')}</p>
              <p class="text-xs text-white/55">${escapeHtml(formatDateTime(inquiry.updatedAt || inquiry.createdAt))}</p>
            </div>
          </td>
          <td>${escapeHtml(truncateText(inquiry.message, 96))}</td>
          <td>${renderStatusBadge(inquiry.status || 'New')}</td>
          <td>${renderAdminActions('inquiry', inquiry._id)}</td>
        </tr>
      `
        )
        .join('')
    : renderEmptyRow(6, 'No inquiries found.');

  renderPagination('inquiriesPagination', 'inquiries', totalPages);
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
              <p class="text-xs text-white/55">${escapeHtml(`${rating.rating || 0}/5 • ${rating.visitType || 'General'}`)}</p>
            </div>
          </td>
          <td>${renderStatusBadge(rating.status || 'Pending')}</td>
          <td>${rating.isFeatured ? '<span class="text-sea-400 font-semibold">Featured</span>' : '<span class="text-white/45">No</span>'}</td>
          <td>${renderAdminActions('rating', rating._id)}</td>
        </tr>
      `
        )
        .join('')
    : renderEmptyRow(6, 'No ratings found.');

  renderPagination('ratingsPagination', 'ratings', totalPages);
};

const renderRatingsModerationSection = () => {
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

  renderPagination('ratingsPagination', 'ratings', totalPages);
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
  renderMenuSection();
  renderOrdersSection();
  renderRoomsSection();
  renderRoomBookingsSection();
  renderBoatsSection();
  renderBoatBookingsSection();
  renderRatingsSummaryCards();
  renderInquiriesSection();
  renderRatingsModerationSection();
  renderContentSection();
};

const bindActions = () => {
  const bindIfPresent = (id, eventName, handler) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener(eventName, handler);
  };

  bindIfPresent('menuSearch', 'input', () => renderMenuSection());
  bindIfPresent('ordersSearch', 'input', () => renderOrdersSection());
  bindIfPresent('ordersFilter', 'change', () => renderOrdersSection());
  bindIfPresent('roomsSearch', 'input', () => renderRoomsSection());
  bindIfPresent('roomBookingsSearch', 'input', () => renderRoomBookingsSection());
  bindIfPresent('roomBookingsFilter', 'change', () => renderRoomBookingsSection());
  bindIfPresent('boatsSearch', 'input', () => renderBoatsSection());
  bindIfPresent('boatBookingsSearch', 'input', () => renderBoatBookingsSection());
  bindIfPresent('boatBookingsFilter', 'change', () => renderBoatBookingsSection());
  bindIfPresent('inquiriesSearch', 'input', () => renderInquiriesSection());
  bindIfPresent('inquiriesFilter', 'change', () => renderInquiriesSection());
  bindIfPresent('ratingsSearch', 'input', () => renderRatingsModerationSection());
  bindIfPresent('ratingsFilter', 'change', () => renderRatingsModerationSection());

  bindIfPresent('menuAdd', 'click', () => openEdit('menu'));
  bindIfPresent('roomsAdd', 'click', () => openEdit('room'));
  bindIfPresent('boatsAdd', 'click', () => openEdit('boat'));
  bindIfPresent('inquiryAdd', 'click', () => openEdit('inquiry'));
  bindIfPresent('ratingAdd', 'click', () => openEdit('rating'));

  const adminContent = document.getElementById('adminContent');
  if (adminContent) {
    adminContent.addEventListener('click', (event) => {
      const editTrigger = event.target.closest('[data-edit]');
      const deleteTrigger = event.target.closest('[data-delete]');
      const visibilityTrigger = event.target.closest('[data-rating-visibility]');

      if (editTrigger) {
        const type = editTrigger.dataset.edit;
        const id = editTrigger.dataset.id;
        openEdit(type, id);
      }
      if (deleteTrigger) {
        const type = deleteTrigger.dataset.delete;
        const id = deleteTrigger.dataset.id;
        handleDelete(type, id);
      }
      if (visibilityTrigger) {
        updateRatingVisibility(visibilityTrigger.dataset.ratingVisibility, visibilityTrigger.dataset.nextStatus);
      }
    });
  }

  if (adminContent) {
    adminContent.addEventListener('change', (event) => {
      const target = event.target;
      if (target.dataset.status === 'order') updateStatus('/api/orders', target.dataset.id, target.value);
      if (target.dataset.status === 'room') updateStatus('/api/room-bookings', target.dataset.id, target.value);
      if (target.dataset.status === 'boat') updateStatus('/api/boat-bookings', target.dataset.id, target.value);
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
      await adminApiFetch('/api/content', { method: 'PUT', body: JSON.stringify(payload) });
      SF_UI.showToast('Content updated', 'success');
      await loadAll();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to update content', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
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
    SF_UI.showToast(error.message, 'error');
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

const openEdit = (type, id = null) => {
  let item = null;
  if (id) {
    if (type === 'menu') item = state.menu.find((m) => m._id === id);
    if (type === 'room') item = state.rooms.find((m) => m._id === id);
    if (type === 'boat') item = state.boats.find((m) => m._id === id);
    if (type === 'inquiry') item = state.inquiries.find((m) => m._id === id);
    if (type === 'rating') item = state.ratings.find((m) => m._id === id);
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

  if (type === 'rating') {
    openModal(id ? 'Edit Rating' : 'Add Rating', [
      { name: 'name', label: 'Guest Name', value: item?.name, required: true },
      { name: 'email', label: 'Email', type: 'email', value: item?.email, required: true },
      { name: 'title', label: 'Feedback Title', value: item?.title, required: true },
      { name: 'visitType', label: 'Visit Type', type: 'select', value: item?.visitType || 'General', options: RATING_VISIT_TYPES, required: true },
      {
        name: 'rating',
        label: 'Star Rating',
        type: 'select',
        value: String(item?.rating || 5),
        options: [
          { value: '5', label: '5 Stars - Excellent' },
          { value: '4', label: '4 Stars - Very Good' },
          { value: '3', label: '3 Stars - Good' },
          { value: '2', label: '2 Stars - Fair' },
          { value: '1', label: '1 Star - Poor' }
        ],
        required: true
      },
      { name: 'source', label: 'Source', type: 'select', value: item?.source || 'Admin Dashboard', options: RATING_SOURCES, required: true },
      { name: 'message', label: 'Feedback Message', type: 'textarea', value: item?.message, required: true, rows: 5 },
      { name: 'status', label: 'Status', type: 'select', value: item?.status || 'Pending', options: RATING_STATUSES, required: true },
      { name: 'isFeatured', label: 'Feature on Ratings Page', type: 'checkbox', value: item?.isFeatured }
    ], (data, closeModal) => saveEntity(type, id, data, closeModal));
  }
};

const saveEntity = async (type, id, data, closeModal) => {
  const payload = { ...data };
  if (payload.tags !== undefined) payload.tags = payload.tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (payload.amenities !== undefined) payload.amenities = payload.amenities.split(',').map((t) => t.trim()).filter(Boolean);
  if (payload.images !== undefined) payload.images = payload.images.split(',').map((t) => t.trim()).filter(Boolean);
  if (payload.timeSlots !== undefined) payload.timeSlots = payload.timeSlots.split(',').map((t) => t.trim()).filter(Boolean);

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
  if (type === 'rating') endpoint = id ? `/api/ratings/${id}` : '/api/ratings/admin';

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

const initAdminPage = async () => {
  const logoutBtn = document.getElementById('adminLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        SF_UTILS.clearAdminAuth();
        SF_UI.showToast('Admin session closed', 'success');
        setTimeout(() => (window.location.href = 'index.html'), 600);
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
