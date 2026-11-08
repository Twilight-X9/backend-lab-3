const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'books.db');

let db = null;

app.use(express.json());

async function initializeDBAndServer() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec(
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        pages INTEGER NOT NULL
      );
    );

    app.listen(PORT, '0.0.0.0', () => {
      console.log(Server running at http://localhost:/);
    });
  } catch (error) {
    console.error(Database connection error: );
    process.exit(1);
  }
}

app.get(['/books', '/books/'], async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price
    } = req.query;

    const allowedOrderBy = ['id', 'title', 'author', 'price', 'pages'];
    const safeOrderBy = allowedOrderBy.includes(order_by) ? order_by : 'id';
    const safeOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const safeLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const safeOffset = parseInt(offset, 10) >= 0 ? parseInt(offset, 10) : 0;

    let conditions = [];
    let params = [];

    if (search_q && String(search_q).trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(%%);
    }

    if (min_price !== undefined && max_price !== undefined && min_price !== '' && max_price !== '') {
      conditions.push('price BETWEEN ? AND ?');
      params.push(Number(min_price), Number(max_price));
    } else {
      if (min_price !== undefined && min_price !== '') {
        conditions.push('price >= ?');
        params.push(Number(min_price));
      }
      if (max_price !== undefined && max_price !== '') {
        conditions.push('price <= ?');
        params.push(Number(max_price));
      }
    }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    const query = SELECT * FROM book ORDER BY   LIMIT ? OFFSET ?;
    params.push(safeLimit, safeOffset);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

initializeDBAndServer();
