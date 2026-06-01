import React, { useEffect, useState, useRef, useMemo } from "react";
import * as faceapi from "face-api.js";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./TestPage.css";

const TestPage = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  const user = auth?.user;

  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [lockedSections, setLockedSections] = useState([]);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});

  const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState(null);
  const [showSectionPopup, setShowSectionPopup] = useState(false);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
const [noiseViolationCount, setNoiseViolationCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // 🔥 PAYMENT
  const [paid, setPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // 🔥 PER QUESTION TIMER
  const [qTimeLeft, setQTimeLeft] = useState(0);
  const [lockNavigation, setLockNavigation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); 
// null | "loading" | "success" | "failed"
const [clickCount, setClickCount] = useState(0);
const [isFullscreen, setIsFullscreen] = useState(true);
const [isFullscreenSupported, setIsFullscreenSupported] = useState(true);
const videoRef = useRef(null);
const [faceViolation, setFaceViolation] = useState(0);
const [totalFaceViolations, setTotalFaceViolations] = useState(0);
const [windowBlurCount, setWindowBlurCount] = useState(0);
const [modelLoaded, setModelLoaded] = useState(false);
const lastLogTime = useRef(0);
const lastNoiseTime = useRef(0);
const audioCtxRef = useRef(null);
const streamRef = useRef(null);

const submittedRef = useRef(false);
const answersRef = useRef({});
const tabSwitchCountRef = useRef(0);
const scrollCountRef = useRef(0);
const noiseViolationCountRef = useRef(0);
const windowBlurCountRef = useRef(0);
const totalFaceViolationsRef = useRef(0);
const submitReasonRef = useRef("Submitted manually by student");

const testStateKey = `test_state_${id}_${user?.email || 'guest'}`;

// ✅ FIX: Reference for test to prevent stale closure bugs in event listeners
const testRef = useRef(null);
useEffect(() => {
  testRef.current = test;
}, [test]);

// ✅ FIX: Reference for handleSubmit to avoid stale closures in event listeners
const handleSubmitRef = useRef(null);

// ✅ FIX: Define isReadyRef to prevent timers/anti-cheat from firing during load/payment
const isReadyRef = useRef(false);
useEffect(() => {
  isReadyRef.current = !!test && (!test.isPaid || paid);
}, [test, paid]);

const logCheat = (type) => {
  const now = Date.now();

  if (now - lastLogTime.current > 5000) {
    API.post("/cheat/log", {
      testId: testRef.current?._id || test?._id, // ✅ Ensures ID is always captured
      studentEmail: user?.email || "guest",
      type
    }).catch(() => {});

    lastLogTime.current = now;
  }
};

  // ================= FULLSCREEN DETECTION =================
useEffect(() => {
  const supported = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
  setIsFullscreenSupported(!!supported);

  const checkFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  setIsFullscreen(checkFull());

  const handleFullscreenChange = () => {
    const isFull = checkFull();
    setIsFullscreen(isFull);

    if (!isReadyRef.current || submittedRef.current) return;

    if (!isFull) {
      logCheat("exit-fullscreen");
      const newCount = tabSwitchCountRef.current + 1;
      tabSwitchCountRef.current = newCount;
      setTabSwitchCount(newCount);

      if (newCount >= 3) {
        submitReasonRef.current = "Auto-Submit: Exited full-screen multiple times";
        setPopup("autosubmit");
        if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
      } else {
        setPopup(null);
      }
    }
  };

  const events = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
  events.forEach(e => document.addEventListener(e, handleFullscreenChange));

  return () => {
    events.forEach(e => document.removeEventListener(e, handleFullscreenChange));
  };

}, []);
  // ================= TAB SWITCH =================
  useEffect(() => {
    const handleVisibility = () => {
      if (!isReadyRef.current) return;
      if (document.hidden || document.visibilityState === "hidden") {
       logCheat("tab-switch");
       const newCount = tabSwitchCountRef.current + 1;
       tabSwitchCountRef.current = newCount;
       setTabSwitchCount(newCount);

       if (newCount >= 3) {
         submitReasonRef.current = "Auto-Submit: Changed tabs/minimized window";
         setPopup("autosubmit");
         if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
       } else {
         setPopup("tab-warning");
       }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    // ✅ Mobile Safari & Android aggressive backgrounding detection
    window.addEventListener("pagehide", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleVisibility);
    };
  }, []);
  // ================= WINDOW BLUR (ALT+TAB DETECTION) =================
useEffect(() => {

  const handleBlur = () => {
    if (!isReadyRef.current) return;
    logCheat("window-blur");   // ✅ NEW
    const newCount = windowBlurCountRef.current + 1;
    windowBlurCountRef.current = newCount;
    setWindowBlurCount(newCount); // ✅ Track for Admin

    if (newCount >= 3) {
      submitReasonRef.current = "Auto-Submit: Minimized window/Alt+Tab repeatedly";
      setPopup("autosubmit");
      if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
    } else {
      setPopup("tab-warning");
    }
  };

  window.addEventListener("blur", handleBlur);

  return () => window.removeEventListener("blur", handleBlur);

}, []);

  // ================= PREVENT CLOSING TAB / REFRESH =================
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isReadyRef.current || submittedRef.current) return;
      
      logCheat("tab-close-attempt");
      const newCount = tabSwitchCountRef.current + 1;
      tabSwitchCountRef.current = newCount;
      setTabSwitchCount(newCount);

      if (newCount >= 3) {
        submitReasonRef.current = "Auto-Submit: Attempted to close tab/refresh repeatedly";
        setPopup("autosubmit");
        if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
      }

      // Show native browser warning dialog
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave the test? This will be recorded as a violation.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ================= SCROLL BLOCK =================
  useEffect(() => {
    const handleScroll = (e) => {
      if (!isReadyRef.current || submittedRef.current) return;
      // ✅ ONLY BLOCK ZOOM SCROLL TO ALLOW NORMAL READING
      if (e.ctrlKey) {
        e.preventDefault();
        logCheat("scroll-zoom");
        const newCount = scrollCountRef.current + 1;
        scrollCountRef.current = newCount;
        setScrollCount(newCount);

        if (newCount >= 3) {
           submitReasonRef.current = "Auto-Submit: Illegal zooming/scrolling";
           setPopup("autosubmit");
           if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
        } else {
           setPopup("zoom-warning");
        }
      }
    };

    window.addEventListener("wheel", handleScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);

  // ================= MOBILE GESTURES & BACK BUTTON BLOCK =================
  useEffect(() => {
    // Block pinch-to-zoom on mobile
    const handleTouchMove = (e) => {
      if (!isReadyRef.current || submittedRef.current) return;
      if (e.touches.length > 1) { // Multiple fingers = pinch zoom attempt
        e.preventDefault();
      }
    };

    // Block back button (Swipe left/right to go back/forward on mobile)
    window.history.pushState(null, null, window.location.href);
    const handlePopState = (e) => {
      if (!isReadyRef.current || submittedRef.current) return;
      window.history.pushState(null, null, window.location.href); // Force stay on the page
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ================= KEYBOARD BLOCK =================
useEffect(() => {

  const handleKeyDown = (e) => {
    if (!isReadyRef.current) return;

    // Block ESC and F11
    if (e.key === "Escape" || e.key === "F11") {
      e.preventDefault();
    }

    // 🚫 Block PrintScreen (Windows)
    if (e.key === "PrintScreen") {
      e.preventDefault();
      try { navigator.clipboard.writeText(""); } catch(err) {} // Clear clipboard
      logCheat("screenshot-attempt");
      alert("Screenshots are strictly prohibited and recorded as a violation.");
      return;
    }

    // 🚫 Block Mac Screenshot shortcuts (Cmd + Shift + 3/4/5)
    if (e.metaKey && e.shiftKey && ["3", "4", "5", "s", "S"].includes(e.key)) {
      e.preventDefault();
      logCheat("screenshot-attempt");
      alert("Screenshots are strictly prohibited and recorded as a violation.");
      return;
    }

    // Ctrl/Cmd shortcuts (Prevent open new tab, close tab, print, save, etc.)
    if (
      (e.ctrlKey || e.metaKey) &&
      ["c", "v", "u", "a", "p", "r", "t", "n", "w", "s"].includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
      return;
    }

    // Block Alt key combinations if possible (like Alt+Tab)
    if (e.altKey) {
      e.preventDefault();
      return;
    }

    // DevTools
    if (e.key === "F12") {
      e.preventDefault();
      return;
    }

    // 🚫 COMPLETE KEYBOARD BLOCK FOR MCQ EXAMS
    if (test?.examMode === "mcq") {
      e.preventDefault();
      return;
    }

    // ⌨️ ALLOW KEYBOARD ONLY IF TYPING IN WRITTEN/MIXED MODE TEXTAREA
    if (test?.examMode !== "mcq" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") {
      e.preventDefault();
    }

  };

  document.addEventListener("keydown", handleKeyDown);

  return () => document.removeEventListener("keydown", handleKeyDown);

}, [test]);
// ================= DEVTOOLS DETECTION =================
useEffect(() => {

  const detectDevTools = () => {
    if (!isReadyRef.current) return;
    const threshold = 160;

    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
     // ✅ ADD THIS
  logCheat("devtools"); 
      submitReasonRef.current = "Auto-Submit: DevTools opened";
      setPopup("autosubmit");
      if (!submittedRef.current && handleSubmitRef.current) {
        handleSubmitRef.current();
      }
    }
  };

  const interval = setInterval(detectDevTools, 2000);

  return () => clearInterval(interval);

}, []);
// ================= RESIZE DETECTION =================
useEffect(() => {

  const handleResize = () => {
    if (!isReadyRef.current) return;
    if (
      window.innerHeight < screen.height - 100 ||
      window.innerWidth < screen.width - 100
    ) {
      setPopup("tab-warning");
    }
  };

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);

}, []);
// ================= RANDOM CLICK DETECTION =================
useEffect(() => {

  const handleClick = () => {
    if (!isReadyRef.current) return;
    setClickCount(prev => {
      const newCount = prev + 1;

      if (newCount > 150) {
  logCheat("rapid-click");

  submitReasonRef.current = "Auto-Submit: Rapid click anomaly";
  setPopup("autosubmit");
  if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
}

      return newCount;
    });
  };

  document.addEventListener("click", handleClick);

  return () => document.removeEventListener("click", handleClick);

}, []);
// ================= COPY + RIGHT CLICK BLOCK =================
useEffect(() => {

  const disableRightClick = (e) => e.preventDefault();
  const disableCopy = (e) => e.preventDefault();

  document.addEventListener("contextmenu", disableRightClick);
  document.addEventListener("copy", disableCopy);
  document.addEventListener("cut", disableCopy);
  document.addEventListener("paste", disableCopy);

  return () => {
    document.removeEventListener("contextmenu", disableRightClick);
    document.removeEventListener("copy", disableCopy);
    document.removeEventListener("cut", disableCopy);
    document.removeEventListener("paste", disableCopy);
  };

}, []);
// ================= LOAD FACE MODEL =================
useEffect(() => {
  const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    setModelLoaded(true);
  };

  loadModels();
}, []);
// ================= START CAMERA =================
useEffect(() => {
  if (!test) return;
  if (!test.cameraRequired && !test.voiceRequired) return;

  let stream;

  const startMedia = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: test.cameraRequired || false,
        audio: test.voiceRequired || false
      });
      streamRef.current = stream;

      if (test.cameraRequired && videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }

      if (test.voiceRequired && stream.getAudioTracks().length > 0) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        audioCtxRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        const microphone = audioCtx.createMediaStreamSource(stream);
        const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioCtx.destination);
        window.audioScriptProcessor = scriptProcessor; // Prevent Garbage Collection

        scriptProcessor.onaudioprocess = () => {
          if (!isReadyRef.current || submittedRef.current) return;
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          for (let i = 0; i < array.length; i++) {
            values += (array[i]);
          }
          const average = values / array.length;
          
          const now = Date.now();
          if (average > 40 && now - lastNoiseTime.current > 5000) { 
            lastNoiseTime.current = now;
            logCheat("noise-detected");
            
            const newCount = noiseViolationCountRef.current + 1;
            noiseViolationCountRef.current = newCount;
            setNoiseViolationCount(newCount);
            
            if (newCount >= 3) {
              submitReasonRef.current = "Auto-Submit: Repeated noise/talking detected";
              setPopup("autosubmit");
              if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
            } else {
              setPopup("noise-warning");
            }
          }
        };
      }

    } catch (err) {
      console.log("Media blocked ❌");
      setPopup("camera-warning"); 
    }
  };

  startMedia();

  // ✅ ADD THIS CHECK AFTER START
  const checkCamera = setTimeout(() => {
    if (test.cameraRequired && !videoRef.current?.srcObject) {
      setPopup("camera-warning");
    }
  }, 3000);

  return () => {
    clearTimeout(checkCamera);

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

}, [test]);
// ================= FACE DETECTION =================
useEffect(() => {

  const interval = setInterval(async () => {

    // ✅ FIX: Ensure srcObject exists so it doesn't crash on blocked cameras
    if (!test?.cameraRequired || !videoRef.current?.srcObject || !modelLoaded || !isReadyRef.current) return;

    try {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        })
      );

      // ❌ NO FACE DETECTED
      if (detections.length === 0) {

        logCheat("face-missing");
        const newCount = totalFaceViolationsRef.current + 1;
        totalFaceViolationsRef.current = newCount;
        setTotalFaceViolations(newCount);

        if (newCount >= 3) {
          submitReasonRef.current = "Auto-Submit: Face missing from camera repeatedly";
          setPopup("autosubmit");
          if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
        } else {
          setPopup("face-warning");
        }
      }

      // ❌ MULTIPLE FACES
      else if (detections.length > 1) {

        logCheat("multiple-face");
        const newCount = totalFaceViolationsRef.current + 1;
        totalFaceViolationsRef.current = newCount;
        setTotalFaceViolations(newCount);

        if (newCount >= 3) {
          submitReasonRef.current = "Auto-Submit: Multiple faces detected";
          setPopup("autosubmit");
          if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();
        } else {
          setPopup("multiple-face-warning");
        }
      }

      // ✅ NORMAL FACE
      else {
      }

    } catch (err) {
      console.log("Face detection error");
    }

  }, 2000);

  return () => clearInterval(interval);

}, [test, modelLoaded]);
  // ================= LOAD =================
  useEffect(() => {
    const fetchTest = async () => {
      const res = await API.get(`/tests/${id}`);
      
      const data = res.data;

setTest(data);


// ✅ TEST ACTIVE TIME CHECK
const now = new Date();

if (
  data.startTime &&
  now < new Date(data.startTime)
) {

  alert("Test not started yet ⏰");

  navigate("/student-dashboard");

  return;
}

if (
  data.endTime &&
  now > new Date(data.endTime)
) {

  alert("Test expired ❌");

  navigate("/student-dashboard");

  return;
}


// ✅ PRIVATE TEST CHECK
const studentInfo =
  JSON.parse(
    localStorage.getItem("studentInfo")
  ) || {};

const studentEmail = (studentInfo.email || studentInfo.Email || user?.email || "").toLowerCase().trim();
const allowedList = (data.allowedStudents || []).map(e => e.toLowerCase().trim());
let isAllowed = true;
let rejectMessage = "";

let hasValidDomain = false;
if (data.allowedDomains && data.allowedDomains.length > 0) {
  hasValidDomain = data.allowedDomains.some(domain => {
    const checkDomain = domain.startsWith('@') ? domain : `@${domain}`;
    return studentEmail.endsWith(checkDomain.toLowerCase());
  });
}

if (data.isPrivate) {
  // Agar private test hai toh student list ya fir allowed domain dono mein se kisi ek mein pass hona zaruri hai
  if (!allowedList.includes(studentEmail) && !(data.allowedDomains?.length > 0 && hasValidDomain)) {
    isAllowed = false;
    rejectMessage = "You are not allowed for this test ❌";
  }
} else {
  // Public test mein siraf domain restriction apply hoga (agar dala gaya hai toh)
  if (data.allowedDomains && data.allowedDomains.length > 0 && !hasValidDomain) {
    isAllowed = false;
    rejectMessage = `Restricted Test ❌\nOnly students from allowed domains (${data.allowedDomains.join(', ')}) can take this test.`;
  }
}

if (!isAllowed) {
  alert(rejectMessage);
  window.location.href = "/student";
  return;
}

      const savedStateStr = localStorage.getItem(testStateKey);
      let restored = false;
      let restoredSections = null;

      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          setAnswers(savedState.answers || {});
          answersRef.current = savedState.answers || {};
          setReview(savedState.review || {});
          if (savedState.time !== undefined) setTime(savedState.time);
          if (savedState.sectionTimeLeft !== undefined) setSectionTimeLeft(savedState.sectionTimeLeft);
          if (savedState.qTimeLeft !== undefined) setQTimeLeft(savedState.qTimeLeft);
          if (savedState.sectionIndex !== undefined) setSectionIndex(savedState.sectionIndex);
          if (savedState.current !== undefined) setCurrent(savedState.current);
          if (savedState.lockedSections) setLockedSections(savedState.lockedSections);
          if (savedState.shuffledSections && savedState.shuffledSections.length > 0) {
            restoredSections = savedState.shuffledSections;
          }
          restored = true;
        } catch(e) { console.error("Failed to restore auto-save state", e); }
      }

      let activeSections = restoredSections;
      if (!activeSections) {
        let newShuffledSections = (data.sections || []).map((sec, originalSecIdx) => {
          const questionsWithIndex = [...sec.questions].map((q, idx) => ({ ...q, originalIndex: idx }));
          return {
            ...sec,
            originalSecIdx,
            questions: data.shuffleQuestions === false ? questionsWithIndex : questionsWithIndex.sort(() => Math.random() - 0.5)
          };
        });

        if (data.shuffleSections) {
          newShuffledSections = newShuffledSections.sort(() => Math.random() - 0.5);
        }
        activeSections = newShuffledSections;
      }

      setSections(activeSections);

      if (!restored) {
        const firstSection = activeSections[0];
        if (firstSection?.time) {
          setSectionTimeLeft(firstSection.time * 60);
        }
        setTime((data.totalTime || 1) * 60);
        const firstQ = firstSection?.questions?.[0];
        if (data.enableTimer && firstQ) {
          setQTimeLeft(firstQ.time || 0);
          setLockNavigation(true);
        }
      }

      // ✅ FIX: PAYMENT
      setPaid(!data.isPaid);
      setCheckingPayment(false);
    };

    fetchTest();
  }, [id]);

  // ================= AUTO-SAVE TO LOCALSTORAGE =================
  useEffect(() => {
    if (!isReadyRef.current || submittedRef.current || !test || sections.length === 0) return;
    const stateToSave = {
      answers,
      review,
      time,
      sectionTimeLeft,
      qTimeLeft,
      sectionIndex,
      current,
      lockedSections,
      shuffledSections: sections
    };
    localStorage.setItem(testStateKey, JSON.stringify(stateToSave));
  }, [answers, review, time, sectionTimeLeft, qTimeLeft, sectionIndex, current, lockedSections, test, sections]);

  // ================= TOTAL TIMER =================
  useEffect(() => {
    if (!isReadyRef.current || test?.timerMode !== "total" || submittedRef.current) return;

    if (time === null || time === undefined) return;

    if (time <= 0 && !submitted) {

        setTime(0);

        submitReasonRef.current = "Auto-Submit: Total test time expired";
        setPopup("autosubmit");

        if (!submittedRef.current && handleSubmitRef.current) handleSubmitRef.current();

        return;
      }

    const t = setInterval(() => {

  setTime(prev => {

    if (prev <= 1) {

      clearInterval(t);

      return 0;

    }

    return prev - 1;

  });

}, 1000);
    return () => clearInterval(t);
  }, [time, submitted]);

  // ================= PER QUESTION TIMER =================
  useEffect(() => {
    if (!isReadyRef.current || test?.timerMode !== "question" || submittedRef.current) return;

   if (qTimeLeft <= 0) {

  setQTimeLeft(0);

  setLockNavigation(false);

  const next = current + 1;

  // NEXT QUESTION
  if (next < questions.length) {

    setCurrent(next);

    const nextQ = questions[next];

    setQTimeLeft(nextQ?.time || 0);

    setLockNavigation(true);

  }

  // NEXT SECTION
  else if (sectionIndex + 1 < sections.length) {

    const nextSection = sectionIndex + 1;

    setSectionIndex(nextSection);

    setCurrent(0);

    const firstQ =
      sections[nextSection]?.questions?.[0];

    setQTimeLeft(firstQ?.time || 0);

    setLockNavigation(true);

  }

  // FINAL SUBMIT
  else {

    if (handleSubmitRef.current) handleSubmitRef.current();

  }

  return;
}

    const t = setInterval(() => {
      setQTimeLeft(prev => {

  if (prev <= 1) {

    clearInterval(t);

    return 0;

  }

  return prev - 1;

});
    }, 1000);

    return () => clearInterval(t);

  }, [qTimeLeft, test?.enableTimer]);

  // ================= SECTION TIMER =================
