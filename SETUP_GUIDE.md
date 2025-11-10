# 🚀 TalentSphere HRMS - Complete Setup Guide

This guide will walk you through setting up the TalentSphere HRMS system on your local machine using XAMPP/WAMP.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **XAMPP** or **WAMP** - [Download XAMPP](https://www.apachefriends.org/)
- **Git** (optional) - [Download](https://git-scm.com/)
- A code editor like **VS Code** - [Download](https://code.visualstudio.com/)

## 🗄️ Step 1: Set Up MySQL Database

### 1.1 Start XAMPP/WAMP
- Open XAMPP/WAMP Control Panel
- Start **Apache** and **MySQL** services

### 1.2 Create Database
- Open your browser and go to `http://localhost/phpmyadmin`
- Click on "New" in the left sidebar
- Create a new database named: `talentsphere`
- Collation: `utf8mb4_unicode_ci`
- Click "Create"

## 📦 Step 2: Install Dependencies

### 2.1 Navigate to Project Directory
```bash
cd C:\Users\adity\Downloads\HRMS
```

### 2.2 Install Root Dependencies
```bash
npm install
```

### 2.3 Install Client Dependencies
```bash
cd client
npm install
cd ..
```

## ⚙️ Step 3: Configure Environment Variables

The `.env` file is already created with default values. Verify the database connection:

```env
DATABASE_URL="mysql://root:@localhost:3306/talentsphere"
JWT_SECRET="supersecretkey"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note:** If your MySQL has a password, update the DATABASE_URL:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/talentsphere"
```

## 🔧 Step 4: Set Up Database Schema

### 4.1 Generate Prisma Client
```bash
npx prisma generate
```

### 4.2 Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your database.

### 4.3 Seed Initial Data
```bash
npm run prisma:seed
```

This will create default users and sample data.

## 🎯 Step 5: Run the Application

### Option 1: Run Both Frontend and Backend Together (Recommended)
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

## 🔐 Step 6: Login to the System

Open your browser and navigate to `http://localhost:3000`

### Default Login Credentials:

**Admin Account:**
- Email: `admin@talentsphere.com`
- Password: `Admin@123`

**HR Account:**
- Email: `hr@talentsphere.com`
- Password: `Hr@123`

**Team Lead Account:**
- Email: `lead@talentsphere.com`
- Password: `Lead@123`

**Employee Account:**
- Email: `employee@talentsphere.com`
- Password: `Employee@123`

## 🎨 Step 7: Explore Features

After logging in, you can explore:

1. **Dashboard** - Overview of system statistics
2. **Employees** - Manage employee records (Admin/HR only)
3. **Attendance** - Check-in/out and view attendance history
4. **Leaves** - Apply for leaves and manage approvals
5. **Payroll** - View payslips and salary information
6. **Projects** - Manage projects and tasks
7. **Performance** - Track goals and feedback
8. **Profile** - Update personal information

## 🔍 Troubleshooting

### Issue: Database Connection Failed

**Solution:**
1. Ensure MySQL is running in XAMPP/WAMP
2. Verify database name is `talentsphere`
3. Check if MySQL port is 3306 (default)
4. Update `.env` file with correct credentials

### Issue: Port Already in Use

**Solution:**
1. Backend (Port 5000):
   - Change `PORT=5000` to another port in `.env`
   
2. Frontend (Port 3000):
   - The React app will automatically suggest another port

### Issue: Prisma Migration Errors

**Solution:**
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Then run migrations again
npx prisma migrate dev --name init
npm run prisma:seed
```

### Issue: Module Not Found Errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf client/node_modules
npm run install-all
```

## 📱 PWA Installation

The application is a Progressive Web App (PWA). To install:

1. Open the app in Chrome/Edge
2. Look for the "Install" icon in the address bar
3. Click to install as a standalone app
4. Access from your desktop/mobile home screen

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install-all

# Run development server (both frontend & backend)
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio (Database GUI)
npx prisma studio
```

## 📊 Prisma Studio

To view and edit database records visually:

```bash
npx prisma studio
```

This will open a web interface at `http://localhost:5555`

## 🌐 API Documentation

The backend API is available at `http://localhost:5000/api`

### Main API Endpoints:

- **Auth:** `/api/auth/*`
- **Employees:** `/api/employees/*`
- **Attendance:** `/api/attendance/*`
- **Leaves:** `/api/leaves/*`
- **Payroll:** `/api/payroll/*`
- **Projects:** `/api/projects/*`
- **Performance:** `/api/performance/*`
- **Notifications:** `/api/notifications/*`
- **Dashboard:** `/api/dashboard/*`

### Health Check:
```
GET http://localhost:5000/health
```

## 🔒 Security Notes

1. **Change Default Credentials:** After first login, change all default passwords
2. **JWT Secret:** Update `JWT_SECRET` in `.env` for production
3. **Database Password:** Set a strong password for MySQL in production
4. **CORS:** Update `FRONTEND_URL` in `.env` for production deployment

## 📈 Production Deployment

### Backend Deployment:

1. Set environment variables on your server
2. Update `NODE_ENV=production`
3. Use a production-grade database (AWS RDS, etc.)
4. Deploy to services like:
   - Heroku
   - Railway
   - Render
   - AWS EC2
   - DigitalOcean

### Frontend Deployment:

1. Build the React app:
   ```bash
   cd client
   npm run build
   ```

2. Deploy the `build` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Firebase Hosting

3. Update API base URL in production

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review the README.md file
- Check console logs for error messages

## 🎉 Success!

You should now have TalentSphere HRMS running locally. Explore all the features and customize as needed!

---

**Built with ❤️ by TalentSphere Team**
