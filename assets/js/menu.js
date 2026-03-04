let menuItems = [];
let cart = [];

const loadMenu = async () => {
  try {
    const data = await SF_UTILS.apiFetch('/api/menu');
    menuItems = data;
  } catch (error) {
    menuItems = SF_CONFIG.FALLBACK_MENU;
    SF_UI.showToast('Using offline menu preview', 'info');
  }
  renderMenu();
  renderCategories();
};

const renderCategories = () => {
  const container = document.getElementById('menuCategories');
  if (!container) return;
  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  container.innerHTML = categories
    .map(
      (cat) =>
        `<button class="tab-pill ${cat === 'All' ? 'active' : ''}" data-category="${cat}">${cat}</button>`
    )
    .join('');

  container.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.dataset.category;
      renderMenu(category === 'All' ? null : category);
    });
  });
};

const renderMenu = (category = null) => {
  const list = document.getElementById('menuList');
  if (!list) return;
  const items = category ? menuItems.filter((item) => item.category === category) : menuItems;
  list.innerHTML = items
    .map(
      (item) => `
        <div class="glass-card p-5 card-hover flex flex-col gap-4 reveal">
          <div class="image-card h-48">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
          </div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-xl">${item.name}</h3>
              <p class="text-sm text-white/70">${item.description}</p>
            </div>
            <span class="text-sea-400 font-semibold">${SF_UTILS.formatCurrency(item.price)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="badge">${item.category}</span>
            <button class="btn-primary text-sm" data-add="${item._id}">Add</button>
          </div>
        </div>
      `
    )
    .join('');

  list.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = menuItems.find((m) => m._id === btn.dataset.add);
      openItemModal(item);
    });
  });

  SF_UI.initReveal();
};

const openItemModal = (item) => {
  const modal = document.getElementById('itemModal');
  const content = document.getElementById('itemModalContent');
  if (!modal || !content) return;
  content.innerHTML = `
    <h3 class="text-2xl mb-2">${item.name}</h3>
    <p class="text-sm text-white/70 mb-4">${item.description}</p>
    <div class="flex items-center justify-between mb-4">
      <span class="text-sea-400 font-semibold">${SF_UTILS.formatCurrency(item.price)}</span>
      <span class="badge">${item.category}</span>
    </div>
    <div class="flex items-center gap-3 mb-6">
      <label for="modalQty" class="text-sm text-white/70">Quantity</label>
      <input id="modalQty" type="number" min="1" value="1" class="input-field w-24" />
    </div>
    <div class="flex gap-3 justify-end">
      <button class="btn-outline" data-close>Cancel</button>
      <button class="btn-primary" data-confirm>Add to cart</button>
    </div>
  `;
  modal.classList.add('active');

  content.querySelector('[data-close]').addEventListener('click', () => modal.classList.remove('active'));
  content.querySelector('[data-confirm]').addEventListener('click', () => {
    const qty = Number(document.getElementById('modalQty').value || 1);
    addToCart(item, qty);
    modal.classList.remove('active');
  });
};

const addToCart = (item, quantity = 1) => {
  const existing = cart.find((c) => c.menuItem === item._id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ menuItem: item._id, name: item.name, price: item.price, quantity });
  }
  renderCart();
  SF_UI.showToast('Added to cart', 'success');
};

const removeFromCart = (menuItem) => {
  cart = cart.filter((c) => c.menuItem !== menuItem);
  renderCart();
};

const updateQuantity = (menuItem, quantity) => {
  const item = cart.find((c) => c.menuItem === menuItem);
  if (item) {
    item.quantity = Math.max(1, quantity);
    renderCart();
  }
};

