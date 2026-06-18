window.addEventListener("DOMContentLoaded", async () => {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    if (location.href.includes(link.getAttribute("href"))) {
      link.classList.add("active");
    }
  });

  // 載入 Logo
  try {
    const res = await fetch('/api/settings/customLogo');
    const data = await res.json();
    if (data.value) {
      const logoImg = document.querySelector("img.logo");
      if (logoImg) logoImg.src = data.value;
    }
  } catch (e) {}

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let products = [];

  const cartContainer = document.getElementById("cartContainer");
  const totalPriceEl = document.getElementById("totalPrice");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const clearCartBtn = document.getElementById("clearCartBtn");

  // 從 API 取得最新庫存（用於判斷是否超量）
  try {
    const res = await fetch('/api/products');
    products = await res.json();
  } catch (e) {
    console.error('載入商品失敗', e);
  }

  function renderCart() {
    cartContainer.innerHTML = "";
    if (cart.length === 0) {
      cartContainer.innerHTML = `<div class="no-cart-item">🛒 購物車是空的</div>`;
      totalPriceEl.textContent = "總金額：NT$ 0";
      return;
    }
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      const isOutOfStock = product && item.quantity >= product.quantity;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <input type="checkbox" class="select-item" data-id="${item.id}" checked>
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-info">
          <div>${item.name}</div>
          <div>單價：NT$${item.price}</div>
          <div class="actions">
            數量：
            <button class="decrease-btn" data-id="${item.id}">-</button>
            <span class="qty">${item.quantity}</span>
            <button class="increase-btn" data-id="${item.id}" ${isOutOfStock ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
      cartContainer.appendChild(div);
    });

    updateTotal();
    bindEvents();
  }

  function updateTotal() {
    let total = 0;
    document.querySelectorAll(".select-item:checked").forEach(checkbox => {
      const id = parseInt(checkbox.dataset.id);
      const item = cart.find(i => i.id === id);
      if (item) total += item.price * item.quantity;
    });
    totalPriceEl.textContent = `總金額：NT$ ${total.toLocaleString()}`;
  }

  function bindEvents() {
    document.querySelectorAll(".select-item").forEach(cb => {
      cb.addEventListener("change", updateTotal);
    });
    document.querySelectorAll(".decrease-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item && item.quantity > 1) {
          item.quantity--;
          saveCart();
          renderCart();
        }
      });
    });
    document.querySelectorAll(".increase-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        const product = products.find(p => p.id === id);
        if (item && product && item.quantity < product.quantity) {
          item.quantity++;
          saveCart();
          renderCart();
        }
      });
    });
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  checkoutBtn.addEventListener("click", async () => {
    const selectedIds = [...document.querySelectorAll(".select-item:checked")].map(cb => parseInt(cb.dataset.id));
    if (selectedIds.length === 0) {
      alert("請先勾選要下單的商品！");
      return;
    }
    const orderItems = selectedIds.map(id => {
      const item = cart.find(i => i.id === id);
      return { id, quantity: item.quantity };
    });
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: orderItems })
      });
      const data = await res.json();
      if (data.success) {
        // 更新本地庫存顯示
        selectedIds.forEach(id => {
          const product = products.find(p => p.id === id);
          const orderItem = orderItems.find(i => i.id === id);
          if (product && orderItem) product.quantity -= orderItem.quantity;
        });
        cart = cart.filter(i => !selectedIds.includes(i.id));
        saveCart();
        alert("✅ 下單成功！");
        renderCart();
      }
    } catch (e) {
      alert('下單失敗，請稍後再試');
    }
  });

  clearCartBtn.addEventListener("click", () => {
    if (confirm("你確定要清空購物車嗎？")) {
      cart = [];
      saveCart();
      renderCart();
    }
  });

  renderCart();
});
