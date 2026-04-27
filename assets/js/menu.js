(() => {
let menuItems = [];
let categoryObserver = null;
let menuSource = 'live';
let menuFiltersBound = false;

const menuFilters = {
  search: '',
  category: 'all',
  sort: 'default'
};

const categoryDetails = SF_CONFIG.MENU_CATEGORY_DETAILS || {};
const categoryOrder = SF_CONFIG.MENU_CATEGORY_ORDER || [];
const fallbackMenu = Array.isArray(SF_CONFIG.FALLBACK_MENU) ? SF_CONFIG.FALLBACK_MENU.filter(Boolean) : [];
const extraMenuDishes = Array.isArray(SF_CONFIG.EXTRA_MENU_DISHES) ? SF_CONFIG.EXTRA_MENU_DISHES.filter(Boolean) : [];

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getSectionId = (category) => `menu-category-${slugify(category)}`;

const getOrderedCategories = (items = menuItems) => {
  const available = [...new Set(items.map((item) => item.category).filter(Boolean))];
  return [...categoryOrder.filter((category) => available.includes(category)), ...available.filter((category) => !categoryOrder.includes(category))];
};

const getItemPriceLabel = (item) => {
  if (item.marketPrice) {
    return item.priceLabel || 'Market Price';
  }

  return SF_UTILS.formatPrice(item.price || 0);
};

const getMenuItemId = (item) => item._id || item.id || item.menuItem || '';

const isStockDishImage = (url) => {
  if (!url) return true;
  return /images\.unsplash\.com|source\.unsplash\.com/i.test(url);
};

const hashString = (value) =>
  String(value || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

const realDishPhotoRules = [
  {
    keywords: ['scallop', 'prawn', 'shrimp'],
    image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['salad', 'greens'],
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['lobster', 'crab'],
    image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['snapper', 'fish', 'tuna', 'reef'],
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['chicken', 'lemongrass'],
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['short rib', 'beef'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['rice', 'curry', 'sri lankan'],
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['burger'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['pasta', 'italian'],
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['breakfast', 'egg', 'toast'],
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['coconut palm', 'palm pudding', 'pudding'],
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['tiramisu', 'dessert', 'cake'],
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['latte', 'coffee', 'mocha', 'hot'],
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['passionfruit', 'cooler'],
    image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=1200&q=80'
  },
  {
    keywords: ['fizz', 'juice', 'drink', 'cold', 'iced'],
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80'
  }
];

const realDishPhotoPools = {
  Starters: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80'
  ],
  Salads: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80'],
  Soups: ['https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80'],
  Burgers: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80'],
  Breakfast: ['https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1200&q=80'],
  'Sri Lankan': ['https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80'],
  Curries: ['https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80'],
  Grilled: [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80'
  ],
  'Seafood Specials': [
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=80'
  ],
  Mains: [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
  ],
  Desserts: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80'
  ],
  Hot: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'],
  Cold: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80'],
  Drinks: [
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=1200&q=80'
  ]
};

const getRealDishPhoto = (item) => {
  const searchableText = [item.name, item.category, item.description].map(normalizeText).join(' ');
  const matchedRule = realDishPhotoRules.find((rule) => rule.keywords.some((keyword) => searchableText.includes(keyword)));
  if (matchedRule) return matchedRule.image;

  const pool = realDishPhotoPools[item.category] || [SF_CONFIG.IMAGES.dishA, SF_CONFIG.IMAGES.dishB, SF_CONFIG.IMAGES.menuHero].filter(Boolean);
  return pool[hashString(getMenuItemId(item) || item.name || item.category) % pool.length];
};

const getItemFallbackImage = (item) => (categoryDetails[item.category] && categoryDetails[item.category].image) || SF_CONFIG.IMAGES.menuHero;

const getItemImage = (item) => (isStockDishImage(item.image) ? getRealDishPhoto(item) : item.image || getItemFallbackImage(item));

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const getMenuSignature = (item) => `${normalizeText(item.category)}::${normalizeText(item.name)}`;

const mergeWithExtraDishes = (items) => {
  const merged = Array.isArray(items) ? [...items] : [];
  const signatures = new Set(merged.map(getMenuSignature));

  extraMenuDishes.forEach((dish) => {
    const signature = getMenuSignature(dish);
    if (!signatures.has(signature)) {
      merged.push(dish);
      signatures.add(signature);
    }
  });

  return merged;
};

const getSortablePrice = (item, direction = 'asc') => {
  if (item.marketPrice) {
    return direction === 'desc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }

  return Number(item.price) || 0;
};

const getFilteredMenuItems = () => {
  const searchTerm = normalizeText(menuFilters.search);
  const selectedCategory = menuFilters.category;

  const filtered = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchTerm) return true;

    const searchableText = [item.name, item.category, item.description, item.priceLabel].map(normalizeText).join(' ');
    return searchableText.includes(searchTerm);
  });

  const sorted = [...filtered];

  if (menuFilters.sort === 'price-asc') {
    sorted.sort((a, b) => getSortablePrice(a, 'asc') - getSortablePrice(b, 'asc'));
  } else if (menuFilters.sort === 'price-desc') {
    sorted.sort((a, b) => getSortablePrice(b, 'desc') - getSortablePrice(a, 'desc'));
  } else if (menuFilters.sort === 'name-asc') {
    sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  return sorted;
};

const applyFallbackMenu = () => {
  menuItems = [...fallbackMenu];
  menuSource = menuItems.length ? 'fallback' : 'empty';
  return menuItems.length > 0;
};

const setActiveCategoryLink = (category) => {
  document.querySelectorAll('[data-category-link]').forEach((link) => {
    link.classList.toggle('active', link.dataset.categoryLink === category);
  });
};

const initCategoryObserver = () => {
  if (categoryObserver) {
    categoryObserver.disconnect();
  }

  const sections = document.querySelectorAll('[data-menu-section]');
  if (!sections.length) return;

  categoryObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length) {
        setActiveCategoryLink(visibleEntries[0].target.dataset.menuSection);
      }
    },
    {
      rootMargin: '-18% 0px -62% 0px',
      threshold: [0.15, 0.35, 0.6]
    }
  );

  sections.forEach((section) => categoryObserver.observe(section));
};

