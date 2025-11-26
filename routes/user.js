import { Router } from "express";
const router = Router();
import xss from "xss";
import client from "../config/redisClient.js";
import { validateEmail, validatePassword } from "../helpers/validations.js";
import { registerUser, checkUser } from "../data/user.js";

router.route("/signup").post(async (req, res) => {
  let input = req.body;
  let email = xss(input.email);
  let password = input.password;

  try {
    validateEmail(email);
    validatePassword(password);

    let data = await registerUser(email, password);
    await client.set(email, data.id);

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

    let data = await checkUser(email, password);

    await client.set(email, data.id);

    res.status(200).send(data);
  } catch (error) {

    res.status(400).json({ error: error.message });
  }
});

export default router;
