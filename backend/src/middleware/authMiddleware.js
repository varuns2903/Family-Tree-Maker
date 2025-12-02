const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from header (Expected format: "Bearer <token>")
    const authHeader = req.header("Authorization");
    
    if (!authHeader) {
      return res.status(403).json({ message: "Authorization Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Remove 'Bearer '

    // 2. Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Add user ID to the request object so controllers can use it
    req.user = payload.user; 
    
    next(); // Continue to the actual controller
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};