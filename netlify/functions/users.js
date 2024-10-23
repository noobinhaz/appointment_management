const { connectToMongoDB } = require("./mongodb");
const { authorize } = require("./authorize");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Update '*' to the specific domain if needed
          "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow Authorization header
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Allow HTTP methods
        },
        body: JSON.stringify({ msg: "CORS preflight handled." }),
      };
    }
    event = authorize(event);
    // Parse the search query from the URL parameters
    const search =
      new URLSearchParams(event.queryStringParameters).get("search") || "";

    // Connect to MongoDB
    const client = await connectToMongoDB();
    const db = client.db(process.env.DATABASE_NAME); // Replace with your actual database name
    const usersCollection = db.collection("users");

    // Build query for search functionality (optional)
    let query = {};
    if (search) {
      query = { username: { $regex: search, $options: "i" } }; // Search by username (case-insensitive)
    }

    // Fetch users and exclude passwords from the result
    const users = await usersCollection
      .find(query)
      .project({ password: 0 })
      .toArray();

    // Return the list of users
    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    // Handle errors
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error: " + error.message }),
    };
  }
};
