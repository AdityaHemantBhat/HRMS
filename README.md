# 🚀 TalentSphere - Enterprise HRMS System

A complete, enterprise-grade Human Resource Management System built with modern technologies.

## 🧩 Tech Stack

**Frontend:**
- React.js with Hooks
- Redux Toolkit + RTK Query
- Ant Design + Custom SCSS
- React Router DOM
- Recharts for analytics

**Backend:**
- Node.js + Express.js
- Prisma ORM
- MySQL Database
- JWT Authentication
- Helmet, CORS, bcryptjs

**Features:**
- Progressive Web App (PWA)
- Real-time notifications
- Role-based access control
- Responsive design

## 📋 Prerequisites

- Node.js (v16 or higher)
- XAMPP/WAMP with MySQL
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd HRMS
```

### 2. Install dependencies
```bash
npm run install-all
```

### 3. Set up MySQL Database
- Start XAMPP/WAMP
- Open phpMyAdmin
- Create a database named `talentsphere`

### 4. Configure environment variables
- Copy `.env.example` to `.env`
- Update database credentials if needed

### 5. Run Prisma migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Seed initial data
```bash
npm run prisma:seed
```

## 🚀 Running the Application

### Development mode (runs both frontend and backend)
```bash
npm run dev
```

### Run backend only
```bash
npm run server
```

### Run frontend only
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Login Credentials

**Admin (Only user in production database):**
- Email: admin@gmail.com
- Password: admin

⚠️ **CRITICAL**: 
1. Change the admin password immediately after first login!
2. Create additional users (HR, Employees) through the admin panel as needed.
3. No test/demo data exists in the database - completely clean for production use.

## 📦 Key Features

### 1. Authentication & Roles
- JWT-based authentication
- Role-based access control (Admin, HR, Team Lead, Employee)
- Forgot password functionality

### 2. Employee Management
- Complete employee directory
- Profile management
- Document uploads
- Onboarding checklist

### 3. Attendance & Time Tracking
- Check-in/Check-out system
- Break tracking (Tea, Lunch)
- Project and task time logging
- Automated alerts for late/missed attendance

### 4. Leave Management
- Multiple leave types
- Leave balance tracking
- Approval workflow
- Holiday calendar

### 5. Payroll System
- Automated salary calculations
- Payslip generation (PDF)
- Allowances and deductions
- Overtime calculations

### 6. Performance Tracking
- Goal/OKR management
- Task performance monitoring
- 360° feedback system
- Performance dashboards

### 7. Notifications
- Real-time in-app alerts
- Push notifications (PWA)
- Email notifications
- Broadcast announcements

### 8. Reports & Analytics
- Visual dashboards
- Export to CSV/PDF
- Attendance reports
- Payroll summaries

## 📁 Project Structure

```
talentsphere/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── styles/
│       ├── App.js
│       └── store.js
├── server/                 # Node.js backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── prisma/
│   └── schema.prisma
└── uploads/               # File uploads directory
```

## 🔧 API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- POST `/api/auth/forgot-password` - Password reset
- GET `/api/auth/me` - Get current user

### Employees
- GET `/api/employees` - Get all employees
- GET `/api/employees/:id` - Get employee by ID
- POST `/api/employees` - Create employee
- PUT `/api/employees/:id` - Update employee
- DELETE `/api/employees/:id` - Delete employee

### Attendance
- POST `/api/attendance/checkin` - Check in
- POST `/api/attendance/checkout` - Check out
- POST `/api/attendance/break` - Log break
- GET `/api/attendance/my-records` - Get user's attendance

### Leaves
- GET `/api/leaves` - Get all leaves
- POST `/api/leaves` - Apply for leave
- PUT `/api/leaves/:id/approve` - Approve leave
- PUT `/api/leaves/:id/reject` - Reject leave

### Payroll
- GET `/api/payroll` - Get payroll records
- POST `/api/payroll/generate` - Generate payroll
- GET `/api/payroll/payslip/:id` - Download payslip

## 🌐 Production Deployment

### Backend
1. Set up MySQL database on production server
2. Update `.env` with production credentials
3. Deploy to VPS, Heroku, or Render
4. Run migrations: `npm run prisma:migrate`

### Frontend
1. Build the React app: `cd client && npm run build`
2. Deploy to Netlify, Vercel, or serve via Nginx
3. Update API base URL in frontend config

## 🔒 Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcryptjs
- Helmet.js for security headers
- CORS configuration
- Input validation with Joi
- Role-based access control

## 📱 PWA Features

- Installable on mobile devices
- Offline support
- Push notifications
- App-like experience

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email support@talentsphere.com or open an issue in the repository.

---

Built with ❤️ by the TalentSphere Team
