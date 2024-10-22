const { connectToMongoDB } = require("./mongodb");
const mongoose = require("mongoose");

exports.handler = async (event) => {
  const method = event.httpMethod;
  const queryParams = new URLSearchParams(event.queryStringParameters);
  const pathParams = event.path.split("/").filter(Boolean);

  let statusCode = 200;
  let response = {};

  try {
    // Connect to MongoDB
    const client = await connectToMongoDB();
    const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
    const appointmentsCollection = db.collection("appointments");

    if (method === "GET") {
      // Handle search, status, and date filtering
      const search = queryParams.get("search") || "";
      const status = queryParams.get("status");
      const from = queryParams.get("from");
      const to = queryParams.get("to");
      const userId = pathParams[1]; // Assume userId is passed in path params

      let query = { userId };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (status) {
        query.status = status;
      }

      if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
      }

      const appointments = await appointmentsCollection.find(query).toArray();
      response = appointments;
    } else if (method === "POST") {
      // Create a new appointment
      const { title, description, date, time, userId } = JSON.parse(event.body);
      const newAppointment = {
        title,
        description,
        date: new Date(date),
        time,
        userId,
        status: "pending",
      };
      const result = await appointmentsCollection.insertOne(newAppointment);
      response = result.ops[0]; // MongoDB returns the created document
    } else if (method === "PUT") {
      const { title, description, date, time, status } = JSON.parse(event.body);
      const appointmentId = new mongoose.Types.ObjectId(pathParams[1]);

      const appointment = await appointmentsCollection.findOne({
        _id: appointmentId,
      });
      if (!appointment) {
        statusCode = 404;
        response = { msg: "Appointment not found" };
      } else {
        const updatedAppointment = {
          ...appointment,
          title: title || appointment.title,
          description: description || appointment.description,
          date: date ? new Date(date) : appointment.date,
          time: time || appointment.time,
          status: status || appointment.status,
        };

        await appointmentsCollection.updateOne(
          { _id: appointmentId },
          { $set: updatedAppointment }
        );
        response = updatedAppointment;
      }
    } else if (method === "DELETE") {
      const appointmentId = new mongoose.Types.ObjectId(pathParams[1]);

      const appointment = await appointmentsCollection.findOne({
        _id: appointmentId,
      });
      if (!appointment) {
        statusCode = 404;
        response = { msg: "Appointment not found" };
      } else {
        await appointmentsCollection.deleteOne({ _id: appointmentId });
        response = { msg: "Appointment removed" };
      }
    } else {
      statusCode = 405;
      response = { msg: "Method Not Allowed" };
    }

    return {
      statusCode,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error: " + error.message }),
    };
  }
};
