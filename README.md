# VaultFlow — Modern Full-Stack Expense Tracker

A sleek, responsive, full-stack personal finance and expense tracking application built with **Node.js**, **Express**, **SQLite3**, and modern vanilla web technologies (HTML5, CSS3, JavaScript ES6+).

---

## 📁 Project Structure

```text
├── server.js          # Express server with RESTful API endpoints & SQLite connection
├── package.json       # Node.js project metadata and dependencies
├── database.db        # SQLite persistent database file
│
├── public/            # Client-side web application
│   ├── index.html     # Semantic HTML5 layout, metric cards, charts & modal dialogs
│   ├── style.css      # Design system with dark/light themes, animations & glassmorphism
│   └── script.js      # Frontend controller, Chart.js integrations & real-time filters
│
└── README.md          # Project documentation and API guide
```

---

## ✨ Features

- 💎 **Sleek, Modern Aesthetic**: Curated color tokens, dark & light mode switcher, glassmorphic headers, and fluid card transitions.
- 📊 **Interactive Analytics**: Real-time spending breakdown donut chart and monthly cash flow comparison using Chart.js.
- 💰 **Key Financial Metrics**: Live calculation of Net Balance, Total Income, Total Expenses, and Savings Rate percentage.
- ⚡ **Real-Time Filtering & Instant Search**: Debounced search by title/notes, type tabs (All, Expenses, Income), and category dropdown.
- 🏷️ **Comprehensive Categories**: Food & Dining, Housing, Utilities, Transportation, Shopping, Entertainment, Health & Fitness, Salary, Freelance, Investments, and Other.
- 📝 **Full CRUD Support**: Add new transactions, edit existing transactions, and delete entries with confirmation protection.
- 💾 **Persistent SQLite Database**: Automatically creates and maintains `database.db` with pre-seeded sample data on first launch.
- 📥 **One-Click CSV Export**: Download transaction history directly into a standard CSV file.
- 📱 **Mobile & Desktop Responsive**: Tailored layouts that adapt seamlessly from mobile devices to ultrawide displays.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm`

### 1. Installation

Clone or navigate to the project directory and install dependencies:

```bash
npm install
```

### 2. Running the Application

Start the Express web server:

```bash
npm start
```

Or run in development mode with auto-reload:

```bash
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:3000`**

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List all transactions. Supports query parameters `search`, `type`, `category`, `sortBy`, `startDate`, `endDate`. |
| `GET` | `/api/transactions/:id` | Get single transaction details by ID. |
| `POST` | `/api/transactions` | Create a new transaction (`title`, `amount`, `type`, `category`, `date`, `payment_method`, `notes`). |
| `PUT` | `/api/transactions/:id` | Update an existing transaction. |
| `DELETE` | `/api/transactions/:id` | Delete a transaction by ID. |
| `GET` | `/api/stats/summary` | Aggregate metrics (Net Balance, Total Income, Total Expenses, Category Breakdown, Monthly Trends). |
| `GET` | `/api/export/csv` | Download complete transaction history as a CSV file. |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 4, SQLite3, CORS
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Design System), Modern JavaScript (ES6+)
- **Icons & Visuals**: Lucide Icons, Chart.js CDN
- **Fonts**: Inter & Outfit (Google Fonts)

---

## 📄 License

This project is licensed under the ISC License.
