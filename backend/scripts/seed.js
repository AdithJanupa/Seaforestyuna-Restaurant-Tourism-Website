const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { admin, db } = require('../config/firebase');
const { createRecord } = require('../utils/firebaseDb');

const seedCollection = async (path, items) => {
  await db.ref(path).remove();
  const created = [];
  for (const item of items) {
    const record = await createRecord(path, item);
    created.push(record);
  }
  return created;
};

const seed = async () => {
  try {
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@seaforestuna.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

    let adminUser = null;
    try {
      adminUser = await admin.auth().getUserByEmail(adminEmail);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    if (!adminUser) {
      adminUser = await admin.auth().createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'SeaForestuna Admin'
      });
    }

    await admin.auth().setCustomUserClaims(adminUser.uid, { role: 'admin', admin: true });

    const menuItems = await seedCollection('menuItems', [
      {
        name: 'Seared Reef Scallops',
        description: 'Lime butter, sea asparagus, toasted pine crumbs.',
        price: 22,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1448043552756-e747b7a2b2b8?auto=format&fit=crop&w=1200&q=80',
        tags: ['seafood', 'signature'],
        isAvailable: true
      },
      {
        name: 'Forest Canopy Salad',
        description: 'Wild greens, citrus vinaigrette, candied seeds.',
        price: 14,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
        tags: ['vegetarian'],
        isAvailable: true
      },
      {
        name: 'Charcoal Lobster Tail',
        description: 'Smoked chili glaze, coconut rice, charred lime.',
        price: 42,
        category: 'Seafood Specials',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        tags: ['signature'],
        isAvailable: true
      },
      {
        name: 'Coastal Herb Snapper',
        description: 'Herb crust, seafoam beurre blanc, grilled fennel.',
        price: 34,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1200&q=80',
        isAvailable: true
      },
      {
        name: 'Mangrove Citrus Fizz',
        description: 'Yuzu, mint, sparkling sea salt rim.',
        price: 9,
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
        isAvailable: true
      },
      {
        name: 'Sand Dune Tiramisu',
        description: 'Espresso cream, cacao dust, almond crumble.',
        price: 12,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=1200&q=80',
        isAvailable: true
      }
    ]);

    const rooms = await seedCollection('rooms', [
      {
        name: 'Sea Breeze Villa',
        description: 'Ocean-facing villa with private deck and hammock lounge.',
        pricePerNight: 220,
        capacity: 2,
        amenities: ['Ocean view', 'Private deck', 'Breakfast included', 'Rain shower'],
        images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      },
      {
        name: 'Forest Canopy Suite',
        description: 'Nestled among the treetops with panoramic canopy views.',
        pricePerNight: 180,
        capacity: 3,
        amenities: ['Canopy view', 'Eco-lodge design', 'Daily tea service'],
        images: ['https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      },
      {
        name: 'Lagoon Family Lodge',
        description: 'Spacious lodge for families with lagoon access.',
        pricePerNight: 260,
        capacity: 5,
        amenities: ['Lagoon access', 'Family suite', 'Outdoor bath'],
        images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      }
    ]);

    const boats = await seedCollection('boats', [
      {
        name: 'Sunrise Mangrove Cruise',
        description: 'Golden-hour glide through mangroves with wildlife spotting.',
        durationHours: 2,
        maxCapacity: 8,
        price: 45,
        timeSlots: ['07:00', '09:30'],
        images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      },
      {
        name: 'Reef Snorkel Escape',
        description: 'Guided snorkel adventure with reef exploration.',
        durationHours: 3,
        maxCapacity: 10,
        price: 60,
        timeSlots: ['10:30', '14:00'],
        images: ['https://images.unsplash.com/photo-1477792075202-936af4ee5505?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      },
      {
        name: 'Twilight Lagoon Sail',
        description: 'Evening sail with lanterns and coastal bites.',
        durationHours: 2.5,
        maxCapacity: 12,
        price: 55,
        timeSlots: ['17:00', '19:30'],
        images: ['https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'],
        isActive: true
      }
    ]);

    await db.ref('contentBlocks').remove();
    await db.ref('contentBlocks/about').set({
      id: 'about',
      _id: 'about',
      key: 'about',
      title: 'SeaForestuna Restaurant',
      body: 'SeaForestuna blends coastal gastronomy with eco-luxury stays and curated sea adventures. Our chefs craft ocean-forward menus while our hospitality team guides you into mangrove forests, reef lagoons, and moonlit sails.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    await db.ref('contentBlocks/ratings').set({
      id: 'ratings',
      _id: 'ratings',
      key: 'ratings',
      title: 'Guest Ratings and Feedback',
      body: 'Read verified SeaForestuna feedback, share your own experience, and discover how guests rate our dining, stays, and lagoon journeys.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    console.log('Seed completed');
    console.log('Admin credentials:', adminEmail, adminPassword);
    console.log('Seeded menu items:', menuItems.length);
    console.log('Seeded rooms:', rooms.length);
    console.log('Seeded boats:', boats.length);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
