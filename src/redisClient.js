import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

client.on("connect", () => {
  console.log("Redis connected");
});

client.on("error", (err) => {
  console.error("Redis error", err);
});

export default client;
