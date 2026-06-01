const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ================= STUDENT SCHEMA =================
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required ❌"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required ❌"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format ❌"],
    },

    password: {
      type: String,
      required: [true, "Password is required ❌"],
      minlength: 6,
      select: false, // 🔥 Hide password by default
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    avatar: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================= HASH PASSWORD =================
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ================= MATCH PASSWORD =================
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ================= REMOVE PASSWORD FROM RESPONSE =================
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Student", studentSchema);