
// src/auth.js — register, login, session check, logout, password reset
// Uses only built-in Node modules (crypto) plus express and your db.js.
const express = require("express");
const crypto = require("crypto");
const db = require("./db");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
const COOKIE = "portal_token";
const DAY = 24 * 60 * 60 * 1000;

// ---------- helpers ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function checkPassword(pw, stored) {
  const parts = String(stored).split(":");
  if (parts.length !== 2) return false;
  const real = Buffer.from(parts[1], "hex");
  const test = crypto.scryptSync(pw, parts[0], 64);
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + sig;
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(parts[0]).digest("base64url");
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function startSession(res, userId, remember) {
  const ttl = remember ? 30 * DAY : DAY;
  res.cookie(COOKIE, sign({ id: userId, exp: Date.now() + ttl }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? ttl : undefined
  });
}

function publicUser(u) {
  return { id: u.id, fullName: u.full_name, email: u.email, studentId: u.student_id };
}

function fail(res, status, message) {
  return res.status(status).json({ error: message });
}

function requireAuth(req, res, next) {
  const payload = verify(req.cookies && req.cookies[COOKIE]);
  if (!payload) return fail(res, 401, "Please sign in.");
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);
  if (!user) return fail(res, 401, "Please sign in.");
  req.user = user;
  next();
}

// ---------- routes ----------
router.post("/register", (req, res) => {
  const b = req.body || {};
  const fullName = String(b.fullName || "").trim();
  const email = String(b.email || "").trim();
  const studentId = String(b.studentId || "").trim();
  const password = String(b.password || "");

  if (!fullName || !email || !studentId || !password) return fail(res, 400, "Fill in all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Enter a valid email address.");
  if (password.length < 8) return fail(res, 400, "Password must be at least 8 characters.");

  const taken = db.prepare("SELECT id FROM users WHERE email = ? OR student_id = ?").get(email, studentId);
  if (taken) return fail(res, 409, "An account with that email or student ID already exists.");

  const result = db
    .prepare("INSERT INTO users (full_name, email, student_id, password_hash) VALUES (?, ?, ?, ?)")
    .run(fullName, email, studentId, hashPassword(password));

  const id = Number(result.lastInsertRowid);
  startSession(res, id, false);
  res.status(201).json({ ok: true });
});

router.post("/login", (req, res) => {
  const b = req.body || {};
  const identifier = String(b.identifier || "").trim();
  const password = String(b.password || "");
  if (!identifier || !password) return fail(res, 400, "Enter your email or student ID and password.");

  const user = db.prepare("SELECT * FROM users WHERE email = ? OR student_id = ?").get(identifier, identifier);
  if (!user || !checkPassword(password, user.password_hash)) {
    return fail(res, 401, "Incorrect email, student ID or password.");
  }
  startSession(res, user.id, !!b.remember);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

// Password reset: there is no email sender yet, so the reset link prints in the terminal.
router.post("/forgot", (req, res) => {
  const email = String((req.body && req.body.email) || "").trim();
  const user = email ? db.prepare("SELECT id FROM users WHERE email = ?").get(email) : null;
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    db.prepare("DELETE FROM reset_tokens WHERE user_id = ?").run(user.id);
    db.prepare("INSERT INTO reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
      .run(tokenHash, user.id, Date.now() + 60 * 60 * 1000);
    console.log("Password reset link: http://localhost:" + (process.env.PORT || 3000) + "/reset.html?token=" + token);
  }
  res.json({ ok: true, message: "If that account exists, a reset link has been sent." });
});

router.post("/reset", (req, res) => {
  const b = req.body || {};
  const token = String(b.token || "");
  const password = String(b.password || "");
  if (password.length < 8) return fail(res, 400, "Password must be at least 8 characters.");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = db.prepare("SELECT user_id, expires_at FROM reset_tokens WHERE token_hash = ?").get(tokenHash);
  if (!row || row.expires_at < Date.now()) return fail(res, 400, "This reset link is invalid or has expired.");

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), row.user_id);
  db.prepare("DELETE FROM reset_tokens WHERE user_id = ?").run(row.user_id);
  res.json({ ok: true });
});

module.exports = router;
module.exports.requireAuth = requireAuth;