const initAuthPage = () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');

  const refreshBadge = () => {
    const { user } = SF_UTILS.getAuth();
    if (userBadge) {
      userBadge.textContent = user ? `Logged in as ${user.name || user.email} (${user.role})` : 'Not logged in';
    }
  };

  refreshBadge();
  if (window.SF_FIREBASE && window.SF_FIREBASE.ready) {
    window.SF_FIREBASE.ready().then(refreshBadge).catch(() => {});
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
          await window.SF_FIREBASE.signOut();
        } else {
          SF_UTILS.clearAuth();
        }
        SF_UI.showToast('Logged out', 'success');
        refreshBadge();
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        SF_UI.showToast('Unable to log out', 'error');
      }
    });
  }

  const ensureFirebase = () => {
    if (!window.SF_FIREBASE) {
      SF_UI.showToast('Firebase config missing. Update assets/js/config.js', 'error');
      return false;
    }
    return true;
  };

  const handleLogin = async (form) => {
    if (!ensureFirebase()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      SF_UI.showLoader();
      await window.SF_FIREBASE.login(payload.email, payload.password);
      refreshBadge();
      SF_UI.showToast('Welcome back to SeaForestuna', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 900);
    } catch (error) {
      SF_UI.showToast(error.message || 'Login failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  };

  const handleRegister = async (form) => {
    if (!ensureFirebase()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      SF_UI.showLoader();
      await window.SF_FIREBASE.register(payload.name, payload.email, payload.password);
      refreshBadge();
      SF_UI.showToast('Account created', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 900);
    } catch (error) {
      SF_UI.showToast(error.message || 'Registration failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleLogin(loginForm);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleRegister(registerForm);
    });
  }

};

document.addEventListener('DOMContentLoaded', initAuthPage);
