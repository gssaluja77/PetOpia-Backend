import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import { validateObjectId } from "../helpers/validations.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";
import client from "../config/redisClient.js";

const likePost = async (userId, postId) => {
  validateObjectId(userId, "User ID");
  validateObjectId(postId, "Post ID");
  userId = userId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();

  const postExists = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { _id: 1 } }
  );
  if (!postExists) throw notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $addToSet: { postLikes: userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Like not updated!");

  let cachedPost = await client.hGet("posts", postId.toString());
  if (cachedPost) {
    if (typeof cachedPost === 'string') cachedPost = JSON.parse(cachedPost);
    if (!cachedPost.postLikes.includes(userId)) {
      cachedPost.postLikes.push(userId);
      await client.hSet("posts", postId.toString(), JSON.stringify(cachedPost));
    }
  }

  await client.del("community_posts_pages");

  const { postLikes } = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { postLikes: 1 } }
  );

  return { liked: true, likesLength: postLikes.length };
};

const unlikePost = async (userId, postId) => {
  validateObjectId(userId, "User ID");
  validateObjectId(postId, "Post ID");
  userId = userId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();

  const postExists = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { _id: 1 } }
  );
  if (!postExists) throw notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $pull: { postLikes: userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Unlike not updated!");

  let cachedPost = await client.hGet("posts", postId.toString());
  if (cachedPost) {
    if (typeof cachedPost === 'string') cachedPost = JSON.parse(cachedPost);
    cachedPost.postLikes = cachedPost.postLikes.filter(id => id !== userId);
    await client.hSet("posts", postId.toString(), JSON.stringify(cachedPost));
  }

  await client.del("community_posts_pages");

  const { postLikes } = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { postLikes: 1 } }
  );

  return { liked: false, likesLength: postLikes.length };
};

export { likePost, unlikePost };
