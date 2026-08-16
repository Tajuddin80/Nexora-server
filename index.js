// Bun polyfill for node:v8 isBuildingSnapshot (fixes BSON/Mongoose under Bun)
if (typeof process !== "undefined" && process.getBuiltinModule) {
  const origGetBuiltinModule = process.getBuiltinModule;
  process.getBuiltinModule = function (name) {
    if (name === "v8") {
      return {
        startupSnapshot: {
          isBuildingSnapshot: () => false,
        },
      };
    }
    return origGetBuiltinModule.apply(this, arguments);
  };
}

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const initRentCron = require("./cron/rentCron");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
initRentCron();

// Start Server
app.listen(PORT, () => {
  console.log(`Nexora app listening on port ${PORT}`);
});

module.exports = app;
