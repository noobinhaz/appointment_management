const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToMongoDB } = require("./mongodb"); // Import MongoDB connection utility

exports.handler = async (event) => {
  const { username, password } = JSON.parse(event.body);

  try {
    // Connect to MongoDB
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Update '*' to the specific domain if needed
          "Access-Control-Allow-Headers": "Content-Type", // Allow Authorization header
          "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow HTTP methods
        },
        body: JSON.stringify({ msg: "CORS preflight handled." }),
      };
    }
    const client = await connectToMongoDB();
    const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
    const usersCollection = db.collection("users");

    // Check if the user already exists
    let user = await usersCollection.findOne({ username });
    if (user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ msg: "User already exists" }),
      };
    }

    // Create a new user (hash the password)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword };
    await usersCollection.insertOne(newUser);

    // Create a JWT token
    const payload = { userId: newUser._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return the token
    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error" }),
    };
  }
};
