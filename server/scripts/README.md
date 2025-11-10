# Testing Scripts

## Overview
These scripts help you test various features of the HRMS system with dummy data.

## Scripts

### 1. Add Dummy Payroll Data
**File**: `addDummyPayrollData.js`

Creates 5 dummy employees with different attendance scenarios to test payroll calculations:

#### Dummy Employees Created:

1. **John Doe** (EMP-TEST-001)
   - Base Salary: ₹80,000
   - Full attendance (22 days)
   - 10 hours overtime
   - Expected: High net salary

2. **Jane Smith** (EMP-TEST-002)
   - Base Salary: ₹60,000
   - 20 working days, 2 absent, 3 late
   - 5 hours overtime
   - Expected: Good net salary with some deductions

3. **Mike Wilson** (EMP-TEST-003)
   - Base Salary: ₹50,000
   - 18 working days, 4 absent, 5 late
   - No overtime
   - Expected: Moderate net salary with more deductions

4. **Sarah Jones** (EMP-TEST-004)
   - Base Salary: ₹45,000
   - 15 working days, 7 absent, 2 late
   - No overtime
   - Expected: Lower net salary due to many absences

5. **Test Negative** (EMP-TEST-005) - **EDGE CASE**
   - Base Salary: ₹40,000
   - Only 5 working days, 17 absent
   - High deductions (₹17,000)
   - Expected: ₹0 net salary (tests that negative values don't occur)

#### Usage:
```bash
# From the HRMS root directory
node server/scripts/addDummyPayrollData.js
```

#### What it does:
- Creates 5 dummy users with email pattern `*@test.com`
- Creates employee records with different salary structures
- Generates attendance records for the current month
- Calculates and creates payroll records
- Shows detailed calculation breakdown for each employee

### 2. Delete Dummy Payroll Data
**File**: `deleteDummyPayrollData.js`

Removes all dummy data created by the add script.

#### Usage:
```bash
# From the HRMS root directory
node server/scripts/deleteDummyPayrollData.js
```

#### What it deletes:
- All users with `@test.com` email addresses
- Associated employee records
- All attendance records for dummy employees
- All payroll records for dummy employees
- Any leave records
- Any notifications

## Testing Workflow

### Step 1: Add Dummy Data
```bash
node server/scripts/addDummyPayrollData.js
```

### Step 2: Verify in Dashboard
1. Login to admin dashboard
2. Check the "Monthly Payroll" statistic
3. Go to Payroll page to see individual records
4. Verify calculations are correct

### Step 3: Check Calculations
The script outputs detailed calculations for each employee:
- Base Salary
- Calculated Base (based on working days)
- Allowances
- Overtime Pay
- Gross Salary
- Deductions
- Late Deduction
- Absent Deduction
- **NET SALARY** (should never be negative)

### Step 4: Clean Up
```bash
node server/scripts/deleteDummyPayrollData.js
```

## Expected Results

### Monthly Payroll Total
The dashboard should show the sum of all net salaries (approximately ₹200,000-250,000 depending on the month).

### Individual Payroll Breakdown

**John Doe** (Full attendance):
- Gross: ~₹100,000
- Net: ~₹85,000

**Jane Smith** (Good attendance):
- Gross: ~₹75,000
- Net: ~₹60,000

**Mike Wilson** (Average attendance):
- Gross: ~₹60,000
- Net: ~₹45,000

**Sarah Jones** (Poor attendance):
- Gross: ~₹40,000
- Net: ~₹25,000

**Test Negative** (Edge case):
- Gross: ~₹15,000
- Net: **₹0** (not negative!)

## Payroll Calculation Formula

```
Daily Rate = Base Salary / 22 (working days)
Hourly Rate = Base Salary / (22 × 9 hours)

Calculated Base Salary = Daily Rate × Working Days

Overtime Pay = Overtime Hours × Hourly Rate × 1.5
Late Deduction = Late Days × Hourly Rate
Absent Deduction = Absent Days × Daily Rate

Gross Salary = Calculated Base Salary + Total Allowances + Overtime Pay

Net Salary = MAX(0, Gross Salary - Total Deductions - Late Deduction - Absent Deduction - Leave Deduction)
```

## Troubleshooting

### Script fails with "User already exists"
- The script checks for existing users and skips them
- If you want fresh data, run the delete script first

### Attendance not showing
- Check that the current month has working days
- Sundays are automatically skipped

### Payroll shows 0
- This is expected for the "Test Negative" employee
- It demonstrates that the fix prevents negative values

### Cannot delete data
- Make sure no finalized payrolls exist for dummy employees
- Check database constraints

## Notes

- All dummy users have password: `Test@123`
- Dummy employees have role: `EMPLOYEE`
- All payroll records are created with status: `DRAFT`
- Attendance is generated for the current month only
- The scripts are idempotent (safe to run multiple times)

## Login Credentials for Testing

```
Email: john.doe@test.com
Password: Test@123

Email: jane.smith@test.com
Password: Test@123

Email: mike.wilson@test.com
Password: Test@123

Email: sarah.jones@test.com
Password: Test@123

Email: test.negative@test.com
Password: Test@123
```

You can login as these employees to see their individual payroll from the employee dashboard.

---

## Attendance Testing Scripts

### 3. Add Dummy Attendance Data
**File**: `addDummyAttendanceData.js`

Generates realistic attendance records for all existing employees in the system.

#### What it creates:
- Attendance records for the **last 3 months** (including current month)
- Realistic check-in times (9:00 AM ± 60 minutes)
- Realistic check-out times (6:00 PM ± 90 minutes)
- 90% attendance rate (10% random absences)
- Late arrivals (after 9:30 AM) marked as 'LATE'
- Automatic overtime calculation
- Tea breaks (11:00 AM ± 30 min, 10-15 min duration)
- Lunch breaks (1:00 PM ± 30 min, 30-45 min duration)
- Skips weekends automatically

#### Usage:
```bash
# From the HRMS root directory
npm run add-dummy-attendance
```

Or directly:
```bash
node server/scripts/addDummyAttendanceData.js
```

#### Example Output:
```
🚀 Starting to add dummy attendance data...

📊 Found 25 employees

📅 Generating attendance from 2025-08-01 to 2025-11-08

✅ Successfully created 1,350 attendance records!
📊 Coverage: 25 employees over ~99 days
```

### 4. Delete Dummy Attendance Data
**File**: `deleteDummyAttendanceData.js`

Removes ALL attendance records and breaks from the database.

#### Usage:
```bash
# From the HRMS root directory
npm run delete-dummy-attendance
```

Or directly:
```bash
node server/scripts/deleteDummyAttendanceData.js
```

#### What it deletes:
- All attendance records
- All break records (tea and lunch breaks)
- Requires confirmation before deletion

#### Safety Features:
- Shows current record counts before deletion
- Asks for confirmation (type "yes" to proceed)
- Can be cancelled safely

## Attendance Testing Workflow

### Step 1: Ensure Employees Exist
Make sure you have employees in the system. If not, run:
```bash
node server/scripts/add20Employees.js
```

### Step 2: Add Dummy Attendance
```bash
npm run add-dummy-attendance
```

### Step 3: Test Attendance Reports
1. Login as Admin or HR user
2. Navigate to **Reports > Attendance Report**
3. Select date range (e.g., August 1, 2025 to August 31, 2025)
4. Click "Generate Report"
5. Verify attendance data is displayed correctly

### Step 4: Test Features
- View individual employee attendance details
- Download CSV reports
- Filter by department
- Check attendance statistics
- View daily breakdown with check-in/check-out times

### Step 5: Clean Up (Optional)
```bash
npm run delete-dummy-attendance
```

## Quick Commands Summary

```bash
# Attendance
npm run add-dummy-attendance      # Add 3 months of attendance data
npm run delete-dummy-attendance   # Delete all attendance data

# Payroll
node server/scripts/addDummyPayrollData.js    # Add payroll test data
node server/scripts/deleteDummyPayrollData.js # Delete payroll test data

# Employees
node server/scripts/add20Employees.js         # Add 20 dummy employees
```

## Notes

- Attendance data is generated for **all existing employees** in the database
- The script is **idempotent** - it skips existing records (won't create duplicates)
- Weekend days (Saturday & Sunday) are automatically skipped
- Attendance status is automatically calculated based on check-in time:
  - **PRESENT**: Check-in before 9:30 AM
  - **LATE**: Check-in after 9:30 AM
- Total hours and overtime are automatically calculated
- All times are realistic and varied to simulate real-world scenarios
