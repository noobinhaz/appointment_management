const express = require("express");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { title, description, date, time } = req.body;
  try {
    const newAppointment = new Appointment({
      title,
      description,
      date,
      time,
      userId: req.userId,
      status: "pending",
    });
    await newAppointment.save();
    res.json(newAppointment);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

router.get("/", auth, async (req, res) => {
  const { search, status, from, to } = req.query;

  try {
    let query = { userId: req.userId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status (pending, accepted, rejected)
    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const appointments = await Appointment.find(query);
    res.json(appointments);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

router.put("/:id", auth, async (req, res) => {
  const { title, description, date, time, status } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ msg: "Appointment not found" });

    appointment.title = title || appointment.title;
    appointment.description = description || appointment.description;
    appointment.date = date || appointment.date;
    appointment.time = time || appointment.time;

    if (status === "accepted" || status === "rejected") {
      appointment.status = status;
    }

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ msg: "Appointment not found" });

    await appointment.deleteOne({ id: req.params.id });
    res.json({ msg: "Appointment removed" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" + error.message });
  }
});

module.exports = router;
