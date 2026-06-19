# 🎮 電競次元商城

> 網頁設計課程期末專題 — 淡江大學資訊系統專題製作

🌐 線上展示網址：https://web-design-final-project-production.up.railway.app

---

## 📌 作品簡介

本專題為網頁設計課程之期末實作成果，以「電競次元商城」為主題，完整模擬電商平台的購物流程，並加入後台管理系統讓管理員即時維護賣場內容。前端採用原生 HTML/CSS/JavaScript，後端使用 Node.js + Express，資料持久化由 PostgreSQL 負責，部署於 Railway 雲端平台。

---

## 🗂️ 專案結構

```
web-design-final-project/
├── package.json            # npm 套件設定 & 啟動指令
├── .env.example            # 環境變數範本
├── server/
│   ├── server.js           # Express 伺服器 & API 路由
│   └── database.js         # PostgreSQL 連線 & 資料表初始化
├── index.html              # 首頁
├── page1/page1.html        # 商品頁
├── page2/page2.html        # 賣場管理後台
├── page3/page3.html        # 購物車
├── page4/page4.html        # 關於我們
├── css/                    # 樣式表
├── js/                     # 前端 JavaScript
└── image/                  # 商品圖片 & Logo
```

---

## 🖥️ 功能說明

### 🏠 首頁（index.html）
- 展示最多 5 件由後台標記的「熱門推薦商品」
- 提供搜尋欄，輸入關鍵字後跳轉至商品頁並自動過濾結果
- 支援自訂 Logo 顯示（從資料庫讀取）

### 🛍️ 商品頁（page1.html）
- 顯示所有上架商品，包含圖片、名稱、價格與庫存數量
- 支援關鍵字搜尋，即時過濾商品列表
- 點擊「加入購物車」將商品加入瀏覽器購物車
- 商品庫存為 0 時，加入按鈕自動停用

### 🛒 購物車（page3.html）
- 列出購物車內所有商品，支援勾選要結帳的項目
- 可調整各商品數量（不得超過資料庫庫存上限）
- 顯示勾選商品的即時總金額
- 結帳時呼叫 API 扣除資料庫庫存並清除已購商品
- 支援「清空購物車」一鍵清除所有項目

### 📖 關於我們（page4.html）
- 顯示從後台編輯並儲存至資料庫的「關於我們」文字內容
- 嵌入浮動式「聯繫我們」對話框

### ⚙️ 賣場管理後台（page2.html）
需登入管理員帳號才可使用，預設帳號與密碼如下：

| 帳號 | 密碼 |
|------|------|
| `mystore` | `412410077` |

登入後可進行以下操作：

1. **帳號密碼修改** — 驗證舊密碼後更新資料庫中的管理員憑證
2. **Logo 更換** — 上傳自訂圖片作為網站 Logo，存入資料庫，或還原為預設
3. **商品管理** — 新增、刪除商品；調整庫存數量；設定最多 5 件推薦商品；清空或還原為預設商品
4. **關於我們編輯** — 即時編輯頁面文字內容並儲存至資料庫

---

## 💾 資料儲存機制

後端使用 PostgreSQL 資料庫，共有三張資料表：

| 資料表 | 說明 |
|--------|------|
| `products` | 商品資料（名稱、價格、庫存、圖片、推薦狀態） |
| `admin_account` | 管理員帳號與密碼 |
| `settings` | 彈性設定（`aboutUs` 關於我們、`customLogo` 自訂 Logo） |

購物車資料仍暫存於瀏覽器 `localStorage`，清除瀏覽器快取將導致購物車內容遺失。

---

## 🔧 使用技術

| 技術 | 用途 |
|------|------|
| HTML5 / CSS3 | 頁面結構與樣式 |
| JavaScript (ES6+) | 前端互動邏輯、fetch API |
| Node.js + Express | 後端伺服器與 REST API |
| PostgreSQL | 資料持久化 |
| Railway | 雲端部署（後端 + 資料庫） |

---

## 🚀 本地執行方式

### 前置需求
- Node.js v18 以上
- PostgreSQL（本地安裝或使用 Docker）

### 步驟

```bash
# 1. 克隆專案
git clone https://github.com/hankchou2004/web-design-final-project.git
cd web-design-final-project

# 2. 安裝套件
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env，填入本地 PostgreSQL 帳密

# 4. 啟動伺服器
npm start
# 開啟 http://localhost:3000
```

### 建立本地 PostgreSQL 資料庫（若尚未建立）

```sql
CREATE DATABASE store_db;
CREATE USER store_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE store_db TO store_user;
```

資料表與預設資料會在伺服器第一次啟動時自動建立。

---

## ☁️ Railway 部署

1. 將專案 push 到 GitHub
2. 前往 [Railway](https://railway.app) → New Project → Deploy from GitHub Repo
3. 在同一個 Project 新增 **PostgreSQL** 服務
4. Railway 會自動注入 `DATABASE_URL` 與 `PORT` 環境變數
5. 部署完成後即可取得公開網址

---

## 🔌 API 路由一覽

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/products` | 取得所有商品 |
| POST | `/api/products` | 新增商品 |
| PUT | `/api/products/:id` | 更新商品 |
| DELETE | `/api/products/:id` | 刪除單一商品 |
| DELETE | `/api/products` | 清空所有商品 |
| POST | `/api/products/restore` | 還原預設商品 |
| POST | `/api/admin/login` | 管理員登入 |
| PUT | `/api/admin/password` | 修改帳號密碼 |
| POST | `/api/admin/reset` | 還原預設帳號密碼 |
| GET | `/api/settings/:key` | 讀取設定值 |
| PUT | `/api/settings/:key` | 更新設定值 |
| POST | `/api/orders` | 結帳（扣除庫存） |

---

👥 開發者資訊

本專案由淡江大學資工系學生製作。

---

## 📄 授權

本專案僅供學術用途，版權所有 © 2026 電競次元商城
