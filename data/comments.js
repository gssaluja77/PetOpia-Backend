import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import { getPostById } from "./communityPosts.js";
import { validateObjectId, validateString } from "../helpers/validations.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";
import client from "../config/redisClient.js";


const getCommentByCommentId = async (postId, commentId) => {
  validateObjectId(commentId, "Comment ID");
  validateObjectId(postId, "Post ID");
  commentId = commentId.trim();
  postId = postId.trim();

  const postsCollection = await communityPosts();
  const postWithThatComment = await postsCollection.findOne({
    _id: new ObjectId(postId),
    "postComments._id": new ObjectId(commentId),
  });
  let commentObject = null;
  postWithThatComment.postComments.forEach((element) => {
    if (element._id.toString() === commentId) {
      commentObject = element;
      return;
    }
  });
  commentObject._id = commentObject._id.toString();
  return commentObject;
};

const postComment = async (postId, userEmail, userThatPosted, comment) => {
  validateObjectId(postId, "Post ID");
  validateString(comment, "Comment");
  validateObjectId(userThatPosted, "UserThatPosted");
  postId = postId.trim();
  comment = comment.trim();
  userThatPosted = userThatPosted.trim();

  const date = new Date(Date.now());

  const newComment = {
    _id: new ObjectId(),
    userThatPosted: userThatPosted,
    userEmail: userEmail,
    commentDate: date.toLocaleDateString('en-US', { dateStyle: "long" }),
    commentTime: date.toLocaleTimeString('en-US', { timeStyle: "short" }),
    comment: comment,
    commentLikes: [],
  };

  const postsCollection = await communityPosts();

  const postExists = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { _id: 1 } }
  );
  if (!postExists) throw notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $push: { postComments: newComment } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be posted!");

  let cachedPost = await client.hGet("posts", postId.toString());
  if (cachedPost) {
    if (typeof cachedPost === 'string') cachedPost = JSON.parse(cachedPost);
    cachedPost.postComments.push(newComment);
    await client.hSet("posts", postId.toString(), JSON.stringify(cachedPost));
  }

  newComment._id = newComment._id.toString();
  return newComment;
};

const deleteComment = async (postId, commentId) => {
  validateObjectId(commentId, "Comment ID");
  commentId = commentId.trim();

  const postExists = await getPostById(postId);
  if (postExists === null) throw notFoundError("Post doesn't exist!");
  const postsCollection = await communityPosts();
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $pull: { postComments: { _id: new ObjectId(commentId) } } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be deleted!");
  const updatedPost = await getPostById(postId);

  return updatedPost;
};

const editComment = async (postId, commentId, comment) => {
  validateObjectId(commentId, "Comment ID");
  validateObjectId(commentId, "Post ID");
  validateString(comment, "Comment");
  commentId = commentId.trim();
  postId = postId.trim();
  comment = comment.trim();

  const postsCollection = await communityPosts();
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId), "postComments._id": new ObjectId(commentId) },
    { $set: { "postComments.$.comment": comment } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be edited!");
  const updatedPost = await getPostById(postId);
  return updatedPost;
};

const likeComment = async (userId, postId, commentId) => {
  validateObjectId(postId, "Post ID");
  validateObjectId(userId, "User ID");
  validateObjectId(commentId, "Comment ID");
  postId = postId.trim();
  userId = userId.trim();
  commentId = commentId.trim();

  const postsCollection = await communityPosts();
  const commentExists = await getCommentByCommentId(postId, commentId);
  if (commentExists === null) throw notFoundError("Comment doesn't exist!");
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId), "postComments._id": new ObjectId(commentId) },
    { $addToSet: { "postComments.$.commentLikes": userId.toString() } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Like not updated!");
  const commentLiked = await getCommentByCommentId(postId, commentId);
  await getPostById(postId);
  return { liked: true, likesLength: commentLiked.commentLikes.length };
};

const unlikeComment = async (userId, postId, commentId) => {
  validateObjectId(postId, "Post ID");
  validateObjectId(userId, "User ID");
  validateObjectId(commentId, "Comment ID");
  postId = postId.trim();
  userId = userId.trim();
  commentId = commentId.trim();

  const postsCollection = await communityPosts();
  const commentExists = await getCommentByCommentId(postId, commentId);
  if (commentExists === null) throw notFoundError("Comment doesn't exist!");
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId), "postComments._id": new ObjectId(commentId) },
    { $pull: { "postComments.$.commentLikes": userId } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Unlike not updated!");
  const commentLiked = await getCommentByCommentId(postId, commentId);
  commentLiked._id = commentLiked._id.toString();
  const updatedPost = await getPostById(postId);

  return { liked: true, likesLength: commentLiked.commentLikes.length };
};

export {
  getCommentByCommentId,
  postComment,
  deleteComment,
  editComment,
  likeComment,
  unlikeComment,
};
