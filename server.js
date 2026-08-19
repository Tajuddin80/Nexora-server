require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { initRentCron } = require("./cron/rentCron");

const PORT = process.env.PORT || 5000;

// Connect to Database & Initialize Background Tasks
connectDB();
initRentCron();

app.listen(PORT, () => {
  console.log(`Nexora Server listening on port ${PORT}`);
});
