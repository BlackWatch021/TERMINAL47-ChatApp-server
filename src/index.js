import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT || 8001;

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json("Hello World!");
});

io.on("connection", (socket) => {
  console.log("A user connected");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
