import { closeConnection } from "../config/mongoConnection.js";
import { users, communityPosts } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import client from "../config/redisClient.js";
import moment from "moment";

const seedUsers = [
  {
    _id: new ObjectId("692df3ac08b2aa2aaad932a1"),
    firstName: "Gundeep",
    lastName: "Singh Saluja",
    username: "gssaluja",
    email: "gssaluja77@gmail.com",
    joinedDate: "Aug 15th 2024",
    hashedPassword:
      "$2b$10$NIpGJC36WxLCwGhi2V7MjuvzeXc6GCsfr1ijbkqpJM6yrJzfRKm9q",
    pets: [
      {
        _id: new ObjectId("692e1cc003e74f298f2f2d3e"),
        petImage:
          "https://res.cloudinary.com/dbjlccagd/image/upload/v1764633658/petopia/doo3yvep4v3fwimflw7z.jpg",
        petName: "Sam",
        petAge: "7",
        petType: "Dog",
        petBreed: "Pomeranian",
        medications: [],
        appointments: [],
        prescription: [],
      },
    ],
  },
  {
    _id: new ObjectId("656a84c6c0b3d7a8e1b9f0a1"),
    firstName: "Alice",
    lastName: "Thompson",
    username: "alicet_01",
    email: "alice.thompson@gmail.com",
    joinedDate: "Oct 20th 2024",
    hashedPassword:
      "$2b$10$NIpGJC36WxLCwGhi2V7MjuvzeXc6GCsfr1ijbkqpJM6yrJzfRKm9q",
    pets: [],
  },
  {
    _id: new ObjectId("656a84c6c0b3d7a8e1b9f0a2"),
    firstName: "Michael",
    lastName: "Clark",
    username: "mclark_usa",
    email: "michael.clark33@gmail.com",
    joinedDate: "Nov 15th 2024",
    hashedPassword:
      "$2b$10$NIpGJC36WxLCwGhi2V7MjuvzeXc6GCsfr1ijbkqpJM6yrJzfRKm9q",
    pets: [],
  },
  {
    _id: new ObjectId("656a84c6c0b3d7a8e1b9f0a3"),
    firstName: "Priya",
    lastName: "Sharma",
    username: "priya_sharma",
    email: "priya.sharma_in@gmail.com",
    joinedDate: "Dec 9th 2024",
    hashedPassword:
      "$2b$10$NIpGJC36WxLCwGhi2V7MjuvzeXc6GCsfr1ijbkqpJM6yrJzfRKm9q",
    pets: [],
  },
];

const seedPosts = [
  {
    _id: new ObjectId("692e2ecdfceac4ba8f24b8dd"),
    userThatPosted: "656a84c6c0b3d7a8e1b9f0a1",
    username: "alicet_01",
    firstName: "Alice",
    lastName: "Thompson",
    postImage:
      "https://res.cloudinary.com/dbjlccagd/image/upload/v1764634316/petopia/liejlhtvfv20wegrg8x9.jpg",
    postTitle: "Staring problem",
    postDescription:
      "My cutie keeps staring without even blinking as soon as he sees someone😅🐶.",
    postDate: "Mar 11th 2025",
    postTime: "8:45 AM",
    postTimestamp: new Date("2025-03-11T08:45:00.000Z"),
    postComments: [],
    postLikes: [],
  },
  {
    _id: new ObjectId("692e2f15fceac4ba8f24b8de"),
    userThatPosted: "692df3ac08b2aa2aaad932a1",
    username: "gssaluja",
    firstName: "Gundeep",
    lastName: "Singh Saluja",
    postImage:
      "https://res.cloudinary.com/dbjlccagd/image/upload/v1764634388/petopia/rgncivqcshxigzzuthpy.jpg",
    postTitle: "Samuuu...",
    postDescription:
      "He was 7 years old when I lost him. I still miss him so much...!!😔",
    postDate: "Sep 23rd 2025",
    postTime: "3:17 PM",
    postTimestamp: new Date("2025-09-23T15:17:00.000Z"),
    postComments: [],
    postLikes: [],
  },
  {
    _id: new ObjectId("692e2f3ffceac4ba8f24b8df"),
    userThatPosted: "656a84c6c0b3d7a8e1b9f0a2",
    username: "mclark_usa",
    firstName: "Michael",
    lastName: "Clark",
    postImage:
      "https://res.cloudinary.com/dbjlccagd/image/upload/v1764634430/petopia/vco2edmkfatkazvwbde5.jpg",
    postTitle: "Kitty kitty...🐱",
    postDescription: "Meet me two new adopted cuties...❤️",
    postDate: "Apr 5th 2025",
    postTime: "10:02 PM",
    postTimestamp: new Date("2025-04-05T22:02:00.000Z"),
    postComments: [],
    postLikes: [],
  },
  {
    _id: new ObjectId("692e2f5ffceac4ba8f24b8e0"),
    userThatPosted: "656a84c6c0b3d7a8e1b9f0a3",
    username: "priya_sharma",
    firstName: "Priya",
    lastName: "Sharma",
    postImage:
      "https://res.cloudinary.com/dbjlccagd/image/upload/v1764634480/petopia/vjpsgn9riqwys1vsbdta.jpg",
    postTitle: "My dog has anxiety issue",
    postDescription:
      "Keeps looking out the window, doesn't bark at anyone, nor does he ever get excited :(",
    postDate: "Feb 1st 2025",
    postTime: "6:55 AM",
    postTimestamp: new Date("2025-02-01T06:55:00.000Z"),
    postComments: [],
    postLikes: [],
  },
].sort((a, b) => {
  const format = "MMM Do YYYY h:mm A";
  const dateA = moment(a.postDate + " " + a.postTime, format);
  const dateB = moment(b.postDate + " " + b.postTime, format);
  if (!dateA.isValid() || !dateB.isValid()) {
    return 0;
  }
  return dateB - dateA;
});

const seedDB = async () => {
  await client.awaitConnection();

  // Clear Redis cache before seeding
  try {
    console.log("Clearing Redis cache...");
    await client.flushDb();
  } catch (error) {
    console.error("Redis connection error during seeding:", error);
  }

  const userCollection = await users();
  const postCollection = await communityPosts();

  try {
    await postCollection.createIndex({ postTimestamp: -1 });
    console.log("Index on postTimestamp created successfully.");
  } catch (e) {
    console.error("Error creating index on postTimestamp:", e);
  }

  // Clear db collections
  try {
    console.log("Clearing existing collections...");
    await userCollection.deleteMany({});
    await postCollection.deleteMany({});
  } catch (e) {
    console.error("Error clearing collections:", e);
  }

  // Seed data
  try {
    console.log("Seeding users...");
    await userCollection.insertMany(seedUsers);
    console.log("Seeding posts...");
    await postCollection.insertMany(seedPosts);
    console.log("Seeding completed.");
  } catch (e) {
    console.error("Error seeding data:", e);
  }

  // Close connections
  try {
    console.log("Closing database connection...");
    closeConnection();
  } catch (e) {
    console.error("Error closing MongoDB connection:", e);
  }

  try {
    console.log("Closing redis client connection...");
    await client.quit();
  } catch (e) {
    console.error("Error closing Redis connection:", e);
  }
};

seedDB();
