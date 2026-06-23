# Deployment Guide

Wagon Whisper consists of a React/Vite frontend and a Node.js/Express backend connected to MongoDB Atlas.

This guide details how to deploy both applications securely using **Render** and **MongoDB Atlas**.

## 1. MongoDB Atlas Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Database Access** and create a new database user. **Generate a highly secure password** and save it.
3. Go to **Network Access** and whitelist IP `0.0.0.0/0` (Allow Access From Anywhere) so Render can connect.
4. Go to **Database** > **Connect** > **Connect your application** and copy the Connection String (`mongodb+srv://...`). Replace `<password>` with your secure password.

## 2. GitHub Repository
1. Ensure your `.env` files are NOT committed to GitHub.
2. Push your `main` branch containing the backend and frontend code to a private GitHub repository.

## 3. Render Deployment: Web Service (Backend)
1. In Render, create a new **Web Service**.
2. Connect your GitHub repository.
3. **Settings**:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0...`
   - `JWT_SECRET`: `(Generate a 64-char random string)`
   - `JWT_REFRESH_SECRET`: `(Generate another 64-char random string)`
   - `CLIENT_URL`: `(Leave blank for now, update this after deploying the frontend)`
   - `SUPER_ADMIN_EMAIL`: `your.admin@email.com`
   - `SUPER_ADMIN_PASSWORD`: `(A strong initial password)`
5. Click **Create Web Service**. Wait for the deployment to finish and copy the Backend URL (e.g., `https://wagon-backend.onrender.com`).

## 4. Render Deployment: Static Site (Frontend)
1. In Render, create a new **Static Site**.
2. Connect the same GitHub repository.
3. **Settings**:
   - **Root Directory**: `.` (leave blank or use project root)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: `(Paste your Backend URL here)`
5. Click **Create Static Site**. Wait for the deployment to finish and copy the Frontend URL (e.g., `https://wagon-frontend.onrender.com`).

## 5. Final Configuration
1. Go back to your Backend Web Service in Render.
2. Update the Environment Variable `CLIENT_URL` to your new Frontend URL.
3. **Redeploy** the backend.
4. Visit your Frontend URL, log in using the `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` you configured, and immediately use the system to change the Super Admin password.
