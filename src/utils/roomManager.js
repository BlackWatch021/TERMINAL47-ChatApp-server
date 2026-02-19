// utils/roomManager.js
import { v4 as uuidv4 } from "uuid";

class RoomManager {
  constructor() {
    this.rooms = new Map(); // Store active rooms
    this.roomTimers = new Map(); // Store disposal timers
  }

  // Create a new room
  createRoom(roomName, durationMinutes, io) {
    const roomId = this.generateRoomId();

    const room = {
      id: roomId,
      name: roomName,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      durationMinutes,
      users: new Map(),
      messages: [],
    };

    this.rooms.set(roomId, room);

    // Set auto-disposal timer — pass io so we can notify clients
    this.setRoomTimer(roomId, durationMinutes, io);

    console.log(
      `✅ Room created: ${roomId} (${roomName}) - Expires in ${durationMinutes} min`,
    );

    return {
      roomId,
      roomName,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
    };
  }

  // Check If room exists or not
  roomExists(roomId) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, reason: "not_found" };
    }

    if (new Date() > room.expiresAt) {
      return { success: false, reason: "expired" };
    }

    return { success: true, room };
  }

  // Add user to room
  addUser(roomId, userId, userName) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, message: "Room not found" };
    }

    // Check if room has expired
    if (new Date() > room.expiresAt) {
      return { success: false, message: "Room has expired" };
    }

    // Add user to room
    const user = {
      id: userId,
      name: userName,
      joinedAt: new Date(),
    };

    room.users.set(userId, user);

    return {
      success: true,
      room: {
        id: room.id,
        name: room.name,
        users: Array.from(room.users.values()),
        timeRemaining: Math.max(0, room.expiresAt - new Date()),
      },
    };
  }

  // Remove user from room
  removeUser(roomId, userId) {
    const room = this.rooms.get(roomId);

    if (!room) return false;

    room.users.delete(userId);

    // Delete room if empty
    // if (room.users.size === 0) {
    //   this.disposeRoom(roomId);
    // }

    return true;
  }

  // Get room info
  getRoom(roomId) {
    const room = this.rooms.get(roomId);

    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      users: Array.from(room.users.values()),
      userCount: room.users.size,
      expiresAt: room.expiresAt,
      timeRemaining: Math.max(0, room.expiresAt - new Date()),
    };
  }

  // Set timer for room disposal
  setRoomTimer(roomId, durationMinutes, io) {
    const timer = setTimeout(
      () => {
        // Notify all clients in the room BEFORE disposing
        if (io) {
          io.to(roomId).emit("room_disposed", {
            message: "Room has expired",
          });
        }
        this.disposeRoom(roomId);
      },
      durationMinutes * 60 * 1000,
    );

    this.roomTimers.set(roomId, timer);
  }

  // Dispose room (cleanup)
  disposeRoom(roomId) {
    const room = this.rooms.get(roomId);

    if (!room) return;

    // Clear timer
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.roomTimers.delete(roomId);
    }

    // Delete room
    this.rooms.delete(roomId);

    console.log(`🗑️  Room disposed: ${roomId}`);
  }

  // Generate unique room ID
  generateRoomId() {
    return uuidv4();
  }

  // Get all active rooms (optional: for debugging)
  getAllRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      userCount: room.users.size,
      expiresAt: room.expiresAt,
    }));
  }
}

export default new RoomManager();
