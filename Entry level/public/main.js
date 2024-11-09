const socket = io();

let currentUser = '';
let currentRoom = 'general';
let messages = {};

// DOM Elements
const usernameInput = document.getElementById('username');
const setUsernameBtn = document.getElementById('setUsername');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const messagesContainer = document.getElementById('messages');
const roomList = document.querySelector('.rooms ul');
const currentRoomTitle = document.getElementById('currentRoom');
const onlineCount = document.getElementById('onlineCount');

// Initialize room list
const rooms = ['general', 'tech', 'random'];
rooms.forEach(room => {
  const li = document.createElement('li');
  li.textContent = room.charAt(0).toUpperCase() + room.slice(1);
  li.dataset.room = room;
  if (room === currentRoom) li.classList.add('active');
  roomList.appendChild(li);
});

// Set Username
setUsernameBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    currentUser = username;
    usernameInput.disabled = true;
    setUsernameBtn.disabled = true;
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    
    // Join the default room
    socket.emit('joinRoom', { username, room: currentRoom });
  }
});

// Send Message
function sendMessage() {
  const message = messageInput.value.trim();
  if (message && currentUser) {
    socket.emit('chatMessage', { message });
    messageInput.value = '';
  } else if (!currentUser) {
    alert('Please set a username first!');
  }
}

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Switch Rooms
roomList.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (li) {
    const newRoom = li.dataset.room;
    if (newRoom !== currentRoom) {
      // Update UI
      document.querySelectorAll('.rooms li').forEach(li => {
        li.classList.remove('active');
      });
      li.classList.add('active');
      
      // Switch room
      currentRoom = newRoom;
      currentRoomTitle.textContent = newRoom.charAt(0).toUpperCase() + newRoom.slice(1);
      messagesContainer.innerHTML = '';
      
      // Display previous messages
      if (messages[currentRoom]) {
        messages[currentRoom].forEach(message => {
          addMessage(message);
        });
      }
      
      // Join new room
      socket.emit('joinRoom', { username: currentUser, room: newRoom });
    }
  }
});

// Receive Messages
socket.on('message', (message) => {
  addMessage(message);
  messages[currentRoom] = messages[currentRoom] || [];
  messages[currentRoom].push(message);
});

function addMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  
  if (message.username === currentUser) {
    div.classList.add('own');
  }
  
  if (message.username === 'System') {
    div.classList.add('system');
  }
  
  div.innerHTML = `
    <div class="meta">
      <span class="username">${message.username}</span>
      <span class="time">${message.time}</span>
    </div>
    <div class="text">${message.text}</div>
  `;
  
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update room users
socket.on('roomUsers', ({ room, users }) => {
  onlineCount.textContent = `${users.length} online`;
});

// Disable message input until username is set
messageInput.disabled = true;
sendMessageBtn.disabled = true;