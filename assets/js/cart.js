(() => {
let cart = [];
let latestOrder = null;

const getCart = () => {
  cart = SF_UTILS.getCart();
  return cart;
};

const toggleCartState = (hasItems) => {
  const emptyState = document.getElementById('cartEmptyState');
  const list = document.getElementById('cartItemList');
  const summaryBtn = document.getElementById('summaryCheckoutBtn');
  const submitBtn = document.getElementById('submitOrderBtn');

  if (emptyState) emptyState.classList.toggle('hidden', hasItems);
  if (list) list.classList.toggle('hidden', !hasItems);

  if (summaryBtn) {
    summaryBtn.classList.toggle('pointer-events-none', !hasItems);
    summaryBtn.classList.toggle('opacity-50', !hasItems);
  }

  if (submitBtn) {
    submitBtn.disabled = !hasItems;
    submitBtn.classList.toggle('opacity-50', !hasItems);
    submitBtn.classList.toggle('cursor-not-allowed', !hasItems);
  }
};

const renderCartPage = () => {
  const currentCart = getCart();
  const list = document.getElementById('cartItemList');
  if (!list) return;

  const itemCount = SF_UTILS.getCartCount();
  const subtotal = SF_UTILS.getCartSubtotal();
  const hasItems = currentCart.length > 0;

  toggleCartState(hasItems);

  list.innerHTML = currentCart
    .map(
      (item) => `
        <article class="journey-card">
          <div class="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div class="flex items-start gap-4">
              <div class="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
                <img src="${item.image || 'assets/images/logo.png'}" alt="${item.name}" class="w-full h-full object-cover" />
              </div>
              <div class="space-y-2">
                <div>
                  <h3 class="text-xl font-semibold">${item.name}</h3>
                  <p class="text-sm text-white/60">${item.category || 'SeaForestuna Menu'}</p>
                </div>
                <p class="text-sea-400 font-semibold">${SF_UTILS.formatPrice(item.price)}</p>
              </div>
            </div>
            <div class="flex flex-col sm:items-end gap-3">
              <div class="flex items-center gap-3">
                <label class="text-sm text-white/60" for="qty-${item.menuItem}">Qty</label>
                <input
                  id="qty-${item.menuItem}"
                  type="number"
                  min="1"
                  value="${item.quantity}"
                  class="input-field w-20 text-center"
                  data-qty="${item.menuItem}"
                />
              </div>
              <div class="flex items-center gap-4">
                <span class="text-white/80 font-semibold">${SF_UTILS.formatPrice(item.price * item.quantity)}</span>
                <button class="text-sm text-red-300 hover:text-red-200" data-remove="${item.menuItem}">Remove</button>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SF_UTILS.removeFromCart(btn.dataset.remove);
      renderCartPage();
    });
  });

  list.querySelectorAll('[data-qty]').forEach((input) => {
    input.addEventListener('change', () => {
      SF_UTILS.updateCartQuantity(input.dataset.qty, Number(input.value));
      renderCartPage();
    });
  });

  const textTargets = {
    cartHeroCount: itemCount,
    cartItemCount: itemCount
  };

  Object.entries(textTargets).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  ['cartHeroSubtotal', 'cartSubtotal', 'cartGrandTotal'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = SF_UTILS.formatPrice(subtotal);
  });
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

const renderOrderConfirmation = (order) => {
  const confirmation = document.getElementById('orderConfirmation');
  if (!confirmation) return;

  if (!order) {
    confirmation.innerHTML = '';
    return;
  }

  const itemLines = (order.items || [])
    .map(
      (item) => `
        <div class="flex items-center justify-between gap-4 text-sm text-white/75">
          <span>${item.name} x ${Number(item.quantity) || 0}</span>
          <span>${SF_UTILS.formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
        </div>
      `
    )
    .join('');

  const deliveryRows =
    order.orderType === 'delivery'
      ? `
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Delivery Address</span>
            <span class="text-right">${order.address || '--'}</span>
          </div>
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Phone</span>
            <span>${order.phone || '--'}</span>
          </div>
        `
      : '';

  const dineInRows =
    order.orderType === 'dine-in'
      ? `
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Guest Count</span>
            <span>${order.guestCount || '--'}</span>
          </div>
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Table Preference</span>
            <span class="text-right">${order.tablePreference || '--'}</span>
          </div>
        `
      : '';

  confirmation.innerHTML = `
    <div class="glass-card p-6 mt-4 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 class="text-2xl mb-2">Order Confirmed</h3>
          <p class="text-white/70">Reference: <span class="text-sea-400 font-semibold">${order.orderNumber}</span></p>
          <p class="text-sm text-white/60 mt-1">Placed ${formatDateTime(order.createdAt)}</p>
        </div>
        <button type="button" id="downloadReceiptBtn" class="btn-outline w-full sm:w-auto">Download Receipt PDF</button>
      </div>

      <div class="grid sm:grid-cols-2 gap-3 text-sm">
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-white/50 uppercase tracking-[0.24em] text-xs">Order Type</p>
          <p class="text-white/90 mt-2">${formatOrderType(order.orderType)}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-white/50 uppercase tracking-[0.24em] text-xs">Scheduled</p>
          <p class="text-white/90 mt-2">${formatDateTime(order.scheduledAt)}</p>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p class="text-white/50 uppercase tracking-[0.24em] text-xs">Receipt Summary</p>
        ${itemLines}
        <div class="border-t border-white/10 pt-3 space-y-2">
          ${deliveryRows}
          ${dineInRows}
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Subtotal</span>
            <span>${SF_UTILS.formatPrice(order.subtotal)}</span>
          </div>
          <div class="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Tax</span>
            <span>${SF_UTILS.formatPrice(order.tax)}</span>
          </div>
          <div class="flex items-center justify-between gap-4 text-base font-semibold text-sea-400">
            <span>Total</span>
            <span>${SF_UTILS.formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const downloadBtn = document.getElementById('downloadReceiptBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        await SF_PDF.downloadOrderReceipt(order);
      } catch (error) {
        SF_UI.showToast(error.message || 'Unable to generate receipt PDF', 'error');
      }
    });
  }
};

const initOrderForm = () => {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const timeSelect = document.getElementById('orderTime');
  const dateInput = document.getElementById('orderDate');
  const deliveryFields = document.getElementById('deliveryFields');
  const dineInFields = document.getElementById('dineInFields');

  const slots = SF_UTILS.generateTimeSlots('11:00', '21:30', 30);
  timeSelect.innerHTML = slots.map((slot) => `<option value="${slot}">${slot}</option>`).join('');

  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  if (!dateInput.value) dateInput.value = today;

  const updateOrderTypeFields = () => {
    const selected = form.querySelector('input[name="orderType"]:checked');
    const type = selected ? selected.value : 'pickup';
    deliveryFields.classList.toggle('hidden', type !== 'delivery');
    dineInFields.classList.toggle('hidden', type !== 'dine-in');
  };

  form.querySelectorAll('input[name="orderType"]').forEach((input) => {
    input.addEventListener('change', updateOrderTypeFields);
  });
  updateOrderTypeFields();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentCart = getCart();
    if (currentCart.length === 0) {
      SF_UI.showToast('Add items to cart first', 'error');
      return;
    }

    const isAuth = await SF_UTILS.isAuthenticated();
    if (!isAuth) {
      SF_UI.showToast('Please login to place an order', 'error');
      window.location.href = 'auth.html#login';
      return;
    }

    const selected = form.querySelector('input[name="orderType"]:checked');
    const payload = {
      items: currentCart.map((item) => ({ menuItem: item.menuItem, quantity: item.quantity })),
      orderType: selected ? selected.value : 'pickup',
      scheduledDate: dateInput.value,
      timeSlot: timeSelect.value,
      notes: form.notes.value
    };

    if (payload.orderType === 'delivery') {
      payload.address = form.address.value;
      payload.phone = form.phone.value;
    }

    if (payload.orderType === 'dine-in') {
      payload.guestCount = Number(form.guestCount.value);
      payload.tablePreference = form.tablePreference.value;
    }

    try {
      SF_UI.showLoader();
      const order = await SF_UTILS.apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      SF_UTILS.clearCart();
      renderCartPage();
      form.reset();
      dateInput.value = today;
      updateOrderTypeFields();
      latestOrder = order;
      renderOrderConfirmation(order);
      SF_UI.showToast('Order submitted', 'success');
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to submit order', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const initCartPage = () => {
  renderCartPage();
  renderOrderConfirmation(latestOrder);
  initOrderForm();
  window.addEventListener('sf:cart-updated', renderCartPage);
};

document.addEventListener('DOMContentLoaded', initCartPage);
})();
