window.addEventListener("DOMContentLoaded", async () => {
  // 導覽列連結高亮
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    if (location.href.includes(link.getAttribute("href"))) {
      link.classList.add("active");
    }
  });

  // 載入自訂 Logo
  try {
    const res = await fetch('/api/settings/customLogo');
    const data = await res.json();
    if (data.value) {
      const logoImg = document.querySelector("img.logo");
      if (logoImg) logoImg.src = data.value;
    }
  } catch (e) {}

  // 載入推薦商品
  const featuredGrid = document.getElementById("featuredGrid");
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const featured = products.filter(p => p.recommend).slice(0, 5);
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
  } catch (e) {
    console.error('載入商品失敗', e);
  }
});
