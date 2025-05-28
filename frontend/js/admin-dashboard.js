async function fetchUsers() {
  const messageEl = document.getElementById('message');
  try {
    const response = await fetch('/api/admin/users', {
      credentials: 'include'
    });
    if (response.status === 401) {
      messageEl.textContent = 'Unauthorized. Please log in as admin.';
      return;
    }
    if (response.status === 403) {
      messageEl.textContent = 'Forbidden. You do not have admin access.';
      return;
    }
    const users = await response.json();
    const tbody = document.querySelector('#userList tbody');
    tbody.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.username}</td>
        <td>${user.handle}</td>
        <td>${user.email}</td>
        <td>${user.isAdmin ? 'Yes' : 'No'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    messageEl.textContent = 'Error fetching users.';
  }
}

async function fetchProducts() {
  const messageEl = document.getElementById('message');
  try {
    const response = await fetch('/api/products', {
      credentials: 'include'
    });
    if (!response.ok) {
      messageEl.textContent = 'Error fetching products.';
      return;
    }
    const products = await response.json();
    const tbody = document.querySelector('#productList tbody');
    tbody.innerHTML = '';
    products.forEach(product => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.brand}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.condition}</td>
        <td>${product.sellerUsername}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    messageEl.textContent = 'Error fetching products.';
  }
}

fetchUsers();
fetchProducts();

// Optional: Add logout functionality
document.getElementById('logoutLink').addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) {
      window.location.href = 'homei.html';
    }
  } catch (error) {
    alert('Logout failed.');
  }
});
