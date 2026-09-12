const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initDb();
  }
});

function initDb() {
  db.run(
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Credit Card',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error creating transactions table:', err.message);
        return;
      }
      seedInitialData();
    }
  );
}

function seedInitialData() {
  db.get('SELECT COUNT(*) as count FROM transactions', (err, row) => {
    if (err) {
      console.error('Error checking transactions count:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Seeding initial transactions for demo...');
      const now = new Date();
      const formatDate = (daysAgo) => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      const seedTransactions = [
        { title: 'Tech Salary', amount: 5200.0, type: 'income', category: 'Salary', date: formatDate(12), payment_method: 'Bank Transfer', notes: 'Monthly engineering compensation' },
        { title: 'Freelance Design Project', amount: 1450.0, type: 'income', category: 'Freelance', date: formatDate(4), payment_method: 'Bank Transfer', notes: 'Mobile UI redesign client payout' },
        { title: 'Apartment Rent', amount: 1400.0, type: 'expense', category: 'Housing', date: formatDate(11), payment_method: 'Bank Transfer', notes: 'Downtown loft monthly lease' },
        { title: 'Whole Foods Market', amount: 164.35, type: 'expense', category: 'Food & Dining', date: formatDate(2), payment_method: 'Credit Card', notes: 'Weekly groceries and fresh organic produce' },
        { title: 'High-speed Fiber Internet', amount: 69.99, type: 'expense', category: 'Utilities', date: formatDate(8), payment_method: 'Debit Card', notes: 'Gigabit fiber connection' },
        { title: 'Equinox Gym Membership', amount: 85.0, type: 'expense', category: 'Health & Fitness', date: formatDate(14), payment_method: 'Credit Card', notes: 'Monthly fitness and pool access' },
        { title: 'Artisan Bistro Dinner', amount: 92.4, type: 'expense', category: 'Food & Dining', date: formatDate(3), payment_method: 'Credit Card', notes: 'Dinner with colleagues' },
        { title: 'Noise-Cancelling Headphones', amount: 279.0, type: 'expense', category: 'Shopping', date: formatDate(6), payment_method: 'Credit Card', notes: 'Audio upgrade for remote office' },
        { title: 'Electric & Heating Utility', amount: 94.15, type: 'expense', category: 'Utilities', date: formatDate(9), payment_method: 'Bank Transfer', notes: 'City power bill' },
        { title: 'Metro Transit Monthly Pass', amount: 75.0, type: 'expense', category: 'Transportation', date: formatDate(10), payment_method: 'Debit Card', notes: 'Subway & bus monthly commuter card' },
        { title: 'Streaming Subscriptions', amount: 29.98, type: 'expense', category: 'Entertainment', date: formatDate(5), payment_method: 'Credit Card', notes: 'Netflix 4K & Spotify Family bundle' },
        { title: 'Dividend Payout', amount: 185.5, type: 'income', category: 'Investments', date: formatDate(1), payment_method: 'Bank Transfer', notes: 'Quarterly index fund dividend payout' }
      ];

      const stmt = db.prepare(
        'INSERT INTO transactions (title, amount, type, category, date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      seedTransactions.forEach((tx) => {
        stmt.run(tx.title, tx.amount, tx.type, tx.category, tx.date, tx.payment_method, tx.notes);
      });

      stmt.finalize(() => {
        console.log('Seed data inserted successfully.');
      });
    }
  });
}

// API Routes

// GET all transactions with filtering and sorting
app.get('/api/transactions', (req, res) => {
  const { search, category, type, startDate, endDate, sortBy } = req.query;

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (title LIKE ? OR notes LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (type && type !== 'all') {
    query += ' AND type = ?';
    params.push(type);
  }

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  switch (sortBy) {
    case 'date_asc':
      query += ' ORDER BY date ASC, id ASC';
      break;
    case 'amount_desc':
      query += ' ORDER BY amount DESC';
      break;
    case 'amount_asc':
      query += ' ORDER BY amount ASC';
      break;
    case 'title_asc':
      query += ' ORDER BY title ASC';
      break;
    case 'date_desc':
    default:
      query += ' ORDER BY date DESC, id DESC';
      break;
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ data: rows });
  });
});

// GET single transaction
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ data: row });
  });
});

// POST new transaction
app.post('/api/transactions', (req, res) => {
  const { title, amount, type, category, date, payment_method, notes } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required and cannot be empty.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either "income" or "expense".' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  const txDate = date && !isNaN(Date.parse(date)) ? date : new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO transactions (title, amount, type, category, date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [title.trim(), parsedAmount, type, category.trim(), txDate, payment_method || 'Credit Card', notes ? notes.trim() : ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT * FROM transactions WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Transaction created successfully', data: row });
      });
    }
  );
});

// PUT update transaction
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { title, amount, type, category, date, payment_method, notes } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "income" or "expense".' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  const txDate = date && !isNaN(Date.parse(date)) ? date : new Date().toISOString().split('T')[0];

  const query = `
    UPDATE transactions
    SET title = ?, amount = ?, type = ?, category = ?, date = ?, payment_method = ?, notes = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [title.trim(), parsedAmount, type, category.trim(), txDate, payment_method || 'Credit Card', notes ? notes.trim() : '', id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found.' });
      }

      db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Transaction updated successfully', data: row });
      });
    }
  );
});

// DELETE transaction
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    res.json({ message: 'Transaction deleted successfully', id: Number(id) });
  });
});

// GET summary & analytics stats
app.get('/api/stats/summary', (req, res) => {
  const queries = {
    totals: `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COUNT(*) as totalTransactions
      FROM transactions
    `,
    categoryExpenses: `
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'expense'
      GROUP BY category
      ORDER BY total DESC
    `,
    categoryIncomes: `
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE type = 'income'
      GROUP BY category
      ORDER BY total DESC
    `,
    monthlyTrends: `
      SELECT
        substr(date, 1, 7) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      GROUP BY substr(date, 1, 7)
      ORDER BY month ASC
    `
  };

  db.get(queries.totals, (err, totalsRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(queries.categoryExpenses, (err, expenseCategories) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(queries.categoryIncomes, (err, incomeCategories) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(queries.monthlyTrends, (err, monthlyTrends) => {
          if (err) return res.status(500).json({ error: err.message });

          const totalIncome = totalsRow.totalIncome;
          const totalExpense = totalsRow.totalExpense;
          const balance = totalIncome - totalExpense;
          const savingsRate = totalIncome > 0 ? Math.max(0, ((balance / totalIncome) * 100).toFixed(1)) : 0;

          res.json({
            summary: {
              totalIncome,
              totalExpense,
              balance,
              savingsRate: parseFloat(savingsRate),
              totalTransactions: totalsRow.totalTransactions
            },
            expenseCategories,
            incomeCategories,
            monthlyTrends
          });
        });
      });
    });
  });
});

// GET export to CSV
app.get('/api/export/csv', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC, id DESC', (err, rows) => {
    if (err) {
      return res.status(500).send('Error generating export');
    }

    const headers = ['ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Payment Method', 'Notes'];
    const csvRows = [headers.join(',')];

    rows.forEach((row) => {
      const escape = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      csvRows.push([
        row.id,
        escape(row.title),
        row.amount.toFixed(2),
        escape(row.type),
        escape(row.category),
        escape(row.date),
        escape(row.payment_method),
        escape(row.notes)
      ].join(','));
    });

    const csvContent = csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
    res.status(200).send(csvContent);
  });
});

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
