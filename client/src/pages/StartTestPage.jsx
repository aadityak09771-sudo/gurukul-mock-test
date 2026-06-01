import React, {
  useState,
  useEffect
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./StartTestPage.css";
import API from "../services/api";

const StartTestPage = () => {

  const navigate = useNavigate();
  const { id } = useParams();

  const [step, setStep] = useState(1);

  const [test, setTest] = useState(null);
   // ================= FETCH TEST =================

useEffect(() => {

  const fetchTest = async () => {

    try {

      const res = await API.get(
        `/tests/${id}`
      );

      setTest(res.data);

    } catch (err) {

      console.log(err);

    }

  };

  fetchTest();

}, [id]);

  const authData = JSON.parse(localStorage.getItem("auth") || "{}");
  const currentUser = authData?.user;

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    Name: currentUser?.name || "",
    Email: currentUser?.email || "",
    roll: "",
    phone: ""
  });

  const handleChange = (e) => {
   
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

 const handleNext = () => {

  if (test?.courseOptions?.length > 0 && !form.course) {
    alert("Please select your Course ❌");
    return;
  }

  if (test?.branchOptions?.length > 0 && !form.branch) {
    alert("Please select your Branch ❌");
    return;
  }

  if (test?.sectionOptions?.length > 0 && !form.section) {
    alert("Please select your Section ❌");
    return;
  }

  const missingField =
    test?.customFields?.find(
      field =>
        field.required &&
        !form[field.label]
    );

  if (missingField) {

    alert(
      `${missingField.label} is required ❌`
    );

    return;
  }

  setStep(2);

};

  const handleStart = async () => {

  localStorage.setItem(
    "studentInfo",
    JSON.stringify(form)
  );

  try {

    // ✅ FULLSCREEN STARTS HERE
    await document.documentElement.requestFullscreen();

    // ✅ THEN OPEN TEST
    navigate(`/exam/${id}`);

  } catch (err) {

    alert("Please allow fullscreen to start test ❌");

  }
};

  return (
    <div className="start-page">

      <div className="start-card">

        {test?.testImages?.length > 0 ? (
          <div className="test-logo-wrapper" style={{ textAlign: "center", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {test.testImages.map((img, i) => (
              <img key={i} src={img} alt="Test Poster" style={{ maxHeight: "120px", maxWidth: "100%", objectFit: "contain", margin: "0 auto", borderRadius: "8px" }} />
            ))}
          </div>
        ) : test?.testLogo && (
          <div className="test-logo-wrapper" style={{ textAlign: "center", marginBottom: "20px" }}>
            <img src={test.testLogo} alt="Test Logo" style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }} />
          </div>
        )}
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2>Enter Your Details</h2>

            {test?.courseOptions?.length > 0 && (
              <div style={{ marginBottom: "15px", textAlign: "left" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Course *</label>
                <select name="course" value={form.course || ""} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", background: "white" }} required>
                  <option value="">-- Select Course --</option>
                  {test.courseOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {test?.branchOptions?.length > 0 && (
              <div style={{ marginBottom: "15px", textAlign: "left" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Branch *</label>
                <select name="branch" value={form.branch || ""} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", background: "white" }} required>
                  <option value="">-- Select Branch --</option>
                  {test.branchOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {test?.sectionOptions?.length > 0 && (
              <div style={{ marginBottom: "15px", textAlign: "left" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#334155" }}>Section *</label>
                <select name="section" value={form.section || ""} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", background: "white" }} required>
                  <option value="">-- Select Section --</option>
                  {test.sectionOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {
  test?.customFields?.map(
    (field, index) => {
      const isReadOnly = currentUser && (field.label.toLowerCase() === "name" || field.label.toLowerCase() === "email");
      
      return (
        <input
          key={index}
          name={field.label}
          placeholder={field.label}
          required={field.required}
          value={form[field.label] || ""}
          readOnly={isReadOnly}
          style={isReadOnly ? { backgroundColor: "#eef1f8", cursor: "not-allowed", color: "#6c757d" } : {}}
          onChange={handleChange}
        />
      );
    }
  )
}

            <button onClick={handleNext}>
              Continue
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h2>Exam Instructions</h2>

            <ul className="instructions">

          {
            test?.instructions?.map(
              (item, index) => (

                <li key={index}>
                  {item.text}
                </li>

              )
            )
          }

        </ul>

            <div className="btn-row">

              <button
                className="btn-back"
                onClick={() => setStep(1)}
              >
                Back
              </button>

              <button
                className="btn-start"
                onClick={handleStart}
              >
                Start Test
              </button>

            </div>
          </>
        )}

      </div>

    </div>
  );
};

export default StartTestPage;