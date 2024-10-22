const { MongoClient, ServerApiVersion } = require("mongodb");

// Use environment variables for MongoDB URI and credentials
const uri = process.env.MONGO_URI;

let client = null;

async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    try {
      await client.connect();
      console.log("Connected to MongoDB Atlas");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }
  return client;
}

module.exports = { connectToMongoDB };
