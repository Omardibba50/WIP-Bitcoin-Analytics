# 🚀 Complete Deployment Guide - BTC Analytics Dashboard

## Overview
This guide will help you deploy all three components:
1. **Backend API** (Node.js + AI Service)
2. **Frontend** (React + Vite)
3. **Database** (SQLite - embedded in backend)

---

## 📋 Prerequisites

- GitHub account
- Railway account (recommended) OR Render account
- Netlify account (for frontend)

---

## 🔧 Part 1: Deploy Backend API (Railway - Recommended)

### Option A: Railway (Easiest)

1. **Go to [Railway.app](https://railway.app)** and sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` folder as root directory

3. **Configure Environment Variables**
   Click "Variables" tab and add:
   ```
   NODE_ENV=production
   PORT=5000
   GOLD_API_KEY=your_gold_api_key_here (optional)
   METALS_API_KEY=your_metals_api_key_here (optional)
   ```

4. **Deploy**
   - Railway will auto-detect Node.js and deploy
   - Wait for deployment to complete
   - Copy your deployment URL (e.g., `https://your-app.railway.app`)

5. **Verify Deployment**
   Visit: `https://your-app.railway.app/api/health`
   Should return: `{"status":"ok"}`

---

### Option B: Render.com (Alternative)

1. **Go to [Render.com](https://render.com)** and sign in

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory

3. **Configure Service**
   ```
   Name: btc-analytics-backend
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   ```

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   GOLD_API_KEY=your_key (optional)
   METALS_API_KEY=your_key (optional)
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Copy your URL (e.g., `https://btc-analytics-backend.onrender.com`)

---

## 🎨 Part 2: Deploy Frontend (Netlify)

### Step 1: Update Frontend Environment Variables

**IMPORTANT**: Before deploying, update the API URL in your frontend.

Edit `/home/omar/WIP/frontend/.env.production`:
```env
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
VITE_ENV=production
```

Replace `your-backend-url.railway.app` with your actual backend URL from Part 1.

### Step 2: Deploy to Netlify

**I can deploy this for you!** Just confirm and I'll run the deployment.

Alternatively, manual deployment:

1. **Go to [Netlify](https://netlify.com)** and sign in

2. **Deploy from GitHub**
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select your repository
   - Set base directory: `frontend`

3. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **Environment Variables**
   Add in Netlify dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app/api
   VITE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://random-name.netlify.app`

6. **Custom Domain (Optional)**
   - Go to "Domain settings"
   - Add your custom domain

---

## ✅ Part 3: Verify Everything Works

### 1. Test Backend
```bash
curl https://your-backend-url.railway.app/api/health
```
Should return: `{"status":"ok"}`

### 2. Test API Endpoints
```bash
# Get latest price
curl https://your-backend-url.railway.app/api/prices/latest

# Get AI prediction
curl https://your-backend-url.railway.app/api/ai/predictions/latest

# Get dashboard data
curl https://your-backend-url.railway.app/api/dashboard/init
```

### 3. Test Frontend
- Visit your Netlify URL
- Check browser console for errors
- Verify charts are loading
- Check that data is fetching from your backend

---

## 🔒 Security Checklist

- [ ] Backend environment variables are set (not hardcoded)
- [ ] Frontend `.env` files are in `.gitignore`
- [ ] API keys are stored in Railway/Render environment variables
- [ ] CORS is configured correctly in backend
- [ ] Database file is persisted (Railway volumes or Render disk)

---

## 🐛 Troubleshooting

### Frontend shows "No data available"
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` is correct
- Ensure backend is running and accessible

### Backend crashes on startup
- Check Railway/Render logs
- Verify all dependencies are in `package.json`
- Check that SQLite database can be created

### AI predictions not working
- Check backend logs for TensorFlow errors
- Verify model files are included in deployment
- Check that sufficient memory is allocated (Railway: 512MB+)

---

## 📊 Monitoring

### Railway
- View logs: Project → Deployments → Logs
- Monitor metrics: Project → Metrics

### Netlify
- View build logs: Site → Deploys → Deploy log
- Monitor analytics: Site → Analytics

---

## 🔄 Continuous Deployment

Both Railway and Netlify support auto-deployment:
- Push to `main` branch → Auto-deploy backend (Railway)
- Push to `main` branch → Auto-deploy frontend (Netlify)

---

## 💰 Costs

### Free Tier Limits
- **Railway**: $5 free credit/month, then $0.000231/GB-hour
- **Render**: 750 hours/month free (sleeps after 15 min inactivity)
- **Netlify**: 100GB bandwidth/month, 300 build minutes/month

### Recommended for Production
- **Railway Hobby**: $5/month (no sleep, better performance)
- **Render Starter**: $7/month (no sleep)
- **Netlify Pro**: $19/month (more bandwidth)

---

## 📝 Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Update frontend `.env.production` with backend URL
3. ✅ Deploy frontend to Netlify
4. ✅ Test all functionality
5. 🎉 Share your live dashboard!

---

## 🆘 Need Help?

If you encounter issues:
1. Check the logs in Railway/Render/Netlify
2. Verify environment variables are set correctly
3. Test API endpoints directly with curl
4. Check browser console for frontend errors

---

**Ready to deploy? Let me know and I'll help you through each step!**
