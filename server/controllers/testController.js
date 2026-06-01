const Test = require("../models/Test");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // strict check for safety
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  socketTimeout: 15000,
});

// ================= CREATE TEST =================
exports.createTest = async (req, res) => {
  try {
  const {
  title,
  category,
  testLogo,
  testImages,
  totalTime,

  timerMode,
  examMode,

  sections,

  courseOptions,
  branchOptions,
  sectionOptions,

  customFields,

  allowedStudents,
  allowedDomains,
  isPrivate,

  startTime,
  endTime,

  marksCorrect,
  marksNegative,

  instructions,
  status,

  navigationMode,
  allowReview,
  autoSectionMove,
  enableSectionLock,
  cameraRequired,
  voiceRequired,

  isPaid,
  price,

  shuffleQuestions,

} = req.body;

    // ================= VALIDATION =================
    if (!title) {

        return res.status(400).json({
          msg: "Title required ❌",
        });

      }

      if (!totalTime && totalTime !== 0) {

        return res.status(400).json({
          msg: "Total time required ⏱❌",
        });

      }

    // ================= SAFE QUESTIONS =================
    

    const totalQuestions = sections.reduce(
  (acc, sec) => acc + sec.questions.length,
  0
);

if (totalQuestions === 0) {
  return res.status(400).json({
    message: "Add at least 1 question"
  });
}

    // ================= CREATE TEST =================
    const newTest = await Test.create({

  title,
  category: category || "General",
  testLogo: testLogo || "",
  testImages: testImages || [],

  totalTime: Number(totalTime) || 0,

  timerMode: timerMode || "total",

  examMode: examMode || "mcq",

  sections,
  
  courseOptions: courseOptions || [],
  branchOptions: branchOptions || [],
  sectionOptions: sectionOptions || [],
  customFields,

  startTime,
  endTime,



  navigationMode:
    navigationMode || "free",

  allowReview:
    allowReview !== undefined
      ? allowReview
      : true,

  autoSectionMove:
    autoSectionMove !== undefined
      ? autoSectionMove
      : true,

  enableSectionLock:
    enableSectionLock || false,

  cameraRequired: cameraRequired || false,
  voiceRequired: voiceRequired || false,

  marksCorrect:
    Number(marksCorrect) || 4,

  marksNegative:
    Number(marksNegative) || 1,

  instructions:
    instructions || [],

  isPaid:
    isPaid || false,

  price:
    isPaid ? Number(price) : 0,

  isPrivate:
    isPrivate || false,

  allowedStudents:
    allowedStudents || [],

  allowedDomains:
    allowedDomains || [],

  status:
    status || "draft",

});

    res.status(201).json(newTest);

  } catch (err) {
    console.error("CREATE TEST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= SEND PRIVATE TEST INVITES =================
exports.sendPrivateTestInvites = async (req, res) => {
  try {
    const { testId } = req.body;
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ msg: "Test not found" });
    }

    if (!test.isPrivate || !test.allowedStudents || test.allowedStudents.length === 0) {
      return res.status(400).json({ msg: "This is not a private test or no students are added to the list." });
    }

    // Determine the base URL dynamically or fallback to localhost for testing
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const testLink = `${baseUrl}/test/${test._id}`;

    // ✅ Respond instantly to prevent browser timeout
    res.json({ msg: `Invite process started for ${test.allowedStudents.length} students! ✅ E-mails are securely sending in the background.` });

    // ✅ Background async task with rate limit protection
    (async () => {
      let sentCount = 0;
      for (const email of test.allowedStudents) {
        if (email && email.trim() !== "" && email.includes("@")) {
          const htmlContent = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #1e3a8a;">Hello Student,</h2>
                <p>You have been exclusively invited to participate in the following private mock test:</p>
                <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Test Name:</strong> ${test.title}</p>
                  <p><strong>Duration:</strong> ${test.totalTime} Minutes</p>
                </div>
                <p>Click the secure link below to start your exam:</p>
                <a href="${testLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Start Exam Now</a>
                <p style="margin-top: 25px;">Best Regards,<br><strong>Gurukul Success Classes</strong></p>
              </div>
            `
          ;
          try {
            await transporter.sendMail({
              from: `"Gurukul Success Classes" <${process.env.EMAIL_USER}>`,
              to: email.trim(),
              subject: `Invitation: Private Mock Test - ${test.title}`,
              html: htmlContent,
            });
            sentCount++;
          } catch (mailErr) {
            console.error(`Failed to send invite to ${email}:`, mailErr.message);
          }
        }

        
      }
      console.log(`[BACKGROUND JOB]: Successfully sent ${sentCount} test invites.`);
    })();

  } catch (err) {
    console.error("Invite Email Error:", err);
    res.status(500).json({ msg: "Failed to send invites ❌", error: err.message });
  }
};

// ================= GET ALL TESTS =================
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    console.error("GET ALL TESTS ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= GET SINGLE TEST =================
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        msg: "Test not found ❌",
      });
    }

    res.json(test);

  } catch (err) {
    console.error("GET TEST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= UPDATE TEST =================
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        category: req.body.category || "General",
        courseOptions: req.body.courseOptions || [],
        branchOptions: req.body.branchOptions || [],
        sectionOptions: req.body.sectionOptions || [],

        // ✅ Ensure correct types
       totalTime: Number(req.body.totalTime) || 0,
        marksCorrect: Number(req.body.marksCorrect),
        marksNegative: Number(req.body.marksNegative),
        price: req.body.isPaid ? Number(req.body.price) : 0,
      },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({
        msg: "Test not found ❌",
      });
    }

    res.json(test);

  } catch (err) {
    console.error("UPDATE TEST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= DELETE TEST =================
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({
        msg: "Test not found ❌",
      });
    }

    res.json({
      msg: "Test deleted successfully ✅",
    });

  } catch (err) {
    console.error("DELETE TEST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= GET LIVE TESTS =================
exports.getLiveTests = async (req, res) => {
  try {
    const liveTests = await Test.find({ status: "live" });
    res.json(liveTests);
  } catch (err) {
    console.error("LIVE TEST ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};

// ================= TOGGLE TEST STATUS =================
exports.toggleTestStatus = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        msg: "Test not found ❌",
      });
    }

    test.status = test.status === "live" ? "draft" : "live";

    await test.save();

    res.json(test);

  } catch (err) {
    console.error("TOGGLE STATUS ERROR:", err);
    res.status(500).json({ msg: "Server Error ❌" });
  }
};