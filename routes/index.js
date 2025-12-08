import pets from "./pet.js";
import user from "./user.js";
import communityPostsRoute from "./communityPosts.js";
import commentsRoute from "./comments.js";
import likesRoute from "./likes.js";
import uploadRoute from "./upload.js";

const constructorMethod = (app) => {
  app.use("/upload", uploadRoute);
  app.use("/account", communityPostsRoute);
  app.use("/view-post", commentsRoute);
  app.use("/likes", likesRoute);
  app.use("/account/pets", pets);
  app.use("/user", user);

  app.use("*", (_req, res) => {
    res.status(404).send("Page Not Found!");
  });
};

export default constructorMethod;
