import { randomUUID as uuid } from "crypto";
import client from "../config/redisClient.js";

const SESSION_DURATION = 7 * 24 * 60 * 60;

const createSession = async (userId) => {
    const sessionId = uuid();
    const key = `session:${sessionId}`;
    await client.setex(key, SESSION_DURATION, userId);

    return sessionId;
};

const validateSession = async (sessionId) => {
    if (!sessionId) {
        return null;
    }

    const userId = await client.get(`session:${sessionId}`);
    if (!userId) {
        console.error("Invalid session ID!");
        return null;
    }

    return userId;
};

const deleteSession = async (sessionId) => {
    const key = `session:${sessionId}`;
    await client.del(key);
};

export { createSession, validateSession, deleteSession };
