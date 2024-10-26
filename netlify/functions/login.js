const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToMongoDB } = require("./mongodb");

exports.handler = async (event) => {
  // Define CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Replace '*' with your domain for better security
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
    };
  }

  // Check if body exists for POST requests
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ msg: "Invalid request: Missing body" }),
    };
  }

  const { username, password } = JSON.parse(event.body);

  console.log(username, password);

  try {
    if (event.httpMethod === "POST") {
      // Connect to MongoDB
      const client = await connectToMongoDB();
      const db = client.db(process.env.DATABASE_NAME);
      const usersCollection = db.collection("users");

      // Find the user
      const user = await usersCollection.findOne({ username });
      if (!user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ msg: "Invalid credentials" }),
        };
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ msg: "Invalid credentials" }),
        };
      }

      // Generate JWT token
      const payload = { userId: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Return token
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ token }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server Error: ${error.message}` }),
    };
  }
};
