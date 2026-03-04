let roomData = [];
let selectedRoom = null;

const loadRooms = async () => {
  try {
    roomData = await SF_UTILS.apiFetch('/api/rooms');
  } catch (error) {
    roomData = SF_CONFIG.FALLBACK_ROOMS;
    SF_UI.showToast('Using offline rooms preview', 'info');
  }
  renderRooms();
};

const renderRooms = () => {
  const list = document.getElementById('roomList');
  if (!list) return;
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
        <div class="flex items-center justify-between">
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
      SF_UI.showToast('Room booked successfully', 'success');
      document.getElementById('roomConfirmation').innerHTML = `
        <div class="glass-card p-6 mt-6">
          <h3 class="text-2xl mb-2">Booking Confirmed</h3>
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

const applyQueryPrefill = () => {
  const params = new URLSearchParams(window.location.search);
  const checkIn = params.get('checkIn');
  const checkOut = params.get('checkOut');
  if (checkIn) document.getElementById('checkIn').value = checkIn;
  if (checkOut) document.getElementById('checkOut').value = checkOut;
};

const initRoomsPage = () => {
  loadRooms();
  initRoomForm();
  applyQueryPrefill();
};

document.addEventListener('DOMContentLoaded', initRoomsPage);
