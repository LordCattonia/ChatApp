//set up server and Socket.io
const { Socket } = require("dgram");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const uuid = require("uuid");
let timeOut;
let onlineUsers = {};
let id = 0;

// Send index.html to client
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


io.on("connection", (socket) => {
  // Handle connections and disconnections
  console.log(socket.id + " connected");
  socket.on("disconnect", () => {
    console.log(socket.id + " disconnected");
  });

  // Handle UUIDs
  socket.on("token", (data) => {
    socket.emit("token", {token: data.token && uuid.validate(data.token) && uuid.version(data.token) === 4 ? data.token : uuid.v4()})
  })

  // Handles Username + UUID Pairs
  socket.on("Username", (token, Username) => {
    onlineUsers[token] = Username
  });
  socket.on("onlineRequest", () => {
    socket.emit("online", onlineUsers)
  })

  // Handle chat messages
  socket.on("chat message", (msg, usr) => {
    console.log(usr, "says: " + msg);
  });
    // Id management for the client that send the message
    // This has to be before the main id part or else the id will increase before it is received.
  socket.on("requestID", (callback) =>{
    callback(id.toString().padStart(3, "0"))
    id += 1
  })
  socket.on("chat message", (msg, token) => {
    let idmessage = id.toString().padStart(3, "0")
    socket.broadcast.emit("chat message", msg, token, idmessage);
  });



  // Typing management
  socket.on("typing", (usr) => {
    if (usr != null) {
      console.log(usr, "is typing");
      socket.broadcast.emit("typing", usr);
      clearTimeout(timeOut);
      timeOut = setTimeout(function () {
        console.log(usr, "stopped typing");
        socket.broadcast.emit("not typing", usr);
      }, 1000);
    }
  });
  socket.on("not typing", (usr) => {
    console.log(usr, "stopped typing");
    socket.broadcast.emit("not typing", usr);
  });
});
//makes sure it is connected
server.listen(3000, () => {
  console.log("listening on port *:3000");
});
