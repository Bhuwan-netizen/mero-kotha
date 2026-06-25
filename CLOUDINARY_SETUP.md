# Persistent Image Storage — Cloudinary Setup

Listing photos are now uploaded to **Cloudinary** (a free image CDN) instead of the
server's local disk. This fixes images disappearing: Render wipes its filesystem on every
restart/redeploy, so disk-stored uploads were lost. Cloudinary keeps them permanently and
serves them fast over a CDN.

---

## 1. Install the new backend packages

```bash
cd backend
npm install
```

This pulls in `cloudinary` and `multer-storage-cloudinary` (already added to package.json).

---

## 2. Create a free Cloudinary account

1. Go to https://cloudinary.com/users/register_free and sign up (no credit card).
2. After signing in, open the **Dashboard** (or **Programmable Media → Dashboard**).
3. Copy these three values from the "Account Details" / "API Keys" section:
   - **Cloud name**
   - **API Key**
   - **API Secret** (click "reveal")

---

## 3. Add the credentials to your env

**Locally — `backend/.env`:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Production — on the Render website (https://dashboard.render.com):**

1. Log in and click your backend service (**mero-kotha-backend**) in the dashboard.
2. In the left sidebar of that service, click **Environment**.
3. Under **Environment Variables**, click **Add Environment Variable** and add each one
   (Key on the left, Value on the right):
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your api key
   - `CLOUDINARY_API_SECRET` = your api secret
4. Click **Save Changes**. Render redeploys automatically. (If it doesn't, go to the
   **Manual Deploy** button at the top right → **Deploy latest commit**.)

Render can't read your local `.env`, so these must be set in the dashboard for the live
site to work.

---

## 4. How it works now

- When an owner posts/edits a listing, Multer streams the image straight to Cloudinary
  (folder `mero-kotha`), resized to max 1200x1200.
- The returned CDN URL (e.g. `https://res.cloudinary.com/<cloud>/image/upload/...`) is what
  gets saved in MongoDB, instead of `/uploads/filename`.
- Deleting or replacing a listing image also deletes it from Cloudinary.
- The frontend renders absolute URLs directly; any old `/uploads/...` paths still fall back
  to the backend prefix (those old files are already gone, but nothing breaks).

---

## 5. Notes

- **Old listings** posted before this change point to `/uploads/...` files that Render already
  deleted, so their images will stay broken. New uploads (and re-edits) will work and persist.
- You can leave the `app.use('/uploads', ...)` static route in `server.js` — it's harmless now.
- Cloudinary free tier: 25 GB storage + 25 GB/month bandwidth, plenty for this site.

---

## 6. Files changed

- `backend/config/cloudinary.js` — new; configures Cloudinary from env vars.
- `backend/routes/listings.js` — uploads to Cloudinary, stores CDN URLs, deletes from Cloudinary.
- `backend/package.json` — added `cloudinary`, `multer-storage-cloudinary`.
- `backend/.env` / `.env.example` — added `CLOUDINARY_*` variables.
- `frontend`: `ListingCard.jsx`, `Dashboard.jsx`, `ListingDetail.jsx`, `EditListing.jsx` —
  render absolute image URLs.
