const STAR_SVG = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.8l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8Z" fill="currentColor"/>
  </svg>
`;

const EDIT_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
  </svg>
`;

const DELETE_SVG = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 6h18"></path>
    <path d="M8 6V4h8v2"></path>
    <path d="m19 6-1 14H6L5 6"></path>
    <path d="M10 11v6"></path>
    <path d="M14 11v6"></path>
  </svg>
`;

let publishedRatings = [];
let activeEditRatingId = null;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return 'Recently shared';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently shared';
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const renderStars = (value) => {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return `
    <span class="rating-display" aria-label="${rating} out of 5 stars">
      ${Array.from({ length: 5 }, (_, index) => `<span class="rating-display__star ${index < rating ? 'is-active' : ''}">${STAR_SVG}</span>`).join('')}
    </span>
  `;
};

const getCurrentUser = () => {
  if (!window.SF_UTILS || typeof SF_UTILS.getAuth !== 'function') return null;
  return SF_UTILS.getAuth().user;
};

const prefillUserFields = (form) => {
  if (!form) return;
  const user = getCurrentUser();
  if (!user) return;

  if (form.name && !form.name.value && user.name) form.name.value = user.name;
  if (form.email && !form.email.value && user.email) form.email.value = user.email;
};

const updateRatingSummary = () => {
  const averageEl = document.getElementById('ratingAverage');
  const averageStarsEl = document.getElementById('ratingAverageStars');
  const totalEl = document.getElementById('ratingTotal');
  const featuredEl = document.getElementById('ratingFeatured');
  const summaryTextEl = document.getElementById('ratingsSummaryText');
  if (!averageEl || !averageStarsEl || !totalEl || !featuredEl || !summaryTextEl) return;

  const publishedCount = publishedRatings.length;
  const featuredCount = publishedRatings.filter((rating) => rating.isFeatured).length;
  const average = publishedCount
    ? (publishedRatings.reduce((sum, rating) => sum + (Number(rating.rating) || 0), 0) / publishedCount).toFixed(1)
    : '0.0';

  averageEl.textContent = average;
  averageStarsEl.innerHTML = renderStars(Number(average));
  totalEl.textContent = String(publishedCount);
  featuredEl.textContent = String(featuredCount);
  summaryTextEl.textContent = publishedCount
    ? `${publishedCount} published feedback${publishedCount === 1 ? '' : 's'} from SeaForestuna guests.`
    : 'Published guest ratings will appear here after the first review is shared.';
};

const renderOwnerActions = (rating) => {
  if (!rating.canManage) return '';

  return `
    <div class="review-card__actions">
      <button class="booking-action-btn booking-action-btn--edit" type="button" data-rating-edit="${escapeHtml(rating._id)}" aria-label="Edit your rating" title="Edit your rating">
        ${EDIT_SVG}
      </button>
      <button class="booking-action-btn booking-action-btn--delete" type="button" data-rating-delete="${escapeHtml(rating._id)}" aria-label="Delete your rating" title="Delete your rating">
        ${DELETE_SVG}
      </button>
    </div>
  `;
};

const renderRatingsList = () => {
  const list = document.getElementById('ratingsList');
  if (!list) return;

  if (!publishedRatings.length) {
    list.innerHTML = `
      <div class="glass-card p-8 rating-empty-state">
        <span class="badge">No Reviews Yet</span>
        <h3 class="display text-3xl mt-4">Published feedback will appear here soon.</h3>
        <p class="text-white/65 mt-3">Be the first guest to share a SeaForestuna dining, stay, or boat ride experience.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = publishedRatings
    .map(
      (rating) => `
      <article class="glass-card p-7 review-card reveal">
        <div class="review-card__head">
          <div>
            <span class="badge">${escapeHtml(rating.visitType || 'General')}</span>
            <h3 class="display text-3xl mt-4">${escapeHtml(rating.title || 'Guest Feedback')}</h3>
          </div>
          <div class="review-card__rating">
            ${renderStars(rating.rating)}
            <span class="text-white/55 text-sm">${escapeHtml(`${rating.rating || 0}/5`)}</span>
          </div>
        </div>
        <p class="text-white/72 mt-5 leading-7">${escapeHtml(rating.message || '')}</p>
        <div class="review-card__foot">
          <div>
            <p class="font-semibold text-sand-100">${escapeHtml(rating.name || 'Guest')}</p>
            <p class="text-white/55 text-sm">${escapeHtml(formatDate(rating.updatedAt || rating.createdAt))}</p>
          </div>
          ${rating.isFeatured ? '<span class="badge">Featured</span>' : ''}
        </div>
        ${renderOwnerActions(rating)}
      </article>
    `
    )
    .join('');

  if (window.SF_UI && window.SF_UI.initReveal) {
    window.SF_UI.initReveal();
  }
};

const loadPublishedRatings = async () => {
  try {
    publishedRatings = await SF_UTILS.apiFetch('/api/ratings');
  } catch (error) {
    publishedRatings = [];
  }

  updateRatingSummary();
  renderRatingsList();
};

