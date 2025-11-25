import Redis from "ioredis";

let client = null;
let isConnected = false;

const redisUrl = process.env.REDIS_URL;
const redisUrlLocal = process.env.REDIS_URL_LOCAL;

if (process.env.NODE_ENV === "development") {
  client = new Redis(redisUrlLocal);
} else {
  client = new Redis(redisUrl, {
    tls: redisUrl?.startsWith("rediss://") ? {} : undefined,
  });
}

client.on("error", (err) => {
  console.error("Redis Error:", err.message);
  isConnected = false;
});

client.on("ready", () => {
  console.log("✓ Redis connected");
  isConnected = true;
});

const safeClient = {
  async get(key) {
    if (!isConnected) return null;
    try {
      return await client.get(key);
    } catch {
      return null;
    }
  },

  async set(key, value) {
    if (!isConnected) return;
    try {
      await client.set(key, value);
    } catch { }
  },

  async hSet(key, field, value) {
    if (!isConnected) return;
    try {
      await client.hset(key, field, value);
    } catch { }
  },

  async hGet(key, field) {
    if (!isConnected) return null;
    try {
      return await client.hget(key, field);
    } catch {
      return null;
    }
  },

  async hDel(key, field) {
    if (!isConnected) return;
    try {
      await client.hdel(key, field);
    } catch { }
  },

  async hExists(key, field) {
    if (!isConnected) return 0;
    try {
      return await client.hexists(key, field);
    } catch {
      return 0;
    }
  },

  async exists(key) {
    if (!isConnected) return 0;
    try {
      return await client.exists(key);
    } catch {
      return 0;
    }
  },

  async setex(key, seconds, value) {
    if (!isConnected) return;
    try {
      await client.setex(key, seconds, value);
    } catch { }
  },

  async del(key) {
    if (!isConnected) return;
    try {
      await client.del(key);
    } catch { }
  },
};

export default safeClient;
