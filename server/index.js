import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test DB Connection
app.get("/ping", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

app.listen(process.env.PORT, () => {
  console.log(
    `Server running on port http://localhost:${process.env.PORT}/ping`
  );
});

// create a new product
app.post("/products", async (req, res) => {
  const { user_id, sku, name, description, price, quantity } = req.body;

  if (!user_id || !sku || !name || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (user_id, sku, name, description, price, quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, sku, name, description || "", price, quantity || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all products for a user
app.get("/products", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  try {
    const result = await pool.query(
      `SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a single product

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "product not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update product
app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { sku, name, description, price, quantity } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
            SET sku = COALESCE($1, sku),
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                price = COALESCE($4, price),
                quantity = COALESCE($5, quantity)
            WHERE id = $6
            RETURNING *`,
      [sku, name, description, price, quantity, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted", product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
