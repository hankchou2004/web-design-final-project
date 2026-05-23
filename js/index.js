window.addEventListener("DOMContentLoaded", () => {
  // 導覽列連結高亮
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    if (location.href.includes(link.getAttribute("href"))) {
      link.classList.add("active");
    }
  });

  // 自訂 Logo 載入
  const savedLogo = localStorage.getItem("customLogo");
  if (savedLogo) {
    const logoImg = document.querySelector("img.logo");
    if (logoImg) {
      logoImg.src = savedLogo;
    }
  }

  // 建立推薦商品卡片
  const featuredGrid = document.getElementById("featuredGrid");
  const allProducts = JSON.parse(localStorage.getItem("products")) || [];
  const recommendedIds = JSON.parse(localStorage.getItem("recommendedProductIds")) || [];
  const featured = allProducts.filter(p => recommendedIds.includes(p.id)).slice(0, 5);

  featured.forEach(p => {
    const card = document.createElement("div");
    card.className = "shopee-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div class="title">${p.name}</div>
      <div class="price">NT$ ${p.price.toLocaleString()}</div>
    `;
    featuredGrid.appendChild(card);
  });
});
