import { users } from "../config/mongoCollections.js";
import { badRequestError, internalServerError } from "../helpers/wrappers.js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

import client from "../config/redisClient.js";

dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const registerUser = async (email, password) => {
  const collection = await users();
  const existingUser = await collection.findOne({ email: email });

  if (existingUser) {
    throw badRequestError("User already exists with that email");
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const newUser = {
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

const checkUser = async (email, password) => {
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
  return { id: user._id.toString(), email: user.email };
};

export { registerUser, checkUser };
