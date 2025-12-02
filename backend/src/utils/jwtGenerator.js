const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(user_id) {
  const payload = {
    user: {
      id: user_id
    }
  };

  // Sign the token using the secret from .env
  // Token expires in 1 hour (you can change '1h' to '7d')
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = jwtGenerator;