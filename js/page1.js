const links = document.querySelectorAll(".nav-link");
links.forEach(link => {
  if (location.href.includes(link.getAttribute("href"))) {
    link.classList.add("active");
  }
});

const productGrid = document.getElementById('productGrid');
const noResult = document.getElementById('noResult');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderProducts(items) {
  productGrid.innerHTML = "";
  if (items.length === 0) {
    noResult.style.display = "block";
    noResult.textContent = "目前沒有任何商品";
    return;
  }
  noResult.style.display = "none";

  items.forEach(p => {
    const card = document.createElement('div');
    card.className = 'shopee-card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/180?text=無圖'}" alt="${p.name}" />
      <div class="title">${p.name}</div>
      <div class="price">NT$ ${p.price.toLocaleString()}</div>
      <div class="stock">庫存：${p.quantity}</div>
      <button class="add-to-cart-btn" data-id="${p.id}" ${p.quantity === 0 ? 'disabled' : ''}>加入購物車</button>
    `;
    productGrid.appendChild(card);
  });

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
  });
}

function searchProducts(keyword) {
  keyword = keyword.trim().toLowerCase();
  if (keyword === "") return products;
  return products.filter(p => p.name.toLowerCase().includes(keyword));
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.quantity <= 0) {
    alert('商品已售完');
    return;
  }
  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1, image: product.image });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert(`已加入購物車：${product.name}`);
}

searchBtn.addEventListener('click', (event) => {
  event.preventDefault();
  renderProducts(searchProducts(searchInput.value));
});

window.addEventListener("DOMContentLoaded", async () => {
  // 載入 Logo
  try {
    const res = await fetch('/api/settings/customLogo');
    const data = await res.json();
    if (data.value) {
      const logoImg = document.querySelector("img.logo");
      if (logoImg) logoImg.src = data.value;
    }
  } catch (e) {}

  // 從 API 載入商品
  try {
    const res = await fetch('/api/products');
    products = await res.json();
  } catch (e) {
    console.error('載入商品失敗', e);
    products = [];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const searchKeyword = urlParams.get("search");
  if (searchKeyword) {
    searchInput.value = searchKeyword;
    renderProducts(searchProducts(searchKeyword));
  } else {
    renderProducts(products);
  }
});
