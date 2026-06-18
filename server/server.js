require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDB, DEFAULT_PRODUCTS } = require('./database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // base64 圖片需要較大 limit
app.use(express.static(path.join(__dirname, '..')));

// ── 商品 API ──────────────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, quantity, image, recommend } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, quantity, image, recommend) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, price, quantity ?? 1, image ?? null, recommend ?? false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// restore 必須在 /:id 之前註冊，避免 'restore' 被當成 id
app.post('/api/products/restore', async (req, res) => {
  try {
    await pool.query('DELETE FROM products');
    for (const p of DEFAULT_PRODUCTS) {
      await pool.query(
        'INSERT INTO products (name, price, quantity, image, recommend) VALUES ($1,$2,$3,$4,$5)',
        [p.name, p.price, p.quantity, p.image, p.recommend]
      );
    }
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, quantity, recommend, image } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=$1, price=$2, quantity=$3, recommend=$4, image=$5 WHERE id=$6 RETURNING *',
      [name, price, quantity, recommend, image, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products', async (req, res) => {
  try {
    await pool.query('DELETE FROM products');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 管理員 API ────────────────────────────────────────────────────────

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM admin_account WHERE id=1');
    const admin = result.rows[0];
    if (admin && admin.username === username && admin.password === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/password', async (req, res) => {
  try {
    const { oldPassword, newUsername, newPassword } = req.body;
    const result = await pool.query('SELECT password FROM admin_account WHERE id=1');
    if (!result.rows[0] || result.rows[0].password !== oldPassword) {
      return res.status(401).json({ success: false, message: '舊密碼錯誤' });
    }
    await pool.query(
      'UPDATE admin_account SET username=$1, password=$2 WHERE id=1',
      [newUsername, newPassword]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/reset', async (req, res) => {
  try {
    await pool.query(
      "UPDATE admin_account SET username='mystore', password='412410077' WHERE id=1"
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 設定 API（aboutUs、customLogo）────────────────────────────────────

app.get('/api/settings/:key', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM settings WHERE key=$1', [req.params.key]);
    res.json({ value: result.rows[0]?.value ?? null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
      [req.params.key, value]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 結帳 API ──────────────────────────────────────────────────────────

app.post('/api/orders', async (req, res) => {
  try {
    const { items } = req.body; // [{ id, quantity }]
    for (const item of items) {
      await pool.query(
        'UPDATE products SET quantity = quantity - $1 WHERE id=$2 AND quantity >= $1',
        [item.quantity, item.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 啟動 ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
initDB()
  .then(() => app.listen(PORT, () => console.log(`伺服器啟動於 http://localhost:${PORT}`)))
  .catch(err => { console.error('資料庫初始化失敗:', err); process.exit(1); });
