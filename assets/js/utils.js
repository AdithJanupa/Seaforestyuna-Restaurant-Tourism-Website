const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

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

const isAuthenticated = async () => {
  await waitForAuth();
  if (window.SF_FIREBASE && window.SF_FIREBASE.getUser) {
    return !!window.SF_FIREBASE.getUser();
  }
  return !!localStorage.getItem('sf_user');
};

const apiFetch = async (path, options = {}) => {
  let token = null;
  if (window.SF_FIREBASE && window.SF_FIREBASE.getToken) {
    try {
      await waitForAuth();
      token = await window.SF_FIREBASE.getToken();
    } catch (error) {
      token = null;
    }
  } else {
    token = localStorage.getItem('sf_token');
  }

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SF_CONFIG.API_BASE_URL}${path}`, {
    ...options,
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
  generateTimeSlots,
  waitForAuth,
  getAuth,
  setAuth,
  clearAuth,
  isAuthenticated,
  apiFetch
};
