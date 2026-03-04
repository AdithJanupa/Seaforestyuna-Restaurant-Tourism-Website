(() => {
  const config = SF_CONFIG.FIREBASE;
  if (!config || !config.apiKey) {
    console.warn('Firebase config missing. Add credentials in assets/js/config.js');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  const auth = firebase.auth();

  let resolveReady = null;
  let readyResolved = false;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const setLocalUser = async (user) => {
    if (!user) {
      localStorage.removeItem('sf_user');
      return;
    }
    const tokenResult = await user.getIdTokenResult();
    const role = tokenResult.claims.role || (tokenResult.claims.admin ? 'admin' : 'user');
    const profile = {
      id: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      role
    };
    localStorage.setItem('sf_user', JSON.stringify(profile));
  };

  auth.onAuthStateChanged((user) => {
    if (!readyResolved) {
      readyResolved = true;
      if (resolveReady) resolveReady(user);
    }
    if (!user) {
      localStorage.removeItem('sf_user');
      return;
    }
    setLocalUser(user).catch((error) => console.warn('Auth profile sync failed', error));
  });

  const register = async (name, email, password) => {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (name) {
      await cred.user.updateProfile({ displayName: name });
    }
    await setLocalUser(cred.user);
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await setLocalUser(cred.user);
    return cred.user;
  };

  const signInWithCustomToken = async (token) => {
    const cred = await auth.signInWithCustomToken(token);
    await cred.user.getIdToken(true);
    await setLocalUser(cred.user);
    return cred.user;
  };

  const signOut = async () => {
    await auth.signOut();
    localStorage.removeItem('sf_user');
  };

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
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
