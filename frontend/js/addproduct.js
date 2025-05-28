function setupImagePreview(inputId, boxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        let img = box.querySelector('img.preview-image');
        if (!img) {
          img = document.createElement('img');
          img.classList.add('preview-image');
          box.appendChild(img);
        }
        img.src = e.target.result;

        // Add remove button
        let removeBtn = box.querySelector('button.remove-btn');
        if (!removeBtn) {
          removeBtn = document.createElement('button');
          removeBtn.classList.add('remove-btn');
          removeBtn.innerHTML = '&times;';
          box.appendChild(removeBtn);

          removeBtn.addEventListener('click', () => {
            input.value = '';
            img.remove();
            removeBtn.remove();
          });
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

setupImagePreview('coverPhoto', 'coverPhotoBox');
setupImagePreview('frontPhoto', 'frontPhotoBox');
setupImagePreview('backPhoto', 'backPhotoBox');
setupImagePreview('sidePhoto', 'sidePhotoBox');
setupImagePreview('labelPhoto', 'labelPhotoBox');
setupImagePreview('detailPhoto', 'detailPhotoBox');
setupImagePreview('flawPhoto', 'flawPhotoBox');

document.getElementById('addProductForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const form = this;
  const formData = new FormData(form);

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const newProductId = data.product._id;
      alert('Product added successfully.');
      window.location.href = `product.html?id=${newProductId}`;
    } else {
      const data = await response.json();
      alert('Failed to add product: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Error adding product: ' + error.message);
  }
});