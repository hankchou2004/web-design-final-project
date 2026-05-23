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
(function() {
  let products = [];
  // 其他程式碼放這裡


function initAdminAccount() {
  if (!localStorage.getItem("adminAccount")) {
    const defaultAdmin = { username: "mystore", password: "412410077" };
    localStorage.setItem("adminAccount", JSON.stringify(defaultAdmin));
    alert("預設管理員帳號：mystore，密碼：412410077");
  }
}

function showAdminSection() {
  loginContainer.style.display = "none";
  adminSection.style.display = "block";
  aboutSection.style.display = "block";
  if (accountSettingsSection) accountSettingsSection.style.display = "block";
  logoutBtn.style.display = "inline-block";

  const raw = localStorage.getItem("products");
  if (raw === null && localStorage.getItem("cleared") !== "true") {
  loadDefaultProducts();
}


  products = JSON.parse(localStorage.getItem("products")) || [];
  renderProducts(products);
}

function checkLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const admin = JSON.parse(localStorage.getItem("adminAccount"));
  // 讀取 localStorage 的 logo 並設定
  const savedLogo = localStorage.getItem("customLogo");
  if (savedLogo) {
    document.querySelector("img.logo").src = savedLogo;
  }

  if (username === admin.username && password === admin.password) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loggedInUser", username);
    showAdminSection();
    alert(`登入成功`);
  } else {
    alert("登入失敗，請輸入正確的帳號與密碼！");
  }
}

logoutBtn.addEventListener("click", () => {
  if (confirm("確定要登出嗎？")) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedInUser");
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
  initAdminAccount();
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

accountForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const admin = JSON.parse(localStorage.getItem("adminAccount"));
  const oldPassword = oldPasswordInput.value.trim();
  const newUsername = newUsernameInput.value.trim();
  const newPassword = newPasswordInput.value.trim();

  if (!newUsername || !oldPassword || !newPassword) {
    alert("請完整輸入舊密碼、新帳號與新密碼");
    return;
  }
  if (oldPassword !== admin.password) {
    alert("舊密碼錯誤，無法修改");
    return;
  }

  localStorage.setItem("adminAccount", JSON.stringify({
    username: newUsername,
    password: newPassword
  }));
  alert("帳號與密碼已修改，請重新登入");
  logoutBtn.click();
});

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

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('.recommend-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = products.find(p => p.id === id);
      const currentRecommends = products.filter(p => p.recommend);
      if (!product.recommend && currentRecommends.length >= 5) {
        alert("最多只能推薦 5 樣商品！");
        return;
      }
      product.recommend = !product.recommend;
      localStorage.setItem("products", JSON.stringify(products));
      renderProducts(products);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      deleteProductById(id);
    });
  });

  document.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = products.find(p => p.id === id);
      if (product && product.quantity > 1) {
        updateQuantity(id, product.quantity - 1);
        renderProducts(products);
      }
    });
  });

  document.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = products.find(p => p.id === id);
      if (product) {
        updateQuantity(id, product.quantity + 1);
        renderProducts(products);
      }
    });
  });
}

function deleteProductById(id) {
  if (!confirm("確定要刪除此商品嗎？")) return;
  products = products.filter(p => p.id !== id);
  localStorage.setItem('products', JSON.stringify(products));
  renderProducts(products);
}

function updateQuantity(id, qty) {
  qty = parseInt(qty);
  if (isNaN(qty) || qty < 1) qty = 1;
  const product = products.find(p => p.id === id);
  if (product) {
    product.quantity = qty;
    localStorage.setItem("products", JSON.stringify(products));
  }
}

clearBtn.addEventListener("click", () => {
  const confirmClear = confirm("⚠️ 確定要清空所有商品嗎？此操作無法還原！");
  if (confirmClear) {
    localStorage.removeItem("products");
    localStorage.setItem("cleared", "true");

    products = [];
    renderProducts(products);
    alert("✅ 所有商品已清空！");
  }
});

