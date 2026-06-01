const Material = require("../models/Material");

// ================= CREATE MATERIAL =================
exports.createMaterial = async (req, res) => {
  try {
    const { title, category, description, fileUrl, type } = req.body;
    if (!title || !fileUrl || !type) {
      return res.status(400).json({ msg: "Please fill all required fields" });
    }
    const material = await Material.create({ title, category: category || "General", description, fileUrl, type });
    res.status(201).json(material);
  } catch (err) {
    console.error("CREATE MATERIAL ERROR:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// ================= GET ALL MATERIALS =================
exports.getMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    console.error("GET MATERIALS ERROR:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// ================= DELETE MATERIAL =================
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: "Material not found" });
    }
    res.json({ msg: "Material deleted successfully" });
  } catch (err) {
    console.error("DELETE MATERIAL ERROR:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};