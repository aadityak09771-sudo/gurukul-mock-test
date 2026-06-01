import { useState } from "react";
import { registerStudent } from "../../services/authService";
import "./StudentRegister.css";
export default function StudentRegister({ setIsRegister }) {
  const [form, setForm] = useState({});

  const handleRegister = async () => {
    try {
      await registerStudent(form);
      alert("Registered successfully");
      setIsRegister(false);
    } catch {
      alert("Error");
    }
  };

  return (
    <>
      <h2>Create Account</h2>
      <input
        className="auth-input"
        placeholder="Name"
        onChange={(e)=>setForm({...form,name:e.target.value})}
      />

      <input
        className="auth-input"
        placeholder="Email"
        onChange={(e)=>setForm({...form,email:e.target.value})}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Password"
        onChange={(e)=>setForm({...form,password:e.target.value})}
      />

      <button className="btn-primary" onClick={handleRegister}>
        Register →
      </button>
    </>
  );
}