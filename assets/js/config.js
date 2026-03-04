const CONFIG = {
  API_BASE_URL: localStorage.getItem('SF_API_BASE') || 'http://localhost:5000',
  FIREBASE: {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'your-project-id.firebaseapp.com',
    databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project-id.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  SITE: {
    name: 'SeaForestuna Restaurant',
    phone: '+1 (555) 482-0119',
    email: 'hello@seaforestuna.com',
    address: 'Coastal Forest Bay, Seafront Drive, Azure Coast'
  },
  IMAGES: {
    hero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80',
    dining: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&w=1600&q=80',
    plating: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1600&q=80',
    rooms: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80',
    boat: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    forest: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    map: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
    menuHero: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&w=1400&q=80',
    roomsHero: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
    boatHero: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    aboutHero: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    servicesHero: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    contactHero: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?auto=format&fit=crop&w=1400&q=80',
    dishA: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    dishB: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
    reviewMap: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80'
  },
  FALLBACK_MENU: [
    {
      _id: 'fallback-1',
      name: 'Seared Reef Scallops',
      description: 'Lime butter, sea asparagus, toasted pine crumbs.',
      price: 22,
      category: 'Starters',
      image: 'https://images.unsplash.com/photo-1448043552756-e747b7a2b2b8?auto=format&fit=crop&w=1200&q=80'
    },
    {
      _id: 'fallback-2',
      name: 'Charcoal Lobster Tail',
      description: 'Smoked chili glaze, coconut rice, charred lime.',
      price: 42,
      category: 'Seafood Specials',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'
    },
    {
      _id: 'fallback-3',
      name: 'Forest Canopy Salad',
      description: 'Wild greens, citrus vinaigrette, candied seeds.',
      price: 14,
      category: 'Starters',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80'
    },
    {
      _id: 'fallback-4',
      name: 'Coastal Herb Snapper',
      description: 'Herb crust, seafoam beurre blanc, grilled fennel.',
      price: 34,
      category: 'Mains',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  FALLBACK_ROOMS: [
    {
      _id: 'room-1',
      name: 'Sea Breeze Villa',
      description: 'Ocean-facing villa with private deck and hammock lounge.',
      pricePerNight: 220,
      capacity: 2,
      amenities: ['Ocean view', 'Private deck', 'Breakfast included', 'Rain shower'],
      images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80']
    },
    {
      _id: 'room-2',
      name: 'Forest Canopy Suite',
      description: 'Nestled among the treetops with panoramic canopy views.',
      pricePerNight: 180,
      capacity: 3,
      amenities: ['Canopy view', 'Eco-lodge design', 'Daily tea service'],
      images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80']
    }
  ],
  FALLBACK_BOATS: [
    {
      _id: 'boat-1',
      name: 'Sunrise Mangrove Cruise',
      description: 'Golden-hour glide through mangroves with wildlife spotting.',
      durationHours: 2,
      maxCapacity: 8,
      price: 45,
      timeSlots: ['07:00', '09:30'],
      images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80']
    }
  ]
};

window.SF_CONFIG = CONFIG;
