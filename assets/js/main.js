const initQuickBooking = () => {
  const widget = document.querySelector('[data-quick-book]');
  if (!widget) return;

  const tabs = widget.querySelectorAll('[data-tab]');
  const panes = widget.querySelectorAll('[data-pane]');

  const activateTab = (name) => {
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === name);
    });
    panes.forEach((pane) => {
      pane.classList.toggle('hidden', pane.dataset.pane !== name);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  const slotSelects = widget.querySelectorAll('[data-time-slots]');
  slotSelects.forEach((select) => {
    const slots = SF_UTILS.generateTimeSlots('08:00', '21:00', 30);
    select.innerHTML = slots.map((slot) => `<option value="${slot}">${slot}</option>`).join('');
  });

  widget.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const params = new URLSearchParams();
      formData.forEach((value, key) => params.append(key, value));
      const target = form.dataset.target;
      window.location.href = `${target}?${params.toString()}`;
    });
  });

  activateTab('food');
};

const initParallax = () => {
  const hero = document.querySelector('[data-parallax]');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const offset = window.scrollY * 0.4;
    hero.style.backgroundPosition = `center ${offset}px`;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  SF_UI.injectNavbar();
  SF_UI.injectFooter();
  SF_UI.setBackgroundImages();
  SF_UI.setImageSources();
  SF_UI.setActiveNav();
  SF_UI.initMobileMenu();
  SF_UI.initReveal();
  SF_UI.initFloatingControls();
  initQuickBooking();
  initParallax();
});
