# 電競次元商城 — 技術文件

> 本文件涵蓋專案架構說明、實作細節、資安分析，以及工作面試中可能被問及的問題與參考回答。

---

## 目錄

1. [專案架構總覽](#1-專案架構總覽)
2. [技術選型說明](#2-技術選型說明)
3. [前端實作](#3-前端實作)
4. [後端實作](#4-後端實作)
5. [資料庫設計](#5-資料庫設計)
6. [部署流程](#6-部署流程)
7. [資安分析與改進建議](#7-資安分析與改進建議)
8. [面試問題與參考回答](#8-面試問題與參考回答)

---

## 1. 專案架構總覽

```
┌─────────────────────────────────────────────────────┐
│                     使用者瀏覽器                     │
│  HTML + CSS + JS  ←→  fetch API  ←→  EmailJS (CDN) │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│              Railway 雲端平台                        │
│  ┌─────────────────────────────┐                    │
│  │   Node.js + Express         │                    │
│  │   server.js（REST API）      │                    │
│  │   + express.static（靜態檔） │                    │
│  └────────────┬────────────────┘                    │
│               │ pg 連線池                            │
│  ┌────────────▼────────────────┐                    │
│  │   PostgreSQL 資料庫          │                    │
│  │   products / admin / settings│                    │
│  └─────────────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

**資料流說明：**

- 使用者所有頁面請求（`/`、`/page1/page1.html` 等）都由 Express 的 `express.static()` 中介層直接回傳靜態 HTML 檔案
- 動態資料（商品、設定、訂單）透過 `fetch()` 呼叫後端 REST API（`/api/...`）
- 聯絡表單透過 EmailJS SDK 直接從瀏覽器端傳送，繞過自身後端

---

## 2. 技術選型說明

| 技術 | 選擇原因 |
|------|----------|
| **原生 HTML/CSS/JS** | 課程要求不使用框架；直接操作 DOM 有助於理解底層運作 |
| **Node.js + Express** | JavaScript 全端統一語言；Express 輕量且路由設定直覺 |
| **PostgreSQL** | 關聯式資料庫符合商品/訂單結構；支援 ACID 交易特性 |
| **pg（node-postgres）** | Node.js 最成熟的 PostgreSQL 驅動，支援連線池 |
| **Railway** | 同時支援 Node.js 服務與 PostgreSQL；免設定 CI/CD，push 即部署 |
| **EmailJS** | 純前端寄信方案，不需要自建 SMTP；免費方案足夠展示用途 |
| **CSS Custom Properties** | 建立設計系統（Design Token），一處修改全站生效 |

---

## 3. 前端實作

### 3.1 設計系統（Design System）

建立 `css/global.css` 作為全站共用樣式，定義 CSS 變數（Custom Properties）作為設計 Token：

```css
:root {
  --cyan:    #00E5FF;   /* 主品牌色 */
  --purple:  #8B5CF6;   /* 副品牌色 */
  --glow-cyan: 0 0 6px rgba(0,229,255,0.55), ...;  /* 霓虹光暈 */
}
```

**好處：** 各頁面只載入 `global.css` + 自己的頁面 CSS，避免重複撰寫 header/footer/button 樣式。

### 3.2 響應式設計（RWD）

採用 CSS Flexbox + Grid 搭配媒體查詢（Media Query）實現：

```css
@media (max-width: 768px) { /* 平板 */ }
@media (max-width: 480px) { /* 手機 */ }
```

商品列表使用 `repeat(auto-fill, minmax(195px, 1fr))` 讓格子數量根據畫面寬度自動調整，不需 JavaScript 介入。

### 3.3 頁面間資料傳遞

由於無框架（無 React state / Vue store），頁面間資料傳遞採用：

| 情境 | 方法 |
|------|------|
| 購物車資料 | `localStorage` |
| 搜尋關鍵字（首頁→商品頁） | URL Query String（`?search=...`） |
| 管理員登入狀態 | `localStorage.isLoggedIn` |
| 商品資料、設定 | 每頁載入時呼叫 REST API |

### 3.4 動態商品渲染

前端不使用模板引擎，改以 JavaScript 字串拼接 HTML：

```js
card.innerHTML = `
  <img src="${product.image}">
  <div class="title">${product.name}</div>
  <div class="price">NT$ ${product.price}</div>
`;
```

**注意：** 這裡存在 XSS 風險（見第 7 節）。

---

## 4. 後端實作

### 4.1 Express 伺服器結構

```
server.js
├── app.use(cors())                    ← 跨域設定
├── app.use(express.json())            ← 解析 JSON 請求體
├── app.use(express.static('..'))      ← 靜態檔案服務
├── /api/products   (CRUD)             ← 商品管理
├── /api/admin      (login/password)   ← 管理員認證
├── /api/settings   (key/value)        ← 彈性設定
├── /api/orders     (POST)             ← 結帳扣庫存
└── initDB().then(() => app.listen())  ← 確保 DB 就緒才啟動
```

### 4.2 資料庫連線池（Connection Pool）

```js
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**為什麼用 Pool 而不是單一連線？**

每次 HTTP 請求都建立新連線會有高延遲（TCP 握手 + PostgreSQL 認證），連線池預先建立多條連線並重複使用，顯著降低回應時間。`pg.Pool` 預設維護最多 10 條連線。

### 4.3 SQL 參數化查詢（防 SQL Injection）

```js
pool.query('SELECT * FROM products WHERE id=$1', [req.params.id])
```

全專案使用 `$1, $2...` 佔位符，由 pg 驅動負責轉義，**完全避免 SQL Injection**。

### 4.4 環境變數分離

敏感資訊（資料庫連線字串）存放於 `.env`（本地）或 Railway 環境變數（雲端），不寫死在程式碼中，`.env` 已列入 `.gitignore`。

---

## 5. 資料庫設計

### 5.1 資料表

```sql
-- 商品資料表
CREATE TABLE products (
  id        SERIAL  PRIMARY KEY,
  name      TEXT    NOT NULL,
  price     INTEGER NOT NULL,
  quantity  INTEGER NOT NULL DEFAULT 1,
  image     TEXT,              -- 儲存 /image/xxx.jpg 路徑或 base64 字串
  recommend BOOLEAN DEFAULT false
);

-- 管理員帳號（單筆，id 固定為 1）
CREATE TABLE admin_account (
  id       INTEGER PRIMARY KEY DEFAULT 1,
  username TEXT    NOT NULL,
  password TEXT    NOT NULL    -- ⚠ 明文儲存，見資安分析
);

-- 彈性設定（key-value 結構）
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
  -- 目前使用：aboutUs（關於我們文字）、customLogo（base64 圖片）
);
```

### 5.2 初始化策略

伺服器啟動時呼叫 `initDB()`，使用 `CREATE TABLE IF NOT EXISTS` 與 `ON CONFLICT DO NOTHING` 確保冪等性（idempotent）——多次執行結果相同，不會重複建表或覆蓋既有資料。

### 5.3 庫存扣減的並發問題

```sql
UPDATE products
SET quantity = quantity - $1
WHERE id=$2 AND quantity >= $1
```

`WHERE quantity >= $1` 條件確保庫存不會扣成負數。但在高並發情境下（多人同時結帳同一商品）可能發生 Race Condition，正式環境應使用 `FOR UPDATE` 鎖定列或資料庫交易（Transaction）。

---

## 6. 部署流程

```
本地開發
  │
  ├─ git push → GitHub (main branch)
  │               │
  │               └─ Railway 偵測到新 commit
  │                       │
  │               Nixpacks 自動偵測 Node.js
  │               執行 npm install + npm start
  │                       │
  │               注入環境變數 (DATABASE_URL, PORT)
  │                       │
  │               Railway PostgreSQL 已就緒
  │                       │
  └──────────────── 公開網址上線 ────────────────────
```

**Railway 自動處理：**
- HTTPS 憑證（Let's Encrypt）
- PORT 環境變數注入
- 連結 PostgreSQL 的 DATABASE_URL
- 程式崩潰時自動重啟

---

## 7. 資安分析與改進建議

### 🔴 高風險

#### 7.1 管理員密碼明文儲存

**問題：** `admin_account` 資料表的 `password` 欄位儲存原始密碼字串，資料庫一旦外洩，密碼立即曝光。

**改進：** 使用 bcrypt 雜湊儲存密碼

```js
const bcrypt = require('bcrypt');

// 設定密碼時
const hash = await bcrypt.hash(plainPassword, 12);

// 驗證時
const isMatch = await bcrypt.compare(inputPassword, storedHash);
```

---

#### 7.2 前端認證狀態（偽認證）

**問題：** 管理員登入後只在 `localStorage` 設定 `isLoggedIn = "true"`，使用者可直接在瀏覽器開發者工具修改此值，繞過登入畫面——但後端 API 沒有驗證，任何人都可以直接呼叫 `/api/products` POST/DELETE 等操作。

**改進：** 後端實作 JWT（JSON Web Token）認證

```js
// 登入成功後發放 token
const jwt = require('jsonwebtoken');
const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });

// 受保護的 API 路由加上驗證中介層
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.delete('/api/products/:id', authMiddleware, async (req, res) => { ... });
```

---

#### 7.3 XSS（跨站腳本攻擊）

**問題：** 前端以 `innerHTML` 插入從資料庫取得的商品名稱，若商品名稱包含 `<script>alert(1)</script>`，會被瀏覽器執行。

```js
// 危險寫法
card.innerHTML = `<div class="title">${product.name}</div>`;
```

**改進：** 使用 `textContent` 或對字串做 HTML 跳脫（Escape）

```js
// 安全寫法
const title = card.querySelector('.title');
title.textContent = product.name;  // 自動跳脫特殊字元
```

---

### 🟡 中風險

#### 7.4 無登入嘗試限制（暴力破解）

**問題：** `/api/admin/login` 沒有速率限制，攻擊者可以無限次嘗試密碼。

**改進：** 加入 `express-rate-limit`

```js
const rateLimit = require('express-rate-limit');
app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分鐘
  max: 10,                    // 最多 10 次
  message: { error: '嘗試次數過多，請稍後再試' }
}));
```

---

#### 7.5 CORS 設定過於寬鬆

**問題：** `app.use(cors())` 允許任何來源跨域請求，在正式環境中應限制為指定網域。

**改進：**

```js
app.use(cors({
  origin: 'https://web-design-final-project-production.up.railway.app'
}));
```

---

#### 7.6 缺乏輸入驗證

**問題：** 新增商品時後端未驗證輸入，price 傳入 `"abc"` 或負數也會寫入資料庫。

**改進：**

```js
app.post('/api/products', async (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0)
    return res.status(400).json({ error: '商品名稱不可為空' });
  if (!Number.isInteger(price) || price <= 0)
    return res.status(400).json({ error: '價格必須為正整數' });
  // ...
});
```

---

#### 7.7 Logo 以 base64 儲存於資料庫

**問題：** 自訂 Logo 將整張圖片轉為 base64 字串寫入 `settings` 資料表，一張圖片可達數 MB，導致每次讀取設定都傳輸大量資料，且佔用資料庫空間。

**改進：** 使用物件儲存（如 AWS S3 / Cloudflare R2），資料庫只儲存圖片 URL。

---

### 🟢 低風險（良好實作，可補充說明）

#### 7.8 已正確防範 SQL Injection

全部查詢使用參數化語法（`$1, $2...`），pg 驅動自動跳脫，**已有效防範**。

#### 7.9 敏感設定透過環境變數管理

`DATABASE_URL` 不寫死在程式碼中，`.env` 已加入 `.gitignore`，符合 12-Factor App 原則。

---

## 8. 面試問題與參考回答

### 架構與設計

**Q1：請簡單介紹這個專案的架構。**

> 這是一個前後端整合的電商網站。前端使用原生 HTML/CSS/JavaScript，不依賴框架，自己建立了一套 CSS Design System 統一樣式。後端是 Node.js 搭配 Express 框架提供 REST API，資料持久化使用 PostgreSQL，部署在 Railway 雲端平台。前端透過 `fetch()` 呼叫後端 API 取得商品、設定等動態資料，購物車狀態暫存於瀏覽器 `localStorage`。

---

**Q2：為什麼選擇不使用 React 或 Vue？**

> 這是課程要求，目的是讓學生理解原生 DOM 操作的底層原理。實際上如果是商業專案，我會選用 React 或 Vue，因為它們提供了元件化、狀態管理和虛擬 DOM 等機制，能大幅提升開發效率和可維護性。不過這次的實作也讓我深刻理解了為什麼框架存在——當你手動維護大量 `innerHTML` 和 DOM 操作時，很容易出現 bug 和效能問題。

---

**Q3：你怎麼處理多個頁面共用的 Header 和 Footer？**

> 我建立了一個 `css/global.css` 共用樣式檔，讓每個 HTML 頁面都引用它。Header 和 Footer 的 HTML 在每個頁面手動重複，這是原生 HTML 的限制——沒有框架就沒有元件複用。如果要改善，可以用 JavaScript 動態插入，或改用 Express 的模板引擎（如 EJS）來做 Server-side Rendering，讓 header/footer 只維護一份。

---

**Q4：為什麼使用 Connection Pool，而不是每次都新建資料庫連線？**

> 建立 PostgreSQL 連線需要 TCP 三向握手加上資料庫認證，延遲大約 50–200ms。若每個 API 請求都重新建立連線，在高流量時會形成明顯的效能瓶頸。連線池預先建立一批連線（預設 10 條），請求來時直接取用、用完歸還，大幅降低延遲。我使用 `pg.Pool` 實現，並加上 `pool.on('error')` 錯誤處理，避免連線池的錯誤事件讓整個 Node.js 程序崩潰。

---

**Q5：你的 API 有做版本控制嗎？**

> 這個專案沒有做，所有 API 路徑都直接是 `/api/products` 這樣的形式。在正式產品中應該加上版本號，例如 `/api/v1/products`，這樣未來改版時舊客戶端還能繼續使用 v1，不需要強制所有人同步升級。

---

### 資安相關

**Q6：這個專案有哪些資安問題？你會怎麼改進？**

> 主要有三個問題。第一，管理員密碼是明文儲存在資料庫，應改用 bcrypt 雜湊，加 12 rounds salt，讓即使資料庫外洩也無法還原原始密碼。第二，認證機制只靠 `localStorage` 的一個布林值，後端 API 沒有驗證呼叫者身份，任何人都可以直接呼叫刪除商品的 API。應改用 JWT，每個受保護的 API 路由都驗證 token。第三，商品名稱用 `innerHTML` 插入 DOM，有 XSS 風險，應改用 `textContent`。

---

**Q7：你的專案如何防止 SQL Injection？**

> 我使用 `node-postgres`（pg）的參數化查詢，所有使用者輸入都透過 `$1, $2...` 佔位符傳入，由 pg 驅動負責跳脫特殊字元，而不是用字串拼接 SQL。例如 `pool.query('SELECT * FROM products WHERE id=$1', [id])`，即使 `id` 傳入 `1; DROP TABLE products;--`，pg 也會將它視為普通字串，不會執行為 SQL 指令。

---

**Q8：你的登入機制有什麼問題？有沒有防暴力破解？**

> 目前的登入 API 沒有任何速率限制，攻擊者可以用腳本無限次嘗試密碼。改進方式是加上 `express-rate-limit` 套件，設定同一 IP 在 15 分鐘內最多嘗試 10 次，超過就封鎖並回傳 429。另外也應考慮帳號鎖定機制，連續失敗超過一定次數後暫時停用該帳號。

---

### 資料庫

**Q9：為什麼購物車資料放在 localStorage，而不是資料庫？**

> 這是設計取捨。購物車資料是使用者個人且暫時性的，存放在 localStorage 不需要後端 API、不佔資料庫空間，操作即時性也較好。缺點是更換裝置或清除瀏覽器資料後購物車就消失了。正式電商（如蝦皮、Momo）通常會在使用者登入後將購物車同步到資料庫，實現跨裝置共享。這個專案因為沒有會員系統，所以暫時只用 localStorage。

---

**Q10：結帳時如何確保庫存不會扣成負數？如果兩個人同時結帳同一商品怎麼辦？**

> 我在 SQL 的 WHERE 條件加了 `quantity >= $1` 的限制，確保只有庫存足夠才更新，不會扣成負數。但這個方法在高並發情境下有 Race Condition 問題：兩個人同時讀到庫存為 1，都通過了 `>= 1` 的檢查，就可能兩筆都成功扣減導致庫存變 -1。正確做法是使用資料庫交易（Transaction）加 `SELECT FOR UPDATE` 行鎖，確保同一時間只有一個請求能修改同一筆庫存記錄。

---

### 前端

**Q11：你怎麼實作 RWD（響應式設計）？**

> 主要用兩個技術。一是 CSS Grid 的 `auto-fill` 搭配 `minmax()`，商品格子會根據螢幕寬度自動決定要幾欄，不需要 JavaScript。二是 Media Query，在 768px 和 480px 兩個斷點調整排版——例如後台的雙欄佈局在平板以下改為單欄堆疊，購物車底部結帳列在手機上改為垂直排列。字體大小則用 `clamp()` 函式實現流體字型，在最小值和最大值之間根據視窗寬度平滑縮放。

---

**Q12：EmailJS 是什麼？為什麼不用後端寄信？**

> EmailJS 是一個讓前端可以直接寄電子郵件的服務，SDK 跑在瀏覽器端，透過 EmailJS 的 API 伺服器轉發到指定信箱，不需要自己的後端處理 SMTP。選擇它是因為這個專案的後端已經在 Railway 上，再架設 SMTP 或串接 SendGrid 需要更多設定，而 EmailJS 的免費方案（每月 200 封）對展示用途已夠。缺點是 Public Key 暴露在前端 JS 中，但 EmailJS 本身設計就是這樣運作，可以透過在 EmailJS 後台設定允許網域來限制濫用。

---

### 部署

**Q13：請說明這個專案從 commit 到上線的流程。**

> 我 `git push` 到 GitHub 的 main branch 後，Railway 會自動偵測到新 commit，用 Nixpacks 自動識別這是 Node.js 專案，執行 `npm install` 安裝依賴，然後執行 `package.json` 裡定義的 `npm start`（即 `node server/server.js`）。Railway 會注入 `PORT` 和 `DATABASE_URL` 環境變數，HTTPS 憑證也由 Railway 自動管理。整個 CI/CD 流程零設定，push 完大約 2 分鐘就上線。

---

**Q14：如果要讓這個專案支援更多使用者同時上線，你會怎麼擴展？**

> 目前的架構是單一 Node.js 實例，瓶頸在兩個地方。一是應用層，可以用 PM2 開啟多個 Node.js 程序（cluster mode）充分利用多核 CPU，或在 Railway 上增加 replica 數量做水平擴展。二是資料庫層，PostgreSQL 可以增加 read replica，讓讀取操作分散到副本，寫入才走主節點。另外前端靜態資源可以上傳到 CDN（如 Cloudflare）加速全球分發，減輕原始伺服器的流量壓力。

---

**Q15：這個專案你最有成就感的部分是什麼？如果重做，你會改變什麼？**

> 最有成就感的部分是從零建立 CSS Design System，定義 CSS Custom Properties 作為設計 Token，讓全站的色彩、間距、動畫都統一管理，修改一個變數就能影響所有元件，這讓我體會到設計系統的價值。
>
> 如果重做，我會從一開始就實作 JWT 認證，而不是等到後期才意識到後端 API 完全沒有保護。我也會選擇使用 EJS 或類似的模板引擎來避免每個 HTML 檔案都要手動複製 header/footer，大幅降低維護成本。另外，圖片應該存到物件儲存服務而非 base64 寫入資料庫，這在架構上更合理也更有擴展性。

---

*文件最後更新：2026 年 6 月*
