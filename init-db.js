const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, 'books.db');

const initialBooks = [
  { title: 'Clean Code', author: 'Robert C. Martin', price: 450, pages: 464 },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', price: 550, pages: 352 },
  { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 320, pages: 176 },
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 400, pages: 472 },
  { title: "You Don't Know JS: Scope & Closures", author: 'Kyle Simpson', price: 280, pages: 98 },
  { title: 'Design Patterns', author: 'Erich Gamma et al.', price: 620, pages: 395 },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', price: 850, pages: 1312 },
  { title: 'Refactoring', author: 'Martin Fowler', price: 590, pages: 448 },
  { title: 'Head First Design Patterns', author: 'Eric Freeman', price: 510, pages: 694 },
  { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', price: 380, pages: 336 }
];

async function initializeDatabase() {
  try {
    const db = await open({
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

    const countResult = await db.get('SELECT COUNT(*) AS total FROM book');
    if (countResult.total === 0) {
      for (const book of initialBooks) {
        await db.run(
          'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
          [book.title, book.author, book.price, book.pages]
        );
      }
      console.log('Database seeded successfully');
    } else {
      console.log(`Database already has ${countResult.total} books`);
    }

    await db.close();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
