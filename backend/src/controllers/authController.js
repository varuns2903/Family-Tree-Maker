const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    // 1. Destructure name, email, password
    const { name, email, password } = req.body; 

    // 2. Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email
    ]);

    if (user.rows.length > 0) {
      return res.status(401).json({ message: "User already exists" });
    }

    // 3. Hash the password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 4. Insert new user (Including Name)
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
    );

    // 5. Generate token
    const token = jwtGenerator(newUser.rows[0].id);

    // 6. Return Token + User Info
    res.json({ 
      token, 
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Password or Email is incorrect" });
    }

    // 2. Validate Password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ message: "Password or Email is incorrect" });
    }

    // 3. Generate Token
    const token = jwtGenerator(user.rows[0].id);

    // 4. Return Token + User Info (Including Name)
    res.json({ 
      token, 
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// --- VERIFY ---
exports.verify = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1", 
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};