import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "./AdminPayment.css";

const AdminPayment = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await API.get("/payments/all");
      setPayments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const approvePayment = async (id) => {
    try {
      // ✅ FIXED ROUTE
      await API.put(`/payments/approve/${id}`);
      fetchPayments();
    } catch (err) {
      alert("Error approving payment");
    }
  };

  return (
    <div className="payments-page">
      <h2>💳 Payments</h2>

      <div className="payments-table">

        {/* HEADER */}
        <div className="table-header">
          <span>Email</span>
          <span>Test</span>
          <span>Amount</span>
          <span>Payment ID</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {/* DATA */}
        {payments.length === 0 ? (
          <div className="no-data">No payments found</div>
        ) : (
          payments.map((p) => (
            <div key={p._id} className="table-row">

              {/* ✅ FIXED FIELDS */}
              <span>{p.studentEmail || "-"}</span>
              <span>{p.testId?.title || "-"}</span>
              <span>₹{p.amount}</span>
              <span>{p.razorpay_payment_id || "-"}</span>

              <span className={p.verifiedByAdmin ? "status-ok" : "status-pending"}>
                {p.verifiedByAdmin ? "Approved" : p.status}
              </span>

              <span>
                {!p.verifiedByAdmin && (
                  <button
                    className="approve-btn"
                    onClick={() => approvePayment(p._id)}
                  >
                    Approve
                  </button>
                )}
              </span>

            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default AdminPayment;