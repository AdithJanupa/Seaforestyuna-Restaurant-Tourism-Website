(() => {
let menuItems = [];
let categoryObserver = null;

const categoryDetails = SF_CONFIG.MENU_CATEGORY_DETAILS || {};
const categoryOrder = SF_CONFIG.MENU_CATEGORY_ORDER || [];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const getSectionId = (category) => `menu-category-${slugify(category)}`;

const getOrderedCategories = () => {
  const available = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];
  return [...categoryOrder.filter((category) => available.includes(category)), ...available.filter((category) => !categoryOrder.includes(category))];
};

const getItemPriceLabel = (item) => item.priceLabel || SF_UTILS.formatLkrPrice(item.price || 0);

const getItemImage = (item) => item.image || (categoryDetails[item.category] && categoryDetails[item.category].image) || SF_CONFIG.IMAGES.menuHero;

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

const renderCategories = () => {
  const container = document.getElementById('menuCategories');
  if (!container) return;

  const categories = getOrderedCategories();
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
          data-category-link="${category}"
        >
          ${category}
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

const renderMenu = () => {
  const container = document.getElementById('menuList');
  if (!container) return;

  const categories = getOrderedCategories();
  if (!categories.length) {
    container.innerHTML = `
      <div class="glass-card p-8 text-center reveal">
        <span class="badge">Menu Unavailable</span>
        <h2 class="display text-3xl mt-4">No menu items available right now</h2>
        <p class="text-white/70 mt-3">Add menu items from the admin side or check the backend connection.</p>
      </div>
    `;
    SF_UI.initReveal();
    return;
  }

  container.innerHTML = categories
    .map((category, index) => {
      const details = categoryDetails[category] || {};
      const items = menuItems.filter((item) => item.category === category);

      return `
        <section class="menu-category-section glass-card reveal" id="${getSectionId(category)}" data-menu-section="${category}">
          <div class="menu-category-head">
            <div class="menu-category-copy">
              <span class="badge">${details.label || `Category ${String(index + 1).padStart(2, '0')}`}</span>
              <h2 class="display text-4xl mt-4">${category}</h2>
              ${details.note ? `<p class="menu-category-note">${details.note}</p>` : ''}
            </div>
            <a href="#menuTop" class="btn-outline menu-category-top">Top</a>
          </div>

          <div class="menu-item-grid">
            ${items
              .map(
                (item) => `
                  <article class="menu-item-card">
                    <div class="menu-item-media image-card">
                      <img src="${getItemImage(item)}" alt="${item.name}" loading="lazy" />
                    </div>
                    <div class="menu-item-content">
                      <div class="menu-item-top">
                        <h3 class="menu-item-name">${item.name}</h3>
                        <span class="menu-item-price ${item.marketPrice ? 'menu-item-price--market' : ''}">${getItemPriceLabel(item)}</span>
                      </div>
                      <p class="menu-item-description">${item.description || 'SeaForestuna signature selection.'}</p>
                    </div>
                    <div class="menu-item-footer">
                      <span class="badge">${category}</span>
                      ${
                        item.marketPrice
                          ? '<a href="contact.html" class="btn-outline menu-item-action">Ask Price</a>'
                          : `<button class="btn-primary menu-item-action" data-add="${item._id}">Add</button>`
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
      const item = menuItems.find((entry) => entry._id === button.dataset.add);
      if (!item) return;
      addToCart(item);
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
  if (subtotalEl) subtotalEl.textContent = SF_UTILS.formatLkrPrice(subtotal);
};

const loadMenu = async () => {
  try {
    menuItems = await SF_UTILS.apiFetch('/api/menu');
  } catch (error) {
    menuItems = [];
    SF_UI.showToast('Unable to load menu items', 'error');
  }

  renderCategories();
  renderMenu();
  syncCartPreview();
};

const initMenuPage = () => {
  loadMenu();
  window.addEventListener('sf:cart-updated', syncCartPreview);
};

document.addEventListener('DOMContentLoaded', initMenuPage);
})();
