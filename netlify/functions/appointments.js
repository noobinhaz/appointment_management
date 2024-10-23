const { authorize } = require("./authorize");
const { connectToMongoDB } = require("./mongodb");
const mongoose = require("mongoose");

exports.handler = async (event) => {
  const method = event.httpMethod;
  const queryParams = new URLSearchParams(event.queryStringParameters);
  const pathParams = event.path.split("/").filter(Boolean);

  let statusCode = 200;
  let response = {};

  try {
    // event = authorize(event);
    // Connect to MongoDB
    const client = await connectToMongoDB();
    const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
    const appointmentsCollection = db.collection("appointments");

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "POST, OPTIONS", // Allowed methods
        },
      };
    }

    if (method === "GET") {
      // Handle search, status, and date filtering
      const search = queryParams.get("search") || "";
      const status = queryParams.get("status");
      const from = queryParams.get("from");
      const to = queryParams.get("to");
      const userId = event.userId; // Assume userId is passed in path params

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
      console.log(event);
      const { title, description, date, time } = JSON.parse(event.body);
      const userId = event?.userId;
      console.log(userId);
      const newAppointment = {
        title,
        description,
        date: new Date(date),
        time,
        userId,
        status: "pending",
      };
      const result = await appointmentsCollection.insertOne(newAppointment);
      response = result;
    } else if (method === "PUT") {
      const { title, description, date, time, status } = JSON.parse(event.body);
      const appointmentId = new mongoose.Types.ObjectId(
        pathParams[pathParams.length - 1]
      );

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
      console.log(pathParams);
      const appointmentId = new mongoose.Types.ObjectId(
        pathParams[pathParams.length - 1]
      );

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
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Allowed HTTP methods
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: error.message.startsWith("Unauthorized") ? 401 : 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Server Error: " + error.message }),
    };
  }
};
