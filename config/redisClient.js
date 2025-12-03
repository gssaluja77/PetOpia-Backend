import IORedis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

let client = null;
let isConnected = false;
let isUpstash = false;

const redisUrlLocal = process.env.REDIS_URL_LOCAL;

if (process.env.NODE_ENV === "development") {
  client = new IORedis(redisUrlLocal);

  client.on("error", (err) => {
    console.error("Redis Error:", err.message);
    isConnected = false;
  });

  client.on("ready", () => {
    console.log("Local Redis connected");
    isConnected = true;
  });
} else {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      client = new UpstashRedis({
        url: url,
        token: token,
      });
      isUpstash = true;
      isConnected = true;
      console.log("Upstash Redis (Vercel KV) configured");
    } catch (error) {
      console.error("Upstash Config Error:", error);
      isConnected = false;
    }
  } else {
    console.warn("Upstash credentials missing. Caching disabled.");
    isConnected = false;
  }
}

const safeClient = {
  async get(key) {
    if (!isConnected) return null;
    try {
      return await client.get(key);
    } catch (error) {
      console.error("Redis Get Error:", error);
      return null;
    }
  },

  async set(key, value) {
    if (!isConnected) return;
    try {
      await client.set(key, value);
    } catch (error) {
      console.error("Redis Set Error:", error);
    }
  },

  async hSet(key, field, value) {
    if (!isConnected) return;
    try {
      if (isUpstash) {
        await client.hset(key, { [field]: value });
      } else {
        await client.hset(key, field, value);
      }
    } catch (error) {
      console.error("Redis HSet Error:", error);
    }
  },

  async hGet(key, field) {
    if (!isConnected) return null;
    try {
      return await client.hget(key, field);
    } catch (error) {
      console.error("Redis HGet Error:", error);
      return null;
    }
  },

  async hDel(key, field) {
    if (!isConnected) return;
    try {
      await client.hdel(key, field);
    } catch (error) {
      console.error("Redis HDel Error:", error);
    }
  },

  async hExists(key, field) {
    if (!isConnected) return 0;
    try {
      return await client.hexists(key, field);
    } catch (error) {
      console.error("Redis HExists Error:", error);
      return 0;
    }
  },

  async exists(key) {
    if (!isConnected) return 0;
    try {
      return await client.exists(key);
    } catch (error) {
      console.error("Redis Exists Error:", error);
      return 0;
    }
  },

  async setex(key, seconds, value) {
    if (!isConnected) return;
    try {
      if (isUpstash) {
        await client.set(key, value, { ex: seconds });
      } else {
        await client.setex(key, seconds, value);
      }
    } catch (error) {
      console.error("Redis SetEx Error:", error);
    }
  },

  async del(key) {
    if (!isConnected) return;
    try {
      await client.del(key);
    } catch (error) {
      console.error("Redis Del Error:", error);
    }
  },
  async flushDb() {
    if (!isConnected) return;
    try {
      await client.flushdb();
    } catch (error) {
      console.error("Redis flushDb Error:", error);
    }
  },
  async quit() {
    if (!isConnected) return;
    try {
      await client.quit();
      isConnected = false;
    } catch (error) {
      console.error("Redis Disconnect Error:", error);
    }
  },
};

export default safeClient;
