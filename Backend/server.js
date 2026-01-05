require('dotenv').config();
const app = require("./src/app");
const { connectDB } = require("./src/db/db");

// Log the Mongo URI for debugging (do NOT commit sensitive credentials)
console.log('MONGODB_URI (raw)=', process.env.MONGODB_URI);

(async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err && err.message ? err.message : err);
  }
})();