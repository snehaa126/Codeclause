const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

// Store active users and their rooms
const users = new Map();
const rooms = ['general', 'tech', 'random'];
const joinedRooms = new Map();

io.on('connection', (socket) => {
  // Handle user joining a room
  socket.on('joinRoom', ({ username, room }) => {
    // Leave previous room if any
    const prevRoom = users.get(socket.id)?.room;
    if (prevRoom) {
      socket.leave(prevRoom);
    }

    // Join new room
    socket.join(room);
    users.set(socket.id, { username, room });

    // Send users and room info
    io.to(room).emit('roomUsers', {
      room,
      users: Array.from(users.values())
        .filter(user => user.room === room)
        .map(user => user.username)
    });
  });

  // Handle room list request
  socket.on('getRooms', () => {
    socket.emit('rooms', rooms);
  });

  // Handle chat messages
  socket.on('chatMessage', ({ message }) => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.room).emit('message', {
        username: user.username,
        text: message,
        time: moment().format('h:mm a')
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);

      // Send updated users list
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: Array.from(users.values())
          .filter(u => u.room === user.room)
          .map(u => u.username)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));