const renderCart = () => {
  const list = document.getElementById('cartItems');
  const drawerList = document.getElementById('cartDrawerItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  if (!list || !totalEl) return;

  const cartMarkup = cart
    .map(
      (item) => `
      <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p class="font-semibold">${item.name}</p>
          <p class="text-xs text-white/60">${SF_UTILS.formatCurrency(item.price)}</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="number" min="1" value="${item.quantity}" class="input-field w-16" data-qty="${item.menuItem}" />
          <button class="text-sm text-red-300" data-remove="${item.menuItem}">Remove</button>
        </div>
      </div>
    `
    )
    .join('');

  list.innerHTML = cartMarkup;
  if (drawerList) drawerList.innerHTML = cartMarkup;

  list.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });

  list.querySelectorAll('[data-qty]').forEach((input) => {
    input.addEventListener('change', () => updateQuantity(input.dataset.qty, Number(input.value)));
  });

  if (drawerList) {
    drawerList.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
    });
    drawerList.querySelectorAll('[data-qty]').forEach((input) => {
      input.addEventListener('change', () => updateQuantity(input.dataset.qty, Number(input.value)));
    });
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalEl.textContent = SF_UTILS.formatCurrency(subtotal);
  if (countEl) countEl.textContent = cart.length;
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

  const updateOrderTypeFields = () => {
    const selected = form.querySelector('input[name="orderType"]:checked');
    const type = selected ? selected.value : 'pickup';
    deliveryFields.classList.toggle('hidden', type !== 'delivery');
    dineInFields.classList.toggle('hidden', type !== 'dine-in');
  };

  const orderTypeInputs = form.querySelectorAll('input[name="orderType"]');
  orderTypeInputs.forEach((input) => input.addEventListener('change', updateOrderTypeFields));
  updateOrderTypeFields();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (cart.length === 0) return SF_UI.showToast('Add items to cart first', 'error');
    const isAuth = await SF_UTILS.isAuthenticated();
    if (!isAuth) {
      SF_UI.showToast('Please login to place an order', 'error');
      return (window.location.href = 'auth.html');
    }

    const selected = form.querySelector('input[name=\"orderType\"]:checked');
    const payload = {
      items: cart.map((item) => ({ menuItem: item.menuItem, quantity: item.quantity })),
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
      cart = [];
      renderCart();
      form.reset();
      SF_UI.showToast('Order submitted', 'success');
      document.getElementById('orderConfirmation').innerHTML = `
        <div class="glass-card p-6 mt-6">
          <h3 class="text-2xl mb-2">Order Confirmed</h3>
          <p class="text-white/70">Reference: <span class="text-sea-400 font-semibold">${order.orderNumber}</span></p>
        </div>
      `;
    } catch (error) {
      SF_UI.showToast(error.message, 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const applyOrderPrefill = () => {
  const params = new URLSearchParams(window.location.search);
  const orderType = params.get('orderType');
  const date = params.get('date');
  const time = params.get('time');

  const form = document.getElementById('orderForm');
  if (!form) return;
  if (orderType) {
    form.querySelectorAll('input[name=\"orderType\"]').forEach((input) => {
      input.checked = input.value === orderType;
    });
    const selected = form.querySelector('input[name=\"orderType\"]:checked');
    if (selected) selected.dispatchEvent(new Event('change'));
  }
  if (date) document.getElementById('orderDate').value = date;
  if (time) document.getElementById('orderTime').value = time;
};

const initCartDrawer = () => {
  const btn = document.getElementById('cartToggle');
  const drawer = document.getElementById('cartDrawer');
  const closeBtn = document.getElementById('cartClose');
  if (!btn || !drawer || !closeBtn) return;
  btn.addEventListener('click', () => drawer.classList.toggle('translate-x-full'));
  closeBtn.addEventListener('click', () => drawer.classList.add('translate-x-full'));
};

const initMenuPage = () => {
  initCartDrawer();
  loadMenu();
  renderCart();
  initOrderForm();
  applyOrderPrefill();

  const modal = document.getElementById('itemModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('active');
    });
  }
};

document.addEventListener('DOMContentLoaded', initMenuPage);
