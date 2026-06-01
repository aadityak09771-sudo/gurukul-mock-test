// ================= EMAIL VALIDATION =================
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ================= PASSWORD VALIDATION =================
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// ================= REQUIRED FIELDS CHECK =================
const isEmpty = (value) => {
  return !value || value.trim() === "";
};

// ================= VALIDATE REGISTER =================
const validateRegister = ({ name, email, password }) => {
  if (isEmpty(name)) return "Name is required ❌";
  if (!isValidEmail(email)) return "Invalid email ❌";
  if (!isValidPassword(password))
    return "Password must be at least 6 characters ❌";

  return null;
};

// ================= VALIDATE LOGIN =================
const validateLogin = ({ email, password }) => {
  if (!isValidEmail(email)) return "Invalid email ❌";
  if (isEmpty(password)) return "Password is required ❌";

  return null;
};

// ================= VALIDATE TEST =================
const validateTest = (test) => {
  if (isEmpty(test.title)) return "Test title required ❌";
  if (!test.duration || test.duration <= 0)
    return "Invalid duration ❌";

  const totalQuestions =
    (test.questions?.verbal?.length || 0) +
    (test.questions?.numerical?.length || 0) +
    (test.questions?.reasoning?.length || 0);

  if (totalQuestions === 0)
    return "Add at least one question ❌";

  return null;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isEmpty,
  validateRegister,
  validateLogin,
  validateTest,
};