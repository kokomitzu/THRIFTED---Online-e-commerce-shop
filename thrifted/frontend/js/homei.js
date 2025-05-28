document.addEventListener('DOMContentLoaded', () => {
    // Add heart functionality
    document.querySelectorAll('.heart-icon').forEach(heart => {
        heart.addEventListener('click', () => {
            const icon = heart.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });

    // Add button functionality
    document.querySelector('.add-btn').addEventListener('click', () => {
        console.log('Add button clicked');
        window.location.href = 'addproduct.html';
    });

    // Modal handling
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeLogin = document.getElementById('closeLogin');
    const closeSignup = document.getElementById('closeSignup');

    loginBtn.onclick = () => {
        loginModal.style.display = 'block';
    };

    signupBtn.onclick = () => {
        signupModal.style.display = 'block';
    };

    closeLogin.addEventListener('click', () => {
        console.log('closeLogin clicked');
        loginModal.style.display = 'none';
        clearLoginForm();
    });

    if (closeSignup) {
        closeSignup.addEventListener('click', () => {
            console.log('closeSignup clicked');
            signupModal.style.display = 'none';
            clearSignupForm();
        });
    }

    // Add password length validation to login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const handleOrEmail = document.getElementById('loginUsernameOrEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        const messageElem = document.getElementById('loginMessage');
        if (!handleOrEmail || !password) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Please enter both handle/email and password.';
            return;
        }
        if (password.length < 8) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Password must be at least 8 characters long.';
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handleOrEmail, password })
            });
            const data = await response.json();
            if (response.ok) {
                messageElem.style.color = 'green';
                messageElem.textContent = data.message;
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    clearLoginForm();
                    // Optionally reload or redirect after login
                    location.reload();
                }, 1500);
            } else {
                messageElem.style.color = 'red';
                messageElem.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Error connecting to server';
        }
    });

    window.onclick = (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            clearLoginForm();
        }
        if (event.target === signupModal) {
            signupModal.style.display = 'none';
            clearSignupForm();
        }
    };

    // Clear forms and messages
    function clearLoginForm() {
        document.getElementById('loginForm').reset();
        document.getElementById('loginMessage').textContent = '';
    }

    function clearSignupForm() {
        document.getElementById('signupForm').reset();
        document.getElementById('signupMessage').textContent = '';
    }

    // Handle signup form submission with automatic login
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const handle = document.getElementById('signupHandle').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();

        const messageElem = document.getElementById('signupMessage');
        const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!handle || !email || !password) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Please enter handle, email, and password.';
            return;
        }
        if (!passwordRequirements.test(password)) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Password does not meet the requirements.';
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, handle, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                messageElem.style.color = 'green';
                messageElem.textContent = data.message;

                // Automatically log in the user after successful signup
                const loginResponse = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ handleOrEmail: handle, password })
                });
                const loginData = await loginResponse.json();
                if (loginResponse.ok) {
                    setTimeout(() => {
                        signupModal.style.display = 'none';
                        clearSignupForm();
                        // Optionally reload or redirect after login
                        location.reload();
                    }, 1500);
                } else {
                    messageElem.style.color = 'red';
                    messageElem.textContent = loginData.message || 'Automatic login failed after signup';
                }
            } else {
                messageElem.style.color = 'red';
                messageElem.textContent = data.message || 'Signup failed';
            }
        } catch (error) {
            messageElem.style.color = 'red';
            messageElem.textContent = 'Error connecting to server';
        }
    });
});

// Function to create product card element
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.style.cursor = 'pointer';

    productCard.addEventListener('click', () => {
        window.location.href = `product.html?id=${product._id}`;
    });

    const imgDiv = document.createElement('div');
    imgDiv.className = 'product-image';
    const img = document.createElement('img');
    img.src = product.coverPhotoUrl || 'https://placehold.co/200x200/f5f5f5/666666?text=No+Image';
    img.alt = product.name || 'Product Image';
    img.style.borderRadius = '10px';
    img.style.width = '220px';
    img.style.height = '220px';
    img.style.objectFit = 'cover';
    imgDiv.appendChild(img);
    productCard.appendChild(imgDiv);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'product-title';
    titleDiv.textContent = product.name || 'Unnamed Product';
    productCard.appendChild(titleDiv);

    const priceDiv = document.createElement('div');
    priceDiv.className = 'product-price';
    priceDiv.textContent = 'PHP ' + (product.price || '0.00');
    productCard.appendChild(priceDiv);

    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'product-condition';
    conditionDiv.textContent = product.condition || 'Condition';
    productCard.appendChild(conditionDiv);

    return productCard;
}

// Fetch and display products on page load
async function loadProducts() {
    const mainContent = document.querySelector('.main-content');
    const existingGrid = document.getElementById('liveProductsGrid');
    if (existingGrid) {
        existingGrid.remove();
    }
    const productsGrid = document.createElement('div');
    productsGrid.id = 'liveProductsGrid';
    productsGrid.className = 'products-grid';
    mainContent.appendChild(productsGrid);

    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        if (products.length === 0) {
            const noProductsMsg = document.createElement('p');
            noProductsMsg.textContent = 'No products available.';
            noProductsMsg.style.textAlign = 'center';
            productsGrid.appendChild(noProductsMsg);
        } else {
            products.forEach(product => {
                const productCard = createProductCard(product);
                productsGrid.appendChild(productCard);
            });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

loadProducts();

// WebSocket for live product updates
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${window.location.host}`);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'newProduct') {
        const productsGrid = document.getElementById('liveProductsGrid');
        if (productsGrid) {
            const productCard = createProductCard(data.product);
            productsGrid.insertBefore(productCard, productsGrid.firstChild);
        }
    }
};

ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};
