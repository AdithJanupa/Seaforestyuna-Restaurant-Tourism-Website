(() => {
const PROFILE_STORAGE_KEY = 'sf_profile_details';

const getStoredProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const getProfileExtras = (userId) => {
  if (!userId) return {};
  return getStoredProfiles()[userId] || {};
};

const saveProfileExtras = (userId, details) => {
  if (!userId) return {};

  const profiles = getStoredProfiles();
  profiles[userId] = {
    ...(profiles[userId] || {}),
    ...details
  };
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  return profiles[userId];
};

const getInitials = (name, email) => {
  const source = (name || email || 'Sea Forest').trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

const formatRole = (role) => {
  const value = String(role || 'user').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatUpdatedAt = (value) => {
  if (!value) return 'Last updated: just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last updated: just now';

  return `Last updated: ${new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)}`;
};

const getCurrentUser = () => SF_UTILS.getAuth().user;

const syncLocalUser = (updates) => {
  const current = getCurrentUser();
  if (!current) return null;

  const nextUser = {
    ...current,
    ...updates
  };
  localStorage.setItem('sf_user', JSON.stringify(nextUser));
  return nextUser;
};

const populateProfile = () => {
  const user = getCurrentUser();
  if (!user) return;

  const extras = getProfileExtras(user.id);
  const displayName = extras.displayName || user.name || user.email || 'SeaForestuna User';
  const phone = extras.phone || '';
  const location = extras.location || '';
  const bio = extras.bio || '';
  const updatedAt = extras.updatedAt || new Date().toISOString();

  const summaryMap = {
    profileAvatar: getInitials(displayName, user.email),
    profileSummaryName: displayName,
    profileSummaryRole: formatRole(user.role),
    profileSummaryEmail: user.email || '',
    profileSummaryUpdated: formatUpdatedAt(updatedAt),
    profileEmail: user.email || '',
    profileRole: formatRole(user.role),
    profileDisplayName: displayName,
    profilePhone: phone,
    profileLocation: location,
    profileBio: bio
  };

  Object.entries(summaryMap).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (!element) return;

    if ('value' in element) {
      element.value = value;
    } else {
      element.textContent = value;
    }
  });
};

const saveProfile = async (event) => {
  event.preventDefault();

  const user = getCurrentUser();
  const form = document.getElementById('profileForm');
  if (!user || !form) return;

  const formData = new FormData(form);
  const displayName = String(formData.get('displayName') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const location = String(formData.get('location') || '').trim();
  const bio = String(formData.get('bio') || '').trim();

  if (!displayName) {
    SF_UI.showToast('Display name is required', 'error');
    return;
  }

  try {
    SF_UI.showLoader();

    if (window.SF_FIREBASE && window.SF_FIREBASE.getUser) {
      const firebaseUser = window.SF_FIREBASE.getUser();
      if (firebaseUser && firebaseUser.displayName !== displayName) {
        await firebaseUser.updateProfile({ displayName });
      }
    }

    syncLocalUser({ name: displayName });
    saveProfileExtras(user.id, {
      displayName,
      phone,
      location,
      bio,
      updatedAt: new Date().toISOString()
    });

    populateProfile();
    SF_UI.showToast('Profile saved successfully', 'success');
  } catch (error) {
    SF_UI.showToast(error.message || 'Unable to save profile', 'error');
  } finally {
    SF_UI.hideLoader();
  }
};

const handleLogout = async () => {
  try {
    if (window.SF_FIREBASE && window.SF_FIREBASE.signOut) {
      await window.SF_FIREBASE.signOut();
    } else {
      SF_UTILS.clearAuth();
    }

    window.location.href = 'auth.html#login';
  } catch (error) {
    SF_UI.showToast('Unable to logout', 'error');
  }
};

const guardProfilePage = async () => {
  if (window.SF_FIREBASE && window.SF_FIREBASE.ready) {
    try {
      await window.SF_FIREBASE.ready();
    } catch (error) {
      // Keep local session fallback if Firebase ready fails.
    }
  }

  if (!getCurrentUser()) {
    window.location.href = 'auth.html#login';
    return false;
  }

  return true;
};

const initProfilePage = async () => {
  SF_UI.injectNavbar();
  SF_UI.injectFooter();
  SF_UI.setActiveNav();
  SF_UI.initMobileMenu();
  SF_UI.initReveal();

  const canViewProfile = await guardProfilePage();
  if (!canViewProfile) return;

  populateProfile();

  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', saveProfile);
  }

  const logoutBtn = document.getElementById('profileLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
};

document.addEventListener('DOMContentLoaded', initProfilePage);
})();
