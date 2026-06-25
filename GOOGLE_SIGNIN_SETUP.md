# Google Sign-In — Setup Guide

Google sign-up/sign-in is now wired into Mero Kotha. To make it work you need a
**Google OAuth Client ID** and to install the two new packages. Follow the steps below.

---

## 1. Install the new dependencies

```bash
# Backend (adds google-auth-library)
cd backend
npm install

# Frontend (adds @react-oauth/google)
cd ../frontend
npm install
```

---

## 2. Create a Google OAuth Client ID

1. Go to the **Google Cloud Console**: https://console.cloud.google.com/
2. Create a project (or pick an existing one) from the project dropdown at the top.
3. In the left menu open **APIs & Services → OAuth consent screen**.
   - Choose **External**, click **Create**.
   - Fill in the app name (e.g. `Mero Kotha`), your support email, and a developer
     contact email. Save and continue through the steps.
   - Under **Test users**, add the Google account(s) you'll test with (while the app
     is in "Testing" mode only listed users can sign in). Publish later to allow everyone.
4. In the left menu open **APIs & Services → Credentials**.
   - Click **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins** — add the URLs your frontend runs on:
     - `http://localhost:5173` (Vite dev server)
     - your production frontend URL (e.g. `https://merokotha.vercel.app`) when you deploy
   - You can leave **Authorized redirect URIs** empty — this flow uses the Google
     Identity Services button, not a redirect.
   - Click **Create**. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`).

---

## 3. Paste the Client ID into your env files

The same Client ID goes in two places (it is safe to expose on the frontend):

**`backend/.env`**
```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

**`frontend/.env`**
```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Restart both the backend (`npm run dev`) and the frontend (`npm run dev`) after editing
env files so the new values load.

---

## 4. How it works

- On **Register** and **Login** pages there's now a **Sign in with Google** button below
  the normal form.
- Clicking it gets a verified Google ID token, which the frontend sends to
  `POST /api/auth/google`.
- The backend verifies the token with Google, then either logs in the existing user
  (matching by Google ID or email) or creates a new account — no password needed.
- Because Google doesn't share phone numbers (and your listings need a contact phone),
  any account with no phone on file sees a **"One last step"** popup asking for a phone
  number before they can continue. This is handled automatically by `PhonePromptModal`.

---

## 5. Files changed

**Backend**
- `models/User.js` — added `googleId`; password now optional for Google users; phone optional.
- `routes/auth.js` — added `POST /api/auth/google` and `PUT /api/auth/phone`.
- `package.json` — added `google-auth-library`.
- `.env` / `.env.example` — added `GOOGLE_CLIENT_ID`.

**Frontend**
- `main.jsx` — wrapped app in `GoogleOAuthProvider`.
- `context/AuthContext.jsx` — added `googleLogin()` and `updatePhone()`.
- `pages/Login.jsx`, `pages/Register.jsx` — added the Google button.
- `components/PhonePromptModal.jsx` — new; collects phone after Google sign-in.
- `App.jsx` — renders the phone prompt globally when a user has no phone.
- `index.css` — divider styling.
- `package.json` — added `@react-oauth/google`.
- `.env` / `.env.example` — added `VITE_GOOGLE_CLIENT_ID`.
