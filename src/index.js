import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import socketEvent from "./socket/events.js";

dotenv.config();
const port = process.env.PORT || 8001;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json("Hello World!");
});

// Initialize socket events
socketEvent(io);

// io.on("connection", (socket) => {
//   console.log("A user connected");
// });

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
