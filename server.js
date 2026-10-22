// server.js - Professional inventory management website
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'stock.db'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: 'inventory_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Provide user info to templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Auth Guard Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Helper formatting price
app.locals.formatPrice = function(price, currency = 'IDR') {
  const num = Number(price) || 0;
  if (currency === 'USD') {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
};

// Initialize DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => {
    // Seed default admin if not exists
    db.get("SELECT * FROM users WHERE username = 'admin'", [], (err, row) => {
      if (!row) {
        const hashed = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
          ['admin', hashed, 'Administrator', 'admin']
        );
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'IDR'
  )`);

  // Ensure currency column exists for existing database
  db.all("PRAGMA table_info(items)", (err, columns) => {
    if (!err && columns && !columns.some(col => col.name === 'currency')) {
      db.run("ALTER TABLE items ADD COLUMN currency TEXT DEFAULT 'IDR'");
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS stock_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`);
});

// Authentication Routes
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { error: req.query.error || null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/login?error=Username+dan+password+wajib+diisi');
  }

  db.get('SELECT * FROM users WHERE username = ?', [username.trim()], (err, user) => {
    if (err) return res.status(500).send(err.message);
    if (!user) {
      return res.redirect('/login?error=Username+atau+password+salah');
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.redirect('/login?error=Username+atau+password+salah');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    res.redirect('/');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// List items with optional search
app.get('/', requireAuth, (req, res) => {
  const query = req.query.q ? `%${req.query.q}%` : null;
  const sql = query ? 'SELECT * FROM items WHERE name LIKE ? ORDER BY id DESC' : 'SELECT * FROM items ORDER BY id DESC';
  const params = query ? [query] : [];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.render('index', { items: rows, query: req.query.q, active: 'home' });
  });
});

// Stats page
app.get('/stats', requireAuth, (req, res) => {
  db.get('SELECT COUNT(*) AS count, SUM(quantity) AS totalQty FROM items', [], (err, summary) => {
    if (err) return res.status(500).send(err.message);
    db.all('SELECT currency, SUM(quantity * price) AS totalValue FROM items GROUP BY currency', [], (err2, currencyValues) => {
      if (err2) return res.status(500).send(err2.message);
      res.render('stats', { stats: summary, currencyValues: currencyValues || [], active: 'stats' });
    });
  });
});

// About page
app.get('/about', requireAuth, (req, res) => {
  res.render('about', { active: 'about' });
});

// Add item form
app.get('/add', requireAuth, (req, res) => {
  res.render('form', { item: null, action: '/add', active: 'add' });
});

// Handle add
app.post('/add', requireAuth, (req, res) => {
  const { name, quantity, price, currency } = req.body;
  const qty = parseInt(quantity, 10) || 0;
  const prc = parseFloat(price) || 0;
  const curr = (currency && currency.toUpperCase() === 'USD') ? 'USD' : 'IDR';

  db.run('INSERT INTO items (name, quantity, price, currency) VALUES (?,?,?,?)', [name, qty, prc, curr], function(err) {
    if (err) return res.status(500).send(err.message);
    const newItemId = this.lastID;

    // Log initial stock if quantity > 0
    if (qty > 0) {
      db.run('INSERT INTO stock_logs (item_id, type, quantity, notes) VALUES (?, ?, ?, ?)',
        [newItemId, 'IN', qty, 'Stok Awal (Penambahan Produk Baru)'],
        (logErr) => {
          if (logErr) console.error('Error logging initial stock:', logErr.message);
          res.redirect('/');
        }
      );
    } else {
      res.redirect('/');
    }
  });
});

// Edit form
app.get('/edit/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).send(err.message);
    if (!row) return res.status(404).send('Item not found');
    res.render('form', { item: row, action: `/edit/${id}`, active: 'edit' });
  });
});

// Handle edit
app.post('/edit/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const { name, quantity, price, currency } = req.body;
  const prc = parseFloat(price) || 0;
  const qty = parseInt(quantity, 10) || 0;
  const curr = (currency && currency.toUpperCase() === 'USD') ? 'USD' : 'IDR';

  db.run('UPDATE items SET name = ?, quantity = ?, price = ?, currency = ? WHERE id = ?', [name, qty, prc, curr, id], err => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/');
  });
});

// Delete
app.post('/delete/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM stock_logs WHERE item_id = ?', [id], () => {
    db.run('DELETE FROM items WHERE id = ?', [id], err => {
      if (err) return res.status(500).send(err.message);
      res.redirect('/');
    });
  });
});

// Adjust stock form (Stok Masuk / Keluar)
app.get('/adjust/:id?', requireAuth, (req, res) => {
  const selectedId = req.params.id || req.query.item_id;
  db.all('SELECT * FROM items ORDER BY name ASC', [], (err, items) => {
    if (err) return res.status(500).send(err.message);
    const selectedItem = items.find(i => String(i.id) === String(selectedId)) || null;
    res.render('adjust', {
      items,
      selectedItem,
      error: req.query.error || null,
      active: 'adjust'
    });
  });
});

// Handle adjust stock
app.post('/adjust', requireAuth, (req, res) => {
  const { item_id, type, quantity, notes } = req.body;
  const qty = parseInt(quantity, 10);

  if (!item_id || !qty || qty <= 0 || !['IN', 'OUT'].includes(type)) {
    return res.redirect(`/adjust/${item_id || ''}?error=Input+tidak+valid`);
  }

  db.get('SELECT * FROM items WHERE id = ?', [item_id], (err, item) => {
    if (err) return res.status(500).send(err.message);
    if (!item) return res.redirect('/adjust?error=Barang+tidak+ditemukan');

    if (type === 'OUT' && qty > item.quantity) {
      return res.redirect(`/adjust/${item_id}?error=Jumlah+keluar+(${qty})+melebihi+stok+saat+ini+(${item.quantity})`);
    }

    const newQty = type === 'IN' ? item.quantity + qty : item.quantity - qty;

    db.run('UPDATE items SET quantity = ? WHERE id = ?', [newQty, item_id], (updateErr) => {
      if (updateErr) return res.status(500).send(updateErr.message);

      const noteText = notes && notes.trim() !== '' ? notes.trim() : (type === 'IN' ? 'Stok Masuk' : 'Stok Keluar');
      db.run('INSERT INTO stock_logs (item_id, type, quantity, notes) VALUES (?, ?, ?, ?)',
        [item_id, type, qty, noteText],
        (logErr) => {
          if (logErr) return res.status(500).send(logErr.message);
          res.redirect('/transactions');
        }
      );
    });
  });
});

// Transaction history list (Riwayat Stok Masuk / Keluar)
app.get('/transactions', requireAuth, (req, res) => {
  const typeFilter = req.query.type;
  let sql = `
    SELECT stock_logs.*, items.name AS item_name
    FROM stock_logs
    LEFT JOIN items ON stock_logs.item_id = items.id
  `;
  const params = [];

  if (typeFilter === 'IN' || typeFilter === 'OUT') {
    sql += ' WHERE stock_logs.type = ?';
    params.push(typeFilter);
  }

  sql += ' ORDER BY stock_logs.id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.render('transactions', {
      transactions: rows,
      currentType: typeFilter || '',
      active: 'transactions'
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
