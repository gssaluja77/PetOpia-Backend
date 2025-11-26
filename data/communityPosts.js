import { ObjectId } from "mongodb";
import { communityPosts } from "../config/mongoCollections.js";
import moment from "moment"
import {
  badRequestError,
  internalServerError,
  notFoundError,
} from "../helpers/wrappers.js";
import {
  validateObjectId,
  validatePostTitle,
  validateString,
} from "../helpers/validations.js";
import client from "../config/redisClient.js";

const getAllPosts = async (page = 1) => {
  const limit = 4;
  if (!Number.isInteger(page)) page = Number(page);

  const cacheKey = "community_posts_pages";
  const field = `page_${page}`;
  const cachedData = await client.hGet(cacheKey, field);
  if (cachedData) {
    return typeof cachedData === "string"
      ? JSON.parse(cachedData)
      : cachedData;
  }

  const postsCollection = await communityPosts();
  const allPostsData = await postsCollection
    .find()
    .sort({ $natural: -1 })
    .toArray();
  const numberOfDocs = await postsCollection.countDocuments();
  if (page < 1) throw badRequestError("Invalid page number in URL!");

  let result;
  if (page === 1) {
    const allPosts = await postsCollection
      .find({})
      .sort({ $natural: -1 })
      .limit(limit)
      .toArray();
    result = {
      allPosts: allPosts,
      allPostsData: allPostsData,
      numberOfDocs: numberOfDocs,
      limit: limit,
    };
  } else {
    const allPosts = await postsCollection
      .find({})
      .sort({ $natural: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray();
    if (!allPosts.length) throw notFoundError("There are no more posts!");
    result = {
      allPosts: allPosts,
      allPostsData: allPostsData,
      numberOfDocs: numberOfDocs,
      limit: limit,
    };
  }

  await client.hSet(cacheKey, field, JSON.stringify(result));
  return result;
};

const getPostById = async (postId) => {
  validateObjectId(postId, "Post ID");
  postId = postId.trim();

  const postsCollection = await communityPosts();
  const postById = await postsCollection.findOne({ _id: new ObjectId(postId) });
  if (postById === null) throw notFoundError("Post doesn't exist!");
  postById.postComments.forEach((ele) => {
    ele._id = ele._id.toString();
  });
  postById.postComments.sort((a, b) => {
    return b.commentLikes.length - a.commentLikes.length;
  });
  postById._id = postById._id.toString();
  await client.hSet("posts", postId.toString(), JSON.stringify(postById));
  return postById;
};

const newPost = async (
  userThatPosted,
  userEmail,
  postImage,
  postTitle,
  postDescription
) => {
  validateObjectId(userThatPosted, "User ID");
  validateString(userThatPosted, "User ID");
  if (postImage) {
    validateString(postImage, "Image path");
    postImage = postImage.trim();
  }
  validateString(postTitle, "Post title");
  validatePostTitle(postTitle, "Post title");
  validateString(postDescription, "Post description");
  postTitle = postTitle.trim();
  postDescription = postDescription.trim();
  userThatPosted = userThatPosted.trim();

  const addPost = {
    userThatPosted: userThatPosted,
    userEmail: userEmail,
    postImage: postImage,
    postTitle: postTitle,
    postDescription: postDescription,
    postDate: moment().format("MMMM Do YYYY"),
    postTime: moment().format("h:mm A"),
    postComments: [],
    postLikes: [],
  };
  const postsCollection = await communityPosts();
  const insertedInfo = await postsCollection.insertOne(addPost);

  if (!insertedInfo.acknowledged)
    throw internalServerError("Could not add community post to the database!");

  await client.hSet("posts", addPost._id.toString(), JSON.stringify(addPost));

  await client.del("community_posts_pages");

  return addPost;
};

const editPost = async (
  postId,
  userThatPosted,
  postImage,
  postTitle,
  postDescription
) => {
  validateObjectId(userThatPosted, "User ID");
  validateString(userThatPosted, "User ID");
  validateString(postTitle, "Post title");
  validatePostTitle(postTitle, "Post title");
  validateString(postDescription, "Post description");
  postTitle = postTitle.trim();
  postDescription = postDescription.trim();
  userThatPosted = userThatPosted.trim();

  let updatedPost;
  const oldData = await getPostById(postId);
  for (const comment of oldData.postComments) {
    comment._id = new ObjectId(comment._id);
  }
  if (postImage) {
    validateString(postImage, "Image path");
    postImage = postImage.trim();
    updatedPost = {
      userThatPosted: oldData.userThatPosted,
      postImage: postImage,
      postTitle: postTitle,
      postDescription: postDescription,
      dateString: oldData.dateString,
      postDate: oldData.postDate,
      postTime: oldData.postTime,
      postComments: oldData.postComments,
      postLikes: oldData.postLikes,
    };
  } else {
    updatedPost = {
      userThatPosted: oldData.userThatPosted,
      postImage: postImage,
      postTitle: postTitle,
      postDescription: postDescription,
      dateString: oldData.dateString,
      postDate: oldData.postDate,
      postTime: oldData.postTime,
      postComments: oldData.postComments,
      postLikes: oldData.postLikes,
    };
  }

  const postsCollection = await communityPosts();
  const updateInfo = await postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $set: updatedPost }
  );
  if (updateInfo.modifiedCount === 0)
    throw internalServerError("You haven't made any changes!");

  await client.del("community_posts_pages");

  return await getPostById(postId);
};

const deletePost = async (postId) => {
  validateObjectId(postId, "Post ID");
  postId = postId.trim();

  const postById = await getPostById(postId);
  if (postById === null) throw notFoundError("Post doesn't exist!");

  const postsCollection = await communityPosts();
  const deleteInfo = await postsCollection.deleteOne({
    _id: new ObjectId(postId),
  });
  if (deleteInfo.deletedCount === 0) {
    throw internalServerError("Post couldn't be delete!");
  }
  await client.hDel("posts", postId.toString());

  await client.del("community_posts_pages");

  return { postId: postId, deleted: true };
};

const searchPosts = async (keyword) => {
  const postsCollection = await communityPosts();
  const allPostsData = await postsCollection
    .find()
    .sort({ $natural: -1 })
    .toArray();
  const searchedPosts = allPostsData.filter(
    (post) =>
      post.postTitle.toLowerCase().includes(keyword) ||
      post.postDescription.toLowerCase().includes(keyword)
  );
  return searchedPosts;
};

export { newPost, getAllPosts, getPostById, deletePost, editPost, searchPosts };
