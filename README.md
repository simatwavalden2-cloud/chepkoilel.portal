# Student Portal (Node.js + Express + SQLite)

## Run it
1. Install Node.js 22.13 or newer (nodejs.org, the LTS button).
2. In this folder:
   ```
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   ```
3. Open `.env` and set `JWT_SECRET` to a long random value:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Start:
   ```
   npm run dev
   ```
5. Open http://localhost:3000

## API
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /api/auth/register | fullName, email, studentId, password | signs you in |
| POST | /api/auth/login | identifier (email or student ID), password, remember | |
| GET | /api/auth/me | | needs sign-in |
| POST | /api/auth/logout | | |
| POST | /api/auth/forgot | identifier | reset link is printed in the server console until email is connected |
| POST | /api/auth/reset | token, password | |

## Security already in place
Passwords hashed with bcrypt, sessions in an httpOnly cookie (JWT, 12 h or 30 days with "Remember me"), rate limits on every auth route, same error for wrong password and unknown user, reset tokens stored hashed and expire in 1 hour, security headers via helmet, input validation.

## Before going live
- Set `NODE_ENV=production` and serve over HTTPS.
- Host on a server with a disk (Render, Railway, Fly.io or a VPS). SQLite stores data in `portal.db`, so serverless hosts like Vercel will lose it. To use Vercel, switch to a hosted database.
- Connect an email service to send the reset link (see the TODO in `src/auth.js`).
