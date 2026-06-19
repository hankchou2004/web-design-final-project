const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

const DEFAULT_ABOUT = `在這個科技飛速發展、電競蓬勃興盛的時代，「電競次元商城」誕生於對遊戲文化的熱愛與對專業設備的堅持。我們深信，好的電競體驗來自於精準、高效與個性化的周邊設備。因此，我們致力於提供多樣化的電競產品，包括高規格的電競滑鼠、機械式鍵盤、環繞音效耳機、RGB燈效設備、電競椅、主題周邊與收藏商品等，滿足每一位玩家對裝備的所有想像。

我們的選品團隊由一群電競愛好者、選手與硬體專家組成，秉持著嚴選與測試的精神，從品牌品質、耐用度、性價比到外觀設計進行全方位評估。無論你是剛踏入電競世界的新手，還是追求極致表現的職業玩家，都能在這裡找到最適合你的戰鬥裝備。

「電競次元商城」不只是一間商店，更是一個屬於玩家的社群平台。我們關注市場趨勢，也聆聽使用者聲音，致力於推動本土電競文化，定期舉辦線上活動與新品評測分享，讓每位玩家都能參與其中，成為社群的一份子。

我們承諾提供快速的出貨、貼心的客服與完善的售後服務，讓每一位顧客都能安心選購、滿意回購。選擇我們，就是選擇一種更專業、更講究的電競生活方式。`;

const DEFAULT_PRODUCTS = [
  { name: "RGB機械鍵盤",    price: 2000,   quantity: 38, image: "/image/product_1.jpg",  recommend: true  },
  { name: "電競滑鼠",       price: 1500,   quantity: 44, image: "/image/product_2.jpg",  recommend: true  },
  { name: "電競耳機",       price: 4050,   quantity: 25, image: "/image/product_3.jpg",  recommend: true  },
  { name: "高解析螢幕",     price: 15000,  quantity: 31, image: "/image/product_4.jpg",  recommend: true  },
  { name: "電競椅",         price: 6500,   quantity: 22, image: "/image/product_5.jpg",  recommend: true  },
  { name: "滑鼠墊加長版",   price: 500,    quantity: 25, image: "/image/product_6.jpg",  recommend: false },
  { name: "CPU散熱器",      price: 10000,  quantity: 18, image: "/image/product_7.jpg",  recommend: false },
  { name: "電競控制器",     price: 1080,   quantity: 46, image: "/image/product_8.jpg",  recommend: false },
  { name: "螢幕掛燈",       price: 2759,   quantity: 13, image: "/image/product_9.jpg",  recommend: false },
  { name: "雙層主機風扇",   price: 1169,   quantity: 9,  image: "/image/product_10.jpg", recommend: false },
  { name: "專業直播麥克風", price: 1241,   quantity: 5,  image: "/image/product_11.jpg", recommend: false },
  { name: "電競背包",       price: 2677,   quantity: 25, image: "/image/product_12.jpg", recommend: false },
  { name: "滑鼠防滑貼",     price: 4573,   quantity: 34, image: "/image/product_13.jpg", recommend: false },
  { name: "護腕墊",         price: 2445,   quantity: 13, image: "/image/product_14.jpg", recommend: false },
  { name: "RGB機殼風扇",    price: 4961,   quantity: 42, image: "/image/product_15.jpg", recommend: false },
  { name: "電競顯示卡支架", price: 3664,   quantity: 6,  image: "/image/product_16.jpg", recommend: false },
  { name: "多功能USB集線器",price: 876,    quantity: 36, image: "/image/product_17.jpg", recommend: false },
  { name: "人體工學腳踏墊", price: 2844,   quantity: 49, image: "/image/product_18.jpg", recommend: false },
  { name: "鍵盤防塵套",     price: 612,    quantity: 50, image: "/image/product_19.jpg", recommend: false },
  { name: "金屬鍵帽組",     price: 3540,   quantity: 44, image: "/image/product_20.jpg", recommend: false },
  { name: "RTX5090",        price: 111000, quantity: 15, image: "/image/product_21.jpg", recommend: false }
];

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id       SERIAL  PRIMARY KEY,
      name     TEXT    NOT NULL,
      price    INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      image    TEXT,
      recommend BOOLEAN DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS admin_account (
      id       INTEGER PRIMARY KEY DEFAULT 1,
      username TEXT    NOT NULL,
      password TEXT    NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await pool.query(`
    INSERT INTO admin_account (id, username, password)
    VALUES (1, 'mystore', '412410077')
    ON CONFLICT (id) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO settings (key, value) VALUES ('aboutUs', $1)
    ON CONFLICT (key) DO NOTHING;
  `, [DEFAULT_ABOUT]);

  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) === 0) {
    for (const p of DEFAULT_PRODUCTS) {
      await pool.query(
        'INSERT INTO products (name, price, quantity, image, recommend) VALUES ($1,$2,$3,$4,$5)',
        [p.name, p.price, p.quantity, p.image, p.recommend]
      );
    }
  }

  console.log('資料庫初始化完成');
}

module.exports = { pool, initDB, DEFAULT_PRODUCTS };