restoreDefaultBtn.addEventListener("click", () => {
  const confirmRestore = confirm("確定要還原為預設商品嗎？這會覆蓋目前的商品資料");
  if (confirmRestore) {
    localStorage.removeItem("cleared"); // ← 加這行
    loadDefaultProducts();
    alert("✅ 商品已還原為預設！");
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
    reader.onload = function(event) {
      addProduct(name, price, event.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    addProduct(name, price, 'https://via.placeholder.com/180?text=無圖');
  }
});

function addProduct(name, price, imageBase64) {
  const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
  const newProduct = {
    id: maxId + 1,
    name: name,
    price: price,
    image: imageBase64,
    quantity: 1,
    recommend: false
  };
  products.push(newProduct);
  localStorage.setItem("products", JSON.stringify(products));
  renderProducts(products);

  productNameInput.value = "";
  productPriceInput.value = "";
  productImageFile.value = "";
}

const aboutContentTextarea = document.getElementById("aboutContent");
const saveAboutBtn = document.getElementById("saveAboutBtn");
const resetAboutBtn = document.getElementById("resetAboutBtn");

if (aboutContentTextarea && saveAboutBtn && resetAboutBtn) {
  const defaultAboutUs = `在這個科技飛速發展、電競蓬勃興盛的時代，「電競次元商城」誕生於對遊戲文化的熱愛與對專業設備的堅持。我們深信，好的電競體驗來自於精準、高效與個性化的周邊設備。因此，我們致力於提供多樣化的電競產品，包括高規格的電競滑鼠、機械式鍵盤、環繞音效耳機、RGB燈效設備、電競椅、主題周邊與收藏商品等，滿足每一位玩家對裝備的所有想像。

我們的選品團隊由一群電競愛好者、選手與硬體專家組成，秉持著嚴選與測試的精神，從品牌品質、耐用度、性價比到外觀設計進行全方位評估。無論你是剛踏入電競世界的新手，還是追求極致表現的職業玩家，都能在這裡找到最適合你的戰鬥裝備。

「電競次元商城」不只是一間商店，更是一個屬於玩家的社群平台。我們關注市場趨勢，也聆聽使用者聲音，致力於推動本土電競文化，定期舉辦線上活動與新品評測分享，讓每位玩家都能參與其中，成為社群的一份子。

我們承諾提供快速的出貨、貼心的客服與完善的售後服務，讓每一位顧客都能安心選購、滿意回購。選擇我們，就是選擇一種更專業、更講究的電競生活方式。`;

  function loadAboutUsContent() {
    const content = localStorage.getItem("aboutUs") || defaultAboutUs;
    aboutContentTextarea.value = content;
  }

  saveAboutBtn.addEventListener("click", () => {
    localStorage.setItem("aboutUs", aboutContentTextarea.value.trim());
    alert("已儲存『關於我們』內容！");
  });

  resetAboutBtn.addEventListener("click", () => {
    const confirmReset = confirm("確定要還原為預設內容嗎？這將覆蓋目前編輯的內容。");
    if (confirmReset) {
      aboutContentTextarea.value = defaultAboutUs;
      localStorage.setItem("aboutUs", defaultAboutUs);
      alert("已還原為預設內容！");
    }
  });

  loadAboutUsContent();
}

function loadDefaultProducts() {
  if (typeof saveDefaultData === "function") {
    saveDefaultData();
    products = JSON.parse(localStorage.getItem("products")) || [];
    renderProducts(products);

    // 清除清空標誌
    localStorage.removeItem("cleared");
  } else {
    alert("無法載入預設商品，請確認 setproduct.js 是否正確引用！");
  }
}


const resetAdminAccountBtn = document.getElementById("resetAdminAccountBtn");

if (resetAdminAccountBtn) {
  resetAdminAccountBtn.addEventListener("click", () => {
    if (confirm("確定要還原管理員帳號密碼為預設值？")) {
      const defaultAdmin = { username: "mystore", password: "412410077" };
      localStorage.setItem("adminAccount", JSON.stringify(defaultAdmin));
      alert("已還原預設帳號密碼，請用預設帳號密碼重新登入。");
      
      // 清空輸入框
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    }
  });
}

const logoFileInput = document.getElementById("logoFileInput");
const changeLogoBtn = document.getElementById("changeLogoBtn");
const logoImg = document.querySelector("img.logo");

changeLogoBtn.addEventListener("click", () => {
  const file = logoFileInput.files[0];
  if (!file) {
    alert("請先選擇一個圖片檔案");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    logoImg.src = dataUrl;
    localStorage.setItem("customLogo", dataUrl);
    alert("Logo 已更新");
  };
  reader.readAsDataURL(file);
});

const resetLogoBtn = document.getElementById("resetLogoBtn");

resetLogoBtn.addEventListener("click", () => {
  localStorage.removeItem("customLogo");  // 清除自訂 Logo
  // 預設 Logo 路徑（請改成你原本的預設路徑）
  const defaultLogoSrc = "/image/logo.png";
  logoImg.src = defaultLogoSrc;
  alert("Logo 已還原為預設");
});




window.checkLogin = checkLogin;

})();
