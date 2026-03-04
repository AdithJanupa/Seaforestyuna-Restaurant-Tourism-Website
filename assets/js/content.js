const initContentBlocks = async () => {
  const titleEls = document.querySelectorAll('[data-content-title]');
  const bodyEls = document.querySelectorAll('[data-content-body]');
  if (!titleEls.length && !bodyEls.length) return;

  try {
    const blocks = await SF_UTILS.apiFetch('/api/content');
    blocks.forEach((block) => {
      document.querySelectorAll(`[data-content-title="${block.key}"]`).forEach((el) => {
        el.textContent = block.title;
      });
      document.querySelectorAll(`[data-content-body="${block.key}"]`).forEach((el) => {
        el.textContent = block.body;
      });
    });
  } catch (error) {
    // fallback to existing static content
  }
};

document.addEventListener('DOMContentLoaded', initContentBlocks);
