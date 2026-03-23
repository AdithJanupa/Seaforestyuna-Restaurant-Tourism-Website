let roomData = [];
let selectedRoom = null;
let roomBookings = [];
let roomBookingsStatus = 'idle';

const roomBookingDateFormatter = new Intl.DateTimeFormat('en-LK', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

const ROOM_ACTION_ICONS = {
  view: `
    <svg viewBox="0 0 24 24" role="img">
      <path d="M12 5c4.8 0 8.8 2.8 10.5 7-1.7 4.2-5.7 7-10.5 7S3.2 16.2 1.5 12C3.2 7.8 7.2 5 12 5Zm0 2C8.4 7 5.3 9 3.7 12c1.6 3 4.7 5 8.3 5s6.7-2 8.3-5C18.7 9 15.6 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" fill="currentColor"/>
    </svg>
  `,
  edit: `
    <svg viewBox="0 0 24 24" role="img">
      <path d="M15.2 3.2a2.8 2.8 0 0 1 4 4L9.7 16.7 5 18l1.3-4.7L15.2 3.2Zm1.4 1.4-8.9 8.9-.5 1.9 1.9-.5 8.9-8.9a.8.8 0 1 0-1.4-1.4ZM4 5a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H6v12h12v-4a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" fill="currentColor"/>
    </svg>
  `,
  delete: `
    <svg viewBox="0 0 24 24" role="img">
      <path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h.6l.8 11.1A2 2 0 0 0 8.4 20h7.2a2 2 0 0 0 2-1.9L18.4 7H19a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm5 2h-4v1h4V5Zm-5.4 3 .7 10h5.4l.7-10H8.6Z" fill="currentColor"/>
    </svg>
  `
};

const isRoomBookingEditable = (booking) => !['Checked-in', 'Checked-out', 'Cancelled'].includes(String(booking?.status || ''));

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatRoomBookingDate = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return roomBookingDateFormatter.format(date);
};

const updateBookedRoomsCount = () => {
  const count = roomBookings.length;
  const countEl = document.getElementById('bookedRoomsCount');
  if (countEl) countEl.textContent = String(count);
};

const updateBookedRoomsToolbarState = () => {
  const refreshBtn = document.getElementById('bookedRoomsRefresh');
  const printBtn = document.getElementById('bookedRoomsPrint');
  const exportBtn = document.getElementById('bookedRoomsExport');
  const hasRows = roomBookingsStatus === 'ready' && roomBookings.length > 0;

  if (refreshBtn) refreshBtn.disabled = roomBookingsStatus === 'loading';
  if (printBtn) printBtn.disabled = !hasRows;
  if (exportBtn) exportBtn.disabled = !hasRows;
};

