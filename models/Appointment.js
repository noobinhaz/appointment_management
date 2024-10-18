const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  time: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
