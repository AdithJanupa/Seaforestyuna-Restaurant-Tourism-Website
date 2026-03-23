const initContactPage = () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  if (window.SF_UTILS && typeof SF_UTILS.getAuth === 'function') {
    const user = SF_UTILS.getAuth().user;
    if (user) {
      if (user.name && form.name) form.name.value = user.name;
      if (user.email && form.email) form.email.value = user.email;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      type: 'General Inquiry',
      subject: form.subject.value,
      message: form.message.value,
      source: 'Contact Page'
    };

    try {
      SF_UI.showLoader();
      await SF_UTILS.apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      SF_UI.showToast('Message sent successfully', 'success');
      form.reset();
    } catch (error) {
      SF_UI.showToast(error.message || 'Unable to send inquiry', 'error');
    } finally {
      SF_UI.hideLoader();
    }
  });
};

document.addEventListener('DOMContentLoaded', initContactPage);
