document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.querySelector('.add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            window.location.href = 'addproduct.html';
        });
    }

    // Fetch user profile data and update UI
    async function fetchUserProfile() {
        try {
            const response = await fetch('/me', { credentials: 'include' });
            console.log('fetch /me response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('fetch /me response data:', data);
                if (data.loggedIn) {
                    const user = data.user;
                    console.log('User data:', user);
                    const usernameElem = document.querySelector('.username');
                    const handleElem = document.querySelector('.handle');
                    const profilePictureElem = document.getElementById('profilePicture');
                    const coverPhotoElem = document.getElementById('coverPhoto');
                    const bioElem = document.getElementById('bioText');

                    if (usernameElem) {
                        usernameElem.textContent = user.username || '';
                    }
                    if (handleElem) {
                        handleElem.textContent = user.handle ? '@' + user.handle : '';
                        // Ensure handle is below username by CSS or HTML structure
                    }
                    if (profilePictureElem && user.profilePictureUrl) {
                        profilePictureElem.src = user.profilePictureUrl;
                        profilePictureElem.style.display = 'block';
                        // Update header profile picture
                        const headerProfilePicture = document.getElementById('headerProfilePicture');
                        const headerProfileIcon = document.querySelector('.profile-icon i');
                        if (headerProfilePicture && headerProfileIcon) {
                            headerProfilePicture.src = user.profilePictureUrl;
                            headerProfilePicture.style.display = 'block';
                            headerProfileIcon.style.display = 'none';
                        }
                    }
                    if (coverPhotoElem && user.coverPhotoUrl) {
                        coverPhotoElem.src = user.coverPhotoUrl;
                        coverPhotoElem.style.display = 'block';
                    }
                    if (bioElem) {
                        bioElem.textContent = user.bio || 'Add a bio';
                    }
                } else {
                    console.log('User not logged in');
                }
            } else {
                console.log('fetch /me response not ok');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    fetchUserProfile();

    // Edit Profile Modal open/close handlers
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileBtn = document.getElementById('closeEditProfile');

    if (editProfileBtn && editProfileModal && closeEditProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            editProfileModal.style.display = 'block';
        });

        closeEditProfileBtn.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
        });

        // Close modal when clicking outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        });
    }

    // Handle edit profile form submission
    const editProfileForm = document.getElementById('editProfileForm');
    const editProfileMessage = document.getElementById('editProfileMessage');

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            editProfileMessage.textContent = '';
            const formData = new FormData(editProfileForm);

            try {
const response = await fetch('/api/profile/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                const data = await response.json();

                if (response.ok) {
                    editProfileMessage.style.color = 'green';
                    editProfileMessage.textContent = 'Profile updated successfully.';
                    editProfileModal.style.display = 'none';
                    // Optionally refresh profile data
                    fetchUserProfile();
                } else {
                    editProfileMessage.style.color = 'red';
                    editProfileMessage.textContent = data.message || 'Failed to update profile.';
                }
            } catch (error) {
                editProfileMessage.style.color = 'red';
                editProfileMessage.textContent = 'Error connecting to server.';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    const sellingProductsGrid = document.getElementById('sellingProductsGrid');
    const emptySellingMessage = document.getElementById('emptySellingMessage');

    try {
        const response = await fetch('/api/myproducts', { credentials: 'include' });
        if (response.ok) {
            const products = await response.json();
            if (products.length === 0) {
                emptySellingMessage.style.display = 'block';
            } else {
                emptySellingMessage.style.display = 'none';
                sellingProductsGrid.innerHTML = ''; // Clear existing products before appending
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.style.cursor = 'pointer';

                    productCard.addEventListener('click', () => {
                        window.location.href = `product.html?id=${product._id || ''}`;
                    });

                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'product-image';
                    const img = document.createElement('img');
                    img.src = product.coverPhotoUrl || 'https://placehold.co/200x200/f5f5f5/666666?text=No+Image';
                    img.alt = product.name || 'Product Image';
                    img.style.borderRadius = '10px';
                    img.style.width = '150px';
                    img.style.height = '150px';
                    img.style.objectFit = 'cover';
                    imgDiv.appendChild(img);
                    productCard.appendChild(imgDiv);

                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'product-title';
                    titleDiv.textContent = product.name || 'Unnamed Product';
                    productCard.appendChild(titleDiv);

                    const priceLikesDiv = document.createElement('div');
                    priceLikesDiv.style.display = 'flex';
                    priceLikesDiv.style.alignItems = 'center';
                    priceLikesDiv.style.gap = '10px';

                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'product-card-price';
                    priceDiv.textContent = 'PHP ' + (product.price || '0.00');
                    priceLikesDiv.appendChild(priceDiv);

                    const likesDiv = document.createElement('div');
                    likesDiv.style.display = 'flex';
                    likesDiv.style.alignItems = 'center';
                    likesDiv.style.gap = '5px';

                    const heartIcon = document.createElement('i');
                    heartIcon.className = 'fas fa-heart';
                    heartIcon.style.color = 'red';
                    likesDiv.appendChild(heartIcon);

                    const likesCount = document.createElement('span');
                    likesCount.textContent = product.likes || '0';
                    likesDiv.appendChild(likesCount);

                    priceLikesDiv.appendChild(likesDiv);
                    productCard.appendChild(priceLikesDiv);

                    const conditionDiv = document.createElement('div');
                    conditionDiv.className = 'product-condition';
                    conditionDiv.textContent = product.condition || 'Condition';
                    productCard.appendChild(conditionDiv);

                    sellingProductsGrid.appendChild(productCard);
                });
            }
        } else {
            emptySellingMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user products:', error);
        emptySellingMessage.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const removeImagesBtn = document.getElementById("removeImagesBtn");
    const editProfileMessage = document.getElementById("editProfileMessage");
    const profilePicturePreview = document.getElementById("profilePicturePreview");
    const coverPhotoPreview = document.getElementById("coverPhotoPreview");
    const profilePictureInput = document.getElementById("profilePictureInput");
    const coverPhotoInput = document.getElementById("coverPhotoInput");

    removeImagesBtn.addEventListener("click", async () => {
        editProfileMessage.textContent = "";
        try {
            const response = await fetch("/api/profile/clear-images", {
                method: "POST",
            });
            const data = await response.json();
            if (response.ok) {
                editProfileMessage.style.color = "green";
                editProfileMessage.textContent = "Profile and cover images removed successfully.";
                // Clear images from UI
                document.getElementById("profilePicture").src = "";
                document.getElementById("coverPhoto").src = "";
                profilePicturePreview.style.display = "none";
                coverPhotoPreview.style.display = "none";
                profilePictureInput.value = "";
                coverPhotoInput.value = "";
            } else {
                editProfileMessage.style.color = "red";
                editProfileMessage.textContent = data.message || "Failed to remove images.";
            }
        } catch (error) {
            editProfileMessage.style.color = "red"; 
            editProfileMessage.textContent = "Error connecting to server.";
        }
    });
});

