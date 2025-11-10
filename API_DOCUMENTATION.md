# 📚 TalentSphere HRMS - API Documentation

Base URL: `http://localhost:5000/api`

## 🔐 Authentication

All protected endpoints require a valid JWT token stored in HTTP-only cookies.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@talentsphere.com",
  "password": "Admin@123"
}

Response: 200 OK
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "admin@talentsphere.com",
    "role": "ADMIN",
    "employee": { ... }
  }
}
```

### Get Current User
```http
GET /auth/me
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@talentsphere.com",
    "role": "ADMIN",
    "employee": { ... }
  }
}
```

### Logout
```http
POST /auth/logout
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password
```http
PUT /auth/reset-password/:resetToken
Content-Type: application/json

{
  "password": "newPassword123"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successful"
}
```

### Update Password
```http
PUT /auth/update-password
Cookie: token=jwt_token
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}

Response: 200 OK
{
  "success": true,
  "message": "Password updated successfully"
}
```

## 👥 Employees

### Get All Employees
```http
GET /employees?page=1&limit=10&search=john&department=Engineering&role=EMPLOYEE
Cookie: token=jwt_token
Roles: ADMIN, HR, TEAM_LEAD

Response: 200 OK
{
  "success": true,
  "count": 10,
  "total": 50,
  "totalPages": 5,
  "currentPage": 1,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "employeeId": "EMP001",
      "designation": "Developer",
      "department": "Engineering",
      "user": { ... }
    }
  ]
}
```

### Get Employee by ID
```http
GET /employees/:id
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "employeeId": "EMP001",
    "designation": "Developer",
    "department": "Engineering",
    "baseSalary": 50000,
    "user": { ... },
    "manager": { ... },
    "subordinates": [ ... ],
    "leaveBalances": [ ... ]
  }
}
```

### Create Employee
```http
POST /employees
Cookie: token=jwt_token
Roles: ADMIN, HR
Content-Type: application/json

{
  "email": "newemployee@example.com",
  "password": "Password@123",
  "role": "EMPLOYEE",
  "firstName": "Jane",
  "lastName": "Smith",
  "employeeId": "EMP021",
  "designation": "Developer",
  "department": "Engineering",
  "baseSalary": 50000,
  "allowances": {
    "hra": 10000,
    "ta": 2500
  },
  "deductions": {
    "pf": 2500,
    "tax": 5000
  }
}

Response: 201 Created
{
  "success": true,
  "message": "Employee created successfully",
  "data": { ... }
}
```

### Update Employee
```http
PUT /employees/:id
Cookie: token=jwt_token
Roles: ADMIN, HR
Content-Type: application/json

{
  "firstName": "Jane",
  "designation": "Senior Developer",
  "baseSalary": 60000
}

Response: 200 OK
{
  "success": true,
  "message": "Employee updated successfully",
  "data": { ... }
}
```

### Delete Employee
```http
DELETE /employees/:id
Cookie: token=jwt_token
Roles: ADMIN

Response: 200 OK
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

### Upload Employee Documents
```http
POST /employees/:id/documents
Cookie: token=jwt_token
Content-Type: multipart/form-data

Form Data:
- resume: file
- idProof: file
- offerLetter: file

Response: 200 OK
{
  "success": true,
  "message": "Documents uploaded successfully",
  "data": { ... }
}
```

### Get Employee Statistics
```http
GET /employees/stats/overview
Cookie: token=jwt_token
Roles: ADMIN, HR

Response: 200 OK
{
  "success": true,
  "data": {
    "totalEmployees": 120,
    "activeEmployees": 115,
    "inactiveEmployees": 5,
    "departmentCounts": [ ... ],
    "roleCounts": [ ... ]
  }
}
```

## ⏰ Attendance

### Check In
```http
POST /attendance/checkin
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "message": "Checked in successfully",
  "data": {
    "id": 1,
    "employeeId": 1,
    "date": "2024-01-15",
    "checkIn": "2024-01-15T09:00:00Z",
    "status": "PRESENT"
  }
}
```

### Check Out
```http
POST /attendance/checkout
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "message": "Checked out successfully",
  "data": {
    "id": 1,
    "checkOut": "2024-01-15T18:00:00Z",
    "totalHours": 9.0,
    "overtimeHours": 0
  }
}
```

### Start Break
```http
POST /attendance/break/start
Cookie: token=jwt_token
Content-Type: application/json

{
  "breakType": "TEA"  // or "LUNCH"
}

Response: 200 OK
{
  "success": true,
  "message": "TEA break started",
  "data": { ... }
}
```

### End Break
```http
POST /attendance/break/end
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "message": "Break ended",
  "data": {
    "duration": 15  // minutes
  }
}
```

### Get My Attendance Records
```http
GET /attendance/my-records?month=1&year=2024
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "count": 22,
  "data": [
    {
      "id": 1,
      "date": "2024-01-15",
      "checkIn": "09:00:00",
      "checkOut": "18:00:00",
      "totalHours": 9.0,
      "status": "PRESENT",
      "breaks": [ ... ]
    }
  ]
}
```

### Get Today's Attendance
```http
GET /attendance/today
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": {
    "attendance": { ... },
    "ongoingBreak": null
  }
}
```

### Get Employee Attendance
```http
GET /attendance/employee/:employeeId?month=1&year=2024
Cookie: token=jwt_token
Roles: ADMIN, HR, TEAM_LEAD

Response: 200 OK
{
  "success": true,
  "count": 22,
  "data": [ ... ]
}
```

### Get Attendance Statistics
```http
GET /attendance/stats?month=1&year=2024
Cookie: token=jwt_token
Roles: ADMIN, HR

