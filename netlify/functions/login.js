const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { connectToMongoDB } = require("./mongodb");

exports.handler = async (event) => {
  const { username, password } = JSON.parse(event.body);

  try {
    // Connect to MongoDB
    const client = await connectToMongoDB();
    const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
    const usersCollection = db.collection("users");

    // Find the user
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ msg: "Invalid credentials" }),
      };
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({ msg: "Invalid credentials" }),
      };
    }

    // Create a JWT token
    const payload = { userId: user._id };
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
