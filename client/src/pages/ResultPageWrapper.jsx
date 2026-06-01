import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ResultPage from "../components/result/ResultPage";
import { getResultById } from "../services/resultService";

const ResultPageWrapper = () => {
  const { id } = useParams(); // /result/:id
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= FETCH RESULT =================
  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await getResultById(id);
        setResult(res.data);
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="result-wrapper">
        <div className="result-loading">Loading Result...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-wrapper">
        <div className="result-error">Result not found ❌</div>
      </div>
    );
  }

  return (
    <div className="result-wrapper">
      <div className="result-container">
        <ResultPage result={result} />
      </div>
    </div>
  );
};
export default ResultPageWrapper;