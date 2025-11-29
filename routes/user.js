import { Router } from "express";
const router = Router();
import xss from "xss";
import { validateEmail, validatePassword, validateString } from "../helpers/validations.js";
import { registerUser, loginUser } from "../data/user.js";

router.route("/signup").post(async (req, res) => {
  let input = req.body;
  let firstName = xss(input.firstName);
  let lastName = xss(input.lastName);
  let email = xss(input.email);
  let password = input.password;

  try {
    validateString(firstName, "First Name");
    validateString(lastName, "Last Name");
    validateEmail(email);
    validatePassword(password);

    let data = await registerUser(firstName, lastName, email, password);

    res.status(200).send(data);
  } catch (error) {
    let status = 400;
    // if (error.message.includes("already exists")) status = 409;
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

export default router;
