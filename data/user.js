import { users } from "../config/mongoCollections.js";
import { badRequestError, internalServerError } from "../helpers/wrappers.js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

import client from "../config/redisClient.js";
import { validateEmail, validatePassword, validateString, validateUsername } from "../helpers/validations.js";

dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const registerUser = async (firstName, lastName, username, email, password) => {
  validateString(firstName, "First Name");
  validateString(lastName, "Last Name");
  validateUsername(username);
  validateEmail(email);
  validatePassword(password);

  const collection = await users();
  const existingUser = await collection.findOne({ email: email });

  if (existingUser) {
    throw badRequestError("User already exists with that email");
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (e) {
    throw internalServerError(e);
  }
  const newUser = {
    firstName,
    lastName,
    username,
    email,
    hashedPassword,
    pets: [],
  };

  let insertInfo = await collection.insertOne(newUser);
  if (!insertInfo.acknowledged) {
    throw internalServerError("Error : Could not add user!");
  }
  let id = insertInfo.insertedId.toString();
  await client.set(email, id);
  return { id, email };
};

const loginUser = async (email, password) => {
  validateEmail(email);
  validatePassword(password);
  const collection = await users();
  const user = await collection.findOne({ email: email });
  if (!user) {
    throw badRequestError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    throw badRequestError("Invalid email or password");
  }

  await client.set(email, user._id.toString());
  return {
    id: user._id.toString(),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

export { registerUser, loginUser };
