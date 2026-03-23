import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Create the Express app and define the server port.
const app = express();
const port = 3000;

// Configure and connect to the PostgreSQL database.
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booknotes",
  password: "12345",
  port: 5432,
});
db.connect();

// Parse form submissions and serve static assets from /public.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Fetch all books from the database.
async function getBooks() {
  try {
    const result = await db.query("SELECT * FROM books");
    return result.rows;
  } catch (err) {
    console.error("Error fetching books:", err);
    throw err;
  }
}

// Fetch one book by its ID; return null if it does not exist.
async function getBook(id) {
  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error fetching book:", err);
    throw err;
  }
}

// Home route: show all books and optional alert message.
app.get("/", async (req, res) => {
  const alertMessage = req.query.alertMessage;
  const books = await getBooks();

  res.render("index.ejs", {
    title: "Home",
    books,
    alertMessage
  });
});

// Book details route: show one book by ID.
app.get("/book/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const alertMessage = req.query.alertMessage;
  const book = await getBook(id);

  if (!book) {
    return res.status(404).send("Book not found");
  }

  res.render("book.ejs", { book, alertMessage });
});

// Render the form to add a new book.
app.get("/add", async (req, res) => {
  res.render("add.ejs", { title: "Add Book" });
});

// Handle add-book form submission and insert the new book.
app.post("/add", async (req, res) => {
  const name = req.body.name;
  const isbn = req.body.isbn;
  const description = req.body.description;
  const notes = req.body.notes;
  const date = new Date();
  try {
    const result = await db.query(
      "INSERT INTO books (name, isbn, date, description, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, isbn, date, description, notes]
    );
    const id = result.rows[0].id;
    const alertMessage = "Book added successfully!";
    res.redirect(`/book/${id}?alertMessage=${encodeURIComponent(alertMessage)}`);
  } catch (err) {
    console.error("Error adding book:", err);
    return res.status(500).send("Error adding book");
  }
});

// Render the edit form for an existing book.
app.get("/edit/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  res.render("edit.ejs", { book: await getBook(id) });
});

// Handle edit form submission and update the selected book.
app.post("/edit/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const name = req.body.name;
  const isbn = req.body.isbn;
  const description = req.body.description;
  const notes = req.body.notes;
  const date = new Date();
  try {
    await db.query(
      "UPDATE books SET (name, isbn, date, description, notes) = ($1, $2, $3, $4, $5) WHERE id = ($6)",
      [name, isbn, date, description, notes, id]
    );
    const alertMessage = "Book edited successfully!";
    res.redirect(`/book/${id}?alertMessage=${encodeURIComponent(alertMessage)}`);
  } catch (err) {
    console.error("Error editing book:", err);
    return res.status(500).send("Error editing book");
  }
});

// Delete a book by ID and redirect with a success message.
app.post("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    const alertMessage = "Book deleted successfully!";
    res.redirect(`/?alertMessage=${encodeURIComponent(alertMessage)}`);
  } catch (err) {
    console.error("Error deleting book:", err);
    return res.status(500).send("Error deleting book");
  }
});

// About page route.
app.get("/about", async (req, res) => {
  res.render("about.ejs", { title: "About Me" });
});

// Contact page route.
app.get("/contact", async (req, res) => {
  res.render("contact.ejs", { title: "Contact Me" });
});

// Handle contact form submission and redirect to home.
app.post("/contact", async (req, res) => {
  const alertMessage = "Contact form submitted successfully!";
  res.redirect(`/?alertMessage=${encodeURIComponent(alertMessage)}`);
});

// Start the server and log the running port.
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
