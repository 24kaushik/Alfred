import IORedis from "ioredis";

const connection = new IORedis({ maxRetriesPerRequest: null, host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || "6379") });

export default connection;
