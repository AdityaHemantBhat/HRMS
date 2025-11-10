# 🚂 Railway Deployment Guide - TalentSphere HRMS

Complete step-by-step guide to deploy your full-stack HRMS application on Railway.

## ✅ Prerequisites Completed

Your project is now configured for Railway deployment with:

- Production build script
- Static file serving for React build
- Proper CORS configuration
- API routing for production

---

## 📋 Step-by-Step Deployment

### **STEP 1: Sign Up for Railway**

1. Go to **https://railway.app**
2. Click **"Login"** and sign up with GitHub
3. Authorize Railway to access your repositories
4. You get **$5 free credit per month** (no credit card required initially)

---

### **STEP 2: Create a New Project**

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **TalentSphere HRMS** repository
4. Railway will automatically detect it's a Node.js project

---

### **STEP 3: Add MySQL Database**

1. In your project dashboard, click **"New"** → **"Database"** → **"Add MySQL"**
2. Railway will create a MySQL database and provide connection details
3. The database URL will be automatically added as `DATABASE_URL` environment variable

---

### **STEP 4: Configure Environment Variables**

Click on your service → **"Variables"** tab → Add these:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
```

**Important:**

- `DATABASE_URL` is automatically set by Railway when you add MySQL
- Change `JWT_SECRET` to a strong random string

---

### **STEP 5: Configure Build Settings**

1. Go to **"Settings"** tab
2. Under **"Build"** section:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Under **"Deploy"** section:
   - **Root Directory**: leave empty (use root)
   - **Watch Paths**: leave default

---

### **STEP 6: Run Database Migrations**

After first deployment:

1. Go to your service → **"Settings"** → **"Deploy"**
2. Click **"Custom Start Command"** and temporarily change to:
   ```
   npx prisma migrate deploy && npm run prisma:seed && npm start
   ```
3. Click **"Deploy"** to redeploy
4. After successful deployment, change start command back to: `npm start`

**Or use Railway CLI:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy

# Seed database
railway run npm run prisma:seed
```

---

### **STEP 7: Deploy!**

1. Railway automatically deploys when you push to GitHub
2. Or click **"Deploy"** button in Railway dashboard
3. Wait 5-10 minutes for build and deployment
4. Railway will provide a public URL like: `https://your-app.up.railway.app`

---

### **STEP 8: Access Your Application**

1. Click on the generated URL
2. Login with default credentials:
   - **Email**: admin@gmail.com
   - **Password**: admin
3. **IMMEDIATELY change the admin password!**

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** for a Railway subdomain
3. Or add your custom domain and configure DNS

### Enable Automatic Deployments

1. Go to **"Settings"** → **"Service"**
2. Enable **"Automatic Deployments"**
3. Choose branch (usually `main` or `master`)
4. Every push to this branch will auto-deploy

### Monitor Your Application

1. **Logs**: Click "Deployments" → Select deployment → View logs
2. **Metrics**: View CPU, Memory, Network usage in dashboard
3. **Database**: Click MySQL service to see connection info

---

## 🐛 Troubleshooting

### Build Fails

- Check logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check if migrations ran successfully
- Try running: `railway run npx prisma migrate deploy`

### 404 Errors on Frontend Routes

- Ensure the production routing code is in `server/app.js`
- Check that React build exists in `client/build`

### API Not Working

- Check CORS configuration
- Verify environment variables are set
- Check logs for errors

---

## 💰 Cost Estimation

Railway pricing (after free $5 credit):

- **Hobby Plan**: $5/month credit (usually enough for small apps)
- **Usage-based**: ~$0.000463/GB-hour for memory
- **MySQL Database**: Included in usage

**Typical monthly cost for this app**: $5-10

---

## 🔄 Updating Your Application

### Method 1: Git Push (Automatic)

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway auto-deploys!

### Method 2: Manual Deploy

1. Go to Railway dashboard
2. Click **"Deploy"** button

### Method 3: Railway CLI

```bash
railway up
```

---

## 📊 Useful Railway Commands

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands in production
railway run <command>

# Open dashboard
railway open

# Check status
railway status
```

---

## ✅ Deployment Checklist

- [ ] Signed up for Railway
- [ ] Created new project from GitHub
- [ ] Added MySQL database
- [ ] Set environment variables
- [ ] Configured build settings
- [ ] Ran database migrations
- [ ] Seeded initial data
- [ ] Tested login with admin credentials
- [ ] Changed admin password
- [ ] Verified all features work
- [ ] Set up custom domain (optional)
- [ ] Enabled automatic deployments

---

## 🎉 You're Live!

Your TalentSphere HRMS is now running on Railway with:

- ✅ Frontend and Backend on same server
- ✅ MySQL database
- ✅ Automatic deployments
- ✅ HTTPS enabled
- ✅ Production-ready configuration

**Next Steps:**

1. Share the URL with your team
2. Create additional user accounts
3. Configure email settings for notifications
4. Set up regular database backups
5. Monitor usage and costs

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: Create an issue in your GitHub repo

---

**Happy Deploying! 🚀**
