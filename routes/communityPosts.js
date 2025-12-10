import express from "express";
import {
  createPost,
  deletePost,
  editPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  searchPosts,
} from "../data/communityPosts.js";
import xss from "xss";
const router = express.Router();
import client from "../config/redisClient.js";
import {
  validateObjectId,
  validatePostTitle,
  validateString,
  validateUsername,
} from "../helpers/validations.js";
import authMiddleware from "../middleware/authMiddleware.js";

router
  .route("/community-posts")
  .get(authMiddleware, async (req, res) => {
    try {
      const allData = await getAllPosts(req.query.page);
      const searchedData = await searchPosts(req.query.keyword);
      res.json({ allData: allData, searchedData: searchedData });
    } catch (error) {
      let status = 500;
      if (error.code && error.code >= 100 && error.code < 600) {
        status = error.code;
      }
      res.status(status).send(error.message);
    }
  })
  .post(authMiddleware, async (req, res) => {
    try {
      let {
        userThatPosted,
        username,
        firstName,
        lastName,
        postImage,
        postTitle,
        postDescription,
      } = req.body;

      validateObjectId(userThatPosted, "User ID");
      validateString(userThatPosted, "User ID");
      validateUsername(username);
      validateString(firstName, "First Name");
      validateString(lastName, "Last Name");
      validateString(postTitle, "Post title");
      validatePostTitle(postTitle, "Post title");
      validateString(postDescription, "Post description");

      const newPost = await createPost(
        xss(userThatPosted),
        xss(username),
        xss(firstName),
        xss(lastName),
        postImage ? postImage : null,
        xss(postTitle),
        xss(postDescription)
      );
      res.json(newPost);
    } catch (error) {
      let status = 500;
      if (error.code && error.code >= 100 && error.code < 600) {
        status = error.code;
      }
      res.status(status).send(error.message);
    }
  });

router.route("/my-posts").get(authMiddleware, async (req, res) => {
  try {
    validateObjectId(req.query.userId, "User ID");

    const myPosts = await getMyPosts(req.query.userId, req.query.keyword);
    res.json(myPosts);
  } catch (error) {
    let status = 500;
    if (error.code && error.code >= 100 && error.code < 600) {
      status = error.code;
    }
    res.status(status).send(error.message);
  }
});

router
  .route("/community-posts/:postId")
  .get(authMiddleware, async (req, res) => {
    try {
      validateObjectId(req.params.postId, "Post ID");
      let postById;
      const postExistsInCache = await client.hExists(
        "posts",
        req.params.postId.toString()
      );
      if (postExistsInCache) {
        postById = await client.hGet("posts", req.params.postId.toString());
        if (typeof postById === "string") {
          postById = JSON.parse(postById);
        }
      } else {
        postById = await getPostById(req.params.postId);
      }
      res.json(postById);
    } catch (error) {
      let status = 500;
      if (error.code && error.code >= 100 && error.code < 600) {
        status = error.code;
      }
      res.status(status).send(error.message);
    }
  })
  .put(authMiddleware, async (req, res) => {
    try {
      validateObjectId(req.params.postId, "Post ID");
      let { userThatPosted, postImage, postTitle, postDescription } = req.body;
      validateObjectId(userThatPosted, "User ID");
      validateString(userThatPosted, "User ID");
      validateString(postTitle, "Post title");
      validatePostTitle(postTitle, "Post title");
      validateString(postDescription, "Post description");
      const updatedPost = await editPost(
        req.params.postId,
        xss(userThatPosted),
        postImage,
        xss(postTitle),
        xss(postDescription)
      );
      res.json(updatedPost);
    } catch (error) {
      let status = 500;
      if (error.code && error.code >= 100 && error.code < 600) {
        status = error.code;
      }
      res.status(status).send(error.message);
    }
  })
  .delete(authMiddleware, async (req, res) => {
    try {
      validateObjectId(req.params.postId, "Post ID");
      await getPostById(req.params.postId);
      const deleteInfo = await deletePost(req.params.postId);
      res.json(deleteInfo);
    } catch (error) {
      let status = 500;
      if (error.code && error.code >= 100 && error.code < 600) {
        status = error.code;
      }
      res.status(status).send(error.message);
    }
  });
export default router;
