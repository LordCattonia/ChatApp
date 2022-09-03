const { Socket } = require("dgram")
const express = require("express")
const fs = require("fs")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const uuid = require("uuid")

let timeOut
let onlineUsers = []
let id = 0
let msgHistory = []

// Serve public folder to client

app.use(express.static('public'))

// Sockets

io.on("connection", (socket) => {

	// Handle connections and disconnections
	console.log(socket.id + " connected")
	socket.on("disconnect", () => {
		console.log(socket.id + " disconnected")
	})

	// Handle UUIDs
	socket.on("token", (data) => {
		socket.emit("token", { token: data.token && uuid.validate(data.token) && uuid.version(data.token) === 4 ? data.token : uuid.v4() })
	})

	// Handles Username + UUID Pairs
	socket.on("Username", (token, Username) => {
		onlineUsers[token] = Username
	})

	// Handle chat messages
	socket.on("chat message", (msg, usr) => {
		console.log(usr, "says: " + msg)
	})

	// Id management for the client that send the message
	// This has to be before the main id part or else the id will increase before it is received.
	socket.on("requestID", (callback) => {
		callback(id)
		id += 1
	})

	socket.on("peekID", (callback) => {
		callback(id)
	})

	socket.on("chat message", (msg, token) => {
		let idmessage = id
		msgHistory.push({name:onlineUsers[token], message:msg})
		socket.broadcast.emit("chat message", msg, onlineUsers[token], idmessage)
	})

	socket.on("requestMessageHistory", (callback) => {
		callback(msgHistory)
	})

	// Typing
	socket.on("typing", (data) => {
		if (!data.user) return

		if (data.typing) {
			console.log(data.user, "is typing")
			socket.broadcast.emit("typing", {user: data.user, typing: true})
			clearTimeout(timeOut)
			timeOut = setTimeout(function () {
				console.log(data.user, "stopped typing")
				socket.broadcast.emit("typing", {user: data.user, typing: false})
			}, 1000)
		} else {
			console.log(user, "stopped typing")
			socket.broadcast.emit("typing", {user: data.user, typing: false})
		}
	})
})

// Listen on port 3000
server.listen(3000, () => {
	console.log("listening on port *:3000")
})
