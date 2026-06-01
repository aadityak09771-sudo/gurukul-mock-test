import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import "./StudentProfile.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const StudentProfile = () => {

  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get(`/results/student/${id}`);
        setData(res.data);
      } catch (err) {
        console.error("Profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) return <h2 style={{ padding: 30 }}>Loading...</h2>;
  if (!data) return <h2>No Data</h2>;

  return (
    <>
    <style>
      {`
        @media (max-width: 768px) {
          .profile-stats {
            flex-direction: column;
          }
        }
      `}
    </style>
    <div className="profile-page">

      <div className="profile-card">

        {/* HEADER */}
        <div className="profile-header">
          <div className="avatar">
            {data.studentName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2>{data.studentName}</h2>
            <p>Total Tests: {data.totalTests}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="profile-stats">
          <div className="stat-box">
            <h3>{data.totalTests}</h3>
            <p>Tests</p>
          </div>

          <div className="stat-box">
            <h3>{data.avg}%</h3>
            <p>Average</p>
          </div>
        </div>

        {/* CHART */}
        <h3>Performance</h3>

        <div className="chart-box">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.results}>
              <XAxis dataKey="testTitle" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#f5a623"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HISTORY */}
        <h3>Test History</h3>

        <div className="history">
          {data.results.map((r) => (
            <div key={r._id} className="history-item">
              <span>{r.testTitle}</span>
              <span>{r.score}/{r.total}</span>
              <span className="pill">{r.percentage}%</span>
            </div>
          ))}
        </div>

      </div>

    </div>
    </>
  );
};

export default StudentProfile;