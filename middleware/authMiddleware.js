import { validateSession } from "../helpers/sessionUtil.js";

const authMiddleware = async (req, res, next) => {
    const sessionId = req.headers.authorization;
    if (!sessionId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = await validateSession(sessionId);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = userId;
    next();
}

export default authMiddleware;