const state = {
  menu: [],
  orders: [],
  rooms: [],
  roomBookings: [],
  boats: [],
  boatBookings: [],
  content: []
};

const pagination = {
  menu: 1,
  orders: 1,
  rooms: 1,
  roomBookings: 1,
  boats: 1,
  boatBookings: 1
};

const PAGE_SIZE = 6;

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
    const data = await SF_UTILS.apiFetch('/api/auth/me');
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
    const [menu, orders, rooms, roomBookings, boats, boatBookings, content] = await Promise.all([
      SF_UTILS.apiFetch('/api/menu'),
      SF_UTILS.apiFetch('/api/orders'),
      SF_UTILS.apiFetch('/api/rooms'),
      SF_UTILS.apiFetch('/api/room-bookings'),
      SF_UTILS.apiFetch('/api/boats'),
      SF_UTILS.apiFetch('/api/boat-bookings'),
      SF_UTILS.apiFetch('/api/content')
    ]);
    state.menu = menu;
    state.orders = orders;
    state.rooms = rooms;
    state.roomBookings = roomBookings;
    state.boats = boats;
    state.boatBookings = boatBookings;
    state.content = content;
    renderAll();
  } catch (error) {
    SF_UI.showToast(error.message, 'error');
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

  content.innerHTML = `
    <h3 class="text-2xl mb-4">${title}</h3>
    <form id="adminModalForm" class="space-y-4">
      ${fields
        .map((field) => {
          if (field.type === 'textarea') {
            return `
              <div>
                <label class="text-sm text-white/70">${field.label}</label>
                <textarea name="${field.name}" class="input-field mt-1" rows="3">${field.value || ''}</textarea>
              </div>
            `;
          }
          if (field.type === 'checkbox') {
            return `
              <label class="flex items-center gap-3 text-sm">
                <input type="checkbox" name="${field.name}" ${field.value ? 'checked' : ''} />
                ${field.label}
              </label>
            `;
          }
          return `
            <div>
              <label class="text-sm text-white/70">${field.label}</label>
              <input type="${field.type || 'text'}" name="${field.name}" class="input-field mt-1" value="${field.value || ''}" />
            </div>
          `;
        })
        .join('')}
      <div class="flex justify-end gap-3">
        <button type="button" class="btn-outline" id="modalCancel">Cancel</button>
        <button type="submit" class="btn-primary">Save</button>
      </div>
    </form>
  `;

  modal.classList.add('active');
  document.getElementById('modalCancel').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('adminModalForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target).entries());
    fields
      .filter((field) => field.type === 'checkbox')
      .forEach((field) => {
        formData[field.name] = event.target[field.name].checked;
      });
    modal.classList.remove('active');
    onSubmit(formData);
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

const renderContentSection = () => {
  const about = state.content.find((block) => block.key === 'about');
  const services = state.content.find((block) => block.key === 'services');
  if (about) {
    document.getElementById('aboutTitle').value = about.title;
    document.getElementById('aboutBody').value = about.body;
  }
  if (services) {
    document.getElementById('servicesTitle').value = services.title;
    document.getElementById('servicesBody').value = services.body;
  }
};

const renderAll = () => {
  renderMenuSection();
  renderOrdersSection();
  renderRoomsSection();
  renderRoomBookingsSection();
  renderBoatsSection();
  renderBoatBookingsSection();
  renderContentSection();
};

const bindActions = () => {
  document.getElementById('menuSearch').addEventListener('input', () => renderMenuSection());
  document.getElementById('ordersSearch').addEventListener('input', () => renderOrdersSection());
  document.getElementById('ordersFilter').addEventListener('change', () => renderOrdersSection());
  document.getElementById('roomsSearch').addEventListener('input', () => renderRoomsSection());
  document.getElementById('roomBookingsSearch').addEventListener('input', () => renderRoomBookingsSection());
  document.getElementById('roomBookingsFilter').addEventListener('change', () => renderRoomBookingsSection());
  document.getElementById('boatsSearch').addEventListener('input', () => renderBoatsSection());
  document.getElementById('boatBookingsSearch').addEventListener('input', () => renderBoatBookingsSection());
  document.getElementById('boatBookingsFilter').addEventListener('change', () => renderBoatBookingsSection());

  document.getElementById('menuAdd').addEventListener('click', () => openEdit('menu'));
  document.getElementById('roomsAdd').addEventListener('click', () => openEdit('room'));
  document.getElementById('boatsAdd').addEventListener('click', () => openEdit('boat'));

  document.getElementById('adminContent').addEventListener('click', (event) => {
    const target = event.target;
    if (target.dataset.edit) {
      const type = target.dataset.edit;
      const id = target.dataset.id;
      openEdit(type, id);
    }
    if (target.dataset.delete) {
      const type = target.dataset.delete;
      const id = target.dataset.id;
      handleDelete(type, id);
    }
  });

  document.getElementById('adminContent').addEventListener('change', (event) => {
    const target = event.target;
    if (target.dataset.status === 'order') updateStatus('/api/orders', target.dataset.id, target.value);
    if (target.dataset.status === 'room') updateStatus('/api/room-bookings', target.dataset.id, target.value);
    if (target.dataset.status === 'boat') updateStatus('/api/boat-bookings', target.dataset.id, target.value);
  });

  document.getElementById('contentForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      blocks: [
        {
          key: 'about',
          title: document.getElementById('aboutTitle').value,
          body: document.getElementById('aboutBody').value
        },
        {
          key: 'services',
          title: document.getElementById('servicesTitle').value,
          body: document.getElementById('servicesBody').value
        }
      ]
    };
    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch('/api/content', { method: 'PUT', body: JSON.stringify(payload) });
      SF_UI.showToast('Content updated', 'success');
      await loadAll();
    } catch (error) {
      SF_UI.showToast(error.message, 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const updateStatus = async (basePath, id, status) => {
  try {
    await SF_UTILS.apiFetch(`${basePath}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    SF_UI.showToast('Status updated', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message, 'error');
  }
};

const openEdit = (type, id = null) => {
  let item = null;
  if (id) {
    if (type === 'menu') item = state.menu.find((m) => m._id === id);
    if (type === 'room') item = state.rooms.find((m) => m._id === id);
    if (type === 'boat') item = state.boats.find((m) => m._id === id);
  }

  if (type === 'menu') {
    openModal(id ? 'Edit Menu Item' : 'Add Menu Item', [
      { name: 'name', label: 'Name', value: item?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description },
      { name: 'price', label: 'Price', type: 'number', value: item?.price },
      { name: 'category', label: 'Category', value: item?.category },
      { name: 'image', label: 'Image URL', value: item?.image },
      { name: 'tags', label: 'Tags (comma)', value: item?.tags?.join(', ') },
      { name: 'isAvailable', label: 'Available', type: 'checkbox', value: item?.isAvailable }
    ], (data) => saveEntity(type, id, data));
  }

  if (type === 'room') {
    openModal(id ? 'Edit Room' : 'Add Room', [
      { name: 'name', label: 'Name', value: item?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description },
      { name: 'pricePerNight', label: 'Price Per Night', type: 'number', value: item?.pricePerNight },
      { name: 'capacity', label: 'Capacity', type: 'number', value: item?.capacity },
      { name: 'amenities', label: 'Amenities (comma)', value: item?.amenities?.join(', ') },
      { name: 'images', label: 'Image URLs (comma)', value: item?.images?.join(', ') },
      { name: 'isActive', label: 'Active', type: 'checkbox', value: item?.isActive }
    ], (data) => saveEntity(type, id, data));
  }

  if (type === 'boat') {
    openModal(id ? 'Edit Boat Ride' : 'Add Boat Ride', [
      { name: 'name', label: 'Name', value: item?.name },
      { name: 'description', label: 'Description', type: 'textarea', value: item?.description },
      { name: 'durationHours', label: 'Duration (hours)', type: 'number', value: item?.durationHours },
      { name: 'maxCapacity', label: 'Max Capacity', type: 'number', value: item?.maxCapacity },
      { name: 'price', label: 'Price per guest', type: 'number', value: item?.price },
      { name: 'timeSlots', label: 'Time slots (comma)', value: item?.timeSlots?.join(', ') },
      { name: 'images', label: 'Image URLs (comma)', value: item?.images?.join(', ') },
      { name: 'isActive', label: 'Active', type: 'checkbox', value: item?.isActive }
    ], (data) => saveEntity(type, id, data));
  }
};

const saveEntity = async (type, id, data) => {
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

  let endpoint = '';
  if (type === 'menu') endpoint = '/api/menu';
  if (type === 'room') endpoint = '/api/rooms';
  if (type === 'boat') endpoint = '/api/boats';

  try {
    SF_UI.showLoader();
    await SF_UTILS.apiFetch(id ? `${endpoint}/${id}` : endpoint, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    SF_UI.showToast('Saved successfully', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message, 'error');
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

  try {
    SF_UI.showLoader();
    await SF_UTILS.apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
    SF_UI.showToast('Deleted', 'success');
    await loadAll();
  } catch (error) {
    SF_UI.showToast(error.message, 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const initAdminPage = async () => {
  const logoutBtn = document.getElementById('adminLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
          await window.SF_FIREBASE.signOut();
        } else {
          SF_UTILS.clearAuth();
        }
        SF_UI.showToast('Logged out', 'success');
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
