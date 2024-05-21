const mongoose = require("mongoose");

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to database: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `Database connection error: ${error.name} - ${error.message}`
    );
    process.exit(1);
  }
};

module.exports = connectDB;
