const initAdminLogin = () => {
  const form = document.getElementById('adminLoginForm');
  const status = document.getElementById('adminStatus');
  if (!form) return;

  const setStatus = (message, type = 'info') => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('text-red-300', 'text-green-300', 'text-white/60');
    if (type === 'error') status.classList.add('text-red-300');
    if (type === 'success') status.classList.add('text-green-300');
    if (type === 'info') status.classList.add('text-white/60');
  };

  const ensureFirebase = () => {
    if (!window.SF_FIREBASE) {
      setStatus('Firebase config missing. Update assets/js/config.js.', 'error');
      return false;
    }
    return true;
  };

  const verifyAdmin = async () => {
    const data = await SF_UTILS.apiFetch('/api/auth/me');
    if (!data.user || data.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return data.user;
  };

  const redirectToDashboard = () => {
    window.location.href = 'dashboard.html';
  };

  const checkExistingSession = async () => {
    if (!ensureFirebase()) return;
    try {
      await SF_UTILS.waitForAuth();
      if (!window.SF_FIREBASE.getUser()) return;
      await verifyAdmin();
      redirectToDashboard();
    } catch (error) {
      await window.SF_FIREBASE.signOut();
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!ensureFirebase()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      SF_UI.showLoader();
      await window.SF_FIREBASE.login(payload.email, payload.password);
      await verifyAdmin();
      SF_UI.showToast('Welcome back, admin', 'success');
      redirectToDashboard();
    } catch (error) {
      if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
        await window.SF_FIREBASE.signOut();
      }
      setStatus(error.message || 'Login failed', 'error');
      SF_UI.showToast(error.message || 'Login failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });

  checkExistingSession();
};

document.addEventListener('DOMContentLoaded', initAdminLogin);
