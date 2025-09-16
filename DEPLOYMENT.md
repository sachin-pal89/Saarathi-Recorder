# 🚀 Deployment Guide

## Backend (Render) + Frontend (Vercel)

### 📋 Prerequisites
- [ ] GitHub repository with your code
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] Supabase project with environment variables

---

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Repository
- [ ] Push code to GitHub
- [ ] Ensure `backend/package.json` has correct scripts
- [ ] Verify `backend/render.yaml` exists

### Step 2: Deploy to Render
1. [ ] Go to [render.com](https://render.com)
2. [ ] Sign up/Login with GitHub
3. [ ] Click "New +" → "Web Service"
4. [ ] Connect GitHub repository
5. [ ] Configure service:
   - **Name**: `saarathi-recorder-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. [ ] Set environment variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service key
7. [ ] Click "Create Web Service"
8. [ ] Wait for deployment
9. [ ] **Note your backend URL**: `https://saarathi-recorder-backend.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Repository
- [ ] Ensure `frontend/package.json` has correct scripts
- [ ] Verify `frontend/vercel.json` exists
- [ ] Check `frontend/.gitignore` includes build files

### Step 2: Deploy to Vercel
1. [ ] Go to [vercel.com](https://vercel.com)
2. [ ] Sign up/Login with GitHub
3. [ ] Click "New Project"
4. [ ] Import GitHub repository
5. [ ] Configure project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. [ ] Set environment variables:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `VITE_API_BASE_URL` = Your Render backend URL
7. [ ] Click "Deploy"
8. [ ] Wait for deployment
9. [ ] **Note your frontend URL**: `https://saarathi-recorder.vercel.app`

---

## 🔗 Post-Deployment

### Update Environment Variables
- [ ] Update `VITE_API_BASE_URL` in Vercel with your actual Render backend URL
- [ ] Redeploy frontend if needed

### Test Deployment
- [ ] Visit your Vercel frontend URL
- [ ] Test customer listing
- [ ] Test recording functionality
- [ ] Verify audio playback works
- [ ] Check mobile responsiveness

### Domain Setup (Optional)
- [ ] Configure custom domain in Vercel
- [ ] Set up SSL certificates
- [ ] Update CORS settings if needed

---

## 🐛 Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs in Render/Vercel
2. **Environment Variables**: Ensure all required vars are set
3. **CORS Issues**: Update backend CORS settings
4. **API Connection**: Verify backend URL in frontend env vars

### Useful Commands
```bash
# Test backend locally
cd backend && npm run dev

# Test frontend locally
cd frontend && npm run dev

# Check build locally
cd frontend && npm run build
```

---

## 📊 Monitoring

### Render (Backend)
- Monitor logs in Render dashboard
- Check service health
- Monitor resource usage

### Vercel (Frontend)
- Monitor deployments
- Check analytics
- Monitor performance

---

## 🔄 Updates

### To update backend:
1. Push changes to GitHub
2. Render will auto-deploy

### To update frontend:
1. Push changes to GitHub
2. Vercel will auto-deploy

---

## 📝 Environment Variables Reference

### Backend (Render)
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (Vercel)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://saarathi-recorder-backend.onrender.com
```
