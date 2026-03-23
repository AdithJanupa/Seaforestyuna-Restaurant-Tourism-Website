const formatCurrency = (value, options = {}) => {
  const {
    locale = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

const formatLkrPrice = (value) => `LKR ${new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value)}/-`;

const CART_STORAGE_KEY = 'sf_cart';
const ADMIN_AUTH_STORAGE_KEY = 'sf_admin_auth';

const generateTimeSlots = (start = '08:00', end = '22:00', interval = 30) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const slots = [];
  let current = new Date();
  current.setHours(startH, startM, 0, 0);
  const endTime = new Date();
  endTime.setHours(endH, endM, 0, 0);

  while (current <= endTime) {
    const hours = String(current.getHours()).padStart(2, '0');
    const minutes = String(current.getMinutes()).padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    current = new Date(current.getTime() + interval * 60000);
  }
  return slots;
};

const waitForAuth = async () => {
  if (window.SF_FIREBASE && typeof window.SF_FIREBASE.ready === 'function') {
    await window.SF_FIREBASE.ready();
  }
};

const getAuth = () => {
  const user = localStorage.getItem('sf_user');
  return { user: user ? JSON.parse(user) : null };
};

const setAuth = (token, user) => {
  if (token) localStorage.setItem('sf_token', token);
  if (user) localStorage.setItem('sf_user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('sf_token');
  localStorage.removeItem('sf_user');
};

const readAdminAuth = () => {
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const writeAdminAuth = (value) => {
  try {
    if (!value) {
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      return null;
    }
    sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(value));
    return value;
  } catch (error) {
    return null;
  }
};

const getAdminAuth = () => readAdminAuth();

const setAdminAuth = (auth) => writeAdminAuth(auth);

const setAdminUser = (user) => {
  const current = readAdminAuth();
  if (!current) return null;
  current.user = user;
  return writeAdminAuth(current);
};

const clearAdminAuth = () => {
  sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
};

const getFirebaseApiKey = () => SF_CONFIG?.FIREBASE?.apiKey || '';

const formatIdentityError = (errorCode) => {
  if (!errorCode) return 'Request failed';
  const normalized = String(errorCode).replace(/^auth\//i, '').replace(/_/g, ' ').toLowerCase();
  if (normalized === 'invalid login credentials') return 'Invalid email or password';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const buildAdminAuthState = (payload, user = null) => ({
  idToken: payload.idToken || payload.id_token || '',
  refreshToken: payload.refreshToken || payload.refresh_token || '',
  expiresAt: Date.now() + Math.max(0, Number(payload.expiresIn || payload.expires_in || 0) - 60) * 1000,
  user: user || payload.user || null
});

const refreshAdminToken = async () => {
  const auth = readAdminAuth();
  const apiKey = getFirebaseApiKey();
  if (!auth?.refreshToken || !apiKey) {
    clearAdminAuth();
    return null;
  }

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(auth.refreshToken)}`
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    clearAdminAuth();
    throw new Error(formatIdentityError(data.error?.message || data.error?.error?.message));
  }

  const nextAuth = {
    ...auth,
    ...buildAdminAuthState(data, auth.user)
  };
  writeAdminAuth(nextAuth);
  return nextAuth.idToken;
};

const getAdminToken = async () => {
  const auth = readAdminAuth();
  if (!auth?.idToken) return null;
  if (!auth.expiresAt || auth.expiresAt > Date.now()) return auth.idToken;
  return refreshAdminToken();
};

const adminLogin = async (email, password) => {
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    throw new Error('Firebase config missing. Update assets/js/config.js.');
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(formatIdentityError(data.error?.message));
  }

  const auth = buildAdminAuthState(data);
  writeAdminAuth(auth);
  return auth;
};

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        menuItem: item.menuItem,
        name: item.name || 'Menu Item',
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        image: item.image || '',
        category: item.category || ''
      }))
      .filter((item) => item.menuItem);
  } catch (error) {
    return [];
  }
};

const emitCartUpdate = (cart) => {
  window.dispatchEvent(
    new CustomEvent('sf:cart-updated', {
      detail: { cart }
    })
  );
};

const saveCart = (cart) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  emitCartUpdate(cart);
  return cart;
};

const getCart = () => readCart();

const addToCart = (item, quantity = 1) => {
  const cart = readCart();
  const menuItem = item.menuItem || item._id;
  if (!menuItem) return cart;

  const existing = cart.find((entry) => entry.menuItem === menuItem);
  if (existing) {
    existing.quantity += Math.max(1, Number(quantity) || 1);
    existing.name = item.name || existing.name;
    existing.price = Number(item.price) || existing.price;
    existing.image = item.image || existing.image;
    existing.category = item.category || existing.category;
  } else {
    cart.push({
      menuItem,
      name: item.name || 'Menu Item',
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(quantity) || 1),
      image: item.image || '',
      category: item.category || ''
    });
  }

  return saveCart(cart);
};

const removeFromCart = (menuItem) => {
  const cart = readCart().filter((item) => item.menuItem !== menuItem);
  return saveCart(cart);
};

const updateCartQuantity = (menuItem, quantity) => {
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  const cart = readCart().map((item) =>
    item.menuItem === menuItem
      ? {
          ...item,
          quantity: nextQuantity
        }
      : item
  );
  return saveCart(cart);
};

const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  emitCartUpdate([]);
};

const getCartCount = () => readCart().reduce((sum, item) => sum + item.quantity, 0);

const getCartSubtotal = () => readCart().reduce((sum, item) => sum + item.price * item.quantity, 0);

const isAuthenticated = async () => {
  await waitForAuth();
  if (window.SF_FIREBASE && window.SF_FIREBASE.getUser) {
    return !!window.SF_FIREBASE.getUser();
  }
  return !!localStorage.getItem('sf_user');
};

const apiFetch = async (path, options = {}) => {
  const { authMode = 'user', headers: optionHeaders = {}, ...fetchOptions } = options;
  let token = null;
  if (authMode === 'admin') {
    try {
      token = await getAdminToken();
    } catch (error) {
      token = null;
    }
  } else if (window.SF_FIREBASE && window.SF_FIREBASE.getToken) {
    try {
      await waitForAuth();
      token = await window.SF_FIREBASE.getToken();
    } catch (error) {
      token = null;
    }
  } else {
    token = localStorage.getItem('sf_token');
  }

  const headers = { ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...optionHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SF_CONFIG.API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
};

window.SF_UTILS = {
  formatCurrency,
  formatLkrPrice,
  generateTimeSlots,
  waitForAuth,
  getAuth,
  setAuth,
  clearAuth,
  getAdminAuth,
  setAdminAuth,
  setAdminUser,
  clearAdminAuth,
  getAdminToken,
  adminLogin,
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartCount,
  getCartSubtotal,
  isAuthenticated,
  apiFetch
};
