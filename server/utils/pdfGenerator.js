const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate payslip PDF
const generatePayslip = async (payrollData, employee) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `payslip-${employee.employeeId}-${payrollData.month}-${payrollData.year}.pdf`;
      const filePath = path.join(__dirname, '../../uploads/payslips', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('TalentSphere HRMS', { align: 'center' });
      doc.fontSize(16).text('Payslip', { align: 'center' });
      doc.moveDown();

      // Employee Details
      doc.fontSize(12);
      doc.text(`Employee Name: ${employee.firstName} ${employee.lastName}`);
      doc.text(`Employee ID: ${employee.employeeId}`);
      doc.text(`Designation: ${employee.designation}`);
      doc.text(`Department: ${employee.department}`);
      doc.text(`Month/Year: ${payrollData.month}/${payrollData.year}`);
      doc.moveDown();

      // Earnings
      doc.fontSize(14).text('Earnings', { underline: true });
      doc.fontSize(12);
      doc.text(`Base Salary: ₹${payrollData.baseSalary}`);
      
      if (payrollData.allowances) {
        Object.entries(payrollData.allowances).forEach(([key, value]) => {
          doc.text(`${key.toUpperCase()}: ₹${value}`);
        });
      }
      
      if (parseFloat(payrollData.overtimePay) > 0) {
        doc.text(`Overtime Pay: ₹${payrollData.overtimePay}`);
      }
      
      doc.text(`Gross Salary: ₹${payrollData.grossSalary}`, { bold: true });
      doc.moveDown();

      // Deductions
      doc.fontSize(14).text('Deductions', { underline: true });
      doc.fontSize(12);
      
      if (payrollData.deductions) {
        Object.entries(payrollData.deductions).forEach(([key, value]) => {
          doc.text(`${key.toUpperCase()}: ₹${value}`);
        });
      }
      
      if (parseFloat(payrollData.leaveDeductions) > 0) {
        doc.text(`Leave Deductions: ₹${payrollData.leaveDeductions}`);
      }
      doc.moveDown();

      // Net Salary
      doc.fontSize(14).text(`Net Salary: ₹${payrollData.netSalary}`, { bold: true });
      doc.moveDown();

      // Footer
      doc.fontSize(10).text('This is a computer-generated document. No signature required.', {
        align: 'center'
      });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePayslip };
