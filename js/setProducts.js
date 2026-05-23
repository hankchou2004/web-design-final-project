const defaultProducts = [
  { id: 1, name: "RGB機械鍵盤", price: 2000, quantity: 38, image: "/web-design-final-project/image/product_1.jpg" },
  { id: 2, name: "電競滑鼠", price: 1500, quantity: 44, image: "/web-design-final-project/image/product_2.jpg" },
  { id: 3, name: "電競耳機", price: 4050, quantity: 25, image: "/web-design-final-project/image/product_3.jpg" },
  { id: 4, name: "高解析螢幕", price: 15000, quantity: 31, image: "/web-design-final-project/image/product_4.jpg" },
  { id: 5, name: "電競椅", price: 6500, quantity: 22, image: "/web-design-final-project/image/product_5.jpg" },
  { id: 6, name: "滑鼠墊加長版", price: 500, quantity: 25, image: "/web-design-final-project/image/product_6.jpg" },
  { id: 7, name: "CPU散熱器", price: 10000, quantity: 18, image: "/web-design-final-project/image/product_7.jpg" },
  { id: 8, name: "電競控制器", price: 1080, quantity: 46, image: "/web-design-final-project/image/product_8.jpg" },
  { id: 9, name: "螢幕掛燈", price: 2759, quantity: 13, image: "/web-design-final-project/image/product_9.jpg" },
  { id: 10, name: "雙層主機風扇", price: 1169, quantity: 9, image: "/web-design-final-project/image/product_10.jpg" },
  { id: 11, name: "專業直播麥克風", price: 1241, quantity: 5, image: "/web-design-final-project/image/product_11.jpg" },
  { id: 12, name: "電競背包", price: 2677, quantity: 25, image: "/web-design-final-project/image/product_12.jpg" },
  { id: 13, name: "滑鼠防滑貼", price: 4573, quantity: 34, image: "/web-design-final-project/image/product_13.jpg" },
  { id: 14, name: "護腕墊", price: 2445, quantity: 13, image: "/web-design-final-project/image/product_14.jpg" },
  { id: 15, name: "RGB機殼風扇", price: 4961, quantity: 42, image: "/web-design-final-project/image/product_15.jpg" },
  { id: 16, name: "電競顯示卡支架", price: 3664, quantity: 6, image: "/web-design-final-project/image/product_16.jpg" },
  { id: 17, name: "多功能USB集線器", price: 876, quantity: 36, image: "/web-design-final-project/image/product_17.jpg" },
  { id: 18, name: "人體工學腳踏墊", price: 2844, quantity: 49, image: "/web-design-final-project/image/product_18.jpg" },
  { id: 19, name: "鍵盤防塵套", price: 612, quantity: 50, image: "/web-design-final-project/image/product_19.jpg" },
  { id: 20, name: "金屬鍵帽組", price: 3540, quantity: 44, image: "/web-design-final-project/image/product_20.jpg" },
  { id: 21, name: "RTX5090", price: 111000, quantity: 15, image: "/web-design-final-project/image/product_21.jpg" }
];

const recommendedProductIds = [1, 2, 3, 4, 5];

function saveDefaultData() {
  const productsWithRecommend = defaultProducts.map(product => ({
    ...product,
    recommend: recommendedProductIds.includes(product.id)
  }));

  localStorage.setItem("products", JSON.stringify(productsWithRecommend));
  localStorage.setItem("recommendedProductIds", JSON.stringify(recommendedProductIds));
}

// 僅當 localStorage 尚未有商品資料時才執行
if (!localStorage.getItem("products")) {
  saveDefaultData();
}
