const { connectToMongoDB } = require("./mongodb");
const { authorize } = require("./authorize");

exports.handler = async (event) => {
  try {
    // Handle CORS preflight (OPTIONS request)
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

    // Authorization check
    event = authorize(event);
    if (event.httpMethod === "GET") {
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

      // Return the list of users with CORS headers
      // Return the list of users with CORS headers
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow requests from any origin
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Allowed HTTP methods
          "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow specific headers
          "Content-Type": "application/json", // Ensure JSON response type
        },
        body: JSON.stringify(users),
      };
    }
  } catch (error) {
    // Handle errors with CORS headers
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Allowed HTTP methods
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allow specific headers
      },
      body: JSON.stringify({ error: "Server Error: " + error.message }),
    };
  }
};
