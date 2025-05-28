document.addEventListener("DOMContentLoaded", async () => {
    async function updateHeaderIcons() {
        try {
            const response = await fetch('/me', { credentials: 'include' });
            if (response.status === 401) {
                // Unauthorized, show login and signup buttons instead of redirecting to homei.html to avoid reload loop
                const headerIcons = document.getElementById("headerIcons");
                if (headerIcons) {
                    headerIcons.innerHTML = `
                        <button class="icon-btn" id="signupBtn">Sign up</button>
                        <button class="icon-btn login-btn" id="loginBtn">Log in</button>
                    `;
                    // Reattach event listeners for the new buttons
                    document.getElementById('signupBtn').onclick = () => {
                        const signupModal = document.getElementById('signupModal');
                        if (signupModal) signupModal.style.display = 'block';
                    };
                    document.getElementById('loginBtn').onclick = () => {
                        const loginModal = document.getElementById('loginModal');
                        if (loginModal) loginModal.style.display = 'block';
                    };
                }
                return;
            }
            const data = await response.json();
            const headerIcons = document.getElementById("headerIcons");
            if (data.loggedIn && data.user) {
                // Show bag, heart, profile icons and dashboard button if admin; hide login and sign-up buttons
                    if (headerIcons) {
                    headerIcons.innerHTML = `
                        <a href="bag.html" title="Shopping Bag" class="icon-btn bag-icon" aria-label="Shopping Bag">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zm0 2h12l1.5 2H4.5L6 4zm0 4a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0V8zm6 0a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0V8z"/>
                          </svg>
                        </a>
                        <a href="#" title="Favorites" class="icon-btn heart-icon">
                            <i class="fas fa-heart"></i>
                        </a>
                        ${data.user.isAdmin ? `
                        <a href="admin-dashboard.html" title="Admin Dashboard" class="icon-btn dashboard-icon" style="color: #007bff;">
                            <i class="fas fa-tachometer-alt"></i>
                        </a>
                        ` : ''}
                        <div class="profile-menu-container" style="position: relative; display: inline-block;">
                            <a href="#" title="Profile" class="icon-btn profile-icon" id="profileIcon">
                                <img src="${data.user.profilePictureUrl || ''}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                                <i class="fas fa-user"></i>
                            </a>
                            <div id="profilePopupMenu" class="profile-popup-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); z-index: 1000; min-width: 150px;">
                                <a href="profile.html" class="popup-menu-item" style="display: block; padding: 10px; color: black; text-decoration: none; cursor: pointer;">Visit Profile</a>
                                <div class="popup-menu-item" id="logoutMenuItem" style="padding: 10px; color: black; cursor: pointer; border-top: 1px solid #eee;">Log Out</div>
                            </div>
                        </div>
                    `;
                    // Add event listener for profile icon to toggle popup menu
                    const profileIcon = document.getElementById('profileIcon');
                    const profilePopupMenu = document.getElementById('profilePopupMenu');
                    if (profileIcon && profilePopupMenu) {
                        profileIcon.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (profilePopupMenu.style.display === 'none' || profilePopupMenu.style.display === '') {
                                profilePopupMenu.style.display = 'block';
                            } else {
                                profilePopupMenu.style.display = 'none';
                            }
                        });
                        // Close popup if clicking outside
                        document.addEventListener('click', (e) => {
                            if (!profileIcon.contains(e.target) && !profilePopupMenu.contains(e.target)) {
                                profilePopupMenu.style.display = 'none';
                            }
                        });
                    }
                    // Add event listener for logout menu item
                    const logoutMenuItem = document.getElementById('logoutMenuItem');
                    if (logoutMenuItem) {
                        logoutMenuItem.onclick = async () => {
                            try {
                                const response = await fetch('/logout', {
                                    method: 'POST',
                                    credentials: 'include'
                                });
                                if (response.ok) {
                                    // Update header icons after logout
                                    await updateHeaderIcons();
                                } else {
                                    console.error('Logout failed');
                                }
                            } catch (error) {
                                console.error('Logout error:', error);
                            }
                        };
                    }
                }
                const openSignupLink = document.getElementById("openSignup");
                if (openSignupLink) openSignupLink.style.display = "none";
            } else {
                // Show login and sign-up buttons; hide bag, heart, and profile icons
                if (headerIcons) {
                    headerIcons.innerHTML = `
                        <button class="icon-btn" id="signupBtn">Sign up</button>
                        <button class="icon-btn login-btn" id="loginBtn">Log in</button>
                    `;
                    // Reattach event listeners for the new buttons
                    document.getElementById('signupBtn').onclick = () => {
                        const signupModal = document.getElementById('signupModal');
                        if (signupModal) signupModal.style.display = 'block';
                    };
                    document.getElementById('loginBtn').onclick = () => {
                        const loginModal = document.getElementById('loginModal');
                        if (loginModal) loginModal.style.display = 'block';
                    };
                }
                const openSignupLink = document.getElementById("openSignup");
                if (openSignupLink) openSignupLink.style.display = "inline-block";
            }
        } catch (error) {
            console.error('Error updating header icons:', error);
        }
    }

    await updateHeaderIcons();
});
