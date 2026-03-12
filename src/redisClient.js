import { Redis } from "ioredis";

const client = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

client.on("connect", () => {
  console.log("Redis connected");
});

client.on("error", (err) => {
  console.error("Redis error", err);
});

export default client;
