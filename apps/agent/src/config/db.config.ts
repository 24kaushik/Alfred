import { createRedisClient, type Redis } from "@alfred/redis";

export { prisma } from "@alfred/db";
export const redisClient: Redis = createRedisClient();
