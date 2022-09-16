const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const uuid = require("uuid")

let timeOut
let noType = {}
let cooldown = []
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

	socket.on("requestMessageHistory", (callback) => {
		callback(msgHistory)
	})

	let finder = (value, param, search) => {
		value.find(x => x[param] == search)
	}

	let cooldownManager = (token) => {
		let find = cooldown.find(x => x.uuid == token)
		if (find) {
			if(find.msgcount <= 3){
				find.msgcount = find.msgcount + 1
				console.log(cooldown)
			} else {
				noType[token] = Date.now() + 10 * 1000
				console.log(noType)
			}
		} else {
			cooldown.push({uuid: token, msgcount: 1})
			console.log(cooldown)
		}
	}

	// Handles Chat messages
	socket.on("chat message", (msg, token) => {
		if (noType[token] <= Date.now() || noType[token] == undefined) {
			if (msg.length <= 1000) {
				let count = (msg.match(/br>/g) || []).length
				if (count <= 20) {
					console.log(onlineUsers.find(x => x.uuid === token).name, "says: " + msg)
					id++
					cooldownManager(token)
					let idmessage = id
					msgHistory.push({name:onlineUsers.find(x => x.uuid === token).name, message: msg, id: idmessage})
					io.emit("chat message", msg, onlineUsers.find(x => x.uuid === token).name, idmessage)
				} else {
					socket.emit("error", {error: true, msg:`Too many break charcaters will fill up the screens for everyone else <br>But you knew that already didn't you?`, buttonMsg: 'I am a bad person'})
				}
			} else {
				socket.emit("error", {error: true, msg: `Please keep your message to a maximum of 1000 characters.`, buttonMsg: ' I really should have seen the super cool character count'})
			}
		} else {
			socket.emit("error", {error: true, msg: `You have been rate limited because you are spamming.<br>Chill out for 10 seconds bro`, buttonMsg: `Enter the <b>CHILL ZONE</b>`})
		}
	})

	let resetcooldown = () => {
		cooldown.forEach(obj => {
			obj.msgcount = 0
		})
	}
	 
	setInterval(resetcooldown, 10000)

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

	socket.on("delete-message", (pw, id) => {
		if (pw == 80085 || pw == 69420) {
			socket.emit("error", {error: true, msg: "Nice try lmao", buttonMsg: "Try Again?"})
		} else {
			if (pw == "password-placeholder") {
					try {
						msgHistory.find(x => x.id == id).message = "moderator deleted message"
						msgHistory.find(x => x.id == id).name = null
						io.emit("delete", id);
					} catch(err) {
						console.log("deletion failed")
					}
		} else {
		}
		}
	})

})


// Listen on port 3000
server.listen(3000, () => {
	console.log("listening on port *:3000")
})
