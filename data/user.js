import { users } from "../config/mongoCollections.js";
import { badRequestError, internalServerError } from "../helpers/wrappers.js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

import client from "../config/redisClient.js";
import {
  validateEmail,
  validatePassword,
  validateString,
  validateUsername,
} from "../helpers/validations.js";
import moment from "moment";

dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const registerUser = async (firstName, lastName, username, email, password) => {
  firstName = firstName.trim();
  lastName = lastName.trim();

  validateString(firstName, "First Name");
  validateString(lastName, "Last Name");
  validateUsername(username);
  validateEmail(email);
  validatePassword(password);

  const collection = await users();
  const existingEmail = await collection.findOne({ email: email });
  const existingUsername = await collection.findOne({ username: username });

  if (existingEmail) {
    throw badRequestError("User already exists with that email");
  }
  if (existingUsername) {
    throw badRequestError("User already exists with that username");
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
    joinedDate: moment().format("MMM Do YYYY"),
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
