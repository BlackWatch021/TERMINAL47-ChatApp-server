// socket/events.js
import roomManager from "../utils/roomManager.js";
import { v4 as uuidv4 } from "uuid";

const socketEvent = (io) => {
  io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // ======== ROOM CREATION ========
    socket.on("create_room", (data, callback) => {
      try {
        const { roomName, durationMinutes } = data;
        console.log(
          "Room name",
          roomName,
          "Duraction in minutes",
          durationMinutes,
        );

        // Validate input
        if (!roomName || !durationMinutes) {
          return callback({
            success: false,
            message: "Roomname and duration of room is required",
          });
        }

        if (durationMinutes < 1 || durationMinutes > 30) {
          console.log("Duration must be between 1 and 30");
          return callback({
            success: false,
            message: "Duration must be between 1 and 30 minutes",
          });
        }

        // Create room
        const room = roomManager.createRoom(roomName, durationMinutes);

        callback({
          success: true,
          roomId: room.roomId,
          message: "Room created",
        });

        console.log(`✅ Room created successfully, roomId : ${room.roomId}`);
      } catch (error) {
        console.error("Error creating room:", error);
        callback({ success: false, message: "Failed to create room" || error });
        console.log("Failed to create room");
      }
    });

    // ======== USER JOIN ========
    socket.on("join_room", (data, callback) => {
      try {
        const { roomId, userName } = data;

        if (!roomId || !userName) {
          return callback({
            success: false,
            error: "Room ID and user name required",
          });
        }

        // Add user to room
        const result = roomManager.addUser(roomId, socket.id, userName);

        if (!result.success) {
          return callback({
            success: false,
            error: result.error,
          });
        }

        // Join socket to room
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = socket.id;
        socket.data.userName = userName;

        // Send room info to the user
        callback({
          success: true,
          room: result.room,
        });

        // Notify other users in room
        io.to(roomId).emit("user_joined", {
          userId: socket.id,
          userName,
          userCount: result.room.users.length,
        });

        console.log(`✅ User joined room: ${roomId} (${userName})`);
      } catch (error) {
        console.error("Error joining room:", error);
        callback({ success: false, error: "Failed to join room" });
      }
    });

    // ======== SEND MESSAGE ========
    socket.on("send_message", (data, callback) => {
      try {
        const { roomId, message } = data;
        const { userId, userName } = socket.data;

        if (!roomId || !message) {
          return callback({
            success: false,
            error: "Room ID and message required",
          });
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          return callback({
            success: false,
            error: "Room not found",
          });
        }

        const messageData = {
          id: uuidv4(),
          userId,
          userName,
          message: message.trim(),
          timestamp: new Date(),
        };

        // Broadcast message to room
        io.to(roomId).emit("receive_message", messageData);

        callback({ success: true });
      } catch (error) {
        console.error("Error sending message:", error);
        callback({ success: false, error: "Failed to send message" });
      }
    });

    // ======== DISCONNECT ========
    socket.on("disconnect", () => {
      const { roomId, userId, userName } = socket.data;

      if (roomId) {
        // Remove user from room
        roomManager.removeUser(roomId, userId);

        const room = roomManager.getRoom(roomId);

        if (room) {
          // Notify others
          io.to(roomId).emit("user_left", {
            userId,
            userName,
            userCount: room.userCount,
          });
        } else {
          console.log(`🗑️  Room auto-disposed (empty): ${roomId}`);
        }
      }

      console.log(`👋 User disconnected: ${socket.id}`);
    });
  });
};

export default socketEvent;
