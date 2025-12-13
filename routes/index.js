import petsRoute from "./pet.js";
import userRoute from "./user.js";
import communityPostsRoute from "./communityPosts.js";
import commentsRoute from "./comments.js";
import likesRoute from "./likes.js";
import uploadRoute from "./upload.js";
import cronRoute from "./cron.js";

const configRoutes = (app) => {
  app.use("/upload", uploadRoute);
  app.use("/account/pets", petsRoute);
  app.use("/account", communityPostsRoute);
  app.use("/view-post", commentsRoute);
  app.use("/likes", likesRoute);
  app.use("/user", userRoute);
  app.use("/cron", cronRoute);

  app.use("*", (_req, res) => {
    res.status(404).send("Page Not Found!");
  });
};

export default configRoutes;