const updateStarPicker = (value) => {
  const buttons = document.querySelectorAll('#ratingForm [data-rating-value]');
  const hiddenInput = document.querySelector('#ratingForm input[name="rating"]');
  const label = document.getElementById('ratingSelectionLabel');
  const rating = Math.max(1, Math.min(5, Number(value) || 5));

  if (hiddenInput) hiddenInput.value = String(rating);
  if (label) label.textContent = `${rating} out of 5`;

  buttons.forEach((button) => {
    const isActive = Number(button.dataset.ratingValue) <= rating;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(Number(button.dataset.ratingValue) === rating));
    button.innerHTML = STAR_SVG;
  });
};

const initRatingForm = () => {
  const form = document.getElementById('ratingForm');
  if (!form) return;

  prefillUserFields(form);
  updateStarPicker(5);

  form.querySelectorAll('[data-rating-value]').forEach((button) => {
    button.addEventListener('click', () => updateStarPicker(button.dataset.ratingValue));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value,
      email: form.email.value,
      visitType: form.visitType.value,
      title: form.title.value,
      rating: Number(form.rating.value),
      message: form.message.value,
      source: 'Ratings Page'
    };

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch('/api/ratings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Rating published successfully', 'success');
      form.reset();
      prefillUserFields(form);
      updateStarPicker(5);
      await loadPublishedRatings();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to publish rating', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const toggleInquiryDrawer = (forceOpen) => {
  const drawer = document.getElementById('ratingInquiryDrawer');
  const toggle = document.getElementById('ratingInquiryToggle');
  if (!drawer || !toggle) return;

  const nextState = typeof forceOpen === 'boolean' ? forceOpen : !drawer.classList.contains('is-open');
  drawer.classList.toggle('is-open', nextState);
  toggle.setAttribute('aria-expanded', String(nextState));
  toggle.textContent = nextState ? 'Close Inquiry Desk' : 'Open Inquiry Desk';
};

const initInquiryDrawer = () => {
  const toggle = document.getElementById('ratingInquiryToggle');
  const form = document.getElementById('ratingInquiryForm');
  if (!toggle || !form) return;

  prefillUserFields(form);

  toggle.addEventListener('click', () => toggleInquiryDrawer());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      type: form.type.value,
      subject: form.subject.value,
      message: form.message.value,
      source: 'Ratings Page'
    };

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Inquiry sent successfully', 'success');
      form.reset();
      prefillUserFields(form);
      toggleInquiryDrawer(false);
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to send inquiry', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const closeEditModal = () => {
  const modal = document.getElementById('ratingEditModal');
  if (!modal) return;
  modal.classList.remove('active');
  activeEditRatingId = null;
};

const openEditModal = (ratingId) => {
  const modal = document.getElementById('ratingEditModal');
  const form = document.getElementById('ratingEditForm');
  const rating = publishedRatings.find((item) => item._id === ratingId);
  if (!modal || !form || !rating || !rating.canManage) return;

  activeEditRatingId = ratingId;
  form.name.value = rating.name || '';
  form.email.value = rating.email || getCurrentUser()?.email || '';
  form.visitType.value = rating.visitType || 'General';
  form.rating.value = String(rating.rating || 5);
  form.title.value = rating.title || '';
  form.message.value = rating.message || '';
  modal.classList.add('active');
};

const initEditModal = () => {
  const modal = document.getElementById('ratingEditModal');
  const form = document.getElementById('ratingEditForm');
  const closeBtn = document.getElementById('ratingEditClose');
  const cancelBtn = document.getElementById('ratingEditCancel');
  if (!modal || !form || !closeBtn || !cancelBtn) return;

  closeBtn.addEventListener('click', closeEditModal);
  cancelBtn.addEventListener('click', closeEditModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeEditModal();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeEditRatingId) return;

    const payload = {
      name: form.name.value,
      email: form.email.value,
      visitType: form.visitType.value,
      rating: Number(form.rating.value),
      title: form.title.value,
      message: form.message.value,
      source: 'Ratings Page'
    };

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch(`/api/ratings/${activeEditRatingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Rating updated successfully', 'success');
      closeEditModal();
      await loadPublishedRatings();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to update rating', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

const initRatingCardActions = () => {
  const list = document.getElementById('ratingsList');
  if (!list) return;

  list.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-rating-edit]');
    if (editButton) {
      openEditModal(editButton.dataset.ratingEdit);
      return;
    }

    const deleteButton = event.target.closest('[data-rating-delete]');
    if (!deleteButton) return;

    const ratingId = deleteButton.dataset.ratingDelete;
    if (!ratingId) return;
    if (!window.confirm('Delete this rating?')) return;

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch(`/api/ratings/${ratingId}`, { method: 'DELETE' });
      SF_UI.showToast('Rating deleted', 'success');
      await loadPublishedRatings();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to delete rating', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initRatingForm();
  initInquiryDrawer();
  initEditModal();
  initRatingCardActions();
  loadPublishedRatings();
});
