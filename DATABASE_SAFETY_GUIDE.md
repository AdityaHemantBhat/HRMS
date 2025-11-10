# 🛡️ Database Safety Guide - IMPORTANT!

## ⚠️ **CRITICAL: Understanding Seed Scripts**

### **What Happened to Your Employee?**

When you ran `npm run prisma:seed:minimal` today, it **DELETED ALL DATA** including the employee you created yesterday. This is by design for initial setup, but should NOT be run after you've added real data.

---

## 📋 **Available Scripts & When to Use Them**

### ✅ **Safe Scripts (Won't Delete Data)**

#### 1. `npm run prisma:add-admin`
**Use this to:** Add admin user without deleting existing data
```bash
npm run prisma:add-admin
```
- ✅ Checks if admin exists
- ✅ Creates admin only if missing
- ✅ **PRESERVES all existing employees and data**
- ✅ Safe to run anytime

---

### ⚠️ **DANGEROUS Scripts (Will Delete ALL Data)**

#### 2. `npm run prisma:seed:minimal`
**⚠️ WARNING:** This will DELETE everything!
```bash
npm run prisma:seed:minimal
```
- ❌ Deletes ALL employees
- ❌ Deletes ALL users
- ❌ Deletes ALL attendance records
- ❌ Deletes ALL leave records
- ❌ Deletes ALL payroll data
- ✅ Creates fresh admin user

**When to use:**
- ✅ First time setup only
- ✅ When you want to completely reset the database
- ❌ NEVER run this if you have real data!

**Now includes safety features:**
- Checks if admin exists first
- Shows warning before deleting
- Gives you 3 seconds to cancel (Ctrl+C)

#### 3. `npm run prisma:seed`
**⚠️ WARNING:** Full seed with test data (also deletes everything)

#### 4. `npx prisma migrate reset`
**⚠️ EXTREME WARNING:** Nuclear option - resets entire database schema
```bash
npx prisma migrate reset
```
- ❌ Drops all tables
- ❌ Recreates schema from scratch
- ❌ Deletes EVERYTHING

---

## 🎯 **Recommended Workflow**

### **First Time Setup:**
```bash
# Step 1: Generate Prisma client
npx prisma generate

# Step 2: Run migrations
npx prisma migrate dev --name init

# Step 3: Create admin user (ONLY ONCE)
npm run prisma:seed:minimal

# Step 4: Start the app
npm run dev
```

### **Daily Development:**
```bash
# Just start the app
npm run dev

# Add employees through the admin panel UI
# Your data will persist automatically
```

### **If Admin Gets Deleted Somehow:**
```bash
# Safely add admin back without deleting other data
npm run prisma:add-admin
```

---

## 💡 **Best Practices**

### ✅ **DO:**
1. Add employees through the admin panel UI
2. Use `npm run prisma:add-admin` if you need to recreate admin
3. Run `npm run dev` to start the application
4. Keep your data in the database

### ❌ **DON'T:**
1. Run seed scripts after initial setup
2. Run `npx prisma migrate reset` unless you want to lose everything
3. Manually delete database tables
4. Run `prisma:seed:minimal` if you have real data

---

## 🔄 **How to Recover Your Employee**

Unfortunately, once deleted, the data cannot be recovered unless you have a backup. You'll need to:

1. **Re-add the employee through the admin panel:**
   ```
   1. Login as admin (admin@talentsphere.com / Admin@123)
   2. Go to "Employees" section
   3. Click "Add Employee"
   4. Fill in all the details again
   5. Save
   ```

2. **Set up automatic backups (recommended):**
   - Export database regularly using phpMyAdmin
   - Or use MySQL dump commands
   - Store backups in a safe location

---

## 📊 **Database Backup Commands**

### **Export Database (Backup):**
```bash
# Using mysqldump (if available)
mysqldump -u root -p talentsphere > backup_$(date +%Y%m%d).sql

# Or use phpMyAdmin:
# 1. Go to http://localhost/phpmyadmin
# 2. Select 'talentsphere' database
# 3. Click 'Export' tab
# 4. Click 'Go' to download SQL file
```

### **Import Database (Restore):**
```bash
# Using mysql command
mysql -u root -p talentsphere < backup_20251107.sql

# Or use phpMyAdmin:
# 1. Go to http://localhost/phpmyadmin
# 2. Select 'talentsphere' database
# 3. Click 'Import' tab
# 4. Choose your backup SQL file
# 5. Click 'Go'
```

---

## 🎓 **Summary**

| Script | Deletes Data? | When to Use |
|--------|---------------|-------------|
| `npm run dev` | ❌ No | Every time you work |
| `npm run prisma:add-admin` | ❌ No | If admin is missing |
| `npm run prisma:seed:minimal` | ✅ YES! | First time setup ONLY |
| `npm run prisma:seed` | ✅ YES! | Never (test data) |
| `npx prisma migrate reset` | ✅ YES! | Emergency reset only |

---

## 🆘 **Quick Reference**

**I want to:**
- ✅ Start the app → `npm run dev`
- ✅ Add employees → Use admin panel UI
- ✅ Recreate admin → `npm run prisma:add-admin`
- ⚠️ Reset everything → `npm run prisma:seed:minimal` (WARNING!)
- 💾 Backup data → Use phpMyAdmin export

---

**Remember:** After initial setup, you should NEVER need to run seed scripts again. All data management should be done through the application UI! 🎯
