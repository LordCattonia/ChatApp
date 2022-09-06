const express = require("express")
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
		if(onlineUsers.find(x => x.uuid == token)){
			onlineUsers.find(x => x.uuid == token).name = Username
		} else {
			onlineUsers.push({uuid: token, name: Username})
		}
	})

	socket.on("peekID", (callback) => {
		callback(id)
	})

	// Handles Chat messages
	socket.on("chat message", (msg, token) => {
		if (msg.length <= 1000) {
			let count = (msg.match(/br>/g)).length
			console.log(count)
			if (count <= 20) {
				console.log(onlineUsers.find(x => x.uuid === token).name, "says: " + msg)
				id++
				let idmessage = id
				msgHistory.push({name:onlineUsers.find(x => x.uuid === token).name, message: msg})
				io.emit("chat message", msg, onlineUsers.find(x => x.uuid === token).name, idmessage)
			} else {
				socket.emit("error", {error: true, msg:"Too many '<br>'s will fill up the screens for everyone else :( \nBut you knew that already didn't you?"})
			}
		} else {
			socket.emit("error", {error: true, msg: "Please keep your message to a maximum of 1000 characters."})
		}

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
