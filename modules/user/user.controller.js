const {
  createOrUpdateUserInDB,
  loginUserService,
  getUserRoleFromDB,
} = require("./user.service");

const postUser = async (req, res) => {
  try {
    const result = await createOrUpdateUserInDB(req.body);
    res.status(result.status).send(result.data);
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("POST /users/login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserRole = async (req, res) => {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const role = await getUserRoleFromDB(email);
    res.json({ role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  postUser,
  loginUser,
  getUserRole,
};
