const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ---- Mock data (mirrors client) ----
const shops = [
  { id: "shop-1", name: "SportShop Tirana", initials: "SS", category: "Sports & Shoes", location: "Tirana", rating: 4.9, reviewCount: 128, verified: true },
  { id: "shop-2", name: "Fashion Zone", initials: "FZ", category: "Clothes & Fashion", location: "Tirana", rating: 4.7, reviewCount: 94, verified: true },
  { id: "shop-3", name: "TechZone Albania", initials: "TZ", category: "Electronics", location: "Durrës", rating: 4.6, reviewCount: 77, verified: true },
  { id: "shop-4", name: "Bella Cosmetics", initials: "BC", category: "Beauty & Cosmetics", location: "Tirana", rating: 4.8, reviewCount: 156, verified: true },
  { id: "shop-5", name: "Casa Home", initials: "CH", category: "Home & Living", location: "Shkodër", rating: 4.5, reviewCount: 43, verified: false },
  { id: "shop-6", name: "Kicks ALB", initials: "KA", category: "Shoes", location: "Tirana", rating: 4.4, reviewCount: 61, verified: false },
];

const products = [
  { id: "p-1", name: "Nike Air Max 270", shopId: "shop-1", price: 3200, category: "shoes", inStock: true, rating: 4.9, reviewCount: 34, trending: true },
  { id: "p-2", name: "Adidas Ultraboost 22", shopId: "shop-1", price: 3800, category: "shoes", inStock: true, rating: 4.7, reviewCount: 18, trending: false },
  { id: "p-3", name: "Summer Floral Dress", shopId: "shop-2", price: 1800, category: "clothes", inStock: true, rating: 4.8, reviewCount: 27, trending: true },
  { id: "p-4", name: "Linen Blazer", shopId: "shop-2", price: 2900, category: "clothes", inStock: true, rating: 4.6, reviewCount: 12, trending: false },
  { id: "p-5", name: "iPhone 15 Pro", shopId: "shop-3", price: 145000, category: "electronics", inStock: true, rating: 4.9, reviewCount: 22, trending: true },
  { id: "p-6", name: "Samsung Galaxy S24", shopId: "shop-3", price: 98000, category: "electronics", inStock: true, rating: 4.7, reviewCount: 15, trending: false },
  { id: "p-7", name: "Charlotte Tilbury Foundation", shopId: "shop-4", price: 2200, category: "beauty", inStock: true, rating: 4.9, reviewCount: 41, trending: true },
  { id: "p-8", name: "Dyson Airwrap", shopId: "shop-4", price: 32000, category: "beauty", inStock: false, rating: 4.8, reviewCount: 19, trending: false },
  { id: "p-9", name: "Minimalist Desk Lamp", shopId: "shop-5", price: 1500, category: "home", inStock: true, rating: 4.5, reviewCount: 8, trending: false },
  { id: "p-10", name: "Air Force 1 '07", shopId: "shop-6", price: 2800, category: "shoes", inStock: true, rating: 4.5, reviewCount: 29, trending: false },
];

// ---- Routes ----
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/products', (req, res) => {
  const { q, category, city, sort, trending } = req.query;
  let result = [...products];

  if (q) result = result.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  if (category) result = result.filter(p => p.category === category);
  if (city && city !== 'All cities') {
    result = result.filter(p => {
      const shop = shops.find(s => s.id === p.shopId);
      return shop?.location === city;
    });
  }
  if (trending === 'true') result = result.filter(p => p.trending);
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);

  res.json(result);
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

app.get('/api/shops', (req, res) => {
  const { q, city, verified } = req.query;
  let result = [...shops];
  if (q) result = result.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  if (city && city !== 'All cities') result = result.filter(s => s.location === city);
  if (verified === 'true') result = result.filter(s => s.verified);
  res.json(result);
});

app.get('/api/shops/:id', (req, res) => {
  const s = shops.find(s => s.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

app.post('/api/orders', (req, res) => {
  const { items, delivery, payment } = req.body;
  const order = {
    id: '#' + Math.floor(1000 + Math.random() * 9000),
    items,
    delivery,
    payment,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  res.json({ success: true, order });
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: 'p-' + Date.now(),
    ...req.body,
    inStock: true,
    rating: 0,
    reviewCount: 0,
    trending: false
  };
  products.push(newProduct);
  res.json({ success: true, product: newProduct });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
