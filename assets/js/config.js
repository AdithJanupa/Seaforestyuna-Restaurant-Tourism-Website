const MENU_CATEGORY_ORDER = [
  'Starters',
  'Soups',
  'Salads',
  'Burgers',
  'Wraps',
  'Sandwiches',
  'Italian Corner',
  'Kids Corner',
  'Breakfast',
  'Sri Lankan',
  'Curries',
  'Kottu',
  'Fried Rice',
  'Grilled',
  'Desserts',
  'Hot',
  'Cold'
];

const MENU_CATEGORY_DETAILS = {
  Starters: {
    label: 'Fresh Openers',
    note: 'Light bites and crispy favorites to start your meal.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
  },
  Soups: {
    label: 'Warm Bowls',
    note: 'Comforting soups with seafood, chicken, and creamy house blends.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80'
  },
  Salads: {
    label: 'Garden Picks',
    note: 'Fresh greens, tropical fruit, and bright coastal dressings.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  },
  Burgers: {
    label: 'Grill Favorites',
    note: 'Stacked burgers served with a satisfying restaurant-style finish.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80'
  },
  Wraps: {
    label: 'Served with Fries',
    note: 'Fajita-inspired wraps packed with mozzarella, vegetables, and bold flavor.',
    image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=1200&q=80'
  },
  Sandwiches: {
    label: 'Cafe Classics',
    note: 'Freshly layered sandwiches for breakfast, brunch, or a light lunch.',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80'
  },
  'Italian Corner': {
    label: 'Pasta Plates',
    note: 'Creamy, tomato-rich, and seafood-led pasta dishes from the Italian corner.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80'
  },
  'Kids Corner': {
    label: 'Little Guests',
    note: 'Comfort food options for younger diners.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80'
  },
  Breakfast: {
    label: 'Morning Table',
    note: 'Toasts, eggs, sandwiches, and hearty breakfast picks.',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80'
  },
  'Sri Lankan': {
    label: 'Authentic Plates',
    note: 'Steamed rice served with dhal, seasonal curries, sambol, and authentic Sri Lankan spices.',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80'
  },
  Curries: {
    label: 'Spice Kitchen',
    note: 'Authentic Sri Lankan curries prepared with aromatic spices and served with rice.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80'
  },
  Kottu: {
    label: 'Street Food',
    note: 'Sri Lankan street food made with chopped roti, vegetables, egg, and curry sauce.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80'
  },
  'Fried Rice': {
    label: 'Wok Selection',
    note: 'Quick-fried rice dishes with vegetable, seafood, and mixed meat options.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80'
  },
  Grilled: {
    label: 'Served with Chips and Salad',
    note: 'Char-grilled seafood and meats, from tuna steak to mixed grilled platters.',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80'
  },
  Desserts: {
    label: 'Sweet Finish',
    note: 'Classic desserts, fruit, fritters, and ice cream to end the meal.',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80'
  },
  Hot: {
    label: 'Coffee Bar',
    note: 'Hot coffee and chocolate drinks served fresh from the bar.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'
  },
  Cold: {
    label: 'Iced Drinks',
    note: 'Chilled coffee, mocha, and sweet cold cafe favorites.',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80'
  }
};

const MENU_IMAGE_POOLS = {
  savory: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=1200&q=80'
  ],
  seafood: [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80'
  ],
  breakfast: [
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80'
  ],
  drinks: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1494314671902-399b18174975?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=1200&q=80'
  ],
  dessert: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1200&q=80'
  ]
};

const MENU_CATEGORY_IMAGE_TYPES = {
  Starters: 'savory',
  Soups: 'savory',
  Salads: 'savory',
  Burgers: 'savory',
  Wraps: 'savory',
  Sandwiches: 'savory',
  'Italian Corner': 'savory',
  'Kids Corner': 'savory',
  Breakfast: 'breakfast',
  'Sri Lankan': 'savory',
  Curries: 'savory',
  Kottu: 'savory',
  'Fried Rice': 'savory',
  Grilled: 'seafood',
  Desserts: 'dessert',
  Hot: 'drinks',
  Cold: 'drinks'
};

const hashString = (value) =>
  String(value || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const pickMenuImage = (id, category) => {
  const imageType = MENU_CATEGORY_IMAGE_TYPES[category] || 'savory';
  const pool = MENU_IMAGE_POOLS[imageType] || [];

  if (!pool.length) {
    return MENU_CATEGORY_DETAILS[category] ? MENU_CATEGORY_DETAILS[category].image : '';
  }

  return pool[hashString(id) % pool.length];
};

const FALLBACK_MENU = [];

const CONFIG = {
  API_BASE_URL: localStorage.getItem('SF_API_BASE') || 'http://localhost:5000',
  FIREBASE: {
    apiKey: 'AIzaSyD0pJmMGp6Xz164ZEyE1RIHyChAfmdE4vA',
    authDomain: 'seforetuna.firebaseapp.com',
    databaseURL: 'https://seforetuna-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'seforetuna',
    storageBucket: 'seforetuna.firebasestorage.app',
    messagingSenderId: '475205946285',
    appId: '1:475205946285:web:a6e0f0b875824b502e2f24'
  },
  SITE: {
    name: 'SeaForestuna Restaurant',
    phone: '+94 76 166 2995',
    email: 'mail@seaforestuna.com',
    address: 'Devala Road, Unawatuna 80600, Sri Lanka',
    hours: 'Daily 8:00 AM - 12:00 AM'
  },
  IMAGES: {
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80',
    dining: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&w=1600&q=80',
    plating: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1600&q=80',
    rooms: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80',
    boat: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    forest: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    map: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
    menuHero: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=80',
    roomsHero: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
    boatHero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    aboutHero: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    servicesHero: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    contactHero: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&w=1400&q=80',
    dishA: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    dishB: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
    reviewMap: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80'
  },
  MENU_CATEGORY_ORDER,
  MENU_CATEGORY_DETAILS,
  FALLBACK_MENU,
  FALLBACK_ROOMS: [],
  FALLBACK_BOATS: []
};

window.SF_CONFIG = CONFIG;
