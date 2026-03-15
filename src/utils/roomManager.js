// utils/roomManager.js
import { v4 as uuidv4 } from "uuid";

// Create room
const createRoom = async (roomName, durationMinutes, client) => {
  const roomId = uuidv4();

  const createdAt = Date.now();
  const expiresAt = createdAt + durationMinutes * 60 * 1000;

  const roomKey = `room:${roomId}`;

  //Save room metadata
  await client.hset(roomKey, {
    id: roomId,
    name: roomName,
    createdAt,
    expiresAt,
    durationMinutes,
  });

  // TTL in seconds (time to live)
  const ttl = durationMinutes * 60;

  await client.expire(roomKey, ttl);

  return { roomId, roomName, createdAt, expiresAt, durationMinutes, users: [] };
};

// Add user to room
const addUser = async (roomId, userId, userName, client) => {
  // const room = this.rooms.get(roomId);

  const roomKey = `room:${roomId}`;
  const userKey = `users:${roomId}`;

  //Check if room exists
  const room = await roomExists(roomId, client);

  if (!room.success) {
    return { success: room.success, message: room.message };
  }

  // Add user to Redis
  await client.hset(userKey, userId, userName);

  // Sync TTL for users key if needed
  const usersTTL = await client.ttl(userKey);

  if (usersTTL === -1) {
    const roomTTL = await client.ttl(roomKey);
    await client.expire(userKey, roomTTL);
  }

  // Get all users
  const usersObject = await client.hgetall(userKey);

  const users = Object.entries(usersObject).map(([id, name]) => ({
    id,
    name,
  }));

  // Get remaining time
  const ttl = await client.ttl(roomKey);

  return {
    success: true,
    room: {
      id: roomId,
      users,
      timeRemaining: ttl * 1000, //convert to ms}
    },
  };
};

// Remove user from room
const removeUser = async (roomId, userId, client) => {
  const roomKey = `room:${roomId}`;
  const userKey = `users:${roomId}`;

  //Check if room exists
  const room = await roomExists(roomId, client);

  if (!room.success) {
    return { success: room.success, message: room.message };
  }

  // Remove user
  await client.hdel(userKey, userId);

  // Get remaining users
  const usersObject = await client.hgetall(userKey);

  const users = Object.entries(usersObject).map(([id, name]) => ({
    id,
    name,
  }));

  return {
    success: true,
    users,
    userCount: users.length,
  };
};
// Check If room exists or not
const roomExists = async (roomId, client) => {
  const roomKey = `room:${roomId}`;
  const room = await client.hgetall(roomKey);

  if (!room || Object.keys(room).length === 0) {
    return { success: false, message: "Room not found" };
  }

  return { success: true, room };
};

// Set a server-side timer that notifies clients when the room expires.
// Redis TTL already cleans up the data — this just fires the socket event.
const setRoomTimer = (roomId, durationMinutes, io) => {
  setTimeout(
    () => {
      console.log(`⏰ Room expired → notifying clients: ${roomId}`);
      io.to(roomId).emit("room_disposed", {
        success: false,
        message: "Room has expired",
      });
    },
    durationMinutes * 60 * 1000,
  );
};

export { createRoom, addUser, roomExists, removeUser, setRoomTimer };
