document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotPasswordForm');
  const messageEl = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.textContent = '';
    const email = form.email.value.trim();
    if (!email) {
      messageEl.textContent = 'Please enter your email.';
      return;
    }
    try {
      const response = await fetch('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        messageEl.textContent = data.message;
      } else {
        messageEl.textContent = data.message || 'Error sending reset link.';
      }
    } catch (error) {
      messageEl.textContent = 'Network error. Please try again later.';
    }
  });
});
