const initAuthPage = () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const userBadge = document.getElementById('userBadge');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const tabButtons = Array.from(document.querySelectorAll('[data-auth-tab]'));
  const switchButtons = Array.from(document.querySelectorAll('[data-auth-switch]'));
  const panels = Array.from(document.querySelectorAll('[data-auth-panel]'));

  const modeContent = {
    login: {
      title: 'Login to your account',
      subtitle: 'Sign in with your email and password to continue booking rooms, meals, and seaside experiences.'
    },
    register: {
      title: 'Create your account',
      subtitle: 'Enter your details to open a SeaForestuna profile and start planning your next visit.'
    }
  };

  const updateMode = (mode, syncHash = true) => {
    const selectedMode = modeContent[mode] ? mode : 'login';

    tabButtons.forEach((button) => {
      const isActive = button.dataset.authTab === selectedMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.authPanel === selectedMode;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    if (title) title.textContent = modeContent[selectedMode].title;
    if (subtitle) subtitle.textContent = modeContent[selectedMode].subtitle;

    if (syncHash) {
      const hash = selectedMode === 'register' ? '#register' : '#login';
      window.history.replaceState(null, '', hash);
    }
  };

  const refreshBadge = () => {
    const { user } = SF_UTILS.getAuth();
    const isLoggedIn = Boolean(user);

    if (userBadge) {
      userBadge.textContent = isLoggedIn
        ? `Logged in as ${user.name || user.email} (${user.role || 'user'})`
        : 'Not logged in';
    }

    if (logoutBtn) {
      logoutBtn.disabled = !isLoggedIn;
    }
  };

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
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 900);
    } catch (error) {
      SF_UI.showToast(error.message || 'Login failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  };

  const handleRegister = async (form) => {
    if (!ensureFirebase()) return;
    const payload = Object.fromEntries(new FormData(form).entries());

    if ((payload.password || '').trim().length < 6) {
      SF_UI.showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      SF_UI.showToast('Passwords do not match', 'error');
      return;
    }

    try {
      SF_UI.showLoader();
      await window.SF_FIREBASE.register(payload.name.trim(), payload.email, payload.password);
      refreshBadge();
      form.reset();
      SF_UI.showToast('Account created successfully', 'success');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 900);
    } catch (error) {
      SF_UI.showToast(error.message || 'Registration failed', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateMode(button.dataset.authTab);
    });
  });

  switchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateMode(button.dataset.authSwitch);
    });
  });

  refreshBadge();

  if (window.SF_FIREBASE && window.SF_FIREBASE.ready) {
    window.SF_FIREBASE.ready().then(refreshBadge).catch(() => {});
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (logoutBtn.disabled) return;

      try {
        if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
          await window.SF_FIREBASE.signOut();
        } else {
          SF_UTILS.clearAuth();
        }
        SF_UI.showToast('Logged out', 'success');
        refreshBadge();
      } catch (error) {
        SF_UI.showToast('Unable to log out', 'error');
      }
    });
  }

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

  const initialMode = window.location.hash === '#register' ? 'register' : 'login';
  updateMode(initialMode, false);
};

document.addEventListener('DOMContentLoaded', initAuthPage);
