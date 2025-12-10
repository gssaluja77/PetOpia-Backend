import { Router } from "express";
const router = Router();
import xss from "xss";
import { validateEmail, validatePassword, validateString, validateUsername } from "../helpers/validations.js";
import { registerUser, loginUser } from "../data/user.js";
import { deleteSession } from "../helpers/sessionUtil.js";
import authMiddleware from "../middleware/authMiddleware.js";

router.route("/signup").post(async (req, res) => {
  let input = req.body;
  let firstName = xss(input.firstName);
  let lastName = xss(input.lastName);
  let username = xss(input.username);
  let email = xss(input.email);
  let password = input.password;

  try {
    firstName = firstName.trim();
    lastName = lastName.trim();

    validateString(firstName, "First Name");
    validateString(lastName, "Last Name");
    validateUsername(username);
    validateEmail(email);
    validatePassword(password);

    let data = await registerUser(firstName, lastName, username, email, password);

    res.status(200).send(data);
  } catch (error) {
    let status = 400;
    if (error.message.includes("already exists")) status = 409;
    res.status(status).json({ error: error.message });
  }
});

router.route("/login").post(async (req, res) => {
  let input = req.body;
  let email = xss(input.email);
  let password = input.password;

  try {
    validateEmail(email);
    validatePassword(password);

    let data = await loginUser(email, password);

    res.status(200).send(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.route("/logout").post(authMiddleware, async (req, res) => {
  try {
    const sessionId = req.headers.authorization;
    await deleteSession(sessionId);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
