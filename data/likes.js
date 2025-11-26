import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import { validateObjectId } from "../helpers/validations.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";

const likePost = async (userId, postId) => {
  validateObjectId(userId, "User ID");
  validateObjectId(postId, "Post ID");
  userId = userId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();

  // Quick existence check without fetching full post data
  const postExists = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { _id: 1 } }
  );
  if (!postExists) notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $addToSet: { postLikes: userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Like not updated!");

  // Only fetch the postLikes array, not the entire post
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

  // Quick existence check without fetching full post data
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

  // Only fetch the postLikes array, not the entire post
  const { postLikes } = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { postLikes: 1 } }
  );

  return { liked: false, likesLength: postLikes.length };
};

export { likePost, unlikePost };