const renderCategories = (items = getFilteredMenuItems()) => {
  const container = document.getElementById('menuCategories');
  if (!container) return;

  const categories = getOrderedCategories(items);
  const categoryCounts = items.reduce((counts, item) => {
    if (!item.category) return counts;
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});

  if (!categories.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = categories
    .map(
      (category, index) => `
        <a
          href="#${getSectionId(category)}"
          class="tab-pill ${index === 0 ? 'active' : ''}"
          data-category-link="${escapeHtml(category)}"
        >
          <span class="tab-pill__count">${categoryCounts[category] || 0}</span>
          <span>${escapeHtml(category)}</span>
        </a>
      `
    )
    .join('');

  container.querySelectorAll('[data-category-link]').forEach((link) => {
    link.addEventListener('click', () => {
      setActiveCategoryLink(link.dataset.categoryLink);
    });
  });
};

const renderMenuFinderOptions = () => {
  const categorySelect = document.getElementById('menuCategoryFilter');
  if (!categorySelect) return;

  const categories = getOrderedCategories(menuItems);
  if (menuFilters.category !== 'all' && !categories.includes(menuFilters.category)) {
    menuFilters.category = 'all';
  }

  categorySelect.innerHTML = `
    <option value="all">All categories</option>
    ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
  `;
  categorySelect.value = menuFilters.category;
};

const syncMenuFilterInputs = () => {
  const searchInput = document.getElementById('menuSearchInput');
  const categorySelect = document.getElementById('menuCategoryFilter');
  const sortSelect = document.getElementById('menuSortFilter');

  if (searchInput) searchInput.value = menuFilters.search;
  if (categorySelect) categorySelect.value = menuFilters.category;
  if (sortSelect) sortSelect.value = menuFilters.sort;
};

const updateMenuResultSummary = (filteredItems) => {
  const summary = document.getElementById('menuResultSummary');
  if (!summary) return;

  const total = menuItems.length;
  const resultLabel = `${filteredItems.length} of ${total} menu ${total === 1 ? 'item' : 'items'}`;
  const activeFilters = [];

  if (menuFilters.search) activeFilters.push(`matching "${menuFilters.search}"`);
  if (menuFilters.category !== 'all') activeFilters.push(`in ${menuFilters.category}`);
  if (menuFilters.sort !== 'default') activeFilters.push('sorted');

  summary.textContent = activeFilters.length ? `Showing ${resultLabel} ${activeFilters.join(', ')}.` : `Showing all ${total} menu ${total === 1 ? 'item' : 'items'}.`;
};

const refreshMenuView = () => {
  const filteredItems = getFilteredMenuItems();
  renderCategories(filteredItems);
  renderMenu(filteredItems);
};

const resetMenuFilters = () => {
  menuFilters.search = '';
  menuFilters.category = 'all';
  menuFilters.sort = 'default';
  syncMenuFilterInputs();
  refreshMenuView();
};

const bindMenuFilterControls = () => {
  if (menuFiltersBound) return;
  menuFiltersBound = true;

  const searchInput = document.getElementById('menuSearchInput');
  const categorySelect = document.getElementById('menuCategoryFilter');
  const sortSelect = document.getElementById('menuSortFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      menuFilters.search = searchInput.value.trim();
      refreshMenuView();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      menuFilters.category = categorySelect.value || 'all';
      refreshMenuView();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      menuFilters.sort = sortSelect.value || 'default';
      refreshMenuView();
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-menu-reset]')) {
      resetMenuFilters();
    }
  });
};

