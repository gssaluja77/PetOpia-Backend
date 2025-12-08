import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();
let _connection = undefined;
let _db = undefined;

const dbConnection = async () => {
  if (!_connection) {
    if (process.env.NODE_ENV === "development") {
      _connection = await MongoClient.connect(process.env.DATABASE_URL_LOCAL);
      _db = _connection.db(process.env.DATABASE_NAME);
      console.log("Local MongoDB connected");
    } else {
      _connection = await MongoClient.connect(process.env.MONGODB_URI);
      _db = _connection.db(process.env.DATABASE_NAME);
    }
  }

  return _db;
};
const closeConnection = () => {
  _connection.close();
};

export { dbConnection, closeConnection };
