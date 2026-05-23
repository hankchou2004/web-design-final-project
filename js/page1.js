const links = document.querySelectorAll(".nav-link");
links.forEach(link => {
  if (location.href.includes(link.getAttribute("href"))) {
    link.classList.add("active");
  }
});

// 取得 DOM 元素
const productGrid = document.getElementById('productGrid');
const noResult = document.getElementById('noResult');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// 從 localStorage 載入商品資料
const products = JSON.parse(localStorage.getItem('products')) || [];

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
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      addToCart(id);
    });
  });
}

// 搜尋功能（部分匹配）
function searchProducts(keyword) {
  keyword = keyword.trim().toLowerCase();
  if (keyword === "") return products;
  return products.filter(p => p.name.toLowerCase().includes(keyword));
}

// 初始渲染：顯示全部或帶有搜尋關鍵字
const urlParams = new URLSearchParams(window.location.search);
const searchKeyword = urlParams.get("search");

if (searchKeyword) {
  searchInput.value = searchKeyword;
  const results = searchProducts(searchKeyword);
  renderProducts(results);
} else {
  renderProducts(products);
}

// 搜尋按鈕功能，加 event.preventDefault() 避免表單刷新
searchBtn.addEventListener('click', (event) => {
  event.preventDefault();
  const results = searchProducts(searchInput.value);
  renderProducts(results);
});

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    alert('找不到商品');
    return;
  }

  if (product.quantity <= 0) {
    alert('商品已售完');
    return;
  }

  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    });
  }

  // 更新 localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('products', JSON.stringify(products));

  alert(`已加入購物車：${product.name}`);
  renderProducts(products); // 重新渲染畫面以更新庫存數量
}

window.addEventListener("DOMContentLoaded", () => {
  const savedLogo = localStorage.getItem("customLogo");
  if (savedLogo) {
    const logoImg = document.querySelector("img.logo");
    if (logoImg) {
      logoImg.src = savedLogo;
    }
  }
});
