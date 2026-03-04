let boatData = [];
let selectedBoat = null;

const loadBoats = async () => {
  try {
    boatData = await SF_UTILS.apiFetch('/api/boats');
  } catch (error) {
    boatData = SF_CONFIG.FALLBACK_BOATS;
    SF_UI.showToast('Using offline boat preview', 'info');
  }
  renderBoats();
};

const renderBoats = () => {
  const list = document.getElementById('boatList');
  if (!list) return;
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
        <div class="flex items-center justify-between">
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
      SF_UI.showToast('Boat reservation confirmed', 'success');
      document.getElementById('boatConfirmation').innerHTML = `
        <div class="glass-card p-6 mt-6">
          <h3 class="text-2xl mb-2">Reservation Confirmed</h3>
          <p class="text-white/70">Reference: <span class="text-sea-400 font-semibold">${booking.bookingRef}</span></p>
        </div>
      `;
      form.reset();
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
  initBoatForm();
  applyBoatPrefill();
};

document.addEventListener('DOMContentLoaded', initBoatPage);
