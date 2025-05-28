document.addEventListener('DOMContentLoaded', () => {
  const profileIcon = document.querySelector('.profile-icon');
  const profilePopup = document.getElementById('profilePopup');
  const visitProfileBtn = document.getElementById('visitProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!profileIcon || !profilePopup) return;

  // Position popup below profile icon
  function positionPopup() {
    const rect = profileIcon.getBoundingClientRect();
    profilePopup.style.top = rect.bottom + window.scrollY + 'px';
    profilePopup.style.left = rect.left + window.scrollX + 'px';
  }

  profileIcon.addEventListener('click', (e) => {
    e.preventDefault();
    if (profilePopup.style.display === 'none' || profilePopup.style.display === '') {
      positionPopup();
      profilePopup.style.display = 'block';
    } else {
      profilePopup.style.display = 'none';
    }
  });

  // Hide popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!profilePopup.contains(e.target) && e.target !== profileIcon) {
      profilePopup.style.display = 'none';
    }
  });

  visitProfileBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        window.location.href = 'homei.html';
      } else {
        alert('Logout failed.');
      }
    } catch (error) {
      alert('Logout failed.');
    }
  });
});
