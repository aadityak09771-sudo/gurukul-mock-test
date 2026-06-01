const Student = require("../models/Student");
const Result = require("../models/Result");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// ================= GET ALL STUDENTS (ADMIN) =================
exports.getAllStudents = async (req, res) => {
  try {
    // ✅ Secure bypass to handle Excel and PDF exports through the existing GET route
    if (req.query.export === 'pdf') {
      return exports.exportStudentsPDF(req, res);
    }
    if (req.query.export === 'excel') {
      return exports.exportStudentsExcel(req, res);
    }

    // ✅ OPTIMIZED: Use MongoDB Aggregation to calculate stats efficiently in the database
    const studentsWithStats = await Student.aggregate([
      // 1. Join with the results collection
      {
        $lookup: {
          from: "results", // the name of the results collection in MongoDB
          localField: "email",
          foreignField: "studentEmail",
          as: "studentResults"
        }
      },
      // 2. Add the calculated fields for tests taken and average score
      {
        $addFields: {
          tests: { $size: "$studentResults" },
          avg: {
            $cond: {
              if: { $gt: [{ $size: "$studentResults" }, 0] },
              then: { $round: [{ $avg: "$studentResults.percentage" }, 0] },
              else: 0
            }
          }
        }
      },
      // 3. Remove the large studentResults array and the password for security
      {
        $project: {
          studentResults: 0,
          password: 0
        }
      },
      // 4. Sort by registration date
      { $sort: { createdAt: -1 } }
    ]);

    res.json(studentsWithStats);
  } catch (err) {
    console.error("GET STUDENTS ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= EXPORT STUDENTS PDF =================
exports.exportStudentsPDF = async (req, res) => {
  try {
    // ✅ OPTIMIZED: Use the same fast aggregation pipeline for exports
    const studentsWithStats = await Student.aggregate([
      {
        $lookup: {
          from: "results",
          localField: "email",
          foreignField: "studentEmail",
          as: "studentResults"
        }
      },
      {
        $addFields: {
          tests: { $size: "$studentResults" },
          avg: {
            $cond: {
              if: { $gt: [{ $size: "$studentResults" }, 0] },
              then: { $round: [{ $avg: "$studentResults.percentage" }, 0] },
              else: 0
            }
          }
        }
      },
      { $project: { studentResults: 0, password: 0 } },
      { $sort: { createdAt: -1 } }
    ]);

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="students_list.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text("Registered Students Report", { align: "center" });
    doc.moveDown();

    studentsWithStats.forEach((student, i) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
      doc.fontSize(14).fillColor('#1e3a8a').text(`${i + 1}. ${student.name}`, { continued: false });
      doc.fontSize(12).fillColor('black').text(`Email: ${student.email}`);
      doc.text(`Tests Taken: ${student.tests}`);
      doc.fillColor(student.avg >= 50 ? 'green' : 'red').text(`Average Score: ${student.avg}%`);
      doc.fillColor('black').text(`Registered: ${new Date(student.createdAt).toLocaleDateString()}`);
      doc.moveDown();
      doc.moveTo(30, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);
    res.status(500).json({ msg: "PDF export failed ❌" });
  }
};

// ================= EXPORT STUDENTS EXCEL =================
exports.exportStudentsExcel = async (req, res) => {
  try {
    // ✅ OPTIMIZED: Use the same fast aggregation pipeline for exports
    const studentsWithStats = await Student.aggregate([
      {
        $lookup: {
          from: "results",
          localField: "email",
          foreignField: "studentEmail",
          as: "studentResults"
        }
      },
      {
        $addFields: {
          tests: { $size: "$studentResults" },
          avg: {
            $cond: {
              if: { $gt: [{ $size: "$studentResults" }, 0] },
              then: { $round: [{ $avg: "$studentResults.percentage" }, 0] },
              else: 0
            }
          }
        }
      },
      { $project: { studentResults: 0, password: 0 } },
      { $sort: { createdAt: -1 } }
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students", {
      views: [{ showGridLines: false }]
    });

    // --- TITLE ---
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = "Registered Students Report";
    titleCell.style = { font: { size: 16, bold: true, color: { argb: 'FF1E3A8A' } }, alignment: { vertical: 'middle', horizontal: 'center' } };
    worksheet.getRow(1).height = 30;

    worksheet.addRow([]); // Empty row for spacing

    // --- HEADERS ---
    const headers = ["Name", "Email", "Tests Taken", "Average Score", "Registered Date"];
    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell) => {
      cell.style = { 
        font: { bold: true, color: { argb: 'FFFFFFFF' } }, 
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }, 
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      };
    });

    // --- DATA ---
    studentsWithStats.forEach(student => {
      const row = worksheet.addRow([
        student.name,
        student.email,
        student.tests,
        `${student.avg}%`,
        new Date(student.createdAt).toLocaleDateString()
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber >= 3) {
          cell.alignment = { horizontal: 'center' };
        }
        if (colNumber === 4) {
          cell.font = { color: { argb: student.avg >= 50 ? 'FF16A34A' : 'FFDC2626' }, bold: true };
        }
      });
    });

    // --- AUTO-FIT COLUMNS ---
    worksheet.columns = [
      { width: 30 },
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 20 }
    ];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="students_list.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("EXCEL EXPORT ERROR:", err);
    res.status(500).json({ msg: "Excel export failed ❌" });
  }
};

// ================= GET SINGLE STUDENT =================
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-password");

    if (!student) {
      return res.status(404).json({ msg: "Student not found ❌" });
    }

    res.json(student);
  } catch (err) {
    console.error("GET STUDENT ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= GET MY PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    res.json(student);
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= UPDATE PROFILE =================
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found ❌" });
    }

    student.name = name || student.name;
    student.email = email || student.email;

    await student.save();

    res.json({
      msg: "Profile updated ✅",
      student,
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= DELETE STUDENT (ADMIN) =================
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: "Student not found ❌" });
    }

    // 🔥 ALSO DELETE ALL RESULTS OF THAT STUDENT
    await Result.deleteMany({
      studentEmail: student.email
    });

    await student.deleteOne();

    res.json({
      msg: "Student & related results deleted ✅"
    });

  } catch (err) {
    console.error("DELETE STUDENT ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= STUDENT DASHBOARD =================
exports.getStudentDashboard = async (req, res) => {
  try {
    const results = await Result.find({
      studentEmail: req.user.email,
      isPublished: { $ne: false }
    });

    const totalTests = results.length;

    const avgScore =
      totalTests > 0
        ? Math.round(
            results.reduce((acc, r) => acc + r.percentage, 0) / totalTests
          )
        : 0;

    res.json({
      totalTests,
      avgScore,
      results,
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};