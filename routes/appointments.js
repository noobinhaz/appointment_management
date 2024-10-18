const express = require("express");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");
const router = express.Router();

// Create an appointment
router.post("/", auth, async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const newAppointment = new Appointment({
      title,
      description,
      date,
      time,
      userId: req.userId,
    });
    await newAppointment.save();
    res.json(newAppointment);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

// Get appointments for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId });
    res.json(appointments);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

// Update an appointment
router.put("/:id", auth, async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ msg: "Appointment not found" });

    appointment.title = title || appointment.title;
    appointment.description = description || appointment.description;
    appointment.date = date || appointment.date;
    appointment.time = time || appointment.time;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

// Delete an appointment
router.delete("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ msg: "Appointment not found" });

    await appointment.remove();
    res.json({ msg: "Appointment removed" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
