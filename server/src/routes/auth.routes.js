const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Student = require("../models/Student");
const Company = require("../models/Company");

// Login / Register by Wallet Address
router.post("/login-wallet", async (req, res) => {
  try {
    const { walletAddress, role = "student", name } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    const normalizedAddress = walletAddress.toLowerCase().trim();
    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      user = new User({
        walletAddress: normalizedAddress,
        role,
        name: name || (role === "company" ? "Công ty đối tác" : "Sinh viên thực tập"),
        skills: role === "student" ? ["React", "JavaScript", "Solidity"] : [],
      });
      await user.save();
    }

    if (user.role === "student") {
      await Student.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, fullName: user.name, skills: user.skills || [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (user.role === "company") {
      await Company.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { userId: user._id, name: user.companyName || user.name } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Profile
router.get("/profile/:wallet", async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.params.wallet.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile (skills, bio, name)
router.put("/profile/:wallet", async (req, res) => {
  try {
    const { name, email, companyName, skills, bio } = req.body;
    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.wallet.toLowerCase().trim() },
      {
        $set: {
          ...(name && { name }),
          ...(email && { email }),
          ...(companyName && { companyName }),
          ...(skills && { skills }),
          ...(bio !== undefined && { bio }),
        },
      },
      { new: true, upsert: true }
    );
    if (user.role === "student") {
      await Student.findOneAndUpdate(
        { userId: user._id },
        { $set: { fullName: name || user.name, ...(skills && { skills }) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (user.role === "company") {
      await Company.findOneAndUpdate(
        { userId: user._id },
        { $set: { name: companyName || name || user.companyName || user.name } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
