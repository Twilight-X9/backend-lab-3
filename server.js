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

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
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
      params.push(`%${String(search_q).trim()}%`);
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

    const query = `SELECT * FROM book${whereClause} ORDER BY ${safeOrderBy} ${safeOrder} LIMIT ? OFFSET ?`;
    params.push(safeLimit, safeOffset);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);

    if (!book) {
      return res.status(404).json({ message: `Book with id ${bookId} not found` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post(['/books', '/books/'], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: 'Author is required' });
    }

    if (price === undefined || price === null || price === '' || isNaN(Number(price))) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    const parsedPrice = Number(price);
    const parsedPages = (pages !== undefined && pages !== null && pages !== '' && !isNaN(Number(pages))) ? Number(pages) : 0;

    const result = await db.run(
      'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
      [title.trim(), author.trim(), parsedPrice, parsedPages]
    );

    res.status(201).json({
      message: 'Book created successfully',
      bookId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    const existingBook = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with id ${bookId} not found` });
    }

    if (title === undefined && author === undefined && price === undefined && pages === undefined) {
      return res.status(400).json({ message: 'At least one field must be provided to update' });
    }

    if (price !== undefined && (price === '' || isNaN(Number(price)))) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    if (pages !== undefined && (pages === '' || isNaN(Number(pages)))) {
      return res.status(400).json({ message: 'Pages must be a valid number' });
    }

    const updatedTitle = title !== undefined ? title : existingBook.title;
    const updatedAuthor = author !== undefined ? author : existingBook.author;
    const updatedPrice = price !== undefined ? Number(price) : existingBook.price;
    const updatedPages = pages !== undefined ? Number(pages) : existingBook.pages;

    await db.run(
      'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
      [updatedTitle, updatedAuthor, updatedPrice, updatedPages, bookId]
    );

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;

    const existingBook = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({ message: `Book with id ${bookId} not found` });
    }

    await db.run('DELETE FROM book WHERE id = ?', [bookId]);

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

initializeDBAndServer();
