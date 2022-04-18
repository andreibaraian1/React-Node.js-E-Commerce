const pool = require("../db.config");
const userServices = require("../services/users.services");
const login = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const result = await userServices.login(username, password);
    if (result?.error) {
      res.status(result.status).json({ error: result.error });
    } else {
      res.cookie("token", result.token, { maxage: 86400, httpOnly: true });
      res.status(result.status).json({ message: result.message });
    }
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
};
const register = async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const result = await userServices.register(username, password, email);
    if (result?.error) {
      res.status(result.status).json({ error: result.error });
    } else {
      res.status(result.status).json({ message: result.message });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Unexpected error");
  }
};
const logout = (req, res) => {
  return res
    .clearCookie("token")
    .status(200)
    .json({ message: "Successfully logged out !" });
};
const getUser = (req, res) => {
  try {
    return res.json({
      user: {
        id: req.userId,
        username: req.username,
        role: req.role,
      },
    });
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
};
const getUserInfo = async (req, res) => {
  const userId = req.userId;
  try {
    const userQuery = await pool.query(
      "SELECT id, username, email, address, telephone, role, date_joined, subscription, first_name, last_name, city, state, zipcode, country FROM USERS WHERE id=$1",
      [userId]
    );
    return res.status(200).json(userQuery.rows[0]);
  } catch (err) {
    res.status(500).send("Unexpected error");
  }
};
module.exports = {
  login,
  register,
  logout,
  getUser,
  getUserInfo,
};