const setBookedRoomsOpen = (isOpen) => {
  const toggle = document.getElementById('bookedRoomsToggle');
  const label = document.getElementById('bookedRoomsToggleLabel');
  const panel = document.getElementById('bookedRoomsPanel');

  if (!toggle || !label || !panel) return;

  toggle.setAttribute('aria-expanded', String(isOpen));
  label.textContent = isOpen ? 'Hide Booked Rooms' : 'View Booked Rooms';
  panel.setAttribute('aria-hidden', String(!isOpen));
  panel.classList.toggle('is-open', isOpen);

  if (isOpen) {
    setTimeout(() => {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
};

const getBookingModalElements = () => ({
  modal: document.getElementById('bookingActionModal'),
  badge: document.getElementById('bookingActionBadge'),
  title: document.getElementById('bookingActionTitle'),
  body: document.getElementById('bookingActionBody'),
  close: document.getElementById('bookingActionClose')
});

const closeBookingModal = () => {
  const { modal, body } = getBookingModalElements();
  if (!modal || !body) return;
  modal.classList.remove('active');
  body.innerHTML = '';
};

const openBookingModal = ({ badge, title, content }) => {
  const { modal, badge: badgeEl, title: titleEl, body } = getBookingModalElements();
  if (!modal || !badgeEl || !titleEl || !body) return;

  badgeEl.textContent = badge;
  titleEl.textContent = title;
  body.innerHTML = content;
  modal.classList.add('active');
};

const initBookingModal = () => {
  const { modal, close } = getBookingModalElements();
  if (!modal || modal.dataset.bound === 'true') return;

  modal.dataset.bound = 'true';

  if (close) {
    close.addEventListener('click', closeBookingModal);
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeBookingModal();
  });
};

const renderBookingDetailCard = (label, value, wide = false) => `
  <div class="booking-detail-card ${wide ? 'booking-detail-card--wide' : ''}">
    <span class="booking-detail-card__label">${label}</span>
    <span class="booking-detail-card__value">${value}</span>
  </div>
`;

const renderRoomActionButtons = (booking) => {
  const canManage = isRoomBookingEditable(booking);
  const disabledAttr = canManage ? '' : 'disabled';
  const disabledTitle = canManage ? '' : 'title="Only pending or confirmed bookings can be changed"';

  return `
    <div class="booking-actions">
      <button class="booking-action-btn booking-action-btn--view" type="button" data-room-booking-action="view" data-id="${booking._id}" aria-label="View booking" title="View booking">
        ${ROOM_ACTION_ICONS.view}
      </button>
      <button class="booking-action-btn booking-action-btn--edit" type="button" data-room-booking-action="edit" data-id="${booking._id}" aria-label="Edit booking" title="Edit booking" ${disabledAttr} ${disabledTitle}>
        ${ROOM_ACTION_ICONS.edit}
      </button>
      <button class="booking-action-btn booking-action-btn--delete" type="button" data-room-booking-action="delete" data-id="${booking._id}" aria-label="Delete booking" title="Delete booking" ${disabledAttr} ${disabledTitle}>
        ${ROOM_ACTION_ICONS.delete}
      </button>
    </div>
  `;
};

const renderBookedRoomsTable = () => {
  const body = document.getElementById('bookedRoomsBody');
  const summary = document.getElementById('bookedRoomsSummary');
  if (!body || !summary) return;

  updateBookedRoomsCount();
  updateBookedRoomsToolbarState();

  if (roomBookingsStatus === 'loading') {
    summary.textContent = 'Loading your room bookings from the SeaForestuna stay database.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">Loading booked rooms...</td>
      </tr>
    `;
    return;
  }

  if (roomBookingsStatus === 'guest') {
    summary.textContent = 'Log in to review the room reservations connected to your SeaForestuna account.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">
          <div class="room-bookings-table__message">
            <p>Login required to view booked rooms.</p>
            <a href="auth.html" class="btn-primary room-bookings-table__cta">Login to Continue</a>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  if (roomBookingsStatus === 'error') {
    summary.textContent = 'We could not load your booked rooms right now. Please try refreshing the table.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">Unable to load your booked rooms.</td>
      </tr>
    `;
    return;
  }

  if (!roomBookings.length) {
    summary.textContent = 'No room bookings yet. Confirm a stay and it will appear here instantly.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">No booked rooms found for this account yet.</td>
      </tr>
    `;
    return;
  }

  summary.textContent = `${roomBookings.length} room booking${roomBookings.length === 1 ? '' : 's'} synced from your SeaForestuna account.`;
  body.innerHTML = roomBookings
    .map((booking) => {
      const totalNights = Number(booking.totalNights) || 0;
      const guests = Number(booking.guests) || 0;
      const totalPrice = Number(booking.totalPrice) || 0;
      const status = escapeHtml(booking.status || 'Pending');
      const statusClass = String(booking.status || 'pending')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

      return `
        <tr>
          <td>
            <div class="room-bookings-id-cell">
              <span class="room-bookings-id-cell__ref">${escapeHtml(booking.bookingRef || booking._id || '--')}</span>
              <span class="room-bookings-id-cell__status room-bookings-id-cell__status--${statusClass}">${status}</span>
            </div>
          </td>
          <td>
            <div class="room-bookings-name-cell">
              <span class="room-bookings-name-cell__title">${escapeHtml(booking.roomName || 'Room Booking')}</span>
              <span class="room-bookings-name-cell__meta">
                ${totalNights} night${totalNights === 1 ? '' : 's'}${totalPrice ? ` • ${escapeHtml(SF_UTILS.formatCurrency(totalPrice))}` : ''}
              </span>
            </div>
          </td>
          <td>${escapeHtml(formatRoomBookingDate(booking.checkIn))}</td>
          <td>${escapeHtml(formatRoomBookingDate(booking.checkOut))}</td>
          <td><span class="room-bookings-count-pill">${guests}</span></td>
          <td>${renderRoomActionButtons(booking)}</td>
        </tr>
      `;
    })
    .join('');
};

const loadBookedRooms = async ({ silent = false } = {}) => {
  const isAuth = await SF_UTILS.isAuthenticated();
  if (!isAuth) {
    roomBookings = [];
    roomBookingsStatus = 'guest';
    renderBookedRoomsTable();
    return [];
  }

  roomBookingsStatus = 'loading';
  renderBookedRoomsTable();

  try {
    roomBookings = await SF_UTILS.apiFetch('/api/room-bookings/my');
    roomBookingsStatus = 'ready';
  } catch (error) {
    roomBookings = [];
    roomBookingsStatus = 'error';
    if (!silent) {
      SF_UI.showToast(error.message || 'Unable to load booked rooms', 'error');
    }
  }

  renderBookedRoomsTable();
  return roomBookings;
};

const handlePrintBookedRooms = () => {
  if (!roomBookings.length) {
    SF_UI.showToast('No booked rooms available to print', 'error');
    return;
  }

  const rows = roomBookings
    .map(
      (booking) => `
        <tr>
          <td>${escapeHtml(booking.bookingRef || '--')}</td>
          <td>${escapeHtml(booking.roomName || 'Room Booking')}</td>
          <td>${escapeHtml(formatRoomBookingDate(booking.checkIn))}</td>
          <td>${escapeHtml(formatRoomBookingDate(booking.checkOut))}</td>
          <td>${escapeHtml(String(Number(booking.guests) || 0))}</td>
        </tr>
      `
    )
    .join('');

  const printWindow = window.open('', '_blank', 'width=980,height=720');
  if (!printWindow) {
    SF_UI.showToast('Allow pop-ups to print the booking list', 'error');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>SeaForestuna Booked Rooms</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin-bottom: 8px; }
          p { margin-bottom: 18px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>SeaForestuna Booked Rooms</h1>
        <p>${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Name</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const toCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const handleExportBookedRooms = () => {
  if (!roomBookings.length) {
    SF_UI.showToast('No booked rooms available to export', 'error');
    return;
  }

  const csvRows = [
    ['Booking ID', 'Name', 'Check-in', 'Check-out', 'Count'],
    ...roomBookings.map((booking) => [
      booking.bookingRef || '--',
      booking.roomName || 'Room Booking',
      formatRoomBookingDate(booking.checkIn),
      formatRoomBookingDate(booking.checkOut),
      Number(booking.guests) || 0
    ])
  ];

  const csv = csvRows.map((row) => row.map(toCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'seaforestuna-room-bookings.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const loadRooms = async () => {
  try {
    roomData = await SF_UTILS.apiFetch('/api/rooms');
  } catch (error) {
    roomData = [];
    SF_UI.showToast('Unable to load rooms', 'error');
  }
  renderRooms();
};

const renderRooms = () => {
  const list = document.getElementById('roomList');
  if (!list) return;

  if (!roomData.length) {
    list.innerHTML = `
      <div class="glass-card p-8 text-center reveal md:col-span-2 lg:col-span-3">
        <span class="badge">Rooms Unavailable</span>
        <h3 class="display text-3xl mt-4">No rooms available right now</h3>
        <p class="text-white/70 mt-3">Add room records from the admin panel to show them here.</p>
      </div>
    `;
    SF_UI.initReveal();
    return;
  }

  list.innerHTML = roomData
    .map(
      (room) => `
      <div class="glass-card p-5 card-hover flex flex-col gap-4 reveal">
        <div class="image-card h-52">
          <img src="${room.images?.[0] || SF_CONFIG.IMAGES.rooms}" alt="${room.name}" class="w-full h-full object-cover" />
        </div>
        <div>
          <h3 class="text-2xl">${room.name}</h3>
          <p class="text-sm text-white/70">${room.description}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${(room.amenities || []).slice(0, 4).map((amenity) => `<span class="badge">${amenity}</span>`).join('')}
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sea-400 font-semibold">${SF_UTILS.formatCurrency(room.pricePerNight)} / night</span>
          <button class="btn-primary text-sm" data-book-room="${room._id}">Book</button>
        </div>
      </div>
    `
    )
    .join('');

  list.querySelectorAll('[data-book-room]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectRoom(btn.dataset.bookRoom);
      document.getElementById('bookingSection').scrollIntoView({ behavior: 'smooth' });
    });
  });

  SF_UI.initReveal();
};

const selectRoom = (roomId) => {
  selectedRoom = roomData.find((room) => room._id === roomId);
  const label = document.getElementById('selectedRoom');
  if (label) {
    label.textContent = selectedRoom ? `${selectedRoom.name} (${SF_UTILS.formatCurrency(selectedRoom.pricePerNight)}/night)` : 'Select a room';
  }
};

const getEditableRoomPlans = (currentRoomId = '') => {
  const visibleRooms = roomData.filter(
    (room) => room && room.isActive !== false && String(room.status || '').toLowerCase() !== 'inactive'
  );

  if (currentRoomId && !visibleRooms.some((room) => room._id === currentRoomId)) {
    const currentRoom = roomData.find((room) => room._id === currentRoomId);
    if (currentRoom) {
      visibleRooms.unshift(currentRoom);
    }
  }

  return visibleRooms;
};

const renderRoomPlanOptions = (currentRoomId = '') => {
  const roomPlans = getEditableRoomPlans(currentRoomId);

  if (!roomPlans.length && currentRoomId) {
    return `<option value="${escapeHtml(currentRoomId)}" selected>Current room plan</option>`;
  }

  return roomPlans
    .map((room) => {
      const label = `${room.name || 'Room Plan'} (${SF_UTILS.formatCurrency(Number(room.pricePerNight) || 0)}/night)`;
      return `<option value="${escapeHtml(room._id)}" ${room._id === currentRoomId ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    })
    .join('');
};

const updateRoomBookingPlanFields = () => {
  const form = document.getElementById('roomBookingEditForm');
  if (!form) return;

  const roomSelect = form.elements.roomId;
  const guestsInput = form.elements.guests;
  const capacityLabel = document.getElementById('roomBookingPlanCapacity');
  const selectedPlan = roomData.find((room) => room._id === roomSelect?.value);
  const maxGuests = Number(selectedPlan?.capacity);

  if (guestsInput) {
    if (Number.isFinite(maxGuests) && maxGuests > 0) {
      guestsInput.max = String(maxGuests);
    } else {
      guestsInput.removeAttribute('max');
    }
  }

  if (capacityLabel) {
    if (selectedPlan) {
      capacityLabel.textContent = `Up to ${selectedPlan.capacity || '--'} guests • ${SF_UTILS.formatCurrency(
        Number(selectedPlan.pricePerNight) || 0
      )}/night`;
    } else {
      capacityLabel.textContent = 'Choose a room plan from the available stay options.';
    }
  }
};

const openRoomBookingView = (booking) => {
  openBookingModal({
    badge: 'Booking Details',
    title: 'View Room Booking',
    content: `
      <div class="booking-detail-grid">
        ${renderBookingDetailCard('Booking ID', escapeHtml(booking.bookingRef || '--'))}
        ${renderBookingDetailCard('Status', escapeHtml(booking.status || 'Pending'))}
        ${renderBookingDetailCard('Room', escapeHtml(booking.roomName || 'Room Booking'))}
        ${renderBookingDetailCard('Guests', escapeHtml(String(booking.guests || 0)))}
        ${renderBookingDetailCard('Check-in', escapeHtml(formatRoomBookingDate(booking.checkIn)))}
        ${renderBookingDetailCard('Check-out', escapeHtml(formatRoomBookingDate(booking.checkOut)))}
        ${renderBookingDetailCard('Stay Length', escapeHtml(`${booking.totalNights || 0} night${Number(booking.totalNights) === 1 ? '' : 's'}`))}
        ${renderBookingDetailCard('Total', escapeHtml(SF_UTILS.formatCurrency(Number(booking.totalPrice) || 0)))}
        ${renderBookingDetailCard('Special Requests', escapeHtml(booking.specialRequests || 'No special requests'), true)}
      </div>
      <div class="booking-modal__actions">
        <button type="button" class="btn-primary" id="bookingModalDone">Close</button>
      </div>
    `
  });

  const doneBtn = document.getElementById('bookingModalDone');
  if (doneBtn) {
    doneBtn.addEventListener('click', closeBookingModal);
  }
};

const saveRoomBookingEdit = async (bookingId) => {
  const form = document.getElementById('roomBookingEditForm');
  if (!form) return;
  if (!form.reportValidity()) return;

  const payload = {
    roomId: form.roomId.value,
    checkIn: form.checkIn.value,
    checkOut: form.checkOut.value,
    guests: Number(form.guests.value),
    specialRequests: form.specialRequests.value
  };

  try {
    SF_UI.showLoader();
    const updated = await SF_UTILS.apiFetch(`/api/room-bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    roomBookings = roomBookings.map((entry) => (entry._id === bookingId ? updated : entry));
    roomBookingsStatus = 'ready';
    renderBookedRoomsTable();
    closeBookingModal();
    SF_UI.showToast('Room booking updated', 'success');
    await loadBookedRooms({ silent: true });
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update booking', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const openRoomBookingEdit = (booking) => {
  openBookingModal({
    badge: 'Edit Booking',
    title: 'Edit Room Booking',
    content: `
      <p class="booking-modal__copy">Update your stay dates, guest count, or special requests. Changes will be saved to the booking database.</p>
      <form id="roomBookingEditForm" class="booking-form-grid">
        <label class="booking-field">
          <span>Room Plan</span>
          <select name="roomId" class="input-field" required>
            ${renderRoomPlanOptions(booking.roomId)}
          </select>
          <small id="roomBookingPlanCapacity" class="booking-field__hint"></small>
        </label>
        <label class="booking-field">
          <span>Check-in</span>
          <input name="checkIn" type="date" class="input-field" value="${escapeHtml(booking.checkIn || '')}" required />
        </label>
        <label class="booking-field">
          <span>Check-out</span>
          <input name="checkOut" type="date" class="input-field" value="${escapeHtml(booking.checkOut || '')}" required />
        </label>
        <label class="booking-field">
          <span>Guests</span>
          <input name="guests" type="number" min="1" class="input-field" value="${escapeHtml(String(booking.guests || 1))}" required />
        </label>
        <label class="booking-field booking-field--wide">
          <span>Special Requests</span>
          <textarea name="specialRequests" class="input-field">${escapeHtml(booking.specialRequests || '')}</textarea>
        </label>
      </form>
      <p class="booking-modal__status-note">Only pending or confirmed bookings can be changed.</p>
      <div class="booking-modal__actions">
        <button type="button" class="btn-outline" id="bookingModalCancel">Cancel</button>
        <button type="button" class="btn-primary" id="bookingModalSave">Save Changes</button>
      </div>
    `
  });

  const cancelBtn = document.getElementById('bookingModalCancel');
  const saveBtn = document.getElementById('bookingModalSave');
  const planSelect = document.querySelector('#roomBookingEditForm select[name="roomId"]');

  if (cancelBtn) cancelBtn.addEventListener('click', closeBookingModal);
  if (planSelect) {
    planSelect.addEventListener('change', updateRoomBookingPlanFields);
  }
  updateRoomBookingPlanFields();
  if (saveBtn) saveBtn.addEventListener('click', () => saveRoomBookingEdit(booking._id));
};

const deleteRoomBooking = async (bookingId) => {
  try {
    SF_UI.showLoader();
    await SF_UTILS.apiFetch(`/api/room-bookings/${bookingId}`, {
      method: 'DELETE'
    });

    roomBookings = roomBookings.filter((entry) => entry._id !== bookingId);
    roomBookingsStatus = 'ready';
    renderBookedRoomsTable();
    closeBookingModal();
    SF_UI.showToast('Room booking deleted', 'success');
    await loadBookedRooms({ silent: true });
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to delete booking', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const openRoomBookingDelete = (booking) => {
  openBookingModal({
    badge: 'Delete Booking',
    title: 'Delete Room Booking',
    content: `
      <p class="booking-modal__copy">This will permanently remove <strong>${escapeHtml(booking.bookingRef || booking._id || 'this booking')}</strong> from your room bookings and the database.</p>
      <div class="booking-detail-grid">
        ${renderBookingDetailCard('Room', escapeHtml(booking.roomName || 'Room Booking'))}
        ${renderBookingDetailCard('Dates', escapeHtml(`${formatRoomBookingDate(booking.checkIn)} - ${formatRoomBookingDate(booking.checkOut)}`))}
      </div>
      <div class="booking-modal__actions">
        <button type="button" class="btn-outline" id="bookingModalCancel">Keep Booking</button>
        <button type="button" class="btn-primary" id="bookingModalDelete">Delete Booking</button>
      </div>
    `
  });

  const cancelBtn = document.getElementById('bookingModalCancel');
  const deleteBtn = document.getElementById('bookingModalDelete');

  if (cancelBtn) cancelBtn.addEventListener('click', closeBookingModal);
  if (deleteBtn) deleteBtn.addEventListener('click', () => deleteRoomBooking(booking._id));
};

const bindBookedRoomsTableActions = () => {
  const body = document.getElementById('bookedRoomsBody');
  if (!body || body.dataset.bound === 'true') return;

  body.dataset.bound = 'true';
  body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-room-booking-action]');
    if (!button || button.disabled) return;

    const booking = roomBookings.find((entry) => entry._id === button.dataset.id);
    if (!booking) return;

    if (button.dataset.roomBookingAction === 'view') openRoomBookingView(booking);
    if (button.dataset.roomBookingAction === 'edit') openRoomBookingEdit(booking);
    if (button.dataset.roomBookingAction === 'delete') openRoomBookingDelete(booking);
  });
};

const initBookedRoomsControls = () => {
  const toggle = document.getElementById('bookedRoomsToggle');
  const refreshBtn = document.getElementById('bookedRoomsRefresh');
  const printBtn = document.getElementById('bookedRoomsPrint');
  const exportBtn = document.getElementById('bookedRoomsExport');

  initBookingModal();
  bindBookedRoomsTableActions();
  renderBookedRoomsTable();

  if (toggle) {
    toggle.addEventListener('click', async () => {
      const panel = document.getElementById('bookedRoomsPanel');
      const isOpen = panel ? panel.classList.contains('is-open') : false;

      if (isOpen) {
        setBookedRoomsOpen(false);
        return;
      }

      setBookedRoomsOpen(true);
      await loadBookedRooms({ silent: true });
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', () => loadBookedRooms());
  if (printBtn) printBtn.addEventListener('click', handlePrintBookedRooms);
  if (exportBtn) exportBtn.addEventListener('click', handleExportBookedRooms);

  loadBookedRooms({ silent: true });
};

const initRoomForm = () => {
  const form = document.getElementById('roomBookingForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedRoom) return SF_UI.showToast('Select a room first', 'error');
    const isAuth = await SF_UTILS.isAuthenticated();
    if (!isAuth) {
      SF_UI.showToast('Login required to book', 'error');
      return (window.location.href = 'auth.html');
    }

    const payload = {
      roomId: selectedRoom._id,
      checkIn: form.checkIn.value,
      checkOut: form.checkOut.value,
      guests: Number(form.guests.value),
      specialRequests: form.specialRequests.value
    };

    try {
      SF_UI.showLoader();
      const booking = await SF_UTILS.apiFetch('/api/room-bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      roomBookings = [booking, ...roomBookings.filter((entry) => entry._id !== booking._id)];
      roomBookingsStatus = 'ready';
      renderBookedRoomsTable();
      setBookedRoomsOpen(true);

      SF_UI.showToast('Room booked successfully', 'success');
      document.getElementById('roomConfirmation').innerHTML = `
        <div class="glass-card p-6 mt-6">
          <h3 class="text-2xl mb-2">Booking Confirmed</h3>
          <p class="text-white/70">Reference: <span class="text-sea-400 font-semibold">${booking.bookingRef}</span></p>
        </div>
      `;

      form.reset();
      await loadBookedRooms({ silent: true });
    } catch (error) {
      SF_UI.showToast(error.message, 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const applyQueryPrefill = () => {
  const params = new URLSearchParams(window.location.search);
  const checkIn = params.get('checkIn');
  const checkOut = params.get('checkOut');
  if (checkIn) document.getElementById('checkIn').value = checkIn;
  if (checkOut) document.getElementById('checkOut').value = checkOut;
};

const initRoomsPage = () => {
  loadRooms();
  initBookedRoomsControls();
  initRoomForm();
  applyQueryPrefill();
};

document.addEventListener('DOMContentLoaded', initRoomsPage);
