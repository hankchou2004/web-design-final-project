const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginContainer = document.getElementById("loginContainer");
const adminSection = document.getElementById("adminSection");
const aboutSection = document.getElementById("aboutSection");
const logoutBtn = document.getElementById("logoutBtn");
const accountSettingsSection = document.getElementById("accountSettings");
const oldPasswordInput = document.getElementById("oldPassword");
const newUsernameInput = document.getElementById("newUsername");
const newPasswordInput = document.getElementById("newPassword");
const accountForm = document.getElementById("accountForm");

(function () {
  let products = [];

  // ── 登入 / 登出 ──────────────────────────────────────────────────────

  async function showAdminSection() {
    loginContainer.style.display = "none";
    adminSection.style.display = "block";
    aboutSection.style.display = "block";
    if (accountSettingsSection) accountSettingsSection.style.display = "block";
    logoutBtn.style.display = "inline-block";

    try {
      const res = await fetch('/api/products');
      products = await res.json();
    } catch (e) {
      products = [];
    }
    renderProducts(products);
    loadAboutUsContent();
    loadLogo();
  }

  async function checkLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("isLoggedIn", "true");
        await showAdminSection();
        alert('登入成功');
      } else {
        alert('登入失敗，請輸入正確的帳號與密碼！');
      }
    } catch (e) {
      alert('伺服器連線失敗');
    }
  }

  logoutBtn.addEventListener("click", () => {
    if (confirm("確定要登出嗎？")) {
      localStorage.removeItem("isLoggedIn");
      adminSection.style.display = "none";
      aboutSection.style.display = "none";
      if (accountSettingsSection) accountSettingsSection.style.display = "none";
      loginContainer.style.display = "block";
      usernameInput.value = "";
      passwordInput.value = "";
      logoutBtn.style.display = "none";
    }
  });

  window.onload = () => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      showAdminSection();
    } else {
      loginContainer.style.display = "block";
      adminSection.style.display = "none";
      aboutSection.style.display = "none";
      logoutBtn.style.display = "none";
      if (accountSettingsSection) accountSettingsSection.style.display = "none";
    }
  };

  // ── 修改帳號密碼 ──────────────────────────────────────────────────────

  accountForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = oldPasswordInput.value.trim();
    const newUsername = newUsernameInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    if (!newUsername || !oldPassword || !newPassword) {
      alert("請完整輸入舊密碼、新帳號與新密碼");
      return;
    }
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newUsername, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert("帳號與密碼已修改，請重新登入");
        logoutBtn.click();
      } else {
        alert(data.message || '修改失敗');
      }
    } catch (e) {
      alert('伺服器連線失敗');
    }
  });

  // ── 商品管理 ──────────────────────────────────────────────────────────

  const productGrid = document.getElementById('productGrid');
  const noResult = document.getElementById('noResult');
  const clearBtn = document.getElementById('clearBtn');
  const restoreDefaultBtn = document.getElementById('restoreDefaultBtn');
  const addProductForm = document.getElementById('addProductForm');
  const productNameInput = document.getElementById('productName');
  const productPriceInput = document.getElementById('productPrice');
  const productImageFile = document.getElementById('productImageFile');

  function renderProducts(items) {
    productGrid.innerHTML = "";
    if (!items || items.length === 0) {
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
        <div class="quantity">
          數量：
          <button class="qty-decrease" data-id="${p.id}">−</button>
          <input type="number" min="1" value="${p.quantity || 1}" data-id="${p.id}" class="qty-input" />
          <button class="qty-increase" data-id="${p.id}">＋</button>
        </div>
        <button class="recommend-btn" data-id="${p.id}">${p.recommend ? "✅ 已推薦" : "🌟 設為推薦"}</button>
        <button class="delete-btn" data-id="${p.id}">🗑️ 刪除</button>
      `;
      productGrid.appendChild(card);
    });
    bindProductEvents();
  }

  function bindProductEvents() {
    document.querySelectorAll('.recommend-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find(p => p.id === id);
        const currentRecommends = products.filter(p => p.recommend);
        if (!product.recommend && currentRecommends.length >= 5) {
          alert("最多只能推薦 5 樣商品！");
          return;
        }
        product.recommend = !product.recommend;
        try {
          await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
          });
        } catch (e) {
          product.recommend = !product.recommend; // 失敗則回滾
          alert('更新失敗');
        }
        renderProducts(products);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteProductById(parseInt(btn.dataset.id)));
    });

    document.querySelectorAll('.qty-decrease').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find(p => p.id === id);
        if (product && product.quantity > 1) {
          product.quantity--;
          await updateProductInDB(product);
          renderProducts(products);
        }
      });
    });

    document.querySelectorAll('.qty-increase').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const product = products.find(p => p.id === id);
        if (product) {
          product.quantity++;
          await updateProductInDB(product);
          renderProducts(products);
        }
      });
    });
  }

  async function updateProductInDB(product) {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
    } catch (e) {
      alert('更新失敗');
    }
  }

  async function deleteProductById(id) {
    if (!confirm("確定要刪除此商品嗎？")) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      products = products.filter(p => p.id !== id);
      renderProducts(products);
    } catch (e) {
      alert('刪除失敗');
    }
  }

  clearBtn.addEventListener("click", async () => {
    if (!confirm("⚠️ 確定要清空所有商品嗎？此操作無法還原！")) return;
    try {
      await fetch('/api/products', { method: 'DELETE' });
      products = [];
      renderProducts(products);
      alert("✅ 所有商品已清空！");
    } catch (e) {
      alert('清空失敗');
    }
  });

  restoreDefaultBtn.addEventListener("click", async () => {
    if (!confirm("確定要還原為預設商品嗎？這會覆蓋目前的商品資料")) return;
    try {
      const res = await fetch('/api/products/restore', { method: 'POST' });
      products = await res.json();
      renderProducts(products);
      alert("✅ 商品已還原為預設！");
    } catch (e) {
      alert('還原失敗');
    }
  });

  addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = productNameInput.value.trim();
    const price = parseInt(productPriceInput.value);
    const file = productImageFile.files[0];
    if (!name || isNaN(price) || price < 0) {
      alert('請輸入正確的商品名稱與價格');
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => addProduct(name, price, event.target.result);
      reader.readAsDataURL(file);
    } else {
      addProduct(name, price, 'https://via.placeholder.com/180?text=無圖');
    }
  });

  async function addProduct(name, price, imageBase64) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, quantity: 1, image: imageBase64, recommend: false })
      });
      const newProduct = await res.json();
      products.push(newProduct);
      renderProducts(products);
      productNameInput.value = "";
      productPriceInput.value = "";
      productImageFile.value = "";
    } catch (e) {
      alert('新增商品失敗');
    }
  }

  // ── 關於我們 ──────────────────────────────────────────────────────────

  const aboutContentTextarea = document.getElementById("aboutContent");
  const saveAboutBtn = document.getElementById("saveAboutBtn");
  const resetAboutBtn = document.getElementById("resetAboutBtn");

  const defaultAboutUs = `在這個科技飛速發展、電競蓬勃興盛的時代，「電競次元商城」誕生於對遊戲文化的熱愛與對專業設備的堅持。我們深信，好的電競體驗來自於精準、高效與個性化的周邊設備。因此，我們致力於提供多樣化的電競產品，包括高規格的電競滑鼠、機械式鍵盤、環繞音效耳機、RGB燈效設備、電競椅、主題周邊與收藏商品等，滿足每一位玩家對裝備的所有想像。

我們的選品團隊由一群電競愛好者、選手與硬體專家組成，秉持著嚴選與測試的精神，從品牌品質、耐用度、性價比到外觀設計進行全方位評估。無論你是剛踏入電競世界的新手，還是追求極致表現的職業玩家，都能在這裡找到最適合你的戰鬥裝備。

「電競次元商城」不只是一間商店，更是一個屬於玩家的社群平台。我們關注市場趨勢，也聆聽使用者聲音，致力於推動本土電競文化，定期舉辦線上活動與新品評測分享，讓每位玩家都能參與其中，成為社群的一份子。

我們承諾提供快速的出貨、貼心的客服與完善的售後服務，讓每一位顧客都能安心選購、滿意回購。選擇我們，就是選擇一種更專業、更講究的電競生活方式。`;

  async function loadAboutUsContent() {
    if (!aboutContentTextarea) return;
    try {
      const res = await fetch('/api/settings/aboutUs');
      const data = await res.json();
      aboutContentTextarea.value = data.value || defaultAboutUs;
    } catch (e) {}
  }

  if (saveAboutBtn) {
    saveAboutBtn.addEventListener("click", async () => {
      try {
        await fetch('/api/settings/aboutUs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: aboutContentTextarea.value.trim() })
        });
        alert("已儲存『關於我們』內容！");
      } catch (e) {
        alert('儲存失敗');
      }
    });
  }

  if (resetAboutBtn) {
    resetAboutBtn.addEventListener("click", async () => {
      if (!confirm("確定要還原為預設內容嗎？這將覆蓋目前編輯的內容。")) return;
      try {
        await fetch('/api/settings/aboutUs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: defaultAboutUs })
        });
        aboutContentTextarea.value = defaultAboutUs;
        alert("已還原為預設內容！");
      } catch (e) {
        alert('還原失敗');
      }
    });
  }

  // ── Logo 管理 ──────────────────────────────────────────────────────────

  const logoFileInput = document.getElementById("logoFileInput");
  const changeLogoBtn = document.getElementById("changeLogoBtn");
  const logoImg = document.querySelector("img.logo");
  const resetLogoBtn = document.getElementById("resetLogoBtn");

  async function loadLogo() {
    try {
      const res = await fetch('/api/settings/customLogo');
      const data = await res.json();
      if (data.value && logoImg) logoImg.src = data.value;
    } catch (e) {}
  }

  changeLogoBtn.addEventListener("click", () => {
    const file = logoFileInput.files[0];
    if (!file) {
      alert("請先選擇一個圖片檔案");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      if (logoImg) logoImg.src = dataUrl;
      try {
        await fetch('/api/settings/customLogo', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: dataUrl })
        });
        alert("Logo 已更新");
      } catch (err) {
        alert('Logo 更新失敗');
      }
    };
    reader.readAsDataURL(file);
  });

  resetLogoBtn.addEventListener("click", async () => {
    try {
      await fetch('/api/settings/customLogo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: null })
      });
      if (logoImg) logoImg.src = "/image/logo.png";
      alert("Logo 已還原為預設");
    } catch (e) {
      alert('還原失敗');
    }
  });

  // ── 還原管理員帳號 ────────────────────────────────────────────────────

  const resetAdminAccountBtn = document.getElementById("resetAdminAccountBtn");
  if (resetAdminAccountBtn) {
    resetAdminAccountBtn.addEventListener("click", async () => {
      if (!confirm("確定要還原管理員帳號密碼為預設值？")) return;
      try {
        await fetch('/api/admin/reset', { method: 'POST' });
        alert("已還原預設帳號密碼，請用預設帳號密碼重新登入。");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
      } catch (e) {
        alert('還原失敗');
      }
    });
  }

  window.checkLogin = checkLogin;
})();
