# 🎥 Add video to your blog — step by step

This sets you up to host videos on your blog using **Cloudflare R2** (free for normal use).
**Most of it is done on your phone.** There's one optional fallback that needs a laptop (Windows or Mac) — but only if the easy path doesn't work for you.

> Just click the links in order and do what each step says. Take your time.

---

## Part 1 — Cloudflare storage (on your phone, ~10 minutes)

### Step 1 · Make a free Cloudflare account
1. Open **https://dash.cloudflare.com/sign-up**
2. Enter your email + a password → **Sign up** → verify your email (check your inbox, click the link).

### Step 2 · Create your storage "bucket"
1. Open **https://dash.cloudflare.com/?to=/:account/r2/overview** (this is **R2 Object Storage**).
2. Click **Create bucket**.
3. Give it a name — lowercase, e.g. `my-media`. Location: leave **Automatic**.
4. Click **Create bucket**.
   > *First time only: Cloudflare asks for a payment card to switch R2 on. There's a big free tier (10 GB + free viewing), so normal blog use won't charge you.*

### Step 3 · Turn on the public link
1. Open your new bucket → click the **Settings** tab.
2. Find **Public Development URL** → click **Enable** → type **allow** to confirm.
3. **Copy** the link it shows — it looks like `https://pub-xxxxxxxx.r2.dev`
   ✏️ **Save this — it's Value 1 (Public base URL).**

### Step 4 · Create your access keys
1. Open **https://dash.cloudflare.com/?to=/:account/r2/api-tokens**
2. Click **Create Account API token**.
3. **Permissions:** choose **Object Read & Write**.
4. **Specify bucket(s):** pick the bucket you just made (not "all buckets").
5. Click **Create**. Now copy these three (the secret shows **once** — copy it straight away):
   - **Access Key ID** → ✏️ **Value 2**
   - **Secret Access Key** → ✏️ **Value 3**
   - **Endpoint** (`https://……r2.cloudflarestorage.com`) → ✏️ **Value 4**

### Step 5 · Let your browser upload (CORS — one paste)
1. Open your bucket → **Settings** tab → scroll to **CORS Policy** → click **Add/Edit**.
2. Paste this exactly, then **Save**:
```json
[
  {
    "AllowedOrigins": ["https://inayat-studio.netlify.app"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Part 2 — Tell the Studio (on your phone)

1. Open **https://inayat-studio.netlify.app** → **Sign in with GitHub**.
2. Go to **Settings → Video storage**. Fill in:
   - **Public base URL** = Value 1
   - **S3 endpoint** = Value 4
   - **Bucket** = your bucket name (e.g. `my-media`)
   - **Access Key ID** = Value 2
   - **Secret Access Key** = Value 3
   - Leave **"Use a Worker"** switched **OFF**.
3. **Save.**

## Part 3 — Upload a video 🎉

1. Open (or create) a post → add a **Video block** → **Upload to R2** → pick a clip.
2. It uploads and a player appears in your post.

**If that worked — you're done, entirely from your phone. ✅**
*(This works for most people. If your upload shows a "blocked / connection" error, it's a rare Cloudflare account fault — do the one-time Worker fix below.)*

---

## Optional fallback — the "Worker" (one-time, on a laptop)

Only needed if Part 3 failed with a blocked/TLS error. The files are in **this repo** at `cloudflare/r2-upload-worker/`.

### A · Install Node.js (skip if you already have it)
- **Windows:** open **https://nodejs.org/** → download the big green **"LTS"** button (Windows Installer `.msi`) → run it → click **Next** through the defaults → **Finish**. Then open **PowerShell** (click Start, type `PowerShell`, press Enter).
- **Mac:** open **https://nodejs.org/** → download the **"LTS"** macOS Installer (`.pkg`) → run it → click through. Then open **Terminal** (press **Cmd+Space**, type `Terminal`, Enter).

### B · Deploy the Worker
In that PowerShell/Terminal window:
1. Go into the worker folder (in your downloaded copy of this repo):
   ```
   cd cloudflare/r2-upload-worker
   ```
2. Open **`wrangler.toml`** in any text editor and change `YOUR-BUCKET-NAME` to your real bucket name. Save it.
3. Deploy:
   ```
   npx wrangler deploy
   ```
   - The first time, it opens a browser → **log into Cloudflare → Allow**.
   - It prints a URL like `https://r2-upload-worker.your-name.workers.dev` → ✏️ **copy it.**
4. Set a password for it:
   ```
   npx wrangler secret put UPLOAD_SECRET
   ```
   - Type any password → press Enter.

### C · Point the Studio at the Worker
1. Studio → **Settings → Video storage** → tick **"Use a Worker"**.
2. Paste the **Worker URL** and the **secret** you just set. **Save.**
3. Try the upload again — it works now.

---

## Bonus — free AI image generation (FLUX) 🎨

Your Worker can **also generate images for free** via Cloudflare Workers AI (FLUX) — the image route is already in the Worker code.

To switch it on, just **redeploy the Worker** (the AI binding is already in `wrangler.toml`, nothing to edit):
```
cd cloudflare/r2-upload-worker
npx wrangler deploy
```
*(If you already set up the Worker for video, it's the exact same one-line redeploy.)*

Then in the Studio, the **✦ Generate** action on an image block turns a text prompt into a picture. It's **free** on Cloudflare's tier (~10,000 "Neurons"/day ≈ hundreds of images a day), and the free plan can't run up a bill — it just pauses if you ever hit the daily cap.

---

That's everything. Videos live in your own Cloudflare storage, image-gen runs on your Worker, and it all plays in your posts. Stuck on a step? Send a screenshot.
