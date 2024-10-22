const jwt = require("jsonwebtoken");

const authorize = (event) => {
  const token = event.headers.Authorization || event.headers.authorization;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    event.userId = decoded?.userId;
    return event;
  } catch (error) {
    throw new Error("Unauthorized");
  }
};

module.exports = { authorize };
