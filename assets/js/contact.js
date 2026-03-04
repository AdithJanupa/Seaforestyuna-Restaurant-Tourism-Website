const initContactPage = () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value
    };

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Message sent successfully', 'success');
      form.reset();
    } catch (error) {
      SF_UI.showToast(error.message, 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

document.addEventListener('DOMContentLoaded', initContactPage);
