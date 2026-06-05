import React, {
  useState,
  useEffect
} from "react";
import { createTest } from "../../services/testService";
import "./CreateTest.css";
import API from "../../services/api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const MAIN_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['image', 'clean']
  ]
};

const OPTION_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['image', 'clean']
  ]
};

const CreateTest = ({
  editMode = false,
  initialData = null,
  onSubmit
}) => {

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [testImages, setTestImages] = useState([]);
  const [totalTime, setTotalTime] = useState("");

  const [marksCorrect, setMarksCorrect] = useState(4);
  const [marksNegative, setMarksNegative] = useState(1);
  const [startTime, setStartTime] = useState("");

  const [endTime, setEndTime] = useState("");
  useEffect(() => {

    if (editMode && initialData) {
      setTitle(initialData.title || "");
      setCategory(initialData.category || "General");
      setTestImages(initialData.testImages || (initialData.testLogo ? [initialData.testLogo] : []));
      setTotalTime(initialData.totalTime || "");
      setMarksCorrect(initialData.marksCorrect ?? 4);
      setMarksNegative(initialData.marksNegative ?? 1);

      setCourseOptions((initialData.courseOptions || []).join(", "));
      setBranchOptions((initialData.branchOptions || []).join(", "));
      setSectionOptions((initialData.sectionOptions || []).join(", "));

      // Handle date-time format for input
      const formatDateTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        // Offset the timezone to get the correct local time for the input
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setStartTime(formatDateTime(initialData.startTime));
      setEndTime(formatDateTime(initialData.endTime));

      setTimerMode(initialData.timerMode || "total");
      setExamMode(initialData.examMode || "mcq");

      setIsPrivate(initialData.isPrivate || false);
      setAllowedStudents((initialData.allowedStudents || []).join("\n"));
      setAllowedDomains((initialData.allowedDomains || []).join(", "));

      setCustomFields(initialData.customFields?.length ? initialData.customFields : [{ label: "Name", required: true }, { label: "Email", required: true }, { label: "Phone", required: true }, { label: "Roll No", required: true }]);
      setInstructions(initialData.instructions?.length ? initialData.instructions : []);

      setIsPaid(initialData.isPaid || false);
      setPrice(initialData.price || "");

      // Ensure sections have a unique ID for React keys if they don't already
      const sectionsWithIds = (initialData.sections || []).map((sec, index) => ({
        ...sec,
        id: sec.id || Date.now() + index,
      }));
      setSections(sectionsWithIds.length ? sectionsWithIds : [{ id: 1, name: "verbal", time: "", questions: [] }]);

      setNavigationMode(initialData.navigationMode || "free");
      setAllowReview(initialData.allowReview ?? true);
      setAutoSectionMove(initialData.autoSectionMove ?? true);
      setEnableSectionLock(initialData.enableSectionLock || false);
      setShuffleQuestions(initialData.shuffleQuestions ?? true);
      setShuffleSections(initialData.shuffleSections || false);
      setCameraRequired(initialData.cameraRequired || false);
      setVoiceRequired(initialData.voiceRequired || false);
    }

}, [editMode, initialData]);

  // ✅ TIMER MODE
const [timerMode, setTimerMode] =
  useState("total");

// ✅ EXAM MODE
const [examMode, setExamMode] =
  useState("mcq");

const [mixedQType, setMixedQType] = useState("mcq"); // ✅ Tracks type inside mixed mode

// ✅ PRIVATE TEST
const [isPrivate, setIsPrivate] =
  useState(false);

const [courseOptions, setCourseOptions] = useState("");
const [branchOptions, setBranchOptions] = useState("");
const [sectionOptions, setSectionOptions] = useState("");

const [allowedStudents, setAllowedStudents] =
  useState("");
const [allowedDomains, setAllowedDomains] = useState("");

  const [customFields, setCustomFields] =
  useState([
    {
      label: "Name",
      required: true,
    },

    {
      label: "Email",
      required: true,
    },
    {
      label: "Phone",
      required: true,
    },
    {
      label: "Roll No",
      required: true,
    },
  ]);
  const [instructions, setInstructions] =
  useState([
    {
      text:
        "⏱ Fixed time limit for this exam."
    },
    {
      text:
        "⚠ Do not refresh or close the page."
    },
    {
      text:
        "🚫 Avoid cheating or tab switching."
    },
    {
      text:
        "📷 Camera monitoring may be enabled."
    },
  ]);
  const [currentQTime, setCurrentQTime] = useState("");

  // ✅ PAYMENT
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  const [sections, setSections] = useState([
  {
    id: 1,
    name: "verbal",
    time: "",
    questions: []
  },
  {
    id: 2,
    name: "numerical",
    time: "",
    questions: []
  },
  {
    id: 3,
    name: "reasoning",
    time: "",
    questions: []
  }
]);

const [section, setSection] = useState(0);
const [viewSection, setViewSection] = useState(0);


const [navigationMode, setNavigationMode] =
  useState("free");

const [allowReview, setAllowReview] =
  useState(true);

const [autoSectionMove, setAutoSectionMove] =
  useState(true);

const [enableSectionLock, setEnableSectionLock] =
  useState(false);
const [cameraRequired, setCameraRequired] = useState(false);
const [voiceRequired, setVoiceRequired] = useState(false);
const [shuffleQuestions, setShuffleQuestions] =
  useState(true);
const [shuffleSections, setShuffleSections] = useState(false);
const [editingQIndex, setEditingQIndex] = useState(null);

  const [q, setQ] = useState("");
  const [qImage, setQImage] = useState("");
  const [options, setOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correct, setCorrect] = useState("");
  const [qMarksCorrect, setQMarksCorrect] = useState("");
  const [qMarksNegative, setQMarksNegative] = useState("");

  const [loading, setLoading] = useState(false);
  const [activeToolbar, setActiveToolbar] = useState(null);

  const handleOptionChange = (value, optionKey) => {
    setOptions(prev => ({ ...prev, [optionKey]: value }));
  };

  //section timer
  const updateSectionName = (index, value) => {

  const updated = [...sections];
  updated[index].name = value;

  setSections(updated);
};

const updateSectionTime = (index, value) => {

  const updated = [...sections];
  updated[index].time = Number(value);

  setSections(updated);
};
  // ================= CUSTOM FIELDS =================

const addCustomField = () => {

  setCustomFields(prev => [

    ...prev,

    {
      label: "",
      required: false,
    }

  ]);

};

const updateCustomField = (
  index,
  value
) => {

  const updated = [...customFields];

  updated[index].label = value;

  setCustomFields(updated);

};

const toggleCustomRequired = (
  index
) => {

  const updated = [...customFields];

  updated[index].required =
    !updated[index].required;

  setCustomFields(updated);

};

const removeCustomField = (
  index
) => {

  const updated = [...customFields];

  updated.splice(index, 1);

  setCustomFields(updated);

};
  // ================= ADD QUESTION =================
  const addQuestion = () => {

      if (!q) {

      alert("Enter question ❌");

      return;

    }

    const currentIsWritten = examMode === "written" || (examMode === "mixed" && mixedQType === "written");

    if (
      !currentIsWritten &&
      (!options.A || !options.B || !options.C || !options.D || !correct)
    ) {

      alert("Fill MCQ fields ❌");

      return;

    } 


  if (
  timerMode === "question" &&
  !currentQTime
) {
    alert("Enter time for question ⏱❌");
    return;
  }

  const newQ = {
    q,
    questionImage: qImage,
   type: currentIsWritten ? "written" : "mcq",

options:
  currentIsWritten
    ? {}
    : options,
   correct:
  currentIsWritten
    ? ""
    : correct,
    time:
  timerMode === "question"
    ? Number(currentQTime)
    : 0
  , marksCorrect: qMarksCorrect !== "" ? Number(qMarksCorrect) : null
  , marksNegative: qMarksNegative !== "" ? Number(qMarksNegative) : null
  };

  const updatedSections = [...sections];

  if (editingQIndex) {
    updatedSections[editingQIndex.secIndex].questions[editingQIndex.qIndex] = newQ;
    setEditingQIndex(null);
  } else {
    updatedSections[section].questions.push(newQ);
  }

  setSections(updatedSections);

  setQ("");
  setQImage("");
  setOptions({ A: "", B: "", C: "", D: "" });
  setCorrect("");
  setCurrentQTime("");
  setQMarksCorrect("");
  setQMarksNegative("");
  setActiveToolbar(null);
};

  // ================= EDIT QUESTION =================
  const handleEditQuestion = (secIndex, qIndex) => {
    const questionToEdit = sections[secIndex].questions[qIndex];
    setSection(secIndex);
    setEditingQIndex({ secIndex, qIndex });
    
    setQ(questionToEdit.q);
    setQImage(questionToEdit.questionImage || "");
    setOptions({
      A: questionToEdit.options?.A || "",
      B: questionToEdit.options?.B || "",
      C: questionToEdit.options?.C || "",
      D: questionToEdit.options?.D || ""
    });
    setCorrect(questionToEdit.correct || "");
    setCurrentQTime(questionToEdit.time || "");
    setQMarksCorrect(questionToEdit.marksCorrect !== null && questionToEdit.marksCorrect !== undefined ? questionToEdit.marksCorrect : "");
    setQMarksNegative(questionToEdit.marksNegative !== null && questionToEdit.marksNegative !== undefined ? questionToEdit.marksNegative : "");
    if (questionToEdit.type === "written") {
      setMixedQType("written");
    } else {
      setMixedQType("mcq");
    }
    setActiveToolbar(null);

    document.querySelector('.question-input-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // ================= DELETE =================
  const deleteQuestion = (secIndex, qIndex) => {

  const updatedSections = [...sections];

  updatedSections[secIndex].questions.splice(qIndex, 1);

  setSections(updatedSections);

  if (editingQIndex && editingQIndex.secIndex === secIndex && editingQIndex.qIndex === qIndex) {
      setEditingQIndex(null);
      setQ("");
      setQImage("");
      setOptions({ A: "", B: "", C: "", D: "" });
      setCorrect("");
      setCurrentQTime("");
      setQMarksCorrect("");
      setQMarksNegative("");
      setActiveToolbar(null);
  }
};
   // ✅ ADD SECTION
const addSection = () => {

  setSections(prev => [

    ...prev,

    {
      id: Date.now(),
      name: "New Section",
      time: "",
      questions: []
    }

  ]);

};

// ✅ DELETE SECTION
const removeSection = (index) => {

  if (sections.length === 1) {

    alert("At least 1 section required");

    return;

  }

  const updated = [...sections];

  updated.splice(index, 1);

  setSections(updated);

  setSection(0);

};
  // ================= SAVE =================
  const handleSave = async (status) => {

    if (!title) {
  alert("Enter title ❌");
  return;
}

if (
  timerMode === "total" &&
  !totalTime
) {
  alert("Enter total time ⏱❌");
  return;
}

    const total = sections.reduce(
  (acc, sec) => acc + sec.questions.length,
  0
);

    if (total === 0) {
      alert("Add questions ❌");
      return;
    }

    // Auto-calculate the total time dynamically if timer mode is section or question
    let calculatedTotalTime = Number(totalTime) || 0;
    if (timerMode === "section") {
      calculatedTotalTime = sections.reduce((acc, sec) => acc + Number(sec.time || 0), 0);
    } else if (timerMode === "question") {
      calculatedTotalTime = Math.ceil(sections.reduce((acc, sec) => acc + sec.questions.reduce((qAcc, q) => qAcc + Number(q.time || 0), 0), 0) / 60);
    }

    const newTest = {
      title,
      category,
      testImages,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
      totalTime: calculatedTotalTime,
      courseOptions: courseOptions.split(',').map(s => s.trim()).filter(Boolean),
      branchOptions: branchOptions.split(',').map(s => s.trim()).filter(Boolean),
      sectionOptions: sectionOptions.split(',').map(s => s.trim()).filter(Boolean),
      marksCorrect,
      marksNegative,
      instructions,
      customFields,
      status,
      sections: sections.map(sec => ({
  name: sec.name,
  time: Number(sec.time || 0),
  

  questions: sec.questions.map(q => ({
    q: q.q,
    questionImage: q.questionImage || "",
    type: q.type,
    options: {
      A: q.options.A,
      B: q.options.B,
      C: q.options.C,
      D: q.options.D,
    },

    correct: q.correct,

    time: Number(q.time || 0),
    marksCorrect: q.marksCorrect,
    marksNegative: q.marksNegative,
  })),
})),
      timerMode,
      examMode,

      isPrivate,

      allowedStudents: isPrivate
        ? allowedStudents
            .split("\n")
            .map(email => email.trim())
        : [],
      allowedDomains: allowedDomains.split(',').map(d => d.trim().toLowerCase()).filter(Boolean),
      navigationMode,

      allowReview,

      autoSectionMove,

      enableSectionLock,

      shuffleQuestions,
      shuffleSections,
      cameraRequired,
      voiceRequired,

      // PAYMENT
      isPaid,
      price: isPaid ? Number(price) : 0
    };

    try {
      setLoading(true);
      console.log("SAVING TEST:", newTest);
      if (editMode) {

          await onSubmit(newTest);

        } else {

          const res = await createTest(newTest);
          
          // ✅ Extract ID from the newly created test to send invites
          const newTestId = res._id || res.data?._id;
          if (status === "live" && newTest.isPrivate && newTest.allowedStudents.length > 0) {
            const confirmSend = window.confirm("This is a private test. Do you want to automatically email the secure test link to all allowed students now?");
            if (confirmSend && newTestId) {
              const inviteRes = await API.post('/tests/send-invites', { testId: newTestId });
              alert(inviteRes.data.msg);
            }
          }

        }

      alert(`Test ${status === "live" ? "Live 🚀" : "Saved 💾"}`);

      // RESET
      setTitle("");
      setCategory("General");
      setTestImages([]);
      setStartTime("");
      setEndTime("");
      setTotalTime("");
      setMarksCorrect(4);
      setMarksNegative(1);
      setInstructions([
  {
    text:
      "⏱ Fixed time limit for this exam."
  },
  {
    text:
      "⚠ Do not refresh or close the page."
  },
  {
    text:
      "🚫 Avoid cheating or tab switching."
  },
  {
    text:
      "📷 Camera monitoring may be enabled."
  },
  {
    label: "Phone",
    required: true,
  },
]);
      setCurrentQTime("");
      setQMarksCorrect("");
      setQMarksNegative("");
      setCourseOptions("");
      setBranchOptions("");
      setSectionOptions("");
      setIsPaid(false);
      setPrice("");
      setNavigationMode("free");

      setAllowReview(true);

      setAutoSectionMove(true);

      setEnableSectionLock(false);
      setCameraRequired(false);
      setVoiceRequired(false);
      setEditingQIndex(null);
       setTimerMode("total");

        setExamMode("mcq");

        setIsPrivate(false);

        setAllowedStudents("");
        setAllowedDomains("");
        setCustomFields([
  {
    label: "Name",
    required: true,
  },

  {
    label: "Email",
    required: true,
  },
  {
    label: "Phone",
    required: true,
  },
  {
    label: "Roll No",
    required: true,
  },
]);
      setSections([
  {
    id: 1,
    name: "verbal",
    time: "",
    questions: []
  },
  {
    id: 2,
    name: "numerical",
    time: "",
    questions: []
  },
  {
    id: 3,
    name: "reasoning",
    time: "",
    questions: []
  }
]);

    } catch (err) {
      console.error(err);
      alert("Error ❌");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentQWritten = examMode === "written" || (examMode === "mixed" && mixedQType === "written");

  return (
    <div className="admin-panel active">

      <div className="page-header">
        <h2>Create New Test</h2>
        <p>Add questions and configure mock test</p>
      </div>

      {/* ================= TEST DETAILS ================= */}
      <div className="card">
        <div className="card-header">
          <h3>Test Details</h3>
        </div>

      <div className="top-test-row">

  {/* TEST TITLE */}
  <div className="form-group2 title-box">

    <label>Test Title</label>

    <input
      type="text"
      placeholder="Enter test title"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />

  </div>

  {/* CATEGORY */}
  <div className="form-group2 title-box">

    <label>Category (e.g. SSC, Bank)</label>

    <input
      type="text"
      placeholder="Enter test category"
      value={category}
      onChange={(e) => setCategory(e.target.value)}
    />

  </div>

  {/* TIMER MODE */}
  <div className="form-group2 timer-mode-box">

    <label>Timer Mode</label>

    <select
      value={timerMode}
      onChange={(e) =>
        setTimerMode(e.target.value)
      }
    >

      <option value="total">
        Total Timer
      </option>

      <option value="section">
        Section Timer
      </option>

      <option value="question">
        Question Timer
      </option>

    </select>

  </div>

</div>

{/* TEST IMAGES / POSTERS */}
<div className="form-group2 title-box" style={{ width: "100%" }}>
  <label>Test Images / Posters (Shows with title above sections)</label>
  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: testImages.length > 0 ? "10px" : "0" }}>
    {testImages.map((img, index) => (
      <div key={index} style={{ position: "relative", display: "inline-block" }}>
        <img src={img} alt="Preview" style={{ height: "80px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
        <button type="button" onClick={() => setTestImages(prev => prev.filter((_, i) => i !== index))} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", lineHeight: "1" }}>✕</button>
      </div>
    ))}
  </div>
  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
    <input type="text" placeholder="Paste Image URL ->" id="image-url-input" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
    <button type="button" className="btn-sm btn-outline" onClick={() => {
      const input = document.getElementById("image-url-input");
      if (input.value) {
        setTestImages(prev => [...prev, input.value]);
        input.value = "";
      }
    }}>➕ Add URL</button>
    <input
      type="file"
      accept="image/*"
      multiple
      id="test-images-upload"
      style={{ display: "none" }}
      onChange={(e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => setTestImages(prev => [...prev, reader.result]);
          reader.readAsDataURL(file);
        });
        e.target.value = ""; 
      }}
    />
    <button type="button" className="btn-sm btn-outline" onClick={() => document.getElementById("test-images-upload").click()} style={{ whiteSpace: "nowrap" }}>📂 Upload Images</button>
  </div>
</div>

{/* ================= TEST ACTIVE TIME ================= */}

<div className="form-row">

  <div className="form-group2">

    <label>Start Time</label>

    <input
      type="datetime-local"
      value={startTime}
      onChange={(e) =>
        setStartTime(e.target.value)
      }
    />

  </div>

  <div className="form-group2">

    <label>End Time</label>

    <input
      type="datetime-local"
      value={endTime}
      onChange={(e) =>
        setEndTime(e.target.value)
      }
    />

  </div>

</div>
        {/* ================= PAYMENT ================= */}
        <div className="form-row">

          <div className="form-group2">
            <label>Test Type</label>
            <select
              value={isPaid ? "paid" : "free"}
              onChange={(e) => setIsPaid(e.target.value === "paid")}
            >
              <option value="free">Free Test</option>
              <option value="paid">Paid Test</option>
            </select>
          </div>

          {isPaid && (
            <div className="form-group2">
              <label>Price (₹)</label>
              <input
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}

        </div>

        {/* MARKING */}
        <div className="form-row">
          <div className="form-group2">
            <label>Marks Correct</label>
            <input type="number" value={marksCorrect} onChange={e => setMarksCorrect(e.target.value)} />
          </div>

          <div className="form-group2">
            <label>Negative Marks</label>
            <input type="number" value={marksNegative} onChange={e => setMarksNegative(e.target.value)} />
          </div>
        </div>

        

{/* ================= EXAM SETTINGS ================= */}

<div className="card-header">
  <h3>Exam Settings</h3>
</div>

<div className="form-row">

  {/* EXAM MODE */}
  <div className="form-group2">

    <label>Exam Mode</label>

    <select
      value={examMode}
      onChange={(e) =>
        setExamMode(e.target.value)
      }
    >

      <option value="mcq">
        MCQ Test
      </option>

      <option value="written">
        Written Test
      </option>

      <option value="mixed">
        Mixed Mode
      </option>

    </select>

  </div>

 

</div>
{timerMode === "total" && (
  <div className="form-group2 full-width">

    <label>Total Test Time (Minutes)</label>

    <input
      type="number"
      placeholder="Enter total test time"
      value={totalTime}
      onChange={(e) =>
        setTotalTime(e.target.value)
      }
    />

  </div>
)}
{/* ================= CUSTOM STUDENT FIELDS ================= */}

<div className="card-header">
  <h3>Student Entry Fields</h3>
</div>

<div className="form-row" style={{ marginBottom: "20px" }}>
  <div className="form-group2">
    <label>Pre-defined Courses (Comma Separated)</label>
    <input
      type="text"
      placeholder="e.g. B.Tech, BCA, MCA"
      value={courseOptions}
      onChange={(e) => setCourseOptions(e.target.value)}
    />
    <small>Leave blank if not required</small>
  </div>

  <div className="form-group2">
    <label>Pre-defined Branches (Comma Separated)</label>
    <input
      type="text"
      placeholder="e.g. CSE, IT, Mechanical"
      value={branchOptions}
      onChange={(e) => setBranchOptions(e.target.value)}
    />
  </div>

  <div className="form-group2">
    <label>Pre-defined Sections (Comma Separated)</label>
    <input
      type="text"
      placeholder="e.g. A, B, C"
      value={sectionOptions}
      onChange={(e) => setSectionOptions(e.target.value)}
    />
  </div>
</div>
<hr style={{ border: "1px solid #e2e8f0", marginBottom: "20px" }}/>

<div className="custom-fields-wrapper">

  {
    customFields.map((field, index) => (

      <div
        className="custom-field-row"
        key={index}
      >

        <input
          type="text"
          placeholder="Field Name"
          value={field.label}
          onChange={(e) =>
            updateCustomField(
              index,
              e.target.value
            )
          }
        />

        <label>

          <input
            type="checkbox"
            checked={field.required}
            onChange={() =>
              toggleCustomRequired(index)
            }
          />

          Required

        </label>

        {
          index > 2 && (

            <button
              type="button"
              className="remove-field-btn"
              onClick={() =>
                removeCustomField(index)
              }
            >
              ✕
            </button>

          )
        }

      </div>

    ))
  }

  <button
    type="button"
    className="add-field-btn"
    onClick={addCustomField}
  >
    + Add Field
  </button>

</div>
{/* ================= INSTRUCTIONS ================= */}

<div className="card-header">
  <h3>Exam Instructions</h3>
</div>

<div className="custom-fields-wrapper">

  {
    instructions.map((item, index) => (

      <div
        className="custom-field-row"
        key={index}
      >

        <input
          type="text"
          placeholder="Instruction"

          value={item.text}

          onChange={(e) => {

            const updated =
              [...instructions];

            updated[index].text =
              e.target.value;

            setInstructions(updated);

          }}
        />

        {
          index > 0 && (

            <button
              type="button"
              className="remove-field-btn"

              onClick={() => {

                const updated =
                  [...instructions];

                updated.splice(index, 1);

                setInstructions(updated);

              }}
            >
              ✕
            </button>

          )
        }

      </div>

    ))
  }

  <button
    type="button"
    className="add-field-btn"

    onClick={() => {

      setInstructions(prev => [

        ...prev,

        {
          text: ""
        }

      ]);

    }}
  >
    + Add Instruction
  </button>

</div>
{/* ================= PRIVATE TEST ================= */}

<div className="form-row">

  <div className="form-group2">

    <label>Test Access</label>

    <select
      value={isPrivate ? "private" : "public"}
      onChange={(e) =>
        setIsPrivate(
          e.target.value === "private"
        )
      }
    >

      <option value="public">
        Public Test
      </option>

      <option value="private">
        Private Test
      </option>

    </select>

  </div>

</div>

{isPrivate && (

  <div className="form-group2">

    <label>
      Allowed Student Emails
    </label>

    <textarea
      rows="5"
      placeholder={`student1@gmail.com
student2@gmail.com`}

      value={allowedStudents}

      onChange={(e) =>
        setAllowedStudents(e.target.value)
      }
    />

  </div>

)}

<div className="form-group2">
  <label>Allowed Email Domains (Optional Privacy)</label>
  <input
    type="text"
    placeholder="e.g. @sharda.ac.in, @niet.co.in"
    value={allowedDomains}
    onChange={(e) => setAllowedDomains(e.target.value)}
  />
  <small className="hint-text">Restrict test to specific domains. Comma separate for multiple. Leave blank to allow all valid domains.</small>
</div>


 { /* ========== CBT SETTINGS ============== */}

<div className="card-header" style={{ marginTop: "28px" }}>
  <h3>Exam Navigation Settings</h3>
</div>

<div className="form-row">

  {/* NAVIGATION MODE */}
  <div className="form-group2">

    <label>Navigation Mode</label>

    <select
      value={navigationMode}
      onChange={(e) =>
        setNavigationMode(e.target.value)
      }
    >
      <option value="free">
        Free Navigation (Mock Test)
      </option>

      <option value="locked">
        Locked Sections (Real Exam)
      </option>

    </select>

  </div>

</div>

<div className="timer-wrapper">

  {/* REVIEW */}
  <div className="timer-box">

    <label className="timer-label">

      <input
        type="checkbox"
        checked={allowReview}
        onChange={() =>
          setAllowReview(!allowReview)
        }
      />

      Enable Mark For Review

    </label>

  </div>

  {/* AUTO MOVE */}
  <div className="timer-box">

    <label className="timer-label">

      <input
        type="checkbox"
        checked={autoSectionMove}
        onChange={() =>
          setAutoSectionMove(!autoSectionMove)
        }
      />

      Auto Move Next Section

    </label>

  </div>
  {/* LOCK COMPLETED SECTIONS */}
<div className="timer-box">

  <label className="timer-label">

    <input
      type="checkbox"
      checked={enableSectionLock}
      onChange={() =>
        setEnableSectionLock(!enableSectionLock)
      }
    />

    Lock Completed Sections

  </label>

</div>
<div className="timer-box">

  <label className="timer-label">

    <input
      type="checkbox"
      checked={shuffleQuestions}
      onChange={() =>
        setShuffleQuestions(!shuffleQuestions)
      }
    />

    Random Question Order

  </label>

</div>

<div className="timer-box">

  <label className="timer-label">

    <input
      type="checkbox"
      checked={shuffleSections}
      onChange={() =>
        setShuffleSections(!shuffleSections)
      }
    />

    Random Section Order

  </label>

</div>

<div className="timer-box">

  <label className="timer-label">

    <input
      type="checkbox"
      checked={cameraRequired}
      onChange={() =>
        setCameraRequired(!cameraRequired)
      }
    />

    Enable Camera Monitoring

  </label>

</div>
<div className="timer-box">
  <label className="timer-label">
    <input
      type="checkbox"
      checked={voiceRequired}
      onChange={() => setVoiceRequired(!voiceRequired)}
    />
    Enable Mic/Voice Monitoring
  </label>
</div>
 </div>

      {/* ================= ADD QUESTIONS ================= */}
      <div className="question-card">
        <div className="card-header">
          <h3>Add Questions</h3>
        </div>
          <button
          type="button"
          className="add-section-btn"
          onClick={addSection}
        >
          + Section
        </button>
        <div className="section-tabs">
          {sections.map((sec, index) => (
            <div
              key={sec.id}
              className={`section-tab ${section === index ? "active" : ""}`}
              onClick={() => setSection(index)}
            >
              <div className="section-head">

                <span>
                  {sec.name}
                  ({sec.questions.length})
                </span>

                <button
                  type="button"
                  className="remove-section"
                  onClick={(e) => {

                    e.stopPropagation();

                    removeSection(index);

                  }}
                >
                  ✕
                </button>

              </div>
          </div>
            
          ))} 
          
        </div>
        <div className="section-settings">
              <div className="section-field">

                <label>Section Name</label>

                <input
                  type="text"
                  placeholder="Enter section name"
                  value={sections[section].name}
                  onChange={(e) =>
                    updateSectionName(section, e.target.value)
                  }
                />

              </div>
                
          {timerMode === "section" && (
            <div className="section-field">

          <label>Section Time (Minutes)</label>

          <input
            type="number"
            placeholder="Enter section time"
            value={sections[section].time}
            onChange={(e) =>
              updateSectionTime(section, e.target.value)
            }
          />

        </div>
          )}

</div>
<div className="question-input-area">

        {/* ✅ Dynamic Toggle for Mixed Mode */}
        {examMode === "mixed" && (
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px", fontWeight: "bold" }}>Question Type:</label>
            <select value={mixedQType} onChange={e => setMixedQType(e.target.value)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="written">Written (Descriptive)</option>
            </select>
          </div>
        )}
        
        <div style={{ marginBottom: "15px", backgroundColor: "white", borderRadius: "8px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#334155" }}>Question (Supports pasting from MS Word, Images, Math Symbols):</label>
          <ReactQuill 
            theme="snow" 
            value={q} 
            onChange={setQ} 
            placeholder="Type or paste your question here..."
            modules={MAIN_MODULES}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "10px" }}>
          <input 
            type="text" 
            placeholder="Question Figure URL or Upload ->" 
            value={qImage?.startsWith("data:image") ? "🖼️ Figure Uploaded (Base64)" : qImage}
            readOnly={qImage?.startsWith("data:image")}
            onChange={e => setQImage(e.target.value)} 
            style={{ flex: 1, padding: "12px 14px", border: "2px solid #e7ebf5", borderRadius: "12px", fontSize: "14px", boxSizing: "border-box", backgroundColor: qImage?.startsWith("data:image") ? "#f8fafc" : "white" }} 
          />
          <input
            type="file"
            accept="image/*"
            id="qimage-upload"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setQImage(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
          <button
            type="button"
            className="btn-sm btn-outline"
            onClick={() => document.getElementById("qimage-upload").click()}
            style={{ whiteSpace: "nowrap" }}
          >
            📂 Upload Figure
          </button>
        </div>
        {qImage && (
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={qImage} alt="Preview" style={{ maxHeight: "60px", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
            <button type="button" onClick={() => setQImage("")} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontWeight: "bold" }}>✕ Remove</button>
          </div>
        )}

          {timerMode === "question" && (
             <div className="question-time-input">
  <input
    type="number"
    placeholder="Time for this question (seconds)"
    value={currentQTime}
    onChange={(e) => setCurrentQTime(e.target.value)}
  />
   </div>
)}

{!isCurrentQWritten && (

  <>

    <div className="option-grid-rich">
      {["A", "B", "C", "D"].map(opt => (
        <div 
          className={`rich-opt-box ${activeToolbar === opt ? 'show-toolbar' : 'hide-toolbar'}`} 
          key={opt} 
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <span style={{ 
              marginRight: '15px', 
              flexShrink: 0, 
              marginTop: '8px', 
              width: '36px', 
              height: '36px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}>
              {opt}
            </span>
            
            <div style={{ flex: 1, minWidth: 0 }} className="quill-wrapper">
              <ReactQuill
                theme="snow"
                value={options[opt]}
                onChange={(value) => handleOptionChange(value, opt)}
                placeholder={`Option ${opt} text...`}
                modules={OPTION_MODULES}
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveToolbar(activeToolbar === opt ? null : opt)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'transparent',
                color: '#64748b', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', transition: 'transform 0.3s ease',
                transform: activeToolbar === opt ? 'rotate(180deg)' : 'rotate(0deg)',
                marginLeft: '10px', flexShrink: 0, marginTop: '8px'
              }}
              title="Toggle Formatting Tools"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
    <style>{`
    .option-grid-rich {
      display: grid;
      grid-template-columns: 1fr; /* Full width so toolbar fits perfectly */
      gap: 15px;
      margin-top: 15px;
      margin-bottom: 20px;
    }
    .rich-opt-box {
      display: flex;
      flex-direction: column;
      padding: 15px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .rich-opt-box:focus-within {
      border-color: #cbd5e1;
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }
    .quill-wrapper .quill {
      display: flex;
      flex-direction: column-reverse;
    }
    .quill-wrapper .ql-toolbar {
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }
    .hide-toolbar .ql-toolbar {
      max-height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      opacity: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
    }
    .show-toolbar .ql-toolbar {
      max-height: 300px !important;
      opacity: 1 !important;
      border: 1px solid #e2e8f0 !important;
      background: #f8fafc !important;
      border-radius: 8px;
      padding: 8px !important;
      margin-top: 12px !important;
    }
    .quill-wrapper .ql-container {
      border: 1px solid #e2e8f0 !important;
      background: #f8fafc;
      border-radius: 8px;
    }
    .quill-wrapper .ql-editor {
      padding: 12px 14px;
      font-size: 15px;
      min-height: 48px;
      color: #0f172a;
    }
    .quill-wrapper .ql-editor.ql-blank::before {
      left: 14px;
      color: #94a3b8;
      font-style: normal;
    }
    `}</style>

    <select
      value={correct}
      onChange={(e) =>
        setCorrect(e.target.value)
      }
    >

      <option value="">
        Select Correct Answer
      </option>

      <option value="A">A</option>
      <option value="B">B</option>
      <option value="C">C</option>
      <option value="D">D</option>

    </select>

  </>
  

)}

        <div className="form-row" style={{ marginTop: "15px", marginBottom: "15px" }}>
          <div className="form-group2">
            <label>Marks for Correct Answer (Leave blank to use default: {marksCorrect})</label>
            <input 
              type="number" 
              placeholder={`Default: ${marksCorrect}`} 
              value={qMarksCorrect} 
              onChange={e => setQMarksCorrect(e.target.value)} 
            />
          </div>
          <div className="form-group2">
            <label>Negative Marks (Leave blank to use default: {marksNegative})</label>
            <input 
              type="number" 
              placeholder={`Default: ${marksNegative}`} 
              value={qMarksNegative} 
              onChange={e => setQMarksNegative(e.target.value)} 
            />
          </div>
        </div>

      <button
        type="button"
        className="btn-sm btn-gold"
        onClick={addQuestion}
      >
        {editingQIndex ? "💾 Update Question" : "+ Add Question"}
      </button>
      {editingQIndex && (
        <button
          type="button"
          className="btn-sm btn-outline"
          onClick={() => {
            setEditingQIndex(null);
            setQ("");
            setOptions({ A: "", B: "", C: "", D: "" });
            setCorrect("");
            setCurrentQTime("");
            setQMarksCorrect("");
            setQMarksNegative("");
            setActiveToolbar(null);
          }}
          style={{ marginLeft: "10px" }}
        >
          Cancel Edit
        </button>
      )}

      </div>
</div>
      {/* ================= VIEW QUESTIONS ================= */}
      <div className="card">
        <h3>Added Questions</h3>

        <div className="section-tabs">
          {sections.map((sec, index) => (
           
           <button
              type="button"
              key={sec.id}
              className={`section-tab ${viewSection === index ? "active" : ""}`}
              onClick={() => setViewSection(index)}
            >
              {sec.name}
            </button>
            
            
          ))}
          
        </div>


        {sections[viewSection].questions.map((item, i) => (
          <div key={i} className="question-item">
            <span style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <strong>{i + 1}.</strong> <span dangerouslySetInnerHTML={{ __html: item.q }} />
                </span>
                {item.questionImage && (
                  <span style={{display: "block", marginTop: "5px", color: "#2563eb", fontSize: "12px"}}>
                    🖼️ Figure attached
                  </span>
                )}
                {item.time > 0 && (
                  <small style={{ marginLeft: "10px", color: "red" }}>
                    ⏱ {item.time}s
                  </small>
                )}
                <small style={{ marginLeft: "10px", color: "#16a34a" }}>
                  [+{item.marksCorrect !== undefined && item.marksCorrect !== null ? item.marksCorrect : marksCorrect}, -{item.marksNegative !== undefined && item.marksNegative !== null ? item.marksNegative : marksNegative} Marks]
                </small>
                <small style={{ marginLeft: "10px", color: "gray", fontStyle: "italic" }}>({item.type.toUpperCase()})</small>
              </span>
            <div>
              <button className="btn-icon" onClick={() => handleEditQuestion(viewSection, i)} style={{ marginRight: "10px" }} title="Edit Question">
                ✏️
              </button>
              <button className="btn-icon" onClick={() => deleteQuestion(viewSection, i)} title="Delete Question">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* ================= ACTION BUTTONS ================= */}
      <div className="action-buttons">

        <button
          className="btn-sm btn-outline"
          onClick={() => handleSave("draft")}
        >
          💾 Save Draft
        </button>

        <button
          className="btn-sm btn-green"
          onClick={() => handleSave("live")}
          disabled={loading}
        >
          🚀 {loading ? "Saving..." : "Save & Go Live"}
        </button>

      </div>

    </div>
  </div>
  );
};

export default CreateTest;