const renderMenu = (filteredItems = getFilteredMenuItems()) => {
  const container = document.getElementById('menuList');
  if (!container) return;

  updateMenuResultSummary(filteredItems);

  const categories = getOrderedCategories(filteredItems);
  if (!categories.length) {
    container.innerHTML = `
      <div class="glass-card p-8 text-center reveal">
        <span class="badge">${menuItems.length ? 'No Matches' : 'Menu Unavailable'}</span>
        <h2 class="display text-3xl mt-4">${menuItems.length ? 'No dishes match those filters' : 'No menu items available right now'}</h2>
        <p class="text-white/70 mt-3">
          ${menuItems.length ? 'Try a different search, category, or sort option to reveal more dishes.' : 'Add menu items from the admin side or check the backend connection.'}
        </p>
        ${menuItems.length ? '<button type="button" class="btn-primary mt-6" data-menu-reset>Clear Filters</button>' : ''}
      </div>
    `;
    SF_UI.initReveal();
    return;
  }

  const fallbackNotice =
    menuSource === 'fallback'
      ? `
        <div class="glass-card p-6 mb-8 reveal">
          <span class="badge">Demo Menu</span>
          <h2 class="display text-3xl mt-4">Showing sample menu items</h2>
          <p class="text-white/70 mt-3">The live backend menu is not available yet, so this page is using the built-in demo menu.</p>
        </div>
      `
      : '';

  container.innerHTML =
    fallbackNotice +
    categories
      .map((category, index) => {
        const details = categoryDetails[category] || {};
        const items = filteredItems.filter((item) => item.category === category);

        return `
          <section class="menu-category-section glass-card reveal" id="${getSectionId(category)}" data-menu-section="${category}">
            <div class="menu-category-head">
              <div class="menu-category-copy">
                <span class="badge">${escapeHtml(details.label || `Category ${String(index + 1).padStart(2, '0')}`)}</span>
                <h2 class="display text-4xl mt-4">${escapeHtml(category)}</h2>
                ${details.note ? `<p class="menu-category-note">${escapeHtml(details.note)}</p>` : ''}
              </div>
              <a href="#menuTop" class="btn-outline menu-category-top">Top</a>
            </div>

            <div class="menu-item-grid">
              ${items
                .map(
                  (item) => `
                    <article class="menu-item-card">
                      <div class="menu-item-media image-card">
                        <img
                          src="${escapeHtml(getItemImage(item))}"
                          data-fallback-image="${escapeHtml(getItemFallbackImage(item))}"
                          alt="${escapeHtml(item.name)}"
                          loading="lazy"
                        />
                      </div>
                      <div class="menu-item-content">
                        <div class="menu-item-top">
                          <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
                          <span class="menu-item-price ${item.marketPrice ? 'menu-item-price--market' : ''}">${escapeHtml(getItemPriceLabel(item))}</span>
                        </div>
                        <p class="menu-item-description">${escapeHtml(item.description || 'SeaForestuna signature selection.')}</p>
                      </div>
                      <div class="menu-item-footer">
                        <span class="badge">${escapeHtml(category)}</span>
                        ${
                          item.marketPrice
                            ? '<a href="contact.html" class="btn-outline menu-item-action">Ask Price</a>'
                            : `<button class="btn-primary menu-item-action" data-add="${escapeHtml(getMenuItemId(item))}">Add</button>`
                        }
                      </div>
                    </article>
                  `
                )
                .join('')}
            </div>
          </section>
        `;
      })
      .join('');

  container.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = menuItems.find((entry) => getMenuItemId(entry) === button.dataset.add);
      if (!item) return;
      addToCart(item);
    });
  });

  container.querySelectorAll('[data-fallback-image]').forEach((image) => {
    image.addEventListener('error', () => {
      const fallback = image.dataset.fallbackImage;
      if (fallback && image.src !== fallback) {
        image.src = fallback;
      }
    });
  });

  SF_UI.initReveal();
  initCategoryObserver();
};

