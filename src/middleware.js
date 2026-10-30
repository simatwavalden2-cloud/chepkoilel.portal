const jwt = require("jsonwebtoken");
const db = require("./db");

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not signed in" });
  try {
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare("SELECT id, full_name, email, student_id, created_at FROM users WHERE id = ?")
      .get(sub);
    if (!user) return res.status(401).json({ error: "Not signed in" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}

module.exports = { requireAuth };
