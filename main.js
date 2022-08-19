//set up server and Socket.io
const { Socket } = require('dgram');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var timeOut

//send index.html to client
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//handle connections and disconnections
io.on('connection', (socket) => {
    console.log(socket.id +' connected');
    socket.on('disconnect', () => {
        console.log(socket.id + ' disconnected');
      });
})

//so i can spy
io.on('connection', (socket) => {
    socket.on('chat message', (msg, usr) => {
      console.log(usr, 'says: ' + msg);
    });
  });

//handling messages
  io.on('connection', (socket) => {
    socket.on('chat message', (msg, usr) => {
      socket.broadcast.emit('chat message', msg, usr);
    });
    socket.on("typing", (usr) => {
        if(usr != null) {
            console.log(usr, "is typing");
            socket.broadcast.emit('typing', usr);
            clearTimeout(timeOut);
            timeOut = setTimeout(function(){console.log(usr, "stopped typing"); socket.broadcast.emit('not typing', usr);}, 1000);
        }});
    socket.on("not typing", (usr) => {
        console.log(usr, "stopped typing");
        socket.broadcast.emit('not typing', usr);
    });
  });
//makes sure it is connected
server.listen(3000, () => {
    console.log('listening on port *:3000');
});