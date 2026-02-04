import express from "express"
import { createServer } from "http";
import {Server} from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json("Hello World!");
});

const port = process.env.PORT || 8001;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});;