
// courses-routes.js  — put this next to server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const FILE = process.env.COURSES_FILE || path.join(__dirname, 'data', 'courses.json');

// Set ADMIN_KEY in .env (and in Render). Type the same key on the admin page.
const ADMIN_KEY = process.env.ADMIN_KEY ||
  (process.env.NODE_ENV === 'production' ? null : 'chepkoilel-admin');

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return []; }
}
function save(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}
function admin(req, res, next) {
  if (!ADMIN_KEY || req.get('x-admin-key') !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Wrong admin key.' });
  }
  next();
}
function clean(b) {
  return {
    code: String(b.code || '').trim().toUpperCase(),
    name: String(b.name || '').trim(),
    duration: String(b.duration || '').trim(),
    description: String(b.description || '').trim()
  };
}

// Anyone can view courses (students too)
router.get('/', (req, res) => res.json(load()));

// Admin only
router.post('/', admin, (req, res) => {
  const c = clean(req.body);
  if (!c.code || !c.name) return res.status(400).json({ error: 'Code and name are required.' });
  const list = load();
  if (list.some(x => x.code === c.code)) return res.status(409).json({ error: 'That course code already exists.' });
  c.id = Date.now().toString();
  list.push(c);
  save(list);
  res.status(201).json(c);
});

router.put('/:id', admin, (req, res) => {
  const list = load();
  const i = list.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Course not found.' });
  const c = clean(req.body);
  if (!c.code || !c.name) return res.status(400).json({ error: 'Code and name are required.' });
  if (list.some(x => x.code === c.code && x.id !== req.params.id)) {
    return res.status(409).json({ error: 'That course code already exists.' });
  }
  list[i] = { ...list[i], ...c };
  save(list);
  res.json(list[i]);
});

router.delete('/:id', admin, (req, res) => {
  const list = load();
  const next = list.filter(x => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: 'Course not found.' });
  save(next);
  res.json({ ok: true });
});

module.exports = router;