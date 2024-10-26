const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToMongoDB } = require("./mongodb"); // Import MongoDB connection utility

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*", // Replace '*' with your domain for better security
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
    };
  }

  try {
    if (event.httpMethod === "POST") {
      const { username, password } = JSON.parse(event.body);
      const client = await connectToMongoDB();
      const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
      const usersCollection = db.collection("users");

      let user = await usersCollection.findOne({ username });
      if (user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ msg: "User already exists" }),
        };
      }

      // Create a new user (hash the password)
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { username, password: hashedPassword };
      await usersCollection.insertOne(newUser);
      console.log("password hashed");
      // Create a JWT token
      const payload = { userId: newUser._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      console.log("pucking payload");
      // Return the token
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
      body: JSON.stringify({ error: "Server Error" }),
    };
  }
};
