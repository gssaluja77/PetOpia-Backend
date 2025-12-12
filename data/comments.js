import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import { getPostById } from "./communityPosts.js";
import {
  validateObjectId,
  validateString,
  validateUsername,
} from "../helpers/validations.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";
import moment from "moment";
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

const postComment = async (
  postId,
  username,
  userEmail,
  userThatPosted,
  comment
) => {
  validateObjectId(postId, "Post ID");
  validateString(comment, "Comment");
  validateUsername(username);
  validateObjectId(userThatPosted, "UserThatPosted");
  username = username.trim();
  userEmail = userEmail.trim();
  postId = postId.trim();
  comment = comment.trim();
  userThatPosted = userThatPosted.trim();

  const now = moment();

  const newComment = {
    _id: new ObjectId(),
    userThatPosted: userThatPosted,
    username: username,
    userEmail: userEmail,
    commentDate: now.format("MMM Do YYYY"),
    commentTime: now.format("h:mm A"),
    comment: comment,
    commentLikes: [],
  };

  const postsCollection = await communityPosts();

  const postById = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { _id: 1 } }
  );
  if (!postById) throw notFoundError("Post doesn't exist!");

  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $push: { postComments: newComment } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be posted!");

  let cachedPost = await client.hGet("posts", postId.toString());
  if (cachedPost) {
    if (typeof cachedPost === "string") cachedPost = JSON.parse(cachedPost);
    cachedPost.postComments.push(newComment);
    await client.hSet("posts", postId.toString(), JSON.stringify(cachedPost));
  }

  newComment._id = newComment._id.toString();
  return newComment;
};

const deleteComment = async (postId, commentId) => {
  validateObjectId(commentId, "Comment ID");
  commentId = commentId.trim();

  const postById = await getPostById(postId);
  if (postById === null) throw notFoundError("Post doesn't exist!");
  const postsCollection = await communityPosts();
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $pull: { postComments: { _id: new ObjectId(commentId) } } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be deleted!");

  await client.hDel("posts", postId.toString());

  return {
    ...postById,
    postComments: postById.postComments.filter(
      (comment) => comment._id.toString() !== commentId
    )
  };
};

const editComment = async (postId, commentId, comment) => {
  validateObjectId(commentId, "Comment ID");
  validateObjectId(postId, "Post ID");
  validateString(comment, "Comment");
  commentId = commentId.trim();
  postId = postId.trim();
  comment = comment.trim();

  const oldComment = await getCommentByCommentId(postId, commentId);

  const postsCollection = await communityPosts();
  const updatedInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId), "postComments._id": new ObjectId(commentId) },
    { $set: { "postComments.$.comment": comment } }
  );
  if (updatedInfo.modifiedCount === 0)
    throw internalServerError("Comment could not be edited!");

  await client.hDel("posts", postId.toString());

  return {
    ...oldComment,
    comment: comment
  };
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

  await client.hDel("posts", postId.toString());

  const commentLiked = await getCommentByCommentId(postId, commentId);
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

  await client.hDel("posts", postId.toString());

  const commentLiked = await getCommentByCommentId(postId, commentId);
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