Response: 200 OK
{
  "success": true,
  "data": {
    "totalPresent": 2200,
    "totalAbsent": 50,
    "totalLate": 150,
    "avgHours": 8.5,
    "month": 1,
    "year": 2024
  }
}
```

## 📅 Leaves

### Apply for Leave
```http
POST /leaves
Cookie: token=jwt_token
Content-Type: multipart/form-data

Form Data:
- leaveType: "SICK"
- startDate: "2024-01-20"
- endDate: "2024-01-22"
- reason: "Medical emergency"
- attachment: file (optional)

Response: 201 Created
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": { ... }
}
```

### Get All Leaves
```http
GET /leaves?page=1&limit=10&status=PENDING&leaveType=SICK&employeeId=1
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "count": 10,
  "total": 50,
  "data": [
    {
      "id": 1,
      "leaveType": "SICK",
      "startDate": "2024-01-20",
      "endDate": "2024-01-22",
      "reason": "Medical emergency",
      "status": "PENDING",
      "employee": { ... }
    }
  ]
}
```

### Approve Leave
```http
PUT /leaves/:id/approve
Cookie: token=jwt_token
Roles: ADMIN, HR, TEAM_LEAD

Response: 200 OK
{
  "success": true,
  "message": "Leave approved successfully",
  "data": { ... }
}
```

### Reject Leave
```http
PUT /leaves/:id/reject
Cookie: token=jwt_token
Roles: ADMIN, HR, TEAM_LEAD
Content-Type: application/json

{
  "rejectionReason": "Insufficient staff during this period"
}

Response: 200 OK
{
  "success": true,
  "message": "Leave rejected",
  "data": { ... }
}
```

### Get Leave Balance
```http
GET /leaves/balance
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "leaveType": "SICK",
      "totalLeaves": 12,
      "usedLeaves": 3,
      "remainingLeaves": 9,
      "year": 2024
    }
  ]
}
```

### Get Holidays
```http
GET /leaves/holidays?year=2024
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "New Year",
      "date": "2024-01-01",
      "description": "New Year Day",
      "isOptional": false
    }
  ]
}
```

### Create Holiday
```http
POST /leaves/holidays
Cookie: token=jwt_token
Roles: ADMIN, HR
Content-Type: application/json

{
  "name": "Independence Day",
  "date": "2024-08-15",
  "description": "Independence Day of India",
  "isOptional": false
}

Response: 201 Created
{
  "success": true,
  "message": "Holiday created successfully",
  "data": { ... }
}
```

## 💰 Payroll

### Generate Payroll
```http
POST /payroll/generate
Cookie: token=jwt_token
Roles: ADMIN, HR
Content-Type: application/json

{
  "month": 1,
  "year": 2024,
  "employeeIds": [1, 2, 3]  // optional, leave empty for all
}

Response: 201 Created
{
  "success": true,
  "message": "Payroll generated for 3 employees",
  "data": [ ... ]
}
```

### Get Payroll Records
```http
GET /payroll?page=1&limit=10&month=1&year=2024&status=FINALIZED&employeeId=1
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "count": 10,
  "total": 120,
  "data": [
    {
      "id": 1,
      "month": 1,
      "year": 2024,
      "baseSalary": 50000,
      "grossSalary": 62500,
      "netSalary": 52500,
      "status": "FINALIZED",
      "employee": { ... }
    }
  ]
}
```

### Finalize Payroll
```http
PUT /payroll/:id/finalize
Cookie: token=jwt_token
Roles: ADMIN, HR

Response: 200 OK
{
  "success": true,
  "message": "Payroll finalized successfully",
  "data": { ... }
}
```

### Download Payslip
```http
GET /payroll/:id/payslip
Cookie: token=jwt_token

Response: 200 OK
Content-Type: application/pdf
(PDF file download)
```

### Get Payroll Statistics
```http
GET /payroll/stats/overview?month=1&year=2024
Cookie: token=jwt_token
Roles: ADMIN, HR

Response: 200 OK
{
  "success": true,
  "data": {
    "totalPayroll": 6000000,
    "avgSalary": 50000,
    "totalOvertimePay": 50000,
    "statusCounts": [ ... ]
  }
}
```

## 📊 Dashboard

### Get Dashboard Overview
```http
GET /dashboard/overview
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": {
    // Role-specific dashboard data
    "employees": { ... },
    "attendance": { ... },
    "leaves": { ... },
    "payroll": { ... }
  }
}
```

### Get Attendance Analytics
```http
GET /dashboard/attendance-analytics?month=1&year=2024
Cookie: token=jwt_token
Roles: ADMIN, HR

Response: 200 OK
{
  "success": true,
  "data": {
    "dailyAttendance": [ ... ],
    "statusBreakdown": [ ... ],
    "departmentAttendance": [ ... ]
  }
}
```

## 🔔 Notifications

### Get Notifications
```http
GET /notifications?page=1&limit=20&isRead=false
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "count": 20,
  "total": 50,
  "unreadCount": 15,
  "data": [
    {
      "id": 1,
      "type": "LATE_LOGIN",
      "title": "Late Check-in",
      "message": "You checked in late at 09:30 AM",
      "isRead": false,
      "createdAt": "2024-01-15T09:30:00Z"
    }
  ]
}
```

### Mark as Read
```http
PUT /notifications/:id/read
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Mark All as Read
```http
PUT /notifications/read-all
Cookie: token=jwt_token

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read"
}
```

## 🎯 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role EMPLOYEE is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

## 📝 Notes

- All dates should be in ISO 8601 format
- File uploads use multipart/form-data
- JWT tokens are stored in HTTP-only cookies
- Pagination uses `page` and `limit` query parameters
- All timestamps are in UTC

---

**For more details, check the source code in `/server/controllers/` and `/server/routes/`**
