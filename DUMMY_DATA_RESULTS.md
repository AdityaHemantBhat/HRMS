# Dummy Payroll Data - Test Results

## ✅ Successfully Created!

**Date**: November 2025  
**Total Employees**: 5  
**Total Monthly Payroll**: ₹202,979.81

---

## 📊 Individual Employee Breakdown

### 1. John Doe (EMP-TEST-001) - Perfect Attendance ✅
**Department**: Engineering  
**Designation**: Senior Developer

| Item | Amount |
|------|--------|
| Base Salary | ₹80,000.00 |
| Working Days | 22/22 (100%) |
| Late Days | 0 |
| Absent Days | 0 |
| Overtime Hours | 10 |
| **Calculated Base** | **₹80,000.00** |
| Allowances (HRA + Transport + Medical) | ₹20,000.00 |
| Overtime Pay | ₹6,060.61 |
| **Gross Salary** | **₹106,060.61** |
| Deductions (PF + Tax + Insurance) | ₹15,000.00 |
| Late Deduction | ₹0.00 |
| Absent Deduction | ₹0.00 |
| **NET SALARY** | **₹91,060.61** |

**Login**: john.doe@test.com / Test@123

---

### 2. Jane Smith (EMP-TEST-002) - Good Attendance ✅
**Department**: Marketing  
**Designation**: Marketing Manager

| Item | Amount |
|------|--------|
| Base Salary | ₹60,000.00 |
| Working Days | 20/22 (91%) |
| Late Days | 3 |
| Absent Days | 2 |
| Overtime Hours | 5 |
| **Calculated Base** | **₹54,545.45** |
| Allowances (HRA + Transport) | ₹14,500.00 |
| Overtime Pay | ₹2,272.73 |
| **Gross Salary** | **₹71,318.18** |
| Deductions (PF + Tax) | ₹10,000.00 |
| Late Deduction | ₹909.09 |
| Absent Deduction | ₹5,454.55 |
| **NET SALARY** | **₹54,954.55** |

**Login**: jane.smith@test.com / Test@123

---

### 3. Mike Wilson (EMP-TEST-003) - Average Attendance ⚠️
**Department**: Sales  
**Designation**: Sales Executive

| Item | Amount |
|------|--------|
| Base Salary | ₹50,000.00 |
| Working Days | 18/22 (82%) |
| Late Days | 5 |
| Absent Days | 4 |
| Overtime Hours | 0 |
| **Calculated Base** | **₹40,909.09** |
| Allowances (HRA + Transport + Commission) | ₹17,000.00 |
| Overtime Pay | ₹0.00 |
| **Gross Salary** | **₹57,909.09** |
| Deductions (PF + Tax) | ₹8,500.00 |
| Late Deduction | ₹1,262.63 |
| Absent Deduction | ₹9,090.91 |
| **NET SALARY** | **₹39,055.56** |

**Login**: mike.wilson@test.com / Test@123

---

### 4. Sarah Jones (EMP-TEST-004) - Poor Attendance ⚠️
**Department**: HR  
**Designation**: HR Executive

| Item | Amount |
|------|--------|
| Base Salary | ₹45,000.00 |
| Working Days | 15/22 (68%) |
| Late Days | 2 |
| Absent Days | 7 |
| Overtime Hours | 0 |
| **Calculated Base** | **₹30,681.82** |
| Allowances (HRA + Transport) | ₹10,500.00 |
| Overtime Pay | ₹0.00 |
| **Gross Salary** | **₹41,181.82** |
| Deductions (PF + Tax + Insurance) | ₹8,500.00 |
| Late Deduction | ₹454.55 |
| Absent Deduction | ₹14,318.18 |
| **NET SALARY** | **₹17,909.09** |

**Login**: sarah.jones@test.com / Test@123

---

### 5. Test Negative (EMP-TEST-005) - Edge Case Test 🔴
**Department**: Testing  
**Designation**: QA Tester

| Item | Amount |
|------|--------|
| Base Salary | ₹40,000.00 |
| Working Days | 5/22 (23%) |
| Late Days | 1 |
| Absent Days | 17 |
| Overtime Hours | 0 |
| **Calculated Base** | **₹9,090.91** |
| Allowances (HRA) | ₹8,000.00 |
| Overtime Pay | ₹0.00 |
| **Gross Salary** | **₹17,090.91** |
| Deductions (PF + Tax + Loan) | ₹17,000.00 |
| Late Deduction | ₹202.02 |
| Absent Deduction | ₹30,909.09 |
| **Total Deductions** | **₹48,111.11** |
| **NET SALARY** | **₹0.00** ✅ (Not Negative!) |

**Login**: test.negative@test.com / Test@123

> **Important**: This employee demonstrates the fix working correctly!  
> Without the fix, NET SALARY would be **-₹31,020.20** (negative)  
> With the fix, NET SALARY is **₹0.00** (prevented from going negative)

---

## 🎯 What This Proves

### ✅ Fix is Working Correctly
- **Test Negative** employee has deductions (₹48,111.11) exceeding gross salary (₹17,090.91)
- Instead of showing **-₹31,020.20**, the system correctly shows **₹0.00**
- This proves the `Math.max(0, ...)` fix is working

### ✅ Calculations Are Accurate
All calculations follow the correct formula:
```
Daily Rate = Base Salary ÷ 22 working days
Hourly Rate = Base Salary ÷ (22 × 9 hours)

Calculated Base = Daily Rate × Working Days
Overtime Pay = Overtime Hours × Hourly Rate × 1.5
Late Deduction = Late Days × Hourly Rate
Absent Deduction = Absent Days × Daily Rate

Gross Salary = Calculated Base + Allowances + Overtime Pay
Net Salary = MAX(0, Gross - Deductions - Late - Absent)
```

### ✅ Dashboard Should Show
- **Monthly Payroll Total**: ₹202,979.81
- **5 Payroll Records** in the payroll list
- **All NET SALARY values ≥ 0** (no negative values)

---

## 🔍 How to Verify

### 1. Check Admin Dashboard
1. Login as admin
2. Look at "Monthly Payroll" card
3. Should show: **₹202,979.81** (or close to it)

### 2. Check Payroll Page
1. Go to Payroll section
2. Filter by November 2025
3. You should see 5 records + your existing employees
4. Verify "Test Negative" shows ₹0.00 (not negative)

### 3. Login as Individual Employees
Use the credentials above to login as each employee and see their individual payroll from the employee dashboard.

---

## 🗑️ Clean Up

When you're done testing, delete all dummy data:

```bash
node server/scripts/deleteDummyPayrollData.js
```

This will remove:
- 5 dummy users
- 5 employee records
- ~125 attendance records
- 5 payroll records

---

## 📝 Notes

- All dummy data uses `@test.com` email addresses
- All passwords are: `Test@123`
- Attendance is generated for November 2025
- All payroll records are in DRAFT status
- Sundays are automatically excluded from attendance

---

## ✨ Summary

The payroll calculation system is working correctly:
- ✅ Prevents negative net salary values
- ✅ Accurately calculates based on working days
- ✅ Properly applies overtime, deductions, and allowances
- ✅ Handles edge cases (very few working days + high deductions)

**Total Monthly Payroll**: ₹202,979.81 across 5 employees
