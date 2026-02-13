import Redis from "ioredis";

export const RedisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, // For BullMQ
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});
