const { connectToMongoDB } = require("./mongodb");

exports.handler = async (event) => {
  try {
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
