const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Test = require("../models/Test");
const Result = require("../models/Result");
const nodemailer = require("nodemailer");
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

// Helper to get image buffer from URL
const getImageBuffer = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 8000 }, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume(); // Free up memory if the request fails
        return reject(new Error(`Status Code: ${response.statusCode}`));
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Image fetch timeout'));
    });
    request.on('error', (err) => reject(err));
  });
};

// Helper Function: Calculate dynamic percentile ranking
const getPercentileData = async (testId, score) => {
  if (!testId) return { percentileRank: 'N/A', totalParticipants: 0 };
  const totalParticipants = await Result.countDocuments({ testId });
  const belowOrEqual = await Result.countDocuments({ testId, score: { $lte: score } });
  const percentileRank = totalParticipants > 0 ? Math.round((belowOrEqual / totalParticipants) * 100) : 100;
  return { percentileRank, totalParticipants };
};

// Helper Function: Get SVG path for pie chart slice
const getPieSlice = (cx, cy, r, startAngle, endAngle) => {
  const start = (startAngle - 90) * Math.PI / 180;
  const end = (endAngle - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  if (endAngle - startAngle >= 360) {
    return `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

// Helper Function: Convert HTML to Plain Text while preserving Math scripts
const htmlToPlainText = (html) => {
  if (!html) return "";
  let text = html.toString();
  
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
  };
  text = text.replace(/<sup[^>]*>(.*?)<\/sup>/gi, (match, p1) => {
    return p1.replace(/<[^>]+>/g, '').split('').map(c => superscripts[c] || c).join('');
  });

  const subscripts = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
  };
  text = text.replace(/<sub[^>]*>(.*?)<\/sub>/gi, (match, p1) => {
    return p1.replace(/<[^>]+>/g, '').split('').map(c => subscripts[c] || c).join('');
  });

  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  
  text = text.replace(/<[^>]+>/g, '');
  
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  text = text.replace(/\n\s*\n/g, '\n').trim();
  
  return text;
};

// Helper: Language Fallback logic
const getLangText = (textEng, textHin, language) => {
  const isHinEmpty = !textHin || textHin === '<p><br></p>' || textHin.trim() === '';
  return language === 'hindi' && !isHinEmpty ? textHin : (textEng || "");
};

const getLangOptions = (optEng, optHin, language) => {
  const isHinEmpty = !optHin || !optHin.A || optHin.A === '<p><br></p>' || optHin.A.trim() === '';
  return language === 'hindi' && !isHinEmpty ? optHin : (optEng || null);
};

// ✅ HELPER: Auto-Detect and Apply Devanagari Font Safely
const applyDevanagariFont = (doc) => {
  try {
    const possiblePaths = [
      path.join(__dirname, '../fonts/NotoSansDevanagari-Regular.ttf'),
      path.join(__dirname, '../fonts/Noto_Sans_Devanagari/NotoSansDevanagari-Regular.ttf'),
      path.join(__dirname, '../fonts/Noto_Sans_Devanagari/static/NotoSansDevanagari-Regular.ttf'),
      path.join(__dirname, '../fonts/NotoSansDevanagari.ttf')
    ];
    for (const fontPath of possiblePaths) {
      if (fs.existsSync(fontPath)) {
        doc.registerFont('Devanagari', fontPath);
        doc.font('Devanagari');
        return true;
      }
    }
  } catch (err) {}
  return false;
};

// ================= SUBMIT RESULT =================
exports.submitResult = async (req, res) => {
  try {
    const {
      testId,
      answers,
      studentName,
      studentEmail,
      studentFields,
      studentPhone,
      studentRoll,
      violations
    } = req.body;

    console.log("BODY:", req.body);

    // ================= VALIDATION =================
    if (!testId || !answers) {
      return res.status(400).json({
        msg: "Test ID and answers required ❌"
      });
    }

    if (!studentEmail) {
      return res.status(400).json({
        msg: "Student Email required ❌"
      });
    }

    // ================= FIND TEST =================
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        msg: "Test not found ❌"
      });
    }

    // ================= PREVENT REATTEMPT =================
    const existing = await Result.findOne({
      testId: test._id,
      studentEmail
    });

    if (existing) {
      return res.status(400).json({
        msg: "Already attempted ❌"
      });
    }

    // ================= SCORE CALC =================
    let sectionResults = [];   
    let score = 0;
    let totalQuestions = 0;
    let writtenAnswers = [];
    let totalMarks = 0;

    (test.sections || []).forEach((section, secIndex) => {

    let sectionScore = 0;
    let sectionTotal = 0;

    let sectionCorrect = 0;
    let sectionWrong = 0;
    let sectionTotalMCQ = 0;
    let sectionWritten = 0;

  const qs = section.questions || [];

qs.forEach((q, qIndex) => {

  // ✅ SKIP WRITTEN QUESTIONS
  if (q.type === "written") {
    sectionWritten++;

  const key = `${secIndex}-${qIndex}`;

  writtenAnswers.push({

    section: section.name,

    question: q.q,

    answer: answers[key] || "Not Answered"

  });

  return;
}

  const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (test.marksCorrect || 4);
  const qMarksNegative = q.marksNegative !== undefined && q.marksNegative !== null ? q.marksNegative : (test.marksNegative || 1);

  sectionTotalMCQ++;
  totalQuestions++;

  sectionTotal += qMarksCorrect;
  totalMarks += qMarksCorrect;

  const key = `${secIndex}-${qIndex}`;

  const ans = answers[key];

  // ✅ unanswered = no negative
  if (!ans) return;

  // ✅ correct answer
  if (ans === q.correct) {

    score += qMarksCorrect;

    sectionScore += qMarksCorrect;

    sectionCorrect++;

  }

  // ✅ wrong answer
  else {

    score -= qMarksNegative;

    sectionScore -= qMarksNegative;

    sectionWrong++;

  }

});

if (qs.length === 0) return; // Don't add empty sections to results

sectionResults.push({

  sectionName: section.name,

  correct: sectionCorrect,

  wrong: sectionWrong,

  total: sectionTotalMCQ,

  score: sectionScore,
  totalMarks: sectionTotal,
  written: sectionWritten

});

});

    // ================= TOTAL =================
    const percentage =
      totalMarks > 0
        ? Math.round((score / totalMarks) * 100)
        : 0;


    // ================= SAVE RESULT =================
  const result = await Result.create({

  testId: test._id,

  testName: test.title,

  studentName:
    studentName ||
    studentFields?.name ||
    "",

  studentEmail:
    studentEmail ||
    studentFields?.email ||
    "",

  studentPhone:
    studentPhone ||
    studentFields?.phone ||
    "",

  studentRoll:
    studentRoll ||
    studentFields?.rollno ||
    "",

  studentFields,

  answers,

  score,

  total: totalMarks,

  percentage,

  sectionResults,

  writtenAnswers,
  violations,
  isPublished: true

});

    res.status(201).json(result);

  } catch (err) {
    console.error("RESULT ERROR:", err);

    res.status(500).json({
      msg: "Server Error ❌",
      error: err.message
    });
  }
};



// ================= GET ALL RESULTS =================
exports.getAllResults = async (req, res) => {
  try {
    const { testId } = req.query;

    let filter = {};
    if (testId) filter.testId = testId;

    const results = await Result.find(filter)
      .populate("testId", "title marksCorrect marksNegative") // ✅ IMPORTANT
      .sort({ createdAt: -1 })
      .lean(); // ✅ Bypasses Mongoose strict schema filtering to show new fields

    res.json(results);

  } catch (err) {
    console.error("GET RESULTS ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};


// ================= GET RESULT BY ID =================
exports.getResultById = async (req, res) => {
  try {
    // ✅ Secure Workaround: Allows students to download PDF/Excel directly through the view route
    if (req.query.export === 'pdf') {
      return exports.exportStudentPDF(req, res);
    }
    if (req.query.export === 'excel') {
      return exports.exportStudentExcel(req, res);
    }

    const result = await Result.findById(req.params.id)
      .populate("testId")
      .lean(); // ✅ Bypasses Mongoose strict schema filtering to show new fields

    if (!result) {
      return res.status(404).json({
        msg: "Result not found ❌"
      });
    }
    
    // Dynamically calculate percentile
    if (result.testId) {
      const { percentileRank, totalParticipants } = await getPercentileData(result.testId._id, result.score);
      result.percentileRank = percentileRank;
      result.totalParticipants = totalParticipants;
    }

    res.json(result);

  } catch (err) {
    console.error("GET RESULT ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};


// ================= DELETE RESULT =================
exports.deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        msg: "Result not found ❌"
      });
    }

    res.json({
      msg: "Result deleted successfully ✅"
    });

  } catch (err) {
    console.error("DELETE RESULT ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};


// ================= GET MY RESULTS =================
exports.getMyResults = async (req, res) => {
  try {
    const results = await Result.find({
      studentEmail: req.user?.email,
      isPublished: { $ne: false }
    })
      .populate("testId", "title")
      .sort({ createdAt: -1 });

    res.json(results);

  } catch (err) {
    console.error("MY RESULTS ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};


// ================= GET TEST LIST FROM RESULTS =================
exports.getTestsFromResults = async (req, res) => {
  try {
    const results = await Result.find();

    const testIds = results
      .map(r => r.testId)
      .filter(Boolean);

    const uniqueIds = [...new Set(testIds.map(id => id.toString()))];

    const tests = await Test.find({
      _id: { $in: uniqueIds }
    });

    res.json(tests);

  } catch (err) {
    console.error("TEST LIST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};
// ================= EXPORT PDF =================
exports.exportPDF = async (req, res) => {

  try {

    const filter = {};

if (
  req.query.test &&
  req.query.test !== "all"
) {
  filter.testName = req.query.test;
}

const results = await Result.find(filter)
      .populate("testId", "title marksCorrect marksNegative")
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30 });

    // ✅ SAFE LOCAL FONT LOADING
    applyDevanagariFont(doc);

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=results.pdf"
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .text("Student Results Report", {
        align: "center"
      });

    doc.moveDown();

    results.forEach((r, i) => {

      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${r.studentName}`
        );

      doc.text(`Email: ${r.studentEmail}`);

      doc.text(
        `Test: ${r.testId?.title || r.testName}`
      );

      doc.text(
        `Score: ${r.score}/${r.total}`
      );

      doc.text(
        `Percentage: ${r.percentage}%`
      );

      if (r.sectionResults && r.sectionResults.length > 0) {
        const secText = r.sectionResults.map(s => {
          const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
          const maxMarks = s.totalMarks || (s.total * (r.testId?.marksCorrect || 4));
          const unattempted = Math.max(0, (s.total || 0) - (s.correct || 0) - (s.wrong || 0));
          return `${s.sectionName} - Score: ${s.score}/${maxMarks} (${pct}%) [C:${s.correct}, W:${s.wrong}, U:${unattempted}]` + (s.written ? `, ${s.written} Written` : "");
        }).join("\n  ");
        doc.fontSize(10).text(`Section Details:\n  ${secText}`);
        doc.fontSize(12);
      }

      doc.text(
        `Date: ${new Date(
          r.createdAt
        ).toLocaleDateString()}`
      );

      // ✅ Explicit Primary Fields
      const course = r.studentFields?.course || r.studentFields?.Course || r.studentFields?.class || r.studentFields?.Class;
      const branch = r.studentFields?.branch || r.studentFields?.Branch;
      const section = r.studentFields?.section || r.studentFields?.Section;

      if (course) doc.text(`Course: ${course}`);
      if (branch) doc.text(`Branch: ${branch}`);
      if (section) doc.text(`Section: ${section}`);

      // Include dynamically any other fields
      const customFieldsArr = Object.entries(r.studentFields || {})
        .filter(([k]) => !['name', 'email', 'phone', 'roll', 'rollno', 'roll no', 'course', 'class', 'branch', 'section'].includes(k.toLowerCase()))
        .map(([k, v]) => `${k}: ${v}`);
      if (customFieldsArr.length > 0) {
        doc.text(`Other Info: ${customFieldsArr.join(" | ")}`);
      }

      doc.text(`Tab Switches: ${r.violations?.tabSwitches || 0}`);

      doc.moveDown();

    });

    doc.end();

  } catch (err) {

    console.error("PDF EXPORT ERROR:", err);

    res.status(500).json({
      msg: "PDF export failed ❌"
    });

  }

};
// ================= EXPORT EXCEL =================
exports.exportExcel = async (req, res) => {

  try {

    const workbook = new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet("Results");

    const columns = [

      {
        header: "Student Name",
        key: "studentName",
        width: 25
      },

      {
        header: "Email",
        key: "studentEmail",
        width: 30
      },

      {
        header: "Roll",
        key: "studentRoll",
        width: 15
      },

      {
        header: "Phone",
        key: "studentPhone",
        width: 20
      }

    ];

    const filter = {};

if (
  req.query.test &&
  req.query.test !== "all"
) {
  filter.testName = req.query.test;
}

const results = await Result.find(filter)
      .populate("testId", "title marksCorrect marksNegative")
      .sort({ createdAt: -1 });

    const hasCourse = results.some(r => r.studentFields?.course || r.studentFields?.Course || r.studentFields?.class || r.studentFields?.Class);
    const hasBranch = results.some(r => r.studentFields?.branch || r.studentFields?.Branch);
    const hasSection = results.some(r => r.studentFields?.section || r.studentFields?.Section);

    if (hasCourse) columns.push({ header: "Course/Class", key: "course", width: 15 });
    if (hasBranch) columns.push({ header: "Branch", key: "branch", width: 15 });
    if (hasSection) columns.push({ header: "Section", key: "section", width: 15 });

    let dynamicFields = new Set();
    results.forEach(r => {
      if (r.studentFields) {
        Object.keys(r.studentFields).forEach(k => {
          if (!['name', 'email', 'phone', 'roll', 'rollno', 'roll no', 'course', 'class', 'branch', 'section'].includes(k.toLowerCase())) {
            dynamicFields.add(k);
          }
        });
      }
    });

    dynamicFields.forEach(field => {
      columns.push({ header: field, key: `custom_${field}`, width: 20 });
    });

    columns.push(
      { header: "Test", key: "testName", width: 30 },
      { header: "Score", key: "score", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
      { header: "Total MCQs", key: "totalMCQs", width: 15 },
      { header: "Correct", key: "correct", width: 15 },
      { header: "Wrong", key: "wrong", width: 15 },
      { header: "Unattempted", key: "unattempted", width: 15 },
      { header: "Section Details", key: "sectionResults", width: 80 },
      { header: "Tab Switches", key: "tabSwitches", width: 15 },
      { header: "Date", key: "date", width: 20 }
    );

    worksheet.columns = columns;

    results.forEach((r) => {
      const totalCorrect = r.sectionResults?.reduce((acc, sec) => acc + (sec.correct || 0), 0) || 0;
      const totalWrong = r.sectionResults?.reduce((acc, sec) => acc + (sec.wrong || 0), 0) || 0;
      const totalMCQs = r.sectionResults?.reduce((acc, sec) => acc + (sec.total || 0), 0) || 0;
      const unattempted = Math.max(0, totalMCQs - totalCorrect - totalWrong);

      let rowData = {

        studentName: r.studentName,

        studentEmail: r.studentEmail,

        studentRoll: r.studentRoll,

        studentPhone: r.studentPhone,

        course: r.studentFields?.course || r.studentFields?.Course || r.studentFields?.class || r.studentFields?.Class || "N/A",
        branch: r.studentFields?.branch || r.studentFields?.Branch || "N/A",
        section: r.studentFields?.section || r.studentFields?.Section || "N/A",

        testName:
          r.testId?.title || r.testName,

        score: `${r.score}/${r.total}`,

        percentage: `${r.percentage}%`,

        totalMCQs: totalMCQs,
        correct: totalCorrect,
        wrong: totalWrong,
        unattempted: unattempted,

        sectionResults: r.sectionResults && r.sectionResults.length > 0 ? r.sectionResults.map(s => {
            const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            const maxMarks = s.totalMarks || (s.total * (r.testId?.marksCorrect || 4));
            const secUnattempted = Math.max(0, (s.total || 0) - (s.correct || 0) - (s.wrong || 0));
            return `${s.sectionName} - Score: ${s.score}/${maxMarks} (${pct}%) [C:${s.correct}, W:${s.wrong}, U:${secUnattempted}]` + (s.written ? ` | ${s.written} Written` : "");
        }).join("  ||  ") : "N/A",

        tabSwitches: r.violations?.tabSwitches || 0,

        date: new Date(
          r.createdAt
        ).toLocaleDateString()

      };

      dynamicFields.forEach(field => {
        rowData[`custom_${field}`] = r.studentFields?.[field] || "N/A";
      });

      worksheet.addRow(rowData);

    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=results.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    console.error(
      "EXCEL EXPORT ERROR:",
      err
    );

    res.status(500).json({
      msg: "Excel export failed ❌"
    });

  }

};
exports.exportStudentPDF = async (req, res) => {

  try {

    const result = await Result.findById(
      req.params.id
    );

    if (!result) {

      return res.status(404).json({
        msg: "Result not found"
      });

    }

    let test = null;
    if (result.testId) {
      test = await Test.findById(result.testId);
    }

    const doc = new PDFDocument();

    // ✅ SAFE LOCAL FONT LOADING
    applyDevanagariFont(doc);

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="student_result.pdf"`
    );

    doc.pipe(res);

    const checkPageBreak = (doc, requiredHeight) => {
      if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    };

    // ================= HEADER =================

    doc
      .fontSize(24)
      .text("Student Result Report", {
        align: "center"
      });

    doc.moveDown();

    // ================= STUDENT INFO =================

    doc.fontSize(14);

    doc.text(
      `Student Name: ${result.studentName}`
    );

    doc.text(
      `Email: ${result.studentEmail}`
    );

    doc.text(
      `Roll Number: ${result.studentRoll}`
    );

    doc.text(
      `Phone: ${result.studentPhone}`
    );

    doc.text(
      `Test Name: ${result.testName}`
    );

    doc.text(
      `Score: ${result.score} / ${result.total}`
    );

    doc.text(
      `Percentage: ${result.percentage}%`
    );
    const { percentileRank, totalParticipants } = await getPercentileData(result.testId, result.score);
    doc.text(`Percentile Rank: ${percentileRank}% (Out of ${totalParticipants} Students)`);

    doc.moveDown();

    // ================= PRIMARY STUDENT DETAILS =================
    const course = result.studentFields?.course || result.studentFields?.Course || result.studentFields?.class || result.studentFields?.Class;
    const branch = result.studentFields?.branch || result.studentFields?.Branch;
    const section = result.studentFields?.section || result.studentFields?.Section;

    if (course) doc.text(`Course: ${course}`);
    if (branch) doc.text(`Branch: ${branch}`);
    if (section) doc.text(`Section: ${section}`);
    if (course || branch || section) doc.moveDown();

    Object.entries(result.studentFields || {}).forEach(([k, v]) => {
      if (!['name', 'email', 'phone', 'roll', 'rollno', 'roll no', 'course', 'class', 'branch', 'section'].includes(k.toLowerCase())) {
        doc.text(`${k}: ${v}`);
      }
    });
    if (Object.keys(result.studentFields || {}).length > 0) doc.moveDown();

    // ================= PERFORMANCE OVERVIEW =================
    const totalCorrect = result.sectionResults?.reduce((acc, sec) => acc + (sec.correct || 0), 0) || 0;
    const totalWrong = result.sectionResults?.reduce((acc, sec) => acc + (sec.wrong || 0), 0) || 0;
    const totalMCQs = result.sectionResults?.reduce((acc, sec) => acc + (sec.total || 0), 0) || 0;
    const unattempted = Math.max(0, totalMCQs - totalCorrect - totalWrong);
    const totalWritten = result.sectionResults?.reduce((acc, sec) => acc + (sec.written || 0), 0) || 0;
    const totalQuestions = totalMCQs + totalWritten;

    if (totalQuestions > 0) {
      checkPageBreak(doc, 150);
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('black').text("Performance Overview", { underline: true });
      doc.moveDown(0.5);

      const cx = doc.page.margins.left + 40;
      let cy = doc.y + 40;
      const radius = 40;

      let currentAngle = 0;
      const drawSlice = (val, color) => {
        if (val > 0) {
          const sliceAngle = (val / totalQuestions) * 360;
          doc.path(getPieSlice(cx, cy, radius, currentAngle, currentAngle + sliceAngle)).fill(color);
          currentAngle += sliceAngle;
        }
      };

      drawSlice(totalCorrect, '#16a34a');
      drawSlice(totalWrong, '#dc2626');
      drawSlice(unattempted, '#cbd5e1');
      drawSlice(totalWritten, '#f59e0b');
      
      // Legends
      const legendX = cx + radius + 30;
      let legendY = cy - 20;
      
      doc.rect(legendX, legendY, 12, 12).fill('#16a34a');
      doc.fillColor('black').fontSize(12).text(`Correct: ${totalCorrect} (${((totalCorrect/totalQuestions)*100).toFixed(1)}%)`, legendX + 20, legendY - 1);
      
      legendY += 20;
      doc.rect(legendX, legendY, 12, 12).fill('#dc2626');
      doc.fillColor('black').text(`Wrong: ${totalWrong} (${((totalWrong/totalQuestions)*100).toFixed(1)}%)`, legendX + 20, legendY - 1);
      
      legendY += 20;
      doc.rect(legendX, legendY, 12, 12).fill('#cbd5e1');
      doc.fillColor('black').text(`Unattempted: ${unattempted} (${((unattempted/totalQuestions)*100).toFixed(1)}%)`, legendX + 20, legendY - 1);
      
      if (totalWritten > 0) {
        legendY += 20;
        doc.rect(legendX, legendY, 12, 12).fill('#f59e0b');
        doc.fillColor('black').text(`Written: ${totalWritten} (${((totalWritten/totalQuestions)*100).toFixed(1)}%)`, legendX + 20, legendY - 1);
      }
      
      doc.y = cy + radius + 20;
      doc.moveDown();
    }

    // Reset doc.x to left margin to ensure the next text is properly aligned
    doc.x = doc.page.margins.left;

    // ================= SECURITY REPORT =================
    if (result.violations) {
      doc
        .fontSize(18)
        .fillColor('black')
        .text("Security & Monitoring Report");
      doc.moveDown();

      doc.fontSize(14);
      doc.text(`Submission Reason: ${result.violations.reason || "Normal Submission"}`);
      doc.text(`Tab Switches: ${result.violations.tabSwitches || 0} Times`);
      doc.text(`Window Minimized (Alt+Tab): ${result.violations.windowBlurs || 0} Times`);
      doc.text(`Camera Violations: ${result.violations.cameraViolations || 0} Times`);
      doc.text(`Illegal Scrolls: ${result.violations.scrolls || 0} Times`);
      
      if (result.violations.noiseViolations !== undefined) {
        doc.text(`Mic/Noise Violations: ${result.violations.noiseViolations} Times`);
      }
      doc.moveDown();
    }

    // ================= SECTION DETAILS =================

    if (result.sectionResults?.length) {
      checkPageBreak(doc, 60);
      doc
        .fontSize(18)
        .fillColor('black')
        .text("Section Performance");

      doc.moveDown();

      result.sectionResults.forEach(
        (section, index) => {
          checkPageBreak(doc, 100);
          doc.fontSize(14).fillColor('black');

          const secPct = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;

          doc.text(`${index + 1}. ${section.sectionName} (${secPct}%)`);

          if (section.total > 0 || section.written > 0) {
            const secUnattempted = Math.max(0, (section.total || 0) - (section.correct || 0) - (section.wrong || 0));
            const secWritten = section.written || 0;
            const secTotal = (section.total || 0) + secWritten;
            
            const cx = 80;
            let cy = doc.y + 35;
            const radius = 30;
            
            let currentAngle = 0;
            const drawSlice = (val, color) => {
              if (val > 0) {
                const sliceAngle = (val / secTotal) * 360;
                doc.path(getPieSlice(cx, cy, radius, currentAngle, currentAngle + sliceAngle)).fill(color);
                currentAngle += sliceAngle;
              }
            };

            drawSlice(section.correct, '#16a34a');
            drawSlice(section.wrong, '#dc2626');
            drawSlice(secUnattempted, '#cbd5e1');
            drawSlice(secWritten, '#f59e0b');

            // Legends
            const legendX = cx + radius + 30;
            let legendY = cy - 15;
            
            doc.rect(legendX, legendY, 10, 10).fill('#16a34a');
            doc.fillColor('black').fontSize(10).text(`Correct: ${section.correct}`, legendX + 15, legendY - 1);
            
            legendY += 15;
            doc.rect(legendX, legendY, 10, 10).fill('#dc2626');
            doc.fillColor('black').text(`Wrong: ${section.wrong}`, legendX + 15, legendY - 1);
            
            legendY += 15;
            doc.rect(legendX, legendY, 10, 10).fill('#cbd5e1');
            doc.fillColor('black').text(`Unattempted: ${secUnattempted}`, legendX + 15, legendY - 1);
            
            if (secWritten > 0) {
              legendY += 15;
              doc.rect(legendX, legendY, 10, 10).fill('#f59e0b');
              doc.fillColor('black').text(`Written: ${secWritten}`, legendX + 15, legendY - 1);
            }

            const maxMarks = section.totalMarks || (section.total * (test?.marksCorrect || 4));
            doc.y = cy + radius + 15;
            doc.x = doc.page.margins.left;
            doc.fontSize(12).fillColor('black').text(`Score: ${section.score} / ${maxMarks}`, doc.x, doc.y);
            doc.moveDown(1);
          } else {
              doc.fontSize(12);
              const maxMarks = section.totalMarks || (section.total * (test?.marksCorrect || 4));
              doc.text(`Score: ${section.score} / ${maxMarks}`);
              if (section.written > 0) {
                doc.text(`Written Qs: ${section.written}`);
              }
              doc.moveDown();
          }

        }
      );

    }

    // ================= WRITTEN ANSWERS =================

    if (result.writtenAnswers?.length) {

      doc
        .fontSize(18)
        .text("Written Answers");

      doc.moveDown();

      for (let index = 0; index < result.writtenAnswers.length; index++) {
        const q = result.writtenAnswers[index];

          const language = result.studentFields?.language || "english";
          let qText = q.question; // fallback

          let qImage = null;
          if (test && test.sections) {
            for (const sec of test.sections) {
              const found = (sec.questions || []).find(sq => sq.type === 'written' && sq.q === q.question);
              if (found) {
                qText = getLangText(found.q, found.qHindi, language);
                if (found.questionImage) qImage = found.questionImage;
                break;
              }
            }
          }

          doc.fontSize(14);

          doc.text(
            `Q${index + 1}: ${htmlToPlainText(qText)}`
          );

          if (qImage) {
            try {
              let imgBuffer;
              if (qImage.startsWith('data:image')) {
                const base64Data = qImage.replace(/^data:image\/\w+;base64,/, "");
                imgBuffer = Buffer.from(base64Data, 'base64');
              } else {
                imgBuffer = await getImageBuffer(qImage);
              }
              checkPageBreak(doc, 220); // Prevents image from overlapping page bottom
              doc.moveDown(0.5);
              doc.image(imgBuffer, { fit: [300, 200] });
              doc.moveDown(0.5);
            } catch (imgErr) {
              console.error("PDF Image Error:", imgErr);
              doc.fillColor('gray').fontSize(10).text('[Image could not be loaded]');
              doc.fontSize(14).fillColor('black');
            }
          }

          doc.text(
            `Answer: ${q.answer}`
          );

          doc.moveDown();

      }

    }

    // ================= DETAILED MCQ ANSWERS =================
    if (test && test.sections) {
      doc.addPage();
      doc.fontSize(18).fillColor('black').text("Detailed Answers Report", { align: "center" });
      doc.moveDown();

      for (let secIndex = 0; secIndex < test.sections.length; secIndex++) {
        const sec = test.sections[secIndex];
        const mcqs = (sec.questions || []).filter(q => q.type !== 'written');
        
        if (mcqs.length > 0) {
          doc.fontSize(14).fillColor('black').text(`Section: ${sec.name}`, { underline: true });
          doc.moveDown(0.5);

          for (let qIndex = 0; qIndex < (sec.questions || []).length; qIndex++) {
            const q = sec.questions[qIndex];
            if (q.type === 'written') continue;
            
            const key = `${secIndex}-${qIndex}`;
            const chosen = result.answers ? result.answers[key] : null;
            const isCorrect = chosen === q.correct;

            const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (test.marksCorrect || 4);
            const qMarksNegative = q.marksNegative !== undefined && q.marksNegative !== null ? q.marksNegative : (test.marksNegative || 1);

            const language = result.studentFields?.language || "english";
            const qText = getLangText(q.q, q.qHindi, language);
            const qOptions = getLangOptions(q.options, q.optionsHindi, language);

            doc.fontSize(12).fillColor('black').text(`Q: ${htmlToPlainText(qText)} [+${qMarksCorrect}, -${qMarksNegative}]`);

            if (q.questionImage) {
              try {
                let imgBuffer;
                if (q.questionImage.startsWith('data:image')) {
                  const base64Data = q.questionImage.replace(/^data:image\/\w+;base64,/, "");
                  imgBuffer = Buffer.from(base64Data, 'base64');
                } else {
                  imgBuffer = await getImageBuffer(q.questionImage);
                }
                checkPageBreak(doc, 220); // Prevents image from overlapping page bottom
                doc.moveDown(0.5);
                doc.image(imgBuffer, { fit: [300, 200] });
                doc.moveDown(0.5);
              } catch (imgErr) {
                console.error("PDF Image Error:", imgErr);
                doc.fillColor('gray').fontSize(10).text('[Image could not be loaded]');
                doc.fontSize(12).fillColor('black');
              }
            }

            if (qOptions) {
              doc.moveDown(0.3);
              Object.entries(qOptions).forEach(([k, v]) => {
                const plainTextV = htmlToPlainText(v);
                if (k === q.correct) {
                  doc.fillColor('green').text(`  ${k}. ${plainTextV} [Correct Answer]`);
                } else if (chosen === k && chosen !== q.correct) {
                  doc.fillColor('red').text(`  ${k}. ${plainTextV} [Your Answer]`);
                } else {
                  doc.fillColor('black').text(`  ${k}. ${plainTextV}`);
                }
              });
            }

            doc.moveDown(0.5);
            if (chosen) {
              doc.fillColor(isCorrect ? 'green' : 'red').text(`Your Answer: ${chosen} ${isCorrect ? '(Correct)' : '(Wrong)'}  |  Correct Answer: ${q.correct}`);
            } else {
              doc.fillColor('gray').text(`Your Answer: Not Attempted  |  Correct Answer: ${q.correct}`);
            }
            doc.moveDown(1);
          }
          doc.moveDown();
        }
      }
      doc.fillColor('black');
    }

    doc.end();

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "PDF Export Failed"
    });

  }

};
exports.exportStudentExcel = async (
  req,
  res
) => {

  try {

    const result = await Result.findById(
      req.params.id
    );

    if (!result) {

      return res.status(404).json({
        msg: "Result not found"
      });

    }

    // ✅ Fetch test to get questions for detailed answers
    let test = null;
    if (result.testId) {
      test = await Test.findById(result.testId);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Student Result", {
      views: [{ showGridLines: false }]
    });

    // --- STYLING ---
    const titleStyle = { font: { size: 18, bold: true, color: { argb: 'FF1E3A8A' } }, alignment: { vertical: 'middle', horizontal: 'center' } };
    const headerStyle = { font: { size: 12, bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }, alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
    const subHeaderStyle = { font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium', color: { argb: 'FF4472C4' } }, right: { style: 'thin' } }, alignment: { vertical: 'middle' } };
    const fieldStyle = { font: { bold: true }, border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } };
    const cellBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // --- TITLE ---
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = "Student Result Report";
    titleCell.style = titleStyle;
    sheet.getRow(1).height = 30;

    // --- PERFORMANCE OVERVIEW & PIE CHART ---
    const totalCorrect = result.sectionResults?.reduce((acc, sec) => acc + (sec.correct || 0), 0) || 0;
    const totalWrong = result.sectionResults?.reduce((acc, sec) => acc + (sec.wrong || 0), 0) || 0;
    const totalMCQs = result.sectionResults?.reduce((acc, sec) => acc + (sec.total || 0), 0) || 0;
    const unattempted = Math.max(0, totalMCQs - totalCorrect - totalWrong);
    const totalWritten = result.sectionResults?.reduce((acc, sec) => acc + (sec.written || 0), 0) || 0;
    const totalQuestions = totalMCQs + totalWritten;
    
    const pctCorrect = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const pctWrong = totalQuestions > 0 ? (totalWrong / totalQuestions) * 100 : 0;
    const pctUnattempted = totalQuestions > 0 ? (unattempted / totalQuestions) * 100 : 0;
    const pctWritten = totalQuestions > 0 ? (totalWritten / totalQuestions) * 100 : 0;

    let currentRow = 3;
    if (totalQuestions > 0) {
      const chartConfig = {
        type: 'pie',
        data: {
          labels: ['Correct', 'Wrong', 'Unattempted', 'Written'],
          datasets: [{ data: [totalCorrect, totalWrong, unattempted, totalWritten], backgroundColor: ['#16a34a', '#dc2626', '#cbd5e1', '#f59e0b'], borderWidth: 0 }]
        },
        options: { 
          legend: { display: false },
          plugins: { datalabels: { color: '#fff', font: { weight: 'bold', size: 14 } } },
          layout: { padding: 5 }
        }
      };
      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=300&height=300`;

      try {
        const imageBuffer = await getImageBuffer(chartUrl);
        const imageId = workbook.addImage({ buffer: imageBuffer, extension: 'png' });
        sheet.addImage(imageId, {
          tl: { col: 0.5, row: 2.5 },
          ext: { width: 180, height: 180 }
        });
      } catch (chartError) {
        console.error("Could not fetch chart image:", chartError);
        sheet.getCell('B6').value = "Chart could not be loaded.";
      }
    }

    // --- SUMMARY DATA (next to chart) ---
    sheet.mergeCells(`D${currentRow}:F${currentRow}`);
    sheet.getCell(`D${currentRow}`).value = "Overall Performance";
    sheet.getCell(`D${currentRow}`).style = { font: { bold: true, size: 14, color: { argb: 'FF1E3A8A' } }, border: { bottom: { style: 'thin' } } };
    currentRow += 1;

    const summaryData = [
      { label: "✅ Correct", value: `${totalCorrect} (${pctCorrect.toFixed(1)}%)`, color: 'FF16A34A' },
      { label: "❌ Wrong", value: `${totalWrong} (${pctWrong.toFixed(1)}%)`, color: 'FFDC2626' },
      { label: "⬜ Unattempted", value: `${unattempted} (${pctUnattempted.toFixed(1)}%)`, color: 'FF64748B' },
    ];
    
    if (totalWritten > 0) summaryData.push({ label: "📝 Written", value: `${totalWritten} (${pctWritten.toFixed(1)}%)`, color: 'FFF59E0B' });
    
    summaryData.push(
      { label: "Total Questions", value: totalQuestions, color: 'FF333333' },
      { label: "Final Score", value: `${result.score} / ${result.total}`, color: 'FF333333' },
      { label: "Percentage", value: `${result.percentage}%`, color: 'FF333333' },
    );

    summaryData.forEach(item => {
      sheet.mergeCells(`E${currentRow}:F${currentRow}`);
      sheet.getCell(`D${currentRow}`).value = item.label;
      sheet.getCell(`D${currentRow}`).style = { font: { bold: true, color: { argb: item.color } }, border: cellBorder };
      sheet.getCell(`E${currentRow}`).value = item.value;
      sheet.getCell(`E${currentRow}`).style = { font: { bold: true, color: { argb: item.color } }, border: cellBorder };
      sheet.getCell(`F${currentRow}`).border = cellBorder;
      currentRow++;
    });
    
    currentRow = 14; // Start student info after chart

    // --- STUDENT & TEST INFO ---
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = "Student & Test Information";
    sheet.getCell(`A${currentRow}`).style = subHeaderStyle;
    currentRow++;

    const { percentileRank, totalParticipants } = await getPercentileData(result.testId, result.score);
    const infoData = [
      { field: "Student Name", value: result.studentName }, { field: "Email", value: result.studentEmail },
      { field: "Roll", value: result.studentRoll }, { field: "Phone", value: result.studentPhone },
      { field: "Test", value: result.testName }, { field: "Percentile Rank", value: `${percentileRank}% (out of ${totalParticipants})` },
    ];

    const course = result.studentFields?.course || result.studentFields?.Course || result.studentFields?.class || result.studentFields?.Class;
    const branch = result.studentFields?.branch || result.studentFields?.Branch;
    const section = result.studentFields?.section || result.studentFields?.Section;

    if (course) infoData.push({ field: "Course", value: course });
    if (branch) infoData.push({ field: "Branch", value: branch });
    if (section) infoData.push({ field: "Section", value: section });

    if (result.studentFields) {
      Object.keys(result.studentFields).forEach(k => {
        if (!['name', 'email', 'phone', 'roll', 'rollno', 'roll no', 'course', 'class', 'branch', 'section'].includes(k.toLowerCase())) {
          infoData.push({ field: k, value: result.studentFields[k] });
        }
      });
    }

    infoData.forEach(item => {
      const row = sheet.addRow([item.field, item.value]);
      row.getCell(1).font = { bold: true };
      row.eachCell(c => c.border = cellBorder);
      currentRow++;
    });
    currentRow++;

    // --- SECTION RESULTS TABLE ---
    if (result.sectionResults?.length) {
      sheet.mergeCells(`A${currentRow}:H${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = "Section-wise Performance";
      sheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      currentRow++;

      const sectionTableHeaders = ["Section", "Accuracy", "Correct", "Wrong", "Unattempted", "Score", "Total MCQs", "Written Qs"];
      const sectionHeaderRow = sheet.getRow(currentRow);
      sectionTableHeaders.forEach((header, i) => {
        sectionHeaderRow.getCell(i + 1).value = header;
        sectionHeaderRow.getCell(i + 1).style = headerStyle;
      });
      currentRow++;

      result.sectionResults.forEach(
        section => {
          const secUnattempted = Math.max(0, (section.total || 0) - (section.correct || 0) - (section.wrong || 0));
          const secPct = section.total > 0 ? `${((section.correct / section.total) * 100).toFixed(1)}%` : "0%";
          const maxMarks = section.totalMarks || (section.total * (test?.marksCorrect || 4));
          const rowData = [section.sectionName, secPct, section.correct, section.wrong, secUnattempted, `${section.score} / ${maxMarks}`, section.total, section.written || 0];
          const dataRow = sheet.addRow(rowData);
          dataRow.eachCell(cell => cell.border = cellBorder);
          currentRow++;
        }
      );
      currentRow++;
    }

    // ================= DETAILED MCQ ANSWERS =================
    if (test && test.sections) {
      sheet.mergeCells(`A${currentRow}:F${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = "Detailed Answers Report";
      sheet.getCell(`A${currentRow}`).style = subHeaderStyle;
      currentRow++;

      const answerTableHeaders = ["Section", "Question", "Your Answer", "Correct Answer", "Status", "Question Image"];
      const answerHeaderRow = sheet.getRow(currentRow);
      answerTableHeaders.forEach((header, i) => {
        answerHeaderRow.getCell(i + 1).value = header;
        answerHeaderRow.getCell(i + 1).style = headerStyle;
      });
      currentRow++;

      for (let secIndex = 0; secIndex < test.sections.length; secIndex++) {
        const sec = test.sections[secIndex];
        for (let qIndex = 0; qIndex < (sec.questions || []).length; qIndex++) {
          const q = sec.questions[qIndex];
          const key = `${secIndex}-${qIndex}`;
          const chosen = result.answers ? result.answers[key] : null;
          let rowData;
          const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (test?.marksCorrect || 4);
          const qMarksNegative = q.marksNegative !== undefined && q.marksNegative !== null ? q.marksNegative : (test?.marksNegative || 1);

          const language = result.studentFields?.language || "english";
          const qText = getLangText(q.q, q.qHindi, language);
          const qOptions = getLangOptions(q.options, q.optionsHindi, language);

          if (q.type === 'written') {
            const writtenAnsObj = result.writtenAnswers?.find(wa => wa.question === q.q);
            const writtenAns = writtenAnsObj ? writtenAnsObj.answer : (chosen || 'Not Answered');
            rowData = [sec.name, `${htmlToPlainText(qText)} [+${qMarksCorrect}, -${qMarksNegative}]`, writtenAns, '(Written)', '(Manual Check)', ''];
          } else {
            const isCorrect = chosen === q.correct;
            const correctText = q.correct && qOptions ? `${q.correct}: ${htmlToPlainText(qOptions[q.correct])}` : 'N/A';
            const chosenText = chosen && qOptions ? `${chosen}: ${htmlToPlainText(qOptions[chosen])}` : 'Not Attempted';
            rowData = [sec.name, `${htmlToPlainText(qText)} [+${qMarksCorrect}, -${qMarksNegative}]`, chosenText, correctText, chosen ? (isCorrect ? 'Correct' : 'Wrong') : 'Unattempted', ''];
          }
          const dataRow = sheet.addRow(rowData);
          dataRow.eachCell((cell) => {
            cell.border = cellBorder;
            cell.alignment = { wrapText: true, vertical: 'middle' };
          });
          
          const statusCell = dataRow.getCell(5);
          if (statusCell.value === 'Correct') {
            statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
            for (let i = 1; i <= 6; i++) dataRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          } else if (statusCell.value === 'Wrong') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            for (let i = 1; i <= 6; i++) dataRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          } else if (statusCell.value === 'Unattempted') {
            statusCell.font = { color: { argb: 'FF64748B' }, bold: true };
            for (let i = 1; i <= 6; i++) dataRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          }

          if (q.questionImage) {
            try {
              let imgBuffer;
              if (q.questionImage.startsWith('data:image')) {
                const base64Data = q.questionImage.replace(/^data:image\/\w+;base64,/, "");
                imgBuffer = Buffer.from(base64Data, 'base64');
              } else {
                imgBuffer = await getImageBuffer(q.questionImage);
              }
              let ext = 'png';
              if (q.questionImage.includes('jpeg') || q.questionImage.includes('jpg')) ext = 'jpeg';
              const imageId = workbook.addImage({
                buffer: imgBuffer,
                extension: ext,
              });
              sheet.addImage(imageId, {
                tl: { col: 5.1, row: currentRow - 1 + 0.1 }, 
                ext: { width: 100, height: 100 }
              });
              dataRow.height = 80;
            } catch (err) {
              console.error(err);
              dataRow.getCell(6).value = "Image Error";
            }
          }

          currentRow++;
        }
      }
    }

    // --- AUTO-FIT COLUMNS ---
    sheet.columns.forEach((column, index) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        if (cell.row <= 14) return;
        let columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) maxLength = columnLength;
      });
      if (index === 0) column.width = 15;
      else if (index === 1) column.width = 40; 
      else if (index === 2) column.width = 30; 
      else if (index === 3) column.width = 30; 
      else if (index === 5) column.width = 15;
      else column.width = maxLength < 15 ? 15 : Math.min(maxLength + 2, 40);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="student_result.xlsx"`
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    console.log(err);

    res.status(500).json({
      msg: "Excel Export Failed"
    });

  }

};

// ================= HELPER: GENERATE COMPREHENSIVE EMAIL HTML =================
const generateEmailHTML = (result, test) => {
  const studentNameDisplay = result.studentName || result.studentFields?.name || 'Student';
  const studentEmailDisplay = result.studentEmail || result.studentFields?.email || '-';
  const studentRollDisplay = result.studentRoll || result.studentFields?.roll || result.studentFields?.rollno || '-';
  const studentPhoneDisplay = result.studentPhone || result.studentFields?.phone || result.studentFields?.Phone || result.studentFields?.phoneno || '-';

  let html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;">
      <h2 style="color: #1e3a8a; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-top: 0;">Exam Result Details</h2>
      <p style="font-size: 16px;">Hello <strong>${studentNameDisplay}</strong>,</p>
      <p style="font-size: 16px;">Here is the comprehensive report for your recent mock test.</p>
      
      <h3 style="background: #f1f5f9; padding: 12px; border-radius: 6px; color: #0f172a; margin-top: 25px;">📝 Test Information</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Student Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${studentNameDisplay}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Student Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${studentEmailDisplay}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Student Roll:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${studentRollDisplay}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Student Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${studentPhoneDisplay}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Test Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${result.testName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Score:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${result.score} / ${result.total}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Percentage:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${result.percentage}%</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Percentile Rank:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${result.percentileRank || 'N/A'}%</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Submission Reason:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${result.violations?.reason || 'Normal Submission'}</td></tr>
      </table>
  `;

  if (result.violations) {
    html += `
      <h3 style="background: #fef2f2; padding: 12px; border-radius: 6px; color: #991b1b;">🛡️ Security & Monitoring Report</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Tab Switches:</strong></td><td style="padding: 8px; border-bottom: 1px solid #fecaca; color: ${result.violations.tabSwitches > 0 ? 'red' : 'green'};">${result.violations.tabSwitches || 0} Times</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Window Minimized:</strong></td><td style="padding: 8px; border-bottom: 1px solid #fecaca; color: ${result.violations.windowBlurs > 0 ? 'red' : 'green'};">${result.violations.windowBlurs || 0} Times</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Camera Violations:</strong></td><td style="padding: 8px; border-bottom: 1px solid #fecaca; color: ${result.violations.cameraViolations > 0 ? 'red' : 'green'};">${result.violations.cameraViolations || 0} Times</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Illegal Scrolls:</strong></td><td style="padding: 8px; border-bottom: 1px solid #fecaca; color: ${result.violations.scrolls > 0 ? 'red' : 'green'};">${result.violations.scrolls || 0} Times</td></tr>
        ${result.violations.noiseViolations !== undefined ? `<tr><td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Mic / Noise Violations:</strong></td><td style="padding: 8px; border-bottom: 1px solid #fecaca; color: ${result.violations.noiseViolations > 0 ? 'red' : 'green'};">${result.violations.noiseViolations} Times</td></tr>` : ''}
      </table>
    `;
  }

  if (result.sectionResults && result.sectionResults.length > 0) {
    html += `
      <h3 style="background: #f0fdf4; padding: 12px; border-radius: 6px; color: #166534;">📊 Section Wise Result</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px;">
        <thead>
          <tr style="background: #e2e8f0; color: #334155;">
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Section</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Accuracy</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Correct</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Wrong</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Unattempted</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Score</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Total MCQs</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">Written Qs</th>
          </tr>
        </thead>
        <tbody>
    `;
    result.sectionResults.forEach(sec => {
      const secUnattempted = Math.max(0, (sec.total || 0) - (sec.correct || 0) - (sec.wrong || 0));
      const secPct = sec.total > 0 ? ((sec.correct / sec.total) * 100).toFixed(1) : 0;
      html += `
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.sectionName}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>${secPct}%</strong></td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.correct}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.wrong}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${secUnattempted}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.score} / ${sec.totalMarks || (sec.total * (test?.marksCorrect || 4))}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.total}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sec.written || 0}</td>
          </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  if (test && test.sections) {
    html += `<h3 style="background: #f8fafc; padding: 12px; border-radius: 6px; color: #0f172a; margin-top: 30px;">📖 Detailed Answers</h3>`;
    test.sections.forEach((sec, secIndex) => {
      const mcqQuestions = sec.questions.filter(q => q.type !== 'written');
      const writtenQuestions = sec.questions.filter(q => q.type === 'written');
      
      if (mcqQuestions.length > 0 || writtenQuestions.length > 0) {
        html += `<h4 style="color: #334155; margin-top: 25px; border-bottom: 2px solid #eef1f8; padding-bottom: 5px;">Section: ${sec.name}</h4>`;
      }

      sec.questions.forEach((q, qIndex) => {
        const key = `${secIndex}-${qIndex}`;
        const chosen = result.answers ? result.answers[key] : null;
        const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (test?.marksCorrect || 4);
        const qMarksNegative = q.marksNegative !== undefined && q.marksNegative !== null ? q.marksNegative : (test?.marksNegative || 1);
        
        const language = result.studentFields?.language || "english";
        const qText = getLangText(q.q, q.qHindi, language);
        const qOptions = getLangOptions(q.options, q.optionsHindi, language);

        if (q.type === 'written') {
           const writtenAns = result.writtenAnswers?.find(wa => wa.question === q.q)?.answer || chosen || 'Not Answered';
           html += `
            <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
              <div style="margin: 0 0 10px 0; font-size: 15px;"><strong>Q (Written):</strong> <div>${qText}</div> <span style="font-size: 12px; color: #64748b;">[+${qMarksCorrect}, -${qMarksNegative}]</span></div>
              ${q.questionImage ? `<img src="${q.questionImage}" alt="Question Image" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 10px;" />` : ''}
              <p style="margin: 5px 0; color: #475569;"><strong>Your Answer:</strong> ${writtenAns}</p>
            </div>
          `;
        } else {
          const isCorrect = chosen === q.correct;
          html += `
            <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
              <div style="margin: 0 0 10px 0; font-size: 15px;"><strong>Q:</strong> <div>${qText}</div> <span style="font-size: 12px; color: #64748b;">[+${qMarksCorrect}, -${qMarksNegative}]</span></div>
              ${q.questionImage ? `<img src="${q.questionImage}" alt="Question Image" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 10px;" />` : ''}
            </div>
          `;
          
          if (qOptions) {
            Object.entries(qOptions).forEach(([k, v]) => {
              let bgColor = "transparent";
              let color = "#334155";
              let fw = "normal";
              let border = "1px solid #e2e8f0";
              if (k === q.correct) {
                bgColor = "#dcfce7"; color = "#166534"; fw = "bold"; border = "1px solid #22c55e";
              } else if (chosen === k && chosen !== q.correct) {
                bgColor = "#fee2e2"; color = "#991b1b"; fw = "bold"; border = "1px solid #ef4444";
              }
            html += `<div style="padding: 8px 12px; margin: 4px 0; border-radius: 6px; background-color: ${bgColor}; color: ${color}; font-weight: ${fw}; border: ${border}; display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; gap: 8px; align-items: center;"><strong>${k}.</strong> <div style="margin: 0; padding: 0;">${(v || "").replace(/<p>/g, '<p style="margin: 0; display: inline;">')}</div></div><span>${k === q.correct ? "✅" : (chosen === k ? "❌" : "")}</span></div>`;
            });
          }

          html += `
              <p style="margin: 10px 0 0 0; color: ${chosen ? (isCorrect ? '#16a34a' : '#dc2626') : '#64748b'};">
                <strong>Your Answer:</strong> ${chosen || 'Not Attempted'}
              </p>
            </div>
          `;
        }
      });
    });
  } else if (result.writtenAnswers && result.writtenAnswers.length > 0) {
     html += `<h3 style="background: #f8fafc; padding: 12px; border-radius: 6px; color: #0f172a; margin-top: 30px;">📖 Written Answers</h3>`;
     result.writtenAnswers.forEach((q, index) => {
       html += `
          <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
            <div style="margin: 0 0 10px 0; font-size: 15px;"><strong>Q${index + 1}:</strong> <div>${q.question}</div></div>
            <p style="margin: 5px 0; color: #475569;"><strong>Your Answer:</strong> ${q.answer}</p>
          </div>
       `;
     });
  }

  html += `
      <p style="margin-top: 35px; font-size: 14px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        This is an automated performance report. Contact your administrator for detailed feedback.<br>
        <strong>Gurukul Success Classes</strong>
      </p>
    </div>
  `;
  return html;
};

// ================= SEND SINGLE EMAIL =================
exports.emailStudentResult = async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ msg: "Email credentials missing in Environment Variables ❌" });
    }

    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ msg: "Result not found" });
    
    let email = (result.studentEmail || "").toString().trim();
    if (!email || email.toLowerCase() === "guest@test.com") {
      if (result.studentFields) {
        const emailKey = Object.keys(result.studentFields).find(k => k.toLowerCase() === 'email');
        if (emailKey) {
          email = (result.studentFields[emailKey] || "").toString().trim();
        }
      }
    }

    if (!email || email.toLowerCase() === "guest@test.com" || !email.includes("@")) {
      return res.status(400).json({ msg: "No valid email address found for this student ❌" });
    }

    // Get percentile
    const { percentileRank } = await getPercentileData(result.testId, result.score);
    result.percentileRank = percentileRank;

    // Fetch Test data to include detailed Questions and Answers
    let test = null;
    if (result.testId) {
      test = await Test.findById(result.testId);
    }

    await transporter.sendMail({
      from: `"Gurukul Success Classes" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Comprehensive Exam Result: ${result.testName}`,
      html: generateEmailHTML(result, test),
    });
    
    // ✅ Save the success status to the database
    await Result.findByIdAndUpdate(req.params.id, {
      $set: { emailStatus: 'Sent', emailSentAt: new Date(), isPublished: true }
    }, { strict: false });

    res.json({ msg: "Result emailed successfully to the student! ✅" });
  } catch (err) {
    console.error("Email Error:", err);
    // ✅ Save the failure status to the database
    if (req.params.id) {
      try {
        await Result.findByIdAndUpdate(req.params.id, { $set: { emailStatus: 'Failed', emailError: err.message } }, { strict: false });
      } catch (dbErr) {
        console.error("DB update failed during email error:", dbErr);
      }
    }
    // 🚀 BUBBLE EXACT ERROR TO THE FRONTEND ALERT!
    res.status(500).json({ msg: `Failed to send email ❌: ${err.message}` });
  }
};

// ================= SEND BULK EMAILS =================
exports.emailAllResults = async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ msg: "Email credentials missing in Environment Variables ❌" });
    }

    const { testId, testName } = req.body;
    let filter = {};
    if (testId) filter.testId = testId;
    if (testName) filter.testName = testName;

    const results = await Result.find(Object.keys(filter).length > 0 ? filter : {});
    
    // ✅ Publish all filtered results
    await Result.updateMany(Object.keys(filter).length > 0 ? filter : {}, { $set: { isPublished: true } }, { strict: false });

    // ✅ Respond immediately so the browser request doesn't timeout!
    res.json({ msg: `Publish & Email process started for ${results.length} students! ✅ This is securely running in the background.` });

    // ✅ Process emails asynchronously in the background
    (async () => {
      let sentCount = 0;
      const testCache = {}; // Cache test data to avoid repeating DB calls for the same test

      for (const result of results) {
        let email = (result.studentEmail || "").toString().trim();
        if (!email || email.toLowerCase() === "guest@test.com") {
          if (result.studentFields) {
            const emailKey = Object.keys(result.studentFields).find(k => k.toLowerCase() === 'email');
            if (emailKey) {
              email = (result.studentFields[emailKey] || "").toString().trim();
            }
          }
        }

        if (email && email.toLowerCase() !== "guest@test.com" && email.includes("@")) {
          let test = testCache[result.testId];
          if (!test && result.testId) {
            test = await Test.findById(result.testId);
            testCache[result.testId] = test;
          }

          const { percentileRank } = await getPercentileData(result.testId, result.score);
          result.percentileRank = percentileRank;

          try {
            await transporter.sendMail({
              from: `"Gurukul Success Classes" <${process.env.EMAIL_USER}>`,
              to: email,
              subject: `Comprehensive Exam Result: ${result.testName}`,
              html: generateEmailHTML(result, test),
            });
            sentCount++;
            
            // ✅ Save the success status to the database
            await Result.findByIdAndUpdate(result._id, {
              $set: { emailStatus: 'Sent', emailSentAt: new Date() }
            }, { strict: false });

          } catch (mailErr) {
            console.error(`Failed to send email to ${email}:`, mailErr.message);
            // ✅ Save the failure status to the database
            try {
              await Result.findByIdAndUpdate(result._id, {
                $set: { emailStatus: 'Failed', emailError: mailErr.message }
              }, { strict: false });
            } catch (dbErr) {
              console.error("DB update failed during bulk email error:", dbErr);
            }
          }
        }
      }
      console.log(`[BACKGROUND JOB]: Successfully sent ${sentCount} bulk result emails.`);
    })();
  } catch (err) {
    res.status(500).json({ msg: "Failed to send bulk emails ❌" });
  }
};

// ================= GET LEADERBOARD (PUBLISHED RESULTS) =================
exports.getLeaderboard = async (req, res) => {
  try {
    const { testId } = req.params;
    // Only fetch results that are published
    const results = await Result.find({ testId, isPublished: { $ne: false } })
      .select('studentName studentEmail score total percentage createdAt')
      .sort({ score: -1, percentage: -1 })
      .limit(10) // Strictly limit to TOP 10 performers
      .lean();

    res.json(results);
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};
