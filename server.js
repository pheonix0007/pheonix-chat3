var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  allowEIO3: true // false by default
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

app.get('/giphyCall', (req, res) => {
  res.sendFile(__dirname + '/giphyCall.html');
});

const presence = {}; // socketId -> { userId, typing }

function broadcastPresence() {
  io.emit('presence-update', Object.values(presence).map(function(p) {
    return { userId: p.userId, typing: !!p.typing };
  }));
}

io.on('connection', (socket) => {
  console.log('User Online');

  socket.on('presence', (payload) => {
    var userId = payload && payload.userId ? payload.userId : socket.id;
    presence[socket.id] = { userId: userId, typing: false };
    broadcastPresence();
  });

  socket.on('typing', (isTyping) => {
    if (!presence[socket.id]) {
      presence[socket.id] = { userId: socket.id, typing: !!isTyping };
    } else {
      presence[socket.id].typing = !!isTyping;
    }
    broadcastPresence();
  });

  socket.on('pheonix-message', (msg) => {
    console.log('message:');
    socket.broadcast.emit('message-from-others', msg);
  });

  socket.on('disconnect', () => {
    delete presence[socket.id];
    broadcastPresence();
  });
});

var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
http.listen(server_port, () => {
  console.log('listening on *:' + server_port);
});
