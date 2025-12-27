import express from "express";

const router = express.Router();

const pageStyle = "color: #4F46E5; text-align: center; padding: 20px;";

router.route("/").get((_req, res) => {
    res.status(200).send(`<h1 style="${pageStyle}">Welcome to Petopia!</h1>`);
});

export default router;