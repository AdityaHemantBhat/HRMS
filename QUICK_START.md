# ⚡ Quick Start Guide - TalentSphere HRMS

Get up and running in 5 minutes!

## 🚀 Quick Setup (Windows)

### 1. Start XAMPP/WAMP
- Open XAMPP Control Panel
- Start **MySQL** service

### 2. Create Database
- Go to `http://localhost/phpmyadmin`
- Create database: `talentsphere`

### 3. Install & Run
```bash
# Navigate to project
cd C:\Users\adity\Downloads\HRMS

# Install dependencies
npm install
cd client && npm install && cd ..

# Setup database
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# Start the app
npm run dev
```

### 4. Login
- Open: `http://localhost:3000`
- Email: `admin@talentsphere.com`
- Password: `Admin@123`

## ✅ That's it!

You're now running TalentSphere HRMS locally.

## 📝 Other Login Accounts

**HR:** hr@talentsphere.com / Hr@123  
**Team Lead:** lead@talentsphere.com / Lead@123  
**Employee:** employee@talentsphere.com / Employee@123

## 🔧 Common Commands

```bash
# Run both frontend & backend
npm run dev

# View database in browser
npx prisma studio

# Reset database (if needed)
npx prisma migrate reset
```

## ❓ Having Issues?

Check `SETUP_GUIDE.md` for detailed troubleshooting.

---

**Happy Coding! 🎉**
