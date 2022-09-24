const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const uuid = require("uuid")
const fs = require('fs');
const bannedlist = require('./banned.json'); 
const banned = JSON.parse(JSON.stringify(bannedlist)).bannedIPS

let modList = ["78e05e77-c2da-4e68-b8d8-011004677f87"]
let prefix = "?"
let timeOut
let noType = {}
let cooldown = []
let onlineUsers = []
let msgHistory = []

let saveJSON = (jsonData) => {
	fs.readFile('./banned.json', 'utf8', function (err, data) {
		if (err) {
			console.log(err)
		} else {
			const file = JSON.parse(data);
			file.bannedIPS = jsonData

			const json = JSON.stringify(file);
	
			fs.writeFile('banned.json', json, 'utf8', function(err){
				if(err){ 
					console.log(err); 
				} else {
					console.log("ips were successfully added to banlist")
				}});
		}
	
	});
}

let serverMessage = (message) => {
	io.emit("chat message", message, "Server", msgHistory.length)
	msgHistory.push({name:"Server", message: message, id: msgHistory.length})
}
// Part2, Geting client IP
let getClientIp = (req) => {
  let ipAddress = req.connection.remoteAddress;
	if (!ipAddress) {
    	return '';
  	}
// convert from "::ffff:192.0.0.1"  to "192.0.0.1"
  	if (ipAddress.substr(0, 7) == "::ffff:") {
    	ipAddress = ipAddress.substr(7)
 	}
	return ipAddress;
};
//Part3, Blocking Client IP, if it is in the banned
app.use(function(req, res, next) {
  	let ipAddress = getClientIp(req)
  	if(banned.indexOf(ipAddress) === -1){
		next();
  	} else {
    	res.send(`IP: ${ipAddress} is not in whiteList`)
  	}
})
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
		onlineUsers.findIndex(x => x.uuid == token) === -1 ? onlineUsers.push({uuid: token, name: Username, socketId: socket.id, ip: socket.address}) : onlineUsers.find(x => x.uuid == token).name = Username
	})

	socket.on("peekID", (callback) => {
		callback(msgHistory.length - 1)
	})

	socket.on("requestMessageHistory", (callback) => {
		callback(msgHistory)
	})

	let cooldownManager = (token) => {
		let find = cooldown.find(x => x.uuid == token)
		if (find) {
			if(find.msgcount <= 3){
				find.msgcount = find.msgcount + 1
			} else {
				noType[token] = Date.now() + 10 * 1000
			}
		} else {
			cooldown.push({uuid: token, msgcount: 1})
		}
	}

	// Handles Chat messages
	socket.on("chat message", (msg, token) => {
		if (noType[token] <= Date.now() || noType[token] == undefined) {
			if (msg.length <= 1000) {
				let count = (msg.match(/br>/g) || []).length
				if (count <= 20) {
					console.log(onlineUsers.find(x => x.uuid === token).name, "says: " + msg)
					cooldownManager(token)
					let idmessage = msgHistory.length
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

	setInterval(mapIps, 100)

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
			console.log(data.user, "stopped typing")
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
		}
		}
	})
	// Handle commands
	socket.on("command", (data) => {
		let serverPrivateMessage = (message) => {
			socket.emit("chat message", message, "Server", msgHistory.length)
		}
		if(!data.command.startsWith(prefix)) return
		let args = data.command.slice(prefix.length).trim().split(/ +/)
		let command = args.shift().toLowerCase()
		let noPerms = `Sorry ${onlineUsers.find(x => x.uuid == data.uuid).name}, you do not have permissions to use this command`

		if(command == "say"){
			serverMessage(args[0] || "Please input a message")
		}

		if (command == "debug") {
			console.log(socket)
		}

		if(command == "ban") {
			try {
				if (!modList.includes(data.uuid)) throw Error("noPerms")
				if (!args[0]) throw Error("invalid")
				if (onlineUsers.some(x => x.name === args[0])) {
					banned.push(onlineUsers.find(x => x.name == args[0]).ip)
					saveJSON(banned)
				} else if (onlineUsers.some(x => x.token === args[0])) {
					banned.push(onlineUsers.find(x => x.uuid == args[0]).ip)
					saveJSON(banned)
				} else {
					throw Error("invalid")
				}
			} catch(err) {
				if(err.message == "noPerms") {
					serverMessage(noPerms)
				} else {
					serverPrivateMessage("Make sure to put in a valid username. Usage: <code>?ban {username|uuid}</code>")
					console.log(err)
				}
			}
		}
		
		if (command == 'online') {
			onlineUsers.forEach(obj => {
				serverPrivateMessage(JSON.stringify(obj))
			})
		}

		if (command == 'kick') {
			try {
				if (!modList.includes(data.uuid)) throw Error("noPerms")
				if (!args[0]) throw Error("invalid")
				if (onlineUsers.some(x => x.name === args[0])) {
					let uuid = onlineUsers.find(x => x.name === args[0]).uuid
					console.log(onlineUsers.find(x => x.uuid == uuid).socketId)
					socket.to(onlineUsers.find(x => x.uuid == uuid).socketId).emit("chat message", "kys", "kys", "kys")
				} else if (onlineUsers.some(x => x.token === args[0])) {
					socket.to(onlineUsers.find(x => x.uuid == args[0]).socketId).emit("chat message", "kys", "kys", "kys")
				} else {
					throw Error("invalid")
				}
			} catch(err) {
				if(err.message == "noPerms") {
					serverMessage(noPerms)
				} else {
					serverPrivateMessage("Make sure to put in a valid username. Usage: <code>?kick {username|uuid}</code>")
					console.log(err)
				}
			}
		}
	})
})


// Listen on port 3000
server.listen(3000, () => {
	console.log("listening on port *:3000")
})
