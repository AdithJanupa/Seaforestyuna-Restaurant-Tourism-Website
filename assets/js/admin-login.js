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

  const ensureAdminAuthConfig = () => {
    if (!SF_CONFIG?.FIREBASE?.apiKey) {
      setStatus('Firebase config missing. Update assets/js/config.js.', 'error');
      return false;
    }
    return true;
  };

  const verifyAdmin = async () => {
    const data = await SF_UTILS.apiFetch('/api/auth/me', { authMode: 'admin' });
    if (!data.user || data.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    SF_UTILS.setAdminUser(data.user);
    return data.user;
  };

  const redirectToDashboard = () => {
    window.location.href = 'dashboard.html';
  };

  const checkExistingSession = async () => {
    if (!ensureAdminAuthConfig()) return;
    if (!SF_UTILS.getAdminAuth()?.idToken) return;
    try {
      await verifyAdmin();
      redirectToDashboard();
    } catch (error) {
      SF_UTILS.clearAdminAuth();
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!ensureAdminAuthConfig()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      SF_UI.showLoader();
      await SF_UTILS.adminLogin(payload.email, payload.password);
      await verifyAdmin();
      setStatus('Admin session started in this tab.', 'success');
      SF_UI.showToast('Welcome back, admin', 'success');
      redirectToDashboard();
    } catch (error) {
      SF_UTILS.clearAdminAuth();
      setStatus(error.message || 'Login failed', 'error');
      SF_UI.showToast(error.message || 'Login failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });

  checkExistingSession();
};

document.addEventListener('DOMContentLoaded', initAdminLogin);