const addToCart = (item) => {
  SF_UTILS.addToCart(item, 1);
  syncCartPreview();
  SF_UI.showToast(`${item.name} added to cart`, 'success');
};

const syncCartPreview = () => {
  const count = SF_UTILS.getCartCount();
  const subtotal = SF_UTILS.getCartSubtotal();

  const countEl = document.getElementById('cartCount');
  const heroCountEl = document.getElementById('menuCartCount');
  const subtotalEl = document.getElementById('menuCartSubtotal');

  if (countEl) countEl.textContent = count;
  if (heroCountEl) heroCountEl.textContent = count;
  if (subtotalEl) subtotalEl.textContent = SF_UTILS.formatPrice(subtotal);
};

const loadMenu = async () => {
  menuSource = 'live';

  try {
    const items = await SF_UTILS.apiFetch('/api/menu');
    if (Array.isArray(items) && items.length) {
      menuItems = mergeWithExtraDishes(items);
    } else if (applyFallbackMenu()) {
      SF_UI.showToast('Live menu is empty. Showing demo menu.', 'info');
    } else {
      menuItems = [];
      menuSource = 'empty';
    }
  } catch (error) {
    if (applyFallbackMenu()) {
      SF_UI.showToast('Backend unavailable. Showing demo menu.', 'info');
    } else {
      menuItems = [];
      menuSource = 'empty';
      SF_UI.showToast('Unable to load menu items', 'error');
    }
  }

  renderMenuFinderOptions();
  syncMenuFilterInputs();
  refreshMenuView();
  syncCartPreview();
};

const initMenuPage = () => {
  bindMenuFilterControls();
  loadMenu();
  window.addEventListener('sf:cart-updated', syncCartPreview);
};

document.addEventListener('DOMContentLoaded', initMenuPage);
})();
