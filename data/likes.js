import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import { getPostById } from "./communityPosts.js";
import { validateObjectId } from "../helpers/validations.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";

const likePost = async (userId, postId) => {
  validateObjectId(userId, "User ID");
  validateObjectId(postId, "Post ID");
  userId = userId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();
  const postById = await getPostById(postId.toString());
  if (postById === null) notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $addToSet: { postLikes: userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Like not updated!");
  const { postLikes } = await getPostById(postId);
  return { liked: true, likesLength: postLikes.length };
};

const unlikePost = async (userId, postId) => {
  validateObjectId(userId, "User ID");
  validateObjectId(postId, "Post ID");
  userId = userId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();
  const postById = await getPostById(postId);
  if (postById === null) throw notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $pull: { postLikes: userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Unlike not updated!");
  const { postLikes } = await getPostById(postId);
  return { liked: false, likesLength: postLikes.length };
};

export { likePost, unlikePost };
