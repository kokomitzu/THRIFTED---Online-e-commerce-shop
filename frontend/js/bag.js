document.addEventListener('DOMContentLoaded', async () => {
    const bagItemsContainer = document.getElementById('bagItemsContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const checkoutSection = document.getElementById('checkoutSection');
    const totalAmountSpan = document.getElementById('totalAmount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    async function fetchCart() {
        try {
            const response = await fetch('/api/cart', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to fetch cart');
            }
            const cart = await response.json();
            return cart;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async function updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) return;
        try {
            // Remove the item and re-add with new quantity (simplified approach)
            await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ productId, quantity: newQuantity })
            });
            await loadCart();
        } catch (error) {
            alert('Failed to update quantity');
        }
    }

    async function removeItem(productId) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                await loadCart();
            } else {
                alert('Failed to remove item');
            }
        } catch (error) {
            alert('Failed to remove item');
        }
    }

    function renderCartItems(cart) {
        bagItemsContainer.innerHTML = '';
        if (!cart || !cart.items || cart.items.length === 0) {
            emptyMessage.style.display = 'block';
            checkoutSection.style.display = 'none';
            return;
        }
        emptyMessage.style.display = 'none';
        checkoutSection.style.display = 'block';

        let totalAmount = 0;
        cart.items.forEach(item => {
            const product = item.productId;
            const quantity = item.quantity;
            const itemTotal = product.price * quantity;
            totalAmount += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'bag-item';

            const img = document.createElement('img');
            img.src = product.coverPhotoUrl || 'https://placehold.co/80x100?text=No+Image';
            img.alt = product.name;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'bag-item-details';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'bag-item-title';
            titleDiv.textContent = product.name;

            const priceDiv = document.createElement('div');
            priceDiv.className = 'bag-item-price';
            priceDiv.textContent = `PHP ${product.price.toFixed(2)}`;

            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'bag-item-quantity';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'quantity-btn';
            minusBtn.textContent = '-';
            minusBtn.addEventListener('click', () => {
                updateQuantity(product._id, quantity - 1);
            });

            const quantitySpan = document.createElement('span');
            quantitySpan.textContent = quantity;

            const plusBtn = document.createElement('button');
            plusBtn.className = 'quantity-btn';
            plusBtn.textContent = '+';
            plusBtn.addEventListener('click', () => {
                updateQuantity(product._id, quantity + 1);
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                removeItem(product._id);
            });

            quantityDiv.appendChild(minusBtn);
            quantityDiv.appendChild(quantitySpan);
            quantityDiv.appendChild(plusBtn);

            detailsDiv.appendChild(titleDiv);
            detailsDiv.appendChild(priceDiv);
            detailsDiv.appendChild(quantityDiv);
            detailsDiv.appendChild(removeBtn);

            itemDiv.appendChild(img);
            itemDiv.appendChild(detailsDiv);

            bagItemsContainer.appendChild(itemDiv);
        });

        totalAmountSpan.textContent = totalAmount.toFixed(2);
    }

    async function loadCart() {
        const cart = await fetchCart();
        renderCartItems(cart);
    }

    checkoutBtn.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });

    await loadCart();
});
