import express from "express";
import { likePost, unlikePost } from "../data/likes.js";
const router = express.Router();

router.route("/:postId").post(async (req, res) => {
  try {
    const { userThatPosted } = req.body;
    const likedData = await likePost(userThatPosted, req.params.postId);
    res.json({ likedData: likedData });
  } catch (error) {
    let status = 500;
    if (error.code && error.code >= 100 && error.code < 600) {
      status = error.code;
    }
    res.status(status).send(error.message);
  }
});
router.route("/:postId/:userId").delete(async (req, res) => {
  try {
    const unlikedData = await unlikePost(req.params.userId, req.params.postId);
    res.json({ unlikedData: unlikedData });
  } catch (error) {
    let status = 500;
    if (error.code && error.code >= 100 && error.code < 600) {
      status = error.code;
    }
    res.status(status).send(error.message);
  }
});

export default router;
