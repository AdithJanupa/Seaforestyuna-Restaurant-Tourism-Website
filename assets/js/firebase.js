(() => {
  const AUTH_STORAGE_KEYS = {
    token: 'sf_token',
    user: 'sf_user'
  };

  const resolveFriendlyError = (error) => {
    const code = String(error?.code || error?.message || '').replace(/^auth\//i, '');

    switch (code) {
      case 'invalid-email':
        return 'Enter a valid email address';
      case 'user-disabled':
        return 'This account has been disabled';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
      case 'invalid-login-credentials':
        return 'Invalid email or password';
      case 'email-already-in-use':
        return 'This email address is already registered';
      case 'weak-password':
        return 'Password is too weak';
      case 'operation-not-allowed':
        return 'Email and password sign-in is not enabled in Firebase';
      case 'network-request-failed':
        return 'Network error. Check your internet connection and try again';
      default:
        return error?.message || 'Authentication request failed';
    }
  };

  const clearStoredAuth = () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  };

  const storeAuthSnapshot = (token, profile) => {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.token);
    }

    if (profile) {
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(profile));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    }
  };

  const buildUserProfile = async (user) => {
    if (!user) return null;

    const tokenResult = await user.getIdTokenResult();
    const role = tokenResult.claims.role || (tokenResult.claims.admin ? 'admin' : 'user');

    return {
      token: tokenResult.token,
      profile: {
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        role
      }
    };
  };

  const config = window.SF_CONFIG?.FIREBASE;

  if (!config || !config.apiKey) {
    console.warn('Firebase config missing. Add credentials in assets/js/config.js');
    return;
  }

  if (typeof window.firebase === 'undefined') {
    console.warn('Firebase SDK missing. Ensure Firebase compat scripts load before assets/js/firebase.js');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const auth = firebase.auth();
  let readyResolved = false;
  let resolveReady = null;

  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const resolveReadyOnce = (user) => {
    if (readyResolved) return;
    readyResolved = true;
    if (resolveReady) resolveReady(user || null);
  };

  const syncAuthState = async (user) => {
    if (!user) {
      clearStoredAuth();
      return null;
    }

    const snapshot = await buildUserProfile(user);
    storeAuthSnapshot(snapshot.token, snapshot.profile);
    return snapshot.profile;
  };

  const withFriendlyError = async (task) => {
    try {
      return await task();
    } catch (error) {
      throw new Error(resolveFriendlyError(error));
    }
  };

  const bootstrapPersistence = async () => {
    if (
      typeof auth.setPersistence !== 'function' ||
      !firebase.auth ||
      !firebase.auth.Auth ||
      !firebase.auth.Auth.Persistence
    ) {
      return;
    }

    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  };

  bootstrapPersistence().catch((error) => {
    console.warn('Firebase auth persistence setup failed', error);
  });

  auth.onIdTokenChanged(async (user) => {
    try {
      await syncAuthState(user);
    } catch (error) {
      console.warn('Auth profile sync failed', error);
    } finally {
      resolveReadyOnce(user);
    }
  });

  const register = async (name, email, password) =>
    withFriendlyError(async () => {
      const credential = await auth.createUserWithEmailAndPassword(email, password);

      if (name && credential.user) {
        await credential.user.updateProfile({ displayName: name });
        await credential.user.reload();
      }

      const user = auth.currentUser || credential.user;
      await syncAuthState(user);
      return user;
    });

  const login = async (email, password) =>
    withFriendlyError(async () => {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      await syncAuthState(credential.user);
      return credential.user;
    });

  const signInWithCustomToken = async (token) =>
    withFriendlyError(async () => {
      const credential = await auth.signInWithCustomToken(token);
      const user = credential.user;

      if (user) {
        await user.getIdToken(true);
      }

      await syncAuthState(user);
      return user;
    });

  const signOut = async () =>
    withFriendlyError(async () => {
      await auth.signOut();
      clearStoredAuth();
    });

  const getToken = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) {
      return localStorage.getItem(AUTH_STORAGE_KEYS.token);
    }

    const token = await user.getIdToken(forceRefresh);
    if (token && token !== localStorage.getItem(AUTH_STORAGE_KEYS.token)) {
      const snapshot = await buildUserProfile(user);
      storeAuthSnapshot(snapshot.token, snapshot.profile);
    }
    return token;
  };

  const getUser = () => auth.currentUser;

  window.SF_FIREBASE = {
    auth,
    register,
    login,
    signInWithCustomToken,
    signOut,
    getToken,
    getUser,
    ready: () => ready
  };
})();
