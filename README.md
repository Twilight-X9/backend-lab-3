# Lab 3: REST API, query parameters, validation, debugging

**Pinisetti Sai Babu** • **252U1R1192** • **Section: S-019**  
**Course:** Backend Development Fundamentals (Year II Term II) • Aurora  

---

## Live link
Deployment: [https://backend-lab-3-2.onrender.com/books](https://backend-lab-3-2.onrender.com/books)  
**GitHub Repository:** [https://github.com/Twilight-X9/backend-lab-3](https://github.com/Twilight-X9/backend-lab-3)

---

## Objective
Upgraded the Lab 2 Express and SQLite application into a REST API with query parameters (filtering, search, sorting, pagination), request body validation, consistent JSON response messages, and proper HTTP status codes.

---

## Database schema

The books are stored in a local SQLite database `books.db` inside the `book` table:

```sql
CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price REAL NOT NULL,
  pages INTEGER NOT NULL
);
```

The database initialization script `init-db.js` seeds 10 sample books when the table is empty.

---

## How to run

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Install dependencies
```bash
npm install
```

### Start the server
- **Production mode:**
  ```bash
  npm start
  ```
  Runs at `http://localhost:3000`

- **Development mode (auto-restart on changes):**
  ```bash
  npm run dev
  ```

- **Seed Database:**
  ```bash
  npm run seed
  ```

---

## Endpoints

| Method | Endpoint | Description | Status Code | Query / Body Parameters |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/books` | Retrieve books with optional search, sorting, price filter, and pagination | `200 OK` | Query: `search_q`, `order_by`, `order`, `limit`, `offset`, `min_price`, `max_price` |
| `GET` | `/books/:bookId` | Retrieve a single book by ID | `200 OK` / `404 Not Found` | Route param: `bookId` |
| `POST` | `/books` | Create a new book record | `201 Created` / `400 Bad Request` | JSON: `{ title, author, price, pages }` |
| `PUT` | `/books/:bookId` | Update an existing book by ID | `200 OK` / `400 Bad Request` / `404 Not Found` | Route param: `bookId`<br>JSON: Partial or full fields |
| `DELETE` | `/books/:bookId` | Delete a book by ID | `200 OK` / `404 Not Found` | Route param: `bookId` |
| `ALL` | `*` | Catch-all for undefined routes | `404 Not Found` | Any invalid route |

---

## Query parameters (`GET /books`)

All query parameters are optional and have default values:

- `search_q`: Substring search matching the `title` column using SQL `LIKE %search_q%`. Default: `""` (returns all records).
- `order_by`: Column to sort results by (`id`, `title`, `author`, `price`, `pages`). Default: `id`.
- `order`: Sort direction (`ASC` or `DESC`). Default: `ASC`.
- `limit`: Maximum number of records to return per page. Default: `10`.
- `offset`: Number of records to skip for pagination. Default: `0`.
- `min_price`: Lower bound for price filter.
- `max_price`: Upper bound for price filter. When both `min_price` and `max_price` are provided, the query uses `price BETWEEN ? AND ?`.

### Example queries:
- `GET /books?search_q=JavaScript`
- `GET /books?order_by=price&order=DESC`
- `GET /books?limit=5&offset=5`
- `GET /books?min_price=300&max_price=600`
- `GET /books?search_q=Code&order_by=price&order=ASC`

---

## Validation rules (`POST /books`)

The request body for `POST /books` is validated before database insertion:
1. `title` is required, must be a non-empty string. Missing or blank title returns `400 Bad Request` with `{ "message": "Title is required" }`.
2. `author` is required, must be a non-empty string. Missing or blank author returns `400 Bad Request` with `{ "message": "Author is required" }`.
3. `price` is required, must be numeric. Non-numeric or missing price returns `400 Bad Request` with `{ "message": "Price must be a valid number" }`.
4. `pages` must be numeric if provided.

---

## Postman test list

A Postman collection `postman_collection.json` is included covering both success and failure test cases:

### Success Cases
1. `GET /books` - Retrieve all books with default settings (`200 OK`)
2. `GET /books?search_q=JavaScript` - Filter books by title substring (`200 OK`)
3. `GET /books?order_by=price&order=DESC` - Sort books descending by price (`200 OK`)
4. `GET /books?limit=3&offset=0` - Paginate first 3 books (`200 OK`)
5. `GET /books?min_price=300&max_price=500` - Filter books in price range (`200 OK`)
6. `GET /books?search_q=Code&order_by=price&order=ASC` - Combined search and sort (`200 OK`)
7. `GET /books/1` - Retrieve single book by ID (`200 OK`)
8. `POST /books` - Create new book with valid payload (`201 Created`)
9. `PUT /books/1` - Update book price (`200 OK`)
10. `DELETE /books/10` - Delete book by ID (`200 OK`)

### Failure & Validation Cases
11. `GET /books/9999` - Non-existent ID returns `404 Not Found`
12. `POST /books` - Missing `title` returns `400 Bad Request`
13. `POST /books` - Missing `author` returns `400 Bad Request`
14. `POST /books` - Non-numeric `price` returns `400 Bad Request`
15. `PUT /books/9999` - Updating non-existent book returns `404 Not Found`
16. `DELETE /books/9999` - Deleting non-existent book returns `404 Not Found`
17. `GET /nonexistent` - Undefined route returns `404 Not Found`

---

## Debugging notes

During development, common backend issues were identified and resolved:
1. **Port conflict (EADDRINUSE):** Used dynamic environment variable `process.env.PORT || 3000` to prevent port collisions.
2. **Import path:** Verified `sqlite` and `sqlite3` driver imports so database connection handles resolve correctly.
3. **Table name typo:** Ensured queries consistently reference table name `book`.
4. **Missing await:** Verified every asynchronous SQLite query (`db.all`, `db.get`, `db.run`, `db.exec`) has proper `await` so responses wait for execution before sending output.