useEffect(() => {

  if (!isReadyRef.current || test?.timerMode !== "section" || submittedRef.current) return;

 if (sectionTimeLeft <= 0 && !submitted) {

    // ✅ SHOW POPUP
   setPopup("section-change");

    // ✅ LOCK CURRENT SECTION
    setLockedSections(prev => [
      ...prev,
      sectionIndex
    ]);

    const nextSection = sectionIndex + 1;

    // ================= NEXT SECTION =================
    if (nextSection < sections.length) {

      setTimeout(() => {

        // CLOSE POPUP
        setPopup(null);

        // CHANGE SECTION
        setSectionIndex(nextSection);

        // RESET QUESTION
        setCurrent(0);

        // RESET TIMER
        setSectionTimeLeft(
          (sections[nextSection]?.time || 0) * 60
        );

        // RESET QUESTION TIMER
        const firstQ =
          sections[nextSection]?.questions?.[0];

        if (test?.enableTimer && firstQ) {

          setQTimeLeft(firstQ.time || 0);

          setLockNavigation(true);

        }

      }, 2000);

    }

    // ================= FINAL SUBMIT =================
else {

  setPopup("autosubmit");

  if (!submittedRef.current && handleSubmitRef.current) {
    handleSubmitRef.current();
  }

}

    return;
  }

  // ✅ TIMER INTERVAL
  const timer = setInterval(() => {

    setSectionTimeLeft(prev => {

  if (prev <= 1) {

    clearInterval(timer);

    return 0;

  }

  return prev - 1;

});

  }, 1000);

  // ✅ CLEANUP
  return () => clearInterval(timer);

}, [
  sectionTimeLeft,
  sectionIndex,
  sections,
  test,
  submitted
]);

  // ================= PAYMENT =================
  const handlePayment = async () => {
  try {
    setPaymentStatus("loading");

    const { data: order } = await API.post("/payments/create-order", {
      testId: test._id,
      studentEmail: user?.email || "test@gmail.com"
    });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: order.amount,
      currency: "INR",
      name: "Gurukul Classes",
      description: test.title,
      order_id: order.id,

      handler: async function (response) {

        
        await API.post("/payments/verify", {
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature
        });

        setPaymentStatus("success");
        setPaid(true);
      },

      modal: {
        ondismiss: function () {
          setPaymentStatus("failed");
        }
      },

      theme: {
        color: "#1e293b"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error(err);
    setPaymentStatus("failed");
  }
};

  // ================= SELECT =================
 const selectAnswer = (index, opt) => {

  const originalSecIdx = sections[sectionIndex]?.originalSecIdx ?? sectionIndex;
  const originalQIndex = sections[sectionIndex]?.questions[index]?.originalIndex ?? index;
  const key = `${originalSecIdx}-${originalQIndex}`;

  setAnswers(prev => {
    const updated = { ...prev, [key]: opt };
    answersRef.current = updated;
    return updated;
  });
};

  // ================= SUBMIT =================
  const handleSubmit = async () => {
  if (submittedRef.current) return;
  submittedRef.current = true;
  setSubmitted(true);
  setPopup(null);
  try {
    const studentInfo =
  JSON.parse(localStorage.getItem("studentInfo")) || {};

    // Safely extract Exact Name and Email typed by the user in custom fields
    const emailField = testRef.current?.customFields?.find(f => f.label.toLowerCase().includes("email"));
    const finalStudentEmail = emailField && studentInfo[emailField.label] 
      ? studentInfo[emailField.label] 
      : (studentInfo.Email || studentInfo.email || user?.email || "guest@test.com");

    const nameField = testRef.current?.customFields?.find(f => f.label.toLowerCase() === "name");
    const finalStudentName = nameField && studentInfo[nameField.label]
      ? studentInfo[nameField.label]
      : (studentInfo.Name || studentInfo.name || "Guest");

    const payload = {
      testId: testRef.current?._id || test?._id,
      answers: answersRef.current,
      studentName: finalStudentName,

      studentEmail: finalStudentEmail,

      studentPhone:
        studentInfo.phone ||
        studentInfo.Phone ||
        "0000000000",

      studentRoll:
        studentInfo.roll ||
        studentInfo.Roll ||
        studentInfo["Roll No"] ||
        studentInfo["roll no"] ||
        "N/A",

      violations: {
        tabSwitches: tabSwitchCountRef.current,
        windowBlurs: windowBlurCountRef.current,
        cameraViolations: totalFaceViolationsRef.current,
        scrolls: scrollCountRef.current,
        noiseViolations: noiseViolationCountRef.current,
        reason: submitReasonRef.current
      },
      studentFields: studentInfo,

    };

    const res = await API.post("/results", payload);

    localStorage.setItem("resultId", res.data._id);

    navigate("/exam-submitted");
    
    // Clear the crash-proof auto-save after successful submission
    localStorage.removeItem(testStateKey);

  } catch (err) {
    console.error("SUBMIT ERROR:", err);
    submittedRef.current = false;
    setSubmitted(false); // 🔥 important
    const errorMessage = err.response?.data?.msg || err.response?.data?.message || "Submit failed ❌";
    alert(errorMessage);
  }
};


// ✅ FIX: Actually assign the handleSubmit to the ref so the event listeners can call it!
useEffect(() => {
  handleSubmitRef.current = handleSubmit;
});

const totalMarksCalc = useMemo(() => {
  if (!test) return 0;
  return test.sections?.reduce((acc, sec) => {
    return acc + (sec.questions || []).reduce((qAcc, q) => {
      if (q.type === 'written') return qAcc; 
      const qMarksCorrect = q.marksCorrect !== undefined && q.marksCorrect !== null ? q.marksCorrect : (test.marksCorrect || 4);
      return qAcc + qMarksCorrect;
    }, 0);
  }, 0) || 0;
}, [test]);

 // ONLY CHANGES ARE MARKED WITH ✅ FIX

// ================= PAYMENT BLOCK =================
if (test?.isPaid && !paid) {
  return (
    <div className="payment-container">

      <div className="payment-card">

        {test?.testImages?.length > 0 ? (
          <div style={{ textAlign: "center", marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {test.testImages.map((img, i) => (
              <img key={i} src={img} alt="Test Poster" style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain", margin: "0 auto", borderRadius: "8px" }} />
            ))}
          </div>
        ) : test?.testLogo && (
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <img src={test.testLogo} alt="Test Logo" style={{ maxHeight: "60px", maxWidth: "100%" }} />
          </div>
        )}
        <h2>{test.title}</h2>
        <p className="price">₹{test.price}</p>

        {paymentStatus === "loading" && (
          <p className="status loading">Processing payment...</p>
        )}

        {paymentStatus === "failed" && (
          <p className="status error">❌ Payment failed. Try again.</p>
        )}

        {paymentStatus !== "success" && (
          <button className="pay-btn" onClick={handlePayment}>
            Pay & Start Test
          </button>
        )}

      </div>
    </div>
  );
}

if (!test) return <h2>Loading...</h2>;

// ================= STRICT FULLSCREEN OVERLAY =================
if (isFullscreenSupported && !isFullscreen && !submitted) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f172a", color: "white", padding: "20px", textAlign: "center", zIndex: 9999, position: "fixed", top: 0, left: 0, width: "100%" }}>
      <div style={{ fontSize: "60px", marginBottom: "20px" }}>🚫</div>
      <h2 style={{ marginBottom: "15px", fontSize: "28px", fontWeight: "800", color: "#ef4444" }}>Full Screen Mode Required</h2>
      <p style={{ marginBottom: "25px", maxWidth: "600px", lineHeight: "1.6", color: "#cbd5e1", fontSize: "16px" }}>
        This is a secure, proctored exam. You are required to stay in full-screen mode until the test is submitted. 
        <br /><br />
        <strong style={{ color: "#f87171" }}>Warning:</strong> Exiting full screen, pressing ESC, or switching tabs is recorded as a violation. {3 - tabSwitchCountRef.current} attempts remaining before auto-submit.
      </p>
      <button 
        onClick={() => {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => alert("Fullscreen blocked by your browser. Please check settings."));
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen().catch(() => alert("Fullscreen blocked by your browser."));
          } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen().catch(() => alert("Fullscreen blocked by your browser."));
          }
        }}
        style={{ padding: "16px 32px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", fontSize: "18px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(37,99,235,0.4)" }}
      >
        Enter Full Screen to Start / Resume Exam
      </button>
    </div>
  );
}

const minutes = Math.floor(time / 60);
const seconds = time % 60;

// ✅ FIX: no change here
const currentSection = sections[sectionIndex];

const questions = currentSection?.questions || [];

const currentQ = questions[current] || {};
const originalSecIdx = currentSection?.originalSecIdx ?? sectionIndex;
const currentKey = `${originalSecIdx}-${currentQ?.originalIndex ?? current}`;

const answered = Object.keys(answers).filter(k => answers[k]).length;
const marked = Object.keys(review).length;
const totalQuestions = sections.reduce(
  (acc, sec) => acc + sec.questions.length,
  0
);

const notAnswered =
  Math.max(totalQuestions - answered, 0);

return (
  <div className="exam-container">

    {/* LEFT PANEL */}
    <div className="left-panel">
      <h3>Questions</h3>

      <div className="palette-grid">
        {questions.map((q, i) => {
          const originalSecIdx = currentSection?.originalSecIdx ?? sectionIndex;
          const key = `${originalSecIdx}-${q.originalIndex ?? i}`;

          return (
            <div
              key={i}
              className={`q-box
                ${answers[key] ? "answered" : ""}
                ${
                  review[key] && !answers[key]
                    ? "marked"
                    : ""
                }
                ${current === i ? "active" : ""}
              `}
             onClick={() => {

              if (lockNavigation) {
                setPopup("wait-timer");
                return;
              }

              setCurrent(i);

            }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="legend">
        <p>✅ Answered: {answered}</p>
        <p>🟪 Marked: {marked}</p>
        <p>⬜ Not Answered: {notAnswered}</p>
        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>🎯 Total Marks: {totalMarksCalc}</p>
      </div>
    </div>

    {/* RIGHT PANEL */}
    <div className="right-panel">

      {/* ✅ NEW TEST TITLE AND IMAGES ABOVE SECTIONS */}
      <div className="test-header-images" style={{ padding: "15px 20px", background: "white", borderBottom: "1px solid #eef1f8", textAlign: "center", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
        <h2 style={{ margin: "0 0 10px 0", color: "#0f1b3d", fontSize: "22px" }}>{test?.title}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
          {test?.testImages?.length > 0 
            ? test.testImages.map((img, i) => (
                <img key={i} src={img} alt="Test Poster" style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              ))
            : test?.testLogo && (
                <img src={test.testLogo} alt="Test Logo" style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              )
          }
        </div>
      </div>

      <div className="top-bar">
        <div className="sections">
          {sections.map((sec, index) => (

  <button
    key={index}

    className={`
      ${sectionIndex === index ? "active" : ""}
      ${lockedSections.includes(index) ? "locked-section" : ""}
    `}

    onClick={() => {

  // ✅ PER QUESTION LOCK
  if (lockNavigation) {

    setPopup("wait-timer");

    return;
  }

  // ✅ REAL CBT LOCK MODE
  if (test?.navigationMode === "locked") {

    // ONLY CURRENT SECTION ALLOWED
    if (index !== sectionIndex) {

      setPopup("section-locked");

      return;
    }

  }

  // ✅ COMPLETED SECTION LOCK
  if (
    test?.enableSectionLock &&
    lockedSections.includes(index)
  ) {

    setPopup("section-locked");

    return;
  }

  // ✅ SECTION TIMER LOCK
  if (test?.timerMode === "section" && sectionTimeLeft > 0 && index !== sectionIndex) {
    setPopup("section-timer-locked");
    return;
  }

  // ✅ NORMAL SWITCH
  setSectionIndex(index);

  setCurrent(0);

  // SECTION TIMER RESET
  if (test?.enableSectionTimer) {

    setSectionTimeLeft(
      (sections[index]?.time || 0) * 60
    );

  }

  // QUESTION TIMER RESET
  const firstQ =
    sections[index]?.questions?.[0];

  if (test?.enableTimer && firstQ) {

    setQTimeLeft(firstQ.time || 0);

    setLockNavigation(true);

  }

}}
  >
    {sec.name}
  </button>

))}
        </div>

       <div className="timer-wrapper">

  {/* TOTAL TIMER */}
  {test?.timerMode === "total" && (
    <div className="timer-card total-timer">

      <span>⏱ Total Time</span>

      <h3>
        {minutes}:
        {seconds < 10 ? `0${seconds}` : seconds}
      </h3>

    </div>
  )}

  {/* SECTION TIMER */}
  {test?.timerMode === "section" && (
    <div className="timer-card section-timer-card">

      <span>
        📚 {currentSection?.name} Timer
      </span>

      <h3>
        {Math.floor(sectionTimeLeft / 60)}:
        {sectionTimeLeft % 60 < 10
          ? `0${sectionTimeLeft % 60}`
          : sectionTimeLeft % 60}
      </h3>

    </div>
  )}

  {/* QUESTION TIMER */}
  {test?.timerMode === "question" && (
    <div className="timer-card question-timer-card">

      <span>⌛ Question Timer</span>

      <h3>
        {Math.floor(qTimeLeft / 60)}:
        {qTimeLeft % 60 < 10
          ? `0${qTimeLeft % 60}`
          : qTimeLeft % 60}
      </h3>

    </div>
  )}

</div>
      </div>

      <div className="question-area">
        <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Question {current + 1}</span>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>
            [+{currentQ?.marksCorrect !== undefined && currentQ?.marksCorrect !== null ? currentQ.marksCorrect : (test?.marksCorrect || 4)}, 
            -{currentQ?.marksNegative !== undefined && currentQ?.marksNegative !== null ? currentQ.marksNegative : (test?.marksNegative || 1)} Marks]
          </span>
        </h3>

        {/* FIGURE / QUESTION IMAGE */}
        {currentQ?.questionImage && (
          <div className="question-image" style={{ margin: "15px 0" }}>
            <img 
              src={currentQ.questionImage} 
              alt="Question Figure" 
              style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", border: "1px solid #e2e8f0" }} 
            />
          </div>
        )}
        
        <p>{currentQ?.q}</p>

        {/* MCQ MODE */}
{test?.examMode !== "written" && (
  ["A","B","C","D"].map(letter => (
    <div
      key={letter}
      className={`option ${
        answers[currentKey] === letter
          ? "selected"
          : ""
      }`}
      onClick={() => selectAnswer(current, letter)}
    >
      <strong>{letter}.</strong>

      {currentQ?.options?.[letter]}
    </div>
  ))
)}

{/* WRITTEN MODE */}
{test?.examMode === "written" && (
  <textarea
    className="written-answer"
    placeholder="Write your answer..."
    value={answers[currentKey] || ""}
    onChange={(e) => {
      setAnswers(prev => {
        const updated = { ...prev, [currentKey]: e.target.value };
        answersRef.current = updated;
        return updated;
      })
    }
    }
  />
)}
      </div>

      <div className="action-buttons">

        {/* PREVIOUS */}
        <button onClick={() => {

          if (lockNavigation) {
            setPopup("wait-timer");
            return;
          }

          if (current > 0) {
            setCurrent(current - 1);

            if (test?.enableTimer) {
              const prevQ = questions[current - 1];
              setQTimeLeft(prevQ?.time || 0);
              setLockNavigation(true);
            }
          }

        }}>
          Previous
        </button>

        {/* MARK */}
        <button className="review-btn" onClick={() => {
          const originalSecIdx = sections[sectionIndex]?.originalSecIdx ?? sectionIndex;
          const key = `${originalSecIdx}-${currentQ?.originalIndex ?? current}`;
          setReview(prev => ({
          ...prev,
          [key]: !answers[key]
        }));
          setCurrent(current + 1);
        }}>
          Mark & Next
        </button>

        {/* CLEAR */}
        <button className="clear-btn" onClick={() => {
          const originalSecIdx = sections[sectionIndex]?.originalSecIdx ?? sectionIndex;
          const key = `${originalSecIdx}-${currentQ?.originalIndex ?? current}`;
          setAnswers(prev => {
            const updated = { ...prev, [key]: null };
            answersRef.current = updated;
            return updated;
          });
        }}>
          Clear
        </button>

        {/* SAVE NEXT */}
        <button className="save-btn" onClick={() => {

          if (lockNavigation) {
            setPopup("wait-timer");
            return;
          }
          const originalSecIdx = sections[sectionIndex]?.originalSecIdx ?? sectionIndex;
          const key = `${originalSecIdx}-${currentQ?.originalIndex ?? current}`;

              if (answers[key]) {

                setReview(prev => {

                  const updated = { ...prev };

                  delete updated[key];

                  return updated;

                });

              }
          const next = current + 1;

          if (next < questions.length) {
            
            setCurrent(next);

            if (test?.enableTimer) {
              const nextQ = questions[next];
              setQTimeLeft(nextQ?.time || 0);
              setLockNavigation(true);
            }
          }
            else {

              // LAST QUESTION OF SECTION

              if (
                test?.timerMode !== "section" &&
                sectionIndex + 1 >= sections.length
              ) {

                let hasTimeRemaining = false;
                if (test?.timerMode === "total" && time > 0) hasTimeRemaining = true;
                else if (test?.timerMode === "question" && qTimeLeft > 0) hasTimeRemaining = true;

                if (hasTimeRemaining) {
                  setPopup("early-submit-blocked");
                } else {
                  setPopup("summary");
                }
              }

            }
        }}>
          Save & Next
        </button>

        {/* SUBMIT */}
        <button className="submit-btn" onClick={() => {
          let hasTimeRemaining = false;

          if (test?.timerMode === "total" && time > 0) {
            hasTimeRemaining = true;
          } else if (test?.timerMode === "section" && (sectionIndex < sections.length - 1 || sectionTimeLeft > 0)) {
            hasTimeRemaining = true;
          } else if (test?.timerMode === "question" && (sectionIndex < sections.length - 1 || current < questions.length - 1 || qTimeLeft > 0)) {
            hasTimeRemaining = true;
          }

          if (hasTimeRemaining) {
            setPopup("early-submit-blocked");
          } else {
            setPopup("summary");
          }
        }}>
          Final Submit
        </button>

      </div>

    </div>

    {/* POPUPS */}
    {popup && (
      <div className="popup-overlay">
        <div className="popup-box">

          {popup === "tab-warning" && (
            <>
              <h3>⚠️ Warning</h3>
              <p>Tab switch detected! Attempts left: {3 - tabSwitchCount}</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "zoom-warning" && (
            <>
              <h3>⚠️ Warning</h3>
              <p>Zooming/Pinching not allowed! Attempts left: {3 - scrollCountRef.current}</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}
                    {popup === "face-warning" && (
            <>
              <h3>⚠️ Camera Warning</h3>
              <p>No face detected! Please sit straight and don't try to move from the screen. Attempts left: {3 - totalFaceViolationsRef.current}</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "section-change" && (
                <>
                  <h3>📚 Section Completed</h3>

                  <p>
                    Moving to next section...
                  </p>
                </>
              )}
          {popup === "noise-warning" && (
            <>
              <h3>⚠️ Warning</h3>
              <p>Loud noise/talking detected! Attempts left: {3 - noiseViolationCountRef.current}</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "wait-timer" && (
            <>
              <h3>⛔ Action Denied</h3>
              <p>Please wait for the current timer to complete.</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "section-locked" && (
            <>
              <h3>⛔ Section Locked</h3>
              <p>You cannot navigate to this section right now. Complete the current one first.</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "section-timer-locked" && (
            <>
              <h3>⛔ Timer Active</h3>
              <p>You cannot switch sections until the section timer expires.</p>
              <button onClick={() => setPopup(null)}>OK</button>
            </>
          )}

          {popup === "autosubmit" && (
            <>
              <h3>🚨 Auto Submit</h3>
              <p>Too many violations. Submitting test...</p>
            </>
          )}

          {popup === "camera-warning" && (
             <>
                <h3>📷 Media Required</h3>
                <p>Please allow Camera/Microphone access to continue.</p>
                <button onClick={() => window.location.reload()}>
                  Retry
                </button>
             </>
            )}

          {popup === "early-submit-blocked" && (
            <div style={{ textAlign: "center", padding: "5px" }}>
              <div style={{ fontSize: "45px", marginBottom: "15px" }}>⏳</div>
              <h3 style={{ color: "#dc2626", fontSize: "22px", marginBottom: "10px", fontWeight: "800" }}>Action Not Allowed</h3>
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.5", marginBottom: "25px" }}>
                You cannot submit the test early. The exam will automatically submit once the allotted time is complete.
              </p>
              
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "15px", marginBottom: "25px" }}>
                <span style={{ display: "block", fontSize: "12px", color: "#ef4444", textTransform: "uppercase", fontWeight: "800", letterSpacing: "1px", marginBottom: "5px" }}>
                  Time Remaining
                </span>
                <span style={{ fontSize: "36px", fontWeight: "900", color: "#dc2626", fontFamily: "monospace" }}>
                  {test?.timerMode === "total" ? `${Math.floor(time / 60)}:${time % 60 < 10 ? `0${time % 60}` : time % 60}` :
                   test?.timerMode === "section" ? `${Math.floor(sectionTimeLeft / 60)}:${sectionTimeLeft % 60 < 10 ? `0${sectionTimeLeft % 60}` : sectionTimeLeft % 60}` :
                   `${Math.floor(qTimeLeft / 60)}:${qTimeLeft % 60 < 10 ? `0${qTimeLeft % 60}` : qTimeLeft % 60}`}
                </span>
              </div>

              <button 
                onClick={() => setPopup(null)}
                style={{ background: "#2563eb", color: "white", border: "none", width: "100%", padding: "14px", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", transition: "0.2s" }}
              >
                Resume Exam
              </button>
            </div>
          )}
          {popup === "summary" && (
            <>
              <h3>Submit Test?</h3>
              <p>Answered: {answered}</p>
              <p>Not Answered: {notAnswered}</p>
              <p>Marked: {marked}</p>

              <div className="popup-actions">
                <button onClick={() => setPopup(null)}>Cancel</button>
                <button onClick={handleSubmit}>
                  Submit
                </button>
              </div>
            </>
          )}
              
        </div>
      </div>
    )}

    {test?.cameraRequired && (
      <div className="video-wrapper">

        <div className="video-label">
          Live Monitoring
        </div>

        <div className="video-box">
          <video ref={videoRef} autoPlay muted />
        </div>

      </div>
    )}
  <footer className="test-footer">
  <span>Aptitude Today, Success Tomorrow</span>
</footer>
  </div>
);
};
export default TestPage;