const mongoose = require("mongoose");

// Define Schemes
const responseSchema = mongoose.Schema(
  {
    userId: String, 
    deployId: String, 
    responses: {},
  },
  { strict: false, timestamps: true }
);

// Create Model
const response = mongoose.model("Response", responseSchema);

module.exports = response;
