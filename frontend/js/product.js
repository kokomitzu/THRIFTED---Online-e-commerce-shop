// Simple image carousel functionality
document.addEventListener('DOMContentLoaded', async function() {
    const mainImage = document.querySelector('.main-image');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    const productInfoDiv = document.querySelector('.product-info');
    const actionButtons = document.querySelector('.action-buttons');

    // Parse product ID from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('No product ID specified.');
        window.location.href = 'homei.html';
        return;
    }

    let product = null;
    let userData = null;
    let editMode = false;
    let photos = [];

    function renderStaticView() {
        console.log('renderStaticView called, editMode:', editMode);
        // Render static product info
        productInfoDiv.innerHTML = `
            <h1 class="product-title">${product.name || 'Product Title'}</h1>
            <div class="product-price">PHP ${product.price || '0.00'}</div>
            <div class="product-description">
                <p>Brand: ${product.brand || ''}</p>
                <p>Category: ${product.category || ''}</p>
                <p>Condition: ${product.condition || ''}</p>
                <p>Description: ${product.description || ''}</p>
            </div>
        `;

        // Render thumbnails
        thumbnailContainer.innerHTML = '';
        photos.forEach((photoUrl, index) => {
            const img = document.createElement('img');
            img.src = photoUrl;
            img.alt = `Photo ${index + 1}`;
            img.className = 'thumbnail';
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                mainImage.src = photoUrl;
                mainImage.alt = product.name || 'Product Image';
            });
            thumbnailContainer.appendChild(img);
        });

        // Set main image to first photo if available
        if (photos.length > 0) {
            mainImage.src = photos[0];
            mainImage.alt = product.name || 'Product Image';
        }

        // Render action buttons only if not in edit mode
        if (!editMode) {
            actionButtons.innerHTML = '';
            const editDeleteContainer = document.querySelector('.edit-delete-buttons');
            editDeleteContainer.innerHTML = '';
            if (userData && userData.loggedIn && userData.user && userData.user.username === product.sellerUsername) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'EDIT';
                editBtn.className = 'btn btn-edit';
                editBtn.addEventListener('click', () => {
                    console.log('Edit button clicked');
                    editMode = true;
                    renderEditView();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'DELETE';
                deleteBtn.className = 'btn btn-delete';
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this product?')) {
                        const deleteResponse = await fetch(`/api/products/${product._id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        if (deleteResponse.ok) {
                            alert('Product deleted successfully.');
                            window.location.href = 'myproduct.html';
                        } else {
                            alert('Failed to delete product.');
                        }
                    }
                });

                editDeleteContainer.appendChild(editBtn);
                editDeleteContainer.appendChild(deleteBtn);
            } else if (userData && userData.loggedIn) {
                console.log('Showing buy/add/make offer buttons for non-owner user');
                const buyNowBtn = document.createElement('button');
                buyNowBtn.textContent = 'Buy now';
                buyNowBtn.className = 'buy-now-btn';
                buyNowBtn.style.padding = '12px';
                buyNowBtn.style.fontSize = '1rem';
                buyNowBtn.style.borderRadius = '5px';
                buyNowBtn.style.cursor = 'pointer';
                buyNowBtn.addEventListener('click', () => {
                    // Redirect to checkout or purchase page with product ID
                    // For now, redirect to checkout page
                    window.location.href = 'checkout.html';
                });

                const addToBagBtn = document.createElement('button');
                addToBagBtn.textContent = 'Add to bag';
                addToBagBtn.className = 'add-to-bag-btn';
                addToBagBtn.style.padding = '12px';
                addToBagBtn.style.fontSize = '1rem';
                addToBagBtn.style.borderRadius = '5px';
                addToBagBtn.style.cursor = 'pointer';
                addToBagBtn.addEventListener('click', async () => {
                    try {
                        const response = await fetch('/api/cart', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({ productId: product._id })
                        });
                        if (response.ok) {
                            alert('Product added to bag successfully.');
                        } else {
                            alert('Failed to add product to bag.');
                        }
                    } catch (error) {
                        alert('Error adding product to bag.');
                    }
                });

                const makeOfferBtn = document.createElement('button');
                makeOfferBtn.textContent = 'Make offer';
                makeOfferBtn.className = 'make-offer-btn';
                makeOfferBtn.style.padding = '12px';
                makeOfferBtn.style.fontSize = '1rem';
                makeOfferBtn.style.borderRadius = '5px';
                makeOfferBtn.style.cursor = 'pointer';

                actionButtons.appendChild(buyNowBtn);
                actionButtons.appendChild(addToBagBtn);
                actionButtons.appendChild(makeOfferBtn);
            } else {
                console.log('User not logged in, no action buttons shown');
            }
        }
    }

    function renderEditView() {
        // Render editable product info
        productInfoDiv.innerHTML = `
            <label>
                Name:<br>
                <input type="text" id="productName" value="${product.name || ''}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            </label>
            <label>
                Price:<br>
                <input type="number" id="productPrice" value="${product.price || 0}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            </label>
            <label>
                Brand:<br>
                <input type="text" id="productBrand" value="${product.brand || ''}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            </label>
            <label>
                Category:<br>
                <input type="text" id="productCategory" value="${product.category || ''}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            </label>
            <label>
                Condition:<br>
                <input type="text" id="productCondition" value="${product.condition || ''}" style="width: 100%; padding: 8px; margin-bottom: 10px;">
            </label>
            <label>
                Description:<br>
                <textarea id="productDescription" style="width: 100%; padding: 8px; margin-bottom: 10px;" rows="4">${product.description || ''}</textarea>
            </label>
        `;

        // Render thumbnails with remove buttons
        thumbnailContainer.innerHTML = '';
        photos.forEach((photoUrl, index) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.style.position = 'relative';
            thumbDiv.style.display = 'inline-block';

            const img = document.createElement('img');
            img.src = photoUrl;
            img.alt = `Photo ${index + 1}`;
            img.className = 'thumbnail';
            img.style.display = 'block';

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.className = 'photo-remove-btn';
            removeBtn.title = 'Remove photo';

            removeBtn.addEventListener('click', () => {
                photos.splice(index, 1);
                thumbDiv.remove();
                if (photos.length > 0) {
                    mainImage.src = photos[0];
                } else {
                    mainImage.src = '';
                }
            });

            thumbDiv.appendChild(img);
            thumbDiv.appendChild(removeBtn);
            thumbnailContainer.appendChild(thumbDiv);
        });

        // Render Save and Cancel buttons
        actionButtons.innerHTML = '';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'SAVE';
        saveBtn.className = 'btn btn-edit';
        saveBtn.style.marginTop = '10px';
        saveBtn.style.width = '100%';
        saveBtn.addEventListener('click', async () => {
            const updatedProduct = {
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                brand: document.getElementById('productBrand').value,
                category: document.getElementById('productCategory').value,
                condition: document.getElementById('productCondition').value,
                description: document.getElementById('productDescription').value,
                coverPhotoUrl: photos.length > 0 ? photos[0] : ''
            };
            console.log('Saving product:', updatedProduct);

            const updateResponse = await fetch(`/api/products/${product._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updatedProduct)
            });

            if (updateResponse.ok) {
                alert('Product updated successfully.');
                // Reload product data and switch to static view
                product = await updateResponse.json().then(data => data.product);
                editMode = false;
                photos = product.coverPhotoUrl ? [product.coverPhotoUrl] : [];
                renderStaticView();
            } else {
                alert('Failed to update product.');
            }
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'CANCEL';
        cancelBtn.className = 'btn btn-delete';
        cancelBtn.style.marginTop = '10px';
        cancelBtn.style.width = '100%';
        cancelBtn.addEventListener('click', () => {
            editMode = false;
            renderStaticView();
        });

        actionButtons.appendChild(saveBtn);
        actionButtons.appendChild(cancelBtn);
    }

    try {
        // Fetch product data from backend
        const response = await fetch(`/api/products/${productId}`, { credentials: 'include' });
        if (!response.ok) {
            alert('Failed to load product data.');
            window.location.href = 'homei.html';
            return;
        }
        product = await response.json();
        console.log('Product sellerUsername:', product.sellerUsername);

    // Set the document title dynamically to the product name
    if (product.name) {
        document.title = product.name + " - Thrifted";
    }

    // Fetch logged-in user info
    const userResponse = await fetch('/me', { credentials: 'include' });
    userData = await userResponse.json();
    console.log('User data:', userData);
    console.log('Logged in:', userData.loggedIn);
    if(userData.user) {
        console.log('Username:', userData.user.username);
    }

    // Fetch seller user data by sellerUsername
    let sellerData = null;
    try {
        const sellerResponse = await fetch(`/api/users/${product.sellerUsername}`, { credentials: 'include' });
        if (sellerResponse.ok) {
            sellerData = await sellerResponse.json();
            console.log('Seller data:', sellerData);
        } else {
            console.warn('Failed to fetch seller data');
        }
    } catch (err) {
        console.error('Error fetching seller data:', err);
    }

    // Update seller info section dynamically
    const sellerNameDiv = document.querySelector('.seller-name');
    const sellerProfileImg = document.querySelector('.seller-profile');
    const visitShopBtn = document.querySelector('.visit-shop-btn');

    if (sellerData) {
        sellerNameDiv.textContent = sellerData.displayName || sellerData.username || product.sellerUsername;
        sellerProfileImg.src = sellerData.profilePictureUrl || 'https://placehold.co/50x50/cccccc/333333?text=C';
        sellerProfileImg.alt = `Profile picture of ${sellerNameDiv.textContent}`;
        // Make seller name clickable to profile page
        sellerNameDiv.style.cursor = 'pointer';
        sellerNameDiv.style.textDecoration = 'underline';
        sellerNameDiv.addEventListener('click', () => {
            const userId = sellerData && sellerData._id ? sellerData._id : product.sellerUsername;
            window.location.href = `seller-profile.html?user=${userId}`;
        });
    // Make visit shop button navigate to seller profile
    visitShopBtn.addEventListener('click', () => {
        const userId = sellerData && sellerData._id ? sellerData._id : product.sellerUsername;
        window.location.href = `seller-profile.html?user=${userId}`;
    });
    } else {
        sellerNameDiv.textContent = product.sellerUsername;
        sellerProfileImg.src = 'https://placehold.co/50x50/cccccc/333333?text=C';
        sellerProfileImg.alt = 'Seller profile picture';
        visitShopBtn.addEventListener('click', () => {
            window.location.href = `profile.html?user=${product.sellerUsername}`;
        });
    }

    // Initialize photos array with all product photos if available, else fallback to coverPhotoUrl
    const backendOrigin = 'http://localhost:3002';
    if (product.photos && product.photos.length > 0) {
        photos = [...product.photos];
        // Ensure coverPhotoUrl is first if exists and not already first
        if (product.coverPhotoUrl && photos[0] !== product.coverPhotoUrl) {
            photos = photos.filter(p => p !== product.coverPhotoUrl);
            photos.unshift(product.coverPhotoUrl);
        }
    } else if (product.coverPhotoUrl) {
        photos = [product.coverPhotoUrl];
    } else {
        photos = [];
    }
    // Prepend backend origin to photo URLs if they are relative paths
    photos = photos.map(url => {
        if (url.startsWith('/')) {
            return backendOrigin + url;
        }
        return url;
    });

    renderStaticView();


} catch (error) {
    alert('Error loading product data.');
    window.location.href = 'homei.html';
}

// Like button functionality
const likeBtn = document.querySelector('.like-btn');
likeBtn.addEventListener('click', function() {
    const icon = this.querySelector('i');
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ff0000';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '#666';
    }
});

// Add navigation functionality to header icons and logo
document.getElementById('profileIcon').addEventListener('click', () => {
    window.location.href = 'profile.html';
});
document.getElementById('bagIcon').addEventListener('click', () => {
    window.location.href = 'bag.html';
});
document.getElementById('favoritesIcon').addEventListener('click', () => {
    window.location.href = '#'; // Update with actual favorites page if exists
});
document.getElementById('logo').addEventListener('click', () => {
    window.location.href = 'homei.html';
});
});
