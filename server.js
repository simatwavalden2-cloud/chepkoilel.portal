
require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET (32+ characters) in your .env file. See .env.example.");
  process.exit(1);
}

const authRoutes = require("./src/auth");
const coursesRoutes = require("./courses-routes");
const app = express();

app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// "upgrade-insecure-requests" breaks http://localhost in Safari, so only use it in production (HTTPS).
const csp = helmet.contentSecurityPolicy.getDefaultDirectives();
if (process.env.NODE_ENV !== "production") delete csp["upgrade-insecure-requests"];
app.use(helmet({ contentSecurityPolicy: { directives: csp } }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use(express.static(path.join(__dirname, "public")));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Server error" : "Invalid request" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Student Portal running on http://localhost:${port}`));