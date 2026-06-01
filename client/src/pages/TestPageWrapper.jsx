import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TestPage from "../components/test/TestPage";
import { getTestById } from "../services/testService";
import "./TestPageWrapper.css";

const TestPageWrapper = () => {
  const { id } = useParams(); // /test/:id

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FETCH TEST =================
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await getTestById(id);
        setTest(res.data);
      } catch (err) {
        console.error("Error fetching test:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="test-wrapper">
        <div className="test-loading">Loading Test...</div>
      </div>
    );
  }

  // ================= ERROR =================
  if (!test) {
    return (
      <div className="test-wrapper">
        <div className="test-error">Test not found ❌</div>
      </div>
    );
  }

  // ================= PASS DATA =================
  return (
    <div className="test-wrapper">
      <TestPage test={test} />
    </div>
  );
};

export default TestPageWrapper;