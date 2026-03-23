let boatData = [];
let selectedBoat = null;
let boatBookings = [];
let boatBookingsStatus = 'idle';

const boatBookingDateFormatter = new Intl.DateTimeFormat('en-LK', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

const BOAT_ACTION_ICONS = {
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

const isBoatBookingEditable = (booking) => !['Completed', 'Cancelled'].includes(String(booking?.status || ''));

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatBoatBookingDate = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return boatBookingDateFormatter.format(date);
};

const updateBookedRidesCount = () => {
  const count = boatBookings.length;
  const countEl = document.getElementById('bookedRidesCount');
  if (countEl) countEl.textContent = String(count);
};

const updateBookedRidesToolbarState = () => {
  const refreshBtn = document.getElementById('bookedRidesRefresh');
  const printBtn = document.getElementById('bookedRidesPrint');
  const exportBtn = document.getElementById('bookedRidesExport');
  const hasRows = boatBookingsStatus === 'ready' && boatBookings.length > 0;

  if (refreshBtn) refreshBtn.disabled = boatBookingsStatus === 'loading';
  if (printBtn) printBtn.disabled = !hasRows;
  if (exportBtn) exportBtn.disabled = !hasRows;
};

const setBookedRidesOpen = (isOpen) => {
  const toggle = document.getElementById('bookedRidesToggle');
  const label = document.getElementById('bookedRidesToggleLabel');
  const panel = document.getElementById('bookedRidesPanel');

  if (!toggle || !label || !panel) return;

  toggle.setAttribute('aria-expanded', String(isOpen));
  label.textContent = isOpen ? 'Hide Booked Rides' : 'View Booked Rides';
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

  if (close) close.addEventListener('click', closeBookingModal);

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

const renderBoatActionButtons = (booking) => {
  const canManage = isBoatBookingEditable(booking);
  const disabledAttr = canManage ? '' : 'disabled';
  const disabledTitle = canManage ? '' : 'title="Only pending or confirmed bookings can be changed"';

  return `
    <div class="booking-actions">
      <button class="booking-action-btn booking-action-btn--view" type="button" data-boat-booking-action="view" data-id="${booking._id}" aria-label="View booking" title="View booking">
        ${BOAT_ACTION_ICONS.view}
      </button>
      <button class="booking-action-btn booking-action-btn--edit" type="button" data-boat-booking-action="edit" data-id="${booking._id}" aria-label="Edit booking" title="Edit booking" ${disabledAttr} ${disabledTitle}>
        ${BOAT_ACTION_ICONS.edit}
      </button>
      <button class="booking-action-btn booking-action-btn--delete" type="button" data-boat-booking-action="delete" data-id="${booking._id}" aria-label="Delete booking" title="Delete booking" ${disabledAttr} ${disabledTitle}>
        ${BOAT_ACTION_ICONS.delete}
      </button>
    </div>
  `;
};

const renderBookedRidesTable = () => {
  const body = document.getElementById('bookedRidesBody');
  const summary = document.getElementById('bookedRidesSummary');
  if (!body || !summary) return;

  updateBookedRidesCount();
  updateBookedRidesToolbarState();

  if (boatBookingsStatus === 'loading') {
    summary.textContent = 'Loading your booked rides from the SeaForestuna journey database.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">Loading booked rides...</td>
      </tr>
    `;
    return;
  }

  if (boatBookingsStatus === 'guest') {
    summary.textContent = 'Log in to review the ride plans booked from your SeaForestuna account.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">
          <div class="room-bookings-table__message">
            <p>Login required to view booked rides.</p>
            <a href="auth.html" class="btn-primary room-bookings-table__cta">Login to Continue</a>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  if (boatBookingsStatus === 'error') {
    summary.textContent = 'We could not load your booked rides right now. Please refresh the table.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">Unable to load your booked rides.</td>
      </tr>
    `;
    return;
  }

  if (!boatBookings.length) {
    summary.textContent = 'No booked rides yet. Reserve a plan and it will appear here instantly.';
    body.innerHTML = `
      <tr class="room-bookings-table__empty">
        <td colspan="6">No booked rides found for this account yet.</td>
      </tr>
    `;
    return;
  }

  summary.textContent = `${boatBookings.length} ride booking${boatBookings.length === 1 ? '' : 's'} synced from your SeaForestuna account.`;
  body.innerHTML = boatBookings
    .map((booking) => {
      const guests = Number(booking.guests) || 0;
      const totalPrice = Number(booking.totalPrice) || 0;
      const status = escapeHtml(booking.status || 'Pending');
      const statusClass = String(booking.status || 'pending')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const specialNote = String(booking.specialNotes || '').trim();
      const timeSlotLabel = escapeHtml(booking.timeSlot || '--');
      const dateLabel = escapeHtml(formatBoatBookingDate(booking.date));

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
              <span class="room-bookings-name-cell__title">${escapeHtml(booking.boatName || 'Boat Ride')}</span>
              <span class="room-bookings-name-cell__meta">${escapeHtml(SF_UTILS.formatCurrency(totalPrice))} total</span>
            </div>
          </td>
          <td>
            <div class="room-bookings-name-cell">
              <span class="room-bookings-name-cell__title">${timeSlotLabel}</span>
              <span class="room-bookings-name-cell__meta">${dateLabel}</span>
            </div>
          </td>
          <td><span class="room-bookings-count-pill">${guests}</span></td>
          <td>${specialNote ? escapeHtml(specialNote) : '<span class="room-bookings-name-cell__meta">No special note</span>'}</td>
          <td>${renderBoatActionButtons(booking)}</td>
        </tr>
      `;
    })
    .join('');
};

const loadBookedRides = async ({ silent = false } = {}) => {
  const isAuth = await SF_UTILS.isAuthenticated();
  if (!isAuth) {
    boatBookings = [];
    boatBookingsStatus = 'guest';
    renderBookedRidesTable();
    return [];
  }

  boatBookingsStatus = 'loading';
  renderBookedRidesTable();

  try {
    boatBookings = await SF_UTILS.apiFetch('/api/boat-bookings/my');
    boatBookingsStatus = 'ready';
  } catch (error) {
    boatBookings = [];
    boatBookingsStatus = 'error';
    if (!silent) {
      SF_UI.showToast(error.message || 'Unable to load booked rides', 'error');
    }
  }

  renderBookedRidesTable();
  return boatBookings;
};

const handlePrintBookedRides = () => {
  if (!boatBookings.length) {
    SF_UI.showToast('No booked rides available to print', 'error');
    return;
  }

  const rows = boatBookings
    .map(
      (booking) => `
        <tr>
          <td>${escapeHtml(booking.bookingRef || '--')}</td>
          <td>${escapeHtml(booking.boatName || 'Boat Ride')}</td>
          <td>${escapeHtml(`${formatBoatBookingDate(booking.date)} • ${booking.timeSlot || '--'}`)}</td>
          <td>${escapeHtml(String(Number(booking.guests) || 0))}</td>
          <td>${escapeHtml(booking.specialNotes || '')}</td>
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
        <title>SeaForestuna Booked Rides</title>
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
        <h1>SeaForestuna Booked Rides</h1>
        <p>${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Name</th>
              <th>Time Slot</th>
              <th>Count</th>
              <th>Special Note</th>
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

const handleExportBookedRides = () => {
  if (!boatBookings.length) {
    SF_UI.showToast('No booked rides available to export', 'error');
    return;
  }

  const csvRows = [
    ['Booking ID', 'Name', 'Time Slot', 'Count', 'Special Note'],
    ...boatBookings.map((booking) => [
      booking.bookingRef || '--',
      booking.boatName || 'Boat Ride',
      `${formatBoatBookingDate(booking.date)} • ${booking.timeSlot || '--'}`,
      Number(booking.guests) || 0,
      booking.specialNotes || ''
    ])
  ];

  const csv = csvRows.map((row) => row.map(toCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'seaforestuna-boat-bookings.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const loadBoats = async () => {
  try {
    boatData = await SF_UTILS.apiFetch('/api/boats');
  } catch (error) {
    boatData = [];
    SF_UI.showToast('Unable to load boat rides', 'error');
  }
  renderBoats();
};

const renderBoats = () => {
  const list = document.getElementById('boatList');
  if (!list) return;

  if (!boatData.length) {
    list.innerHTML = `
      <div class="glass-card p-8 text-center reveal md:col-span-2 lg:col-span-3">
        <span class="badge">Boat Rides Unavailable</span>
        <h3 class="display text-3xl mt-4">No boat rides available right now</h3>
        <p class="text-white/70 mt-3">Add boat ride records from the admin panel to show them here.</p>
      </div>
    `;
    SF_UI.initReveal();
    return;
  }

  list.innerHTML = boatData
    .map(
      (boat) => `
      <div class="glass-card p-5 card-hover flex flex-col gap-4 reveal">
        <div class="image-card h-52">
          <img src="${boat.images?.[0] || SF_CONFIG.IMAGES.boat}" alt="${boat.name}" class="w-full h-full object-cover" />
        </div>
        <div>
          <h3 class="text-2xl">${boat.name}</h3>
          <p class="text-sm text-white/70">${boat.description}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge">${boat.durationHours} hrs</span>
          <span class="badge">Up to ${boat.maxCapacity} guests</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-sea-400 font-semibold">${SF_UTILS.formatCurrency(boat.price)} / guest</span>
          <button class="btn-primary text-sm" data-book-boat="${boat._id}">Reserve</button>
        </div>
      </div>
    `
    )
    .join('');

  list.querySelectorAll('[data-book-boat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectBoat(btn.dataset.bookBoat);
      document.getElementById('boatBookingSection').scrollIntoView({ behavior: 'smooth' });
    });
  });

  SF_UI.initReveal();
};

const selectBoat = (boatId) => {
  selectedBoat = boatData.find((boat) => boat._id === boatId);
  const label = document.getElementById('selectedBoat');
  const timeSelect = document.getElementById('boatTime');
  if (label) {
    label.textContent = selectedBoat ? `${selectedBoat.name} (${SF_UTILS.formatCurrency(selectedBoat.price)}/guest)` : 'Select a boat ride';
  }
  if (timeSelect && selectedBoat) {
    timeSelect.innerHTML = (selectedBoat.timeSlots || []).map((slot) => `<option value="${slot}">${slot}</option>`).join('');
  }
};

const getEditableBoatPlans = (currentBoatId = '') => {
  const visibleBoats = boatData.filter(
    (boat) => boat && boat.isActive !== false && String(boat.status || '').toLowerCase() !== 'inactive'
  );

  if (currentBoatId && !visibleBoats.some((boat) => boat._id === currentBoatId)) {
    const currentBoat = boatData.find((boat) => boat._id === currentBoatId);
    if (currentBoat) {
      visibleBoats.unshift(currentBoat);
    }
  }

  return visibleBoats;
};

const renderBoatPlanOptions = (currentBoatId = '') => {
  const plans = getEditableBoatPlans(currentBoatId);

  if (!plans.length && currentBoatId) {
    return `<option value="${escapeHtml(currentBoatId)}" selected>Current ride plan</option>`;
  }

  return plans
    .map((boat) => {
      const label = `${boat.name || 'Boat Ride'} (${SF_UTILS.formatCurrency(Number(boat.price) || 0)}/guest)`;
      return `<option value="${escapeHtml(boat._id)}" ${boat._id === currentBoatId ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    })
    .join('');
};

const getBoatPlanTimeSlots = (boatId, fallbackSlots = []) => {
  const selectedPlan = boatData.find((boat) => boat._id === boatId);
  const timeSlots = selectedPlan?.timeSlots?.length ? selectedPlan.timeSlots : fallbackSlots.filter(Boolean);
  return [...new Set(timeSlots)];
};

const updateBoatBookingPlanFields = (preferredTimeSlot = '') => {
  const form = document.getElementById('boatBookingEditForm');
  if (!form) return;

  const boatSelect = form.elements.boatId;
  const timeSelect = form.elements.timeSlot;
  const guestsInput = form.elements.guests;
  const metaLabel = document.getElementById('boatBookingPlanMeta');
  const selectedPlan = boatData.find((boat) => boat._id === boatSelect?.value);
  const timeSlots = getBoatPlanTimeSlots(boatSelect?.value, [preferredTimeSlot, timeSelect?.value]);
  const selectedTimeSlot = timeSlots.includes(preferredTimeSlot) ? preferredTimeSlot : timeSlots[0] || '';
  const maxGuests = Number(selectedPlan?.maxCapacity);

  if (timeSelect) {
    if (timeSlots.length) {
      timeSelect.innerHTML = timeSlots
        .map((slot) => `<option value="${escapeHtml(slot)}" ${slot === selectedTimeSlot ? 'selected' : ''}>${escapeHtml(slot)}</option>`)
        .join('');
      timeSelect.disabled = false;
    } else {
      timeSelect.innerHTML = '<option value="">No time slots available</option>';
      timeSelect.disabled = true;
    }
  }

  if (guestsInput) {
    if (Number.isFinite(maxGuests) && maxGuests > 0) {
      guestsInput.max = String(maxGuests);
    } else {
      guestsInput.removeAttribute('max');
    }
  }

  if (metaLabel) {
    if (selectedPlan) {
      metaLabel.textContent = `Up to ${selectedPlan.maxCapacity || '--'} guests • ${SF_UTILS.formatCurrency(Number(selectedPlan.price) || 0)}/guest`;
    } else {
      metaLabel.textContent = 'Choose a ride plan to load the available time slots.';
    }
  }
};

const openBoatBookingView = (booking) => {
  openBookingModal({
    badge: 'Booking Details',
    title: 'View Boat Booking',
    content: `
      <div class="booking-detail-grid">
        ${renderBookingDetailCard('Booking ID', escapeHtml(booking.bookingRef || '--'))}
        ${renderBookingDetailCard('Status', escapeHtml(booking.status || 'Pending'))}
        ${renderBookingDetailCard('Ride Plan', escapeHtml(booking.boatName || 'Boat Ride'))}
        ${renderBookingDetailCard('Guests', escapeHtml(String(booking.guests || 0)))}
        ${renderBookingDetailCard('Date', escapeHtml(formatBoatBookingDate(booking.date)))}
        ${renderBookingDetailCard('Time Slot', escapeHtml(booking.timeSlot || '--'))}
        ${renderBookingDetailCard('Total', escapeHtml(SF_UTILS.formatCurrency(Number(booking.totalPrice) || 0)))}
        ${renderBookingDetailCard('Special Note', escapeHtml(booking.specialNotes || 'No special note'), true)}
      </div>
      <div class="booking-modal__actions">
        <button type="button" class="btn-primary" id="bookingModalDone">Close</button>
      </div>
    `
  });

  const doneBtn = document.getElementById('bookingModalDone');
  if (doneBtn) doneBtn.addEventListener('click', closeBookingModal);
};

const saveBoatBookingEdit = async (bookingId) => {
  const form = document.getElementById('boatBookingEditForm');
  if (!form) return;
  if (!form.reportValidity()) return;

  const payload = {
    boatId: form.boatId.value,
    date: form.date.value,
    timeSlot: form.timeSlot.value,
    guests: Number(form.guests.value),
    specialNotes: form.specialNotes.value
  };

  try {
    SF_UI.showLoader();
    const updated = await SF_UTILS.apiFetch(`/api/boat-bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    boatBookings = boatBookings.map((entry) => (entry._id === bookingId ? updated : entry));
    boatBookingsStatus = 'ready';
    renderBookedRidesTable();
    closeBookingModal();
    SF_UI.showToast('Boat booking updated', 'success');
    await loadBookedRides({ silent: true });
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to update booking', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const openBoatBookingEdit = (booking) => {
  const timeSlots = getBoatPlanTimeSlots(booking.boatId, [booking.timeSlot]);

  openBookingModal({
    badge: 'Edit Booking',
    title: 'Edit Boat Booking',
    content: `
      <p class="booking-modal__copy">Update the reserved date, time slot, guest count, or special note. Changes will be saved to the booking database.</p>
      <form id="boatBookingEditForm" class="booking-form-grid">
        <label class="booking-field">
          <span>Ride Plan</span>
          <select name="boatId" class="input-field" required>
            ${renderBoatPlanOptions(booking.boatId)}
          </select>
          <small id="boatBookingPlanMeta" class="booking-field__hint"></small>
        </label>
        <label class="booking-field">
          <span>Date</span>
          <input name="date" type="date" class="input-field" value="${escapeHtml(booking.date || '')}" required />
        </label>
        <label class="booking-field">
          <span>Time Slot</span>
          <select name="timeSlot" class="input-field" required>
            ${timeSlots
              .map(
                (slot) =>
                  `<option value="${escapeHtml(slot)}" ${slot === booking.timeSlot ? 'selected' : ''}>${escapeHtml(slot)}</option>`
              )
              .join('')}
          </select>
        </label>
        <label class="booking-field">
          <span>Guests</span>
          <input name="guests" type="number" min="1" class="input-field" value="${escapeHtml(String(booking.guests || 1))}" required />
        </label>
        <label class="booking-field booking-field--wide">
          <span>Special Note</span>
          <textarea name="specialNotes" class="input-field">${escapeHtml(booking.specialNotes || '')}</textarea>
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
  const planSelect = document.querySelector('#boatBookingEditForm select[name="boatId"]');

  if (cancelBtn) cancelBtn.addEventListener('click', closeBookingModal);
  if (planSelect) {
    planSelect.addEventListener('change', () => updateBoatBookingPlanFields());
  }
  updateBoatBookingPlanFields(booking.timeSlot);
  if (saveBtn) saveBtn.addEventListener('click', () => saveBoatBookingEdit(booking._id));
};

const deleteBoatBooking = async (bookingId) => {
  try {
    SF_UI.showLoader();
    await SF_UTILS.apiFetch(`/api/boat-bookings/${bookingId}`, {
      method: 'DELETE'
    });

    boatBookings = boatBookings.filter((entry) => entry._id !== bookingId);
    boatBookingsStatus = 'ready';
    renderBookedRidesTable();
    closeBookingModal();
    SF_UI.showToast('Boat booking deleted', 'success');
    await loadBookedRides({ silent: true });
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to delete booking', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const openBoatBookingDelete = (booking) => {
  openBookingModal({
    badge: 'Delete Booking',
    title: 'Delete Boat Booking',
    content: `
      <p class="booking-modal__copy">This will permanently remove <strong>${escapeHtml(booking.bookingRef || booking._id || 'this booking')}</strong> from your ride bookings and the database.</p>
      <div class="booking-detail-grid">
        ${renderBookingDetailCard('Ride Plan', escapeHtml(booking.boatName || 'Boat Ride'))}
        ${renderBookingDetailCard('Journey Slot', escapeHtml(`${formatBoatBookingDate(booking.date)} • ${booking.timeSlot || '--'}`))}
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
  if (deleteBtn) deleteBtn.addEventListener('click', () => deleteBoatBooking(booking._id));
};

const bindBookedRidesTableActions = () => {
  const body = document.getElementById('bookedRidesBody');
  if (!body || body.dataset.bound === 'true') return;

  body.dataset.bound = 'true';
  body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-boat-booking-action]');
    if (!button || button.disabled) return;

    const booking = boatBookings.find((entry) => entry._id === button.dataset.id);
    if (!booking) return;

    if (button.dataset.boatBookingAction === 'view') openBoatBookingView(booking);
    if (button.dataset.boatBookingAction === 'edit') openBoatBookingEdit(booking);
    if (button.dataset.boatBookingAction === 'delete') openBoatBookingDelete(booking);
  });
};

const initBookedRidesControls = () => {
  const toggle = document.getElementById('bookedRidesToggle');
  const refreshBtn = document.getElementById('bookedRidesRefresh');
  const printBtn = document.getElementById('bookedRidesPrint');
  const exportBtn = document.getElementById('bookedRidesExport');

  initBookingModal();
  bindBookedRidesTableActions();
  renderBookedRidesTable();

  if (toggle) {
    toggle.addEventListener('click', async () => {
      const panel = document.getElementById('bookedRidesPanel');
      const isOpen = panel ? panel.classList.contains('is-open') : false;

      if (isOpen) {
        setBookedRidesOpen(false);
        return;
      }

      setBookedRidesOpen(true);
      await loadBookedRides({ silent: true });
    });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', () => loadBookedRides());
  if (printBtn) printBtn.addEventListener('click', handlePrintBookedRides);
  if (exportBtn) exportBtn.addEventListener('click', handleExportBookedRides);

  loadBookedRides({ silent: true });
};

const initBoatForm = () => {
  const form = document.getElementById('boatBookingForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!selectedBoat) return SF_UI.showToast('Select a boat experience first', 'error');
    const isAuth = await SF_UTILS.isAuthenticated();
    if (!isAuth) {
      SF_UI.showToast('Login required to reserve', 'error');
      return (window.location.href = 'auth.html');
    }

    const payload = {
      boatId: selectedBoat._id,
      date: form.date.value,
      timeSlot: form.timeSlot.value,
      guests: Number(form.guests.value),
      specialNotes: form.specialNotes.value
    };

    try {
      SF_UI.showLoader();
      const booking = await SF_UTILS.apiFetch('/api/boat-bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      boatBookings = [booking, ...boatBookings.filter((entry) => entry._id !== booking._id)];
      boatBookingsStatus = 'ready';
      renderBookedRidesTable();
      setBookedRidesOpen(true);

      SF_UI.showToast('Boat reservation confirmed', 'success');
      document.getElementById('boatConfirmation').innerHTML = `
        <div class="glass-card p-6 mt-6">
          <h3 class="text-2xl mb-2">Reservation Confirmed</h3>
          <p class="text-white/70">Reference: <span class="text-sea-400 font-semibold">${booking.bookingRef}</span></p>
        </div>
      `;

      form.reset();
      if (selectedBoat) selectBoat(selectedBoat._id);
      await loadBookedRides({ silent: true });
    } catch (error) {
      SF_UI.showToast(error.message, 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const applyBoatPrefill = () => {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');
  if (date) document.getElementById('boatDate').value = date;
};

const initBoatPage = () => {
  loadBoats();
  initBookedRidesControls();
  initBoatForm();
  applyBoatPrefill();
};

document.addEventListener('DOMContentLoaded', initBoatPage);
