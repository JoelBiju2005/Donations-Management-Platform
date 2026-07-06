# Firebase Hosting Deployment Guide
**Temple Donations Management Platform — Frontend**

This guide provides step-by-step instructions to deploy your Next.js frontend using **Firebase Hosting** and establish a secure production connection to your backend running on **Render**.

---

## 🛠️ Step 1: Configure Next.js for Firebase Hosting

Firebase Hosting serves static files. To deploy a Next.js app to Firebase Hosting, the most reliable approach is to configure Next.js to compile to a static export.

1. Open `frontend/next.config.js` (or `.mjs`) and add the `"export"` output configuration:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export', // Compiles Next.js to static HTML/CSS/JS in the 'out' directory
     images: {
       unoptimized: true, // Required for static exports
     },
   };

   module.exports = nextConfig;
   ```

2. Because Firebase Hosting uses static files, Next.js dynamic server-side pages (like `getServerSideProps` or dynamic segment fetching in Server Components) must be rendered client-side (`"use client"`) or pre-built. All pages in your frontend are already configured for static rendering and fetch data dynamically on the client side using `src/lib/api.ts`, which makes them fully compatible with static exports.

---

## 🔑 Step 2: Establish the Connection (Vercel to Render)

To connect your Firebase-hosted frontend to your Render backend, you must feed the production Render API URL into your frontend build using environment variables.

1. Create a file named `frontend/.env.production` in your workspace.
2. Add your **Render Backend API URL** as the environment variable:
   ```text
   NEXT_PUBLIC_API_URL=https://temple-donations-backend.onrender.com/api
   ```
   *(Replace `https://temple-donations-backend.onrender.com/api` with your actual Render service URL).*

When you build the project, Next.js will hardcode this public environment variable into the compiled client-side Javascript bundle so the browser can make request calls to Render.

---

## 📦 Step 3: Initialize Firebase in your Project

1. Open your terminal in the `frontend` folder:
   ```powershell
   cd frontend
   ```

2. Install the Firebase Command Line Interface (CLI) globally if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

3. Log into your Google Account through Firebase:
   ```bash
   firebase login
   ```
   *(This opens a browser window to authenticate your account).*

4. Initialize the Firebase project configurations:
   ```bash
   firebase init hosting
   ```

5. During the initialization wizard, select the following options:
   * **Project Setup**: Select `Create a new project` or `Use an existing project` (if you already created one in the Firebase Console).
   * **Public directory**: Type `out` (This is the folder where Next.js outputs its static export).
   * **Configure as a single-page app**: Type `y` (Yes - routes all navigation URLs to `index.html`).
   * **Set up automatic builds and deploys with GitHub**: Type `n` (No - you can enable this later if desired).

This wizard creates `firebase.json` and `.firebaserc` files in your `frontend` directory.

---

## 🚀 Step 4: Build and Deploy the Frontend

Now you can compile and deploy the website:

1. Build the Next.js static export:
   ```bash
   npm run build
   ```
   This compiles your application and creates an `out/` folder in your `frontend` directory containing the static website.

2. Deploy the `out/` folder to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

3. Once completed, the Firebase CLI will output your live URL (e.g., `https://your-project-id.web.app` or `https://your-project-id.firebaseapp.com`).

---

## 🔒 Step 5: Update Backend CORS Settings on Render

Because your frontend is now hosted on a new domain (`web.app` or a custom domain), your Render backend will block requests by default due to CORS policies.

1. Go to your **Render Dashboard** -> Select your backend service.
2. Go to **Environment** (or **Environment Variables**).
3. Update the `FRONTEND_URL` environment variable to match your new Firebase URL:
   ```text
   FRONTEND_URL=https://your-project-id.web.app
   ```
4. Save the changes. Render will automatically redeploy the backend with the updated CORS configurations.
