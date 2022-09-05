// Initialize FireBase. im poor
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBXXoxX2LvTYb5YkXrG0Kd-Fw7Pu_B6Og",
  authDomain: "chatapp-7bb76.firebaseapp.com",
  projectId: "chatapp-7bb76",
  storageBucket: "chatapp-7bb76.appspot.com",
  messagingSenderId: "680839429741",
  appId: "1:680839429741:web:ff2a96236f56b1f7ba0964",
  measurementId: "G-61H2DW2CSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// I am not very smart but here is my setup
const socket = io()
const rember = document.querySelector("#accept")
let Username = window.localStorage.getItem("username")
document.getElementById("id02").innerHTML = "Username: " + Username
const list = document.getElementById("messages")
const modal = document.getElementById("id01")
const form = document.getElementById("form")
const username = document.getElementById("userbox")
const rememberMe = document.getElementsByName("remember")
const input = document.getElementById("input")
const nameDisplay = document.getElementById("id02")
const typingBox = document.getElementById("typing")
const current = document.getElementById("current")

let token
let typing = []
let msgHistory = []

if (!window.localStorage.getItem("username")) document.getElementById("id02").innerHTML = "No Username"

// Handle tokens
socket.on("connect", () => {
	console.log("socket connected")
	socket.emit("token", {
		token: localStorage.getItem("token")
	})
	requestMessageHistory()
	applyMessageHistory()
})

socket.on("token", (data) => {
	console.log(`Client Token: ${data.token}`)
	localStorage.setItem("token", data.token)
	token = data.token
	socket.emit("Username", token, Username)
})

let resetToken = () => {
	localStorage.removeItem("token")
	window.location.reload()
}

let requestMessageHistory = () => {
	socket.emit("requestMessageHistory", (history) => {
		msgHistory = history
	})
}

let applyMessageHistory = () => {
	socket.emit("peekID", (id) => {
		if (id > 0) {
			let i = 0
			msgHistory.forEach((object) => {
				let item = "How did you send this?"
				item = `<li id="msg${i}">${object.name}: ${object.message}</li>`
				i++
				list.insertAdjacentHTML("beforeend", item.toString())
				window.scrollTo(0, document.body.scrollHeight)
			})
		}
	})
}
// The script sends messages
form.addEventListener("submit", (e) => {
	e.preventDefault()
	if (Username === null || Username === "") {
		document.getElementById("id01").style.display = "block"
	} else {
		if (input.value) {
			// Lenght validation
			if (input.value.length < 1001) {
				let count = (input.value.match(/br>/g) || []).length
				console.log(count)
				if (count < 19) {
					socket.emit("chat message", input.value, token)
					socket.emit("not typing", Username)
					document.getElementById("current").innerHTML = 0
					let msg = input.value
					socket.emit("requestID", (id) => {
						let item = "How did you send this?"
						item = `<li id="msg${id}">${Username}: ${msg}</li>`
						list.insertAdjacentHTML("beforeend", item.toString())
					})
					window.scrollTo(0, document.body.scrollHeight)
					input.value = ""
				} else {
					alert(
						"Too many '<br>'s will fill up the screens for everyone else :( \nBut you knew that already didn't you?"
					)
				}
			} else {
				alert(
					"Please keep your message to a maximum of 1000 characters."
				)
			}
		}
	}
})
// This script recieves messages
socket.on("chat message", (msg, usr, id) => {
	let item = "How did you send this?"
	item = `<li id="msg${id}">${usr}: ${msg}</li>`
	list.insertAdjacentHTML("beforeend", msg)
	window.scrollTo(0, document.body.scrollHeight)
})

// Typing
document.getElementById("input").addEventListener("keydown", () => {
	socket.emit("typing", {user: Username, typing: true})
})

window.addEventListener("input", (event) => {
	if(event.key != "Backspace" && event.key != "Delete") return

	socket.emit("typing", {user: Username, typing: true})		
})

socket.on("typing", (data) => {
	if (!data.user) return

	if (data.typing) {
		console.log("typing")
		if (typing.includes(data.user)) return

		typing.push(data.user)
		typingBox.style.display = "block"
		typingBox.innerHTML = typing + " is typing"
		
	} else {
		typing = typing.filter(user => user !== data.user)
		typing.length ? typingBox.innerHTML = typing + " is typing" : typingBox.style.display = "none"
	}
})

// Form validation
let checkForm = (form) => {
	// validation fails if the input is blank
	if (form.userbox.value == "") {
		alert("Error: Input is empty!")
		form.userbox.focus()
		return false
	}

	// regular expression to match only alphanumeric characters and spaces
	var re = /^[\w ]+$/

	// validation fails if the input doesn't match our regular expression
	if (!re.test(form.userbox.value)) {
		alert("Error: Input contains invalid characters!")
		form.userbox.focus()
		return false
	}
	// if input is too long return false
	if (form.userbox.value.length > 20) {
		alert("Error: Input is more than 20 characters!")
		return false
	}

	// validation was successful

	document.getElementById("id01").style.display = "none"
	setUsername()
	return true
}


// This function sets username when you submit the modal
let setUsername = () => {
	window.localStorage.removeItem("username")
	if (rember.checked == true) {
		window.localStorage.setItem("username", username.value)
		Username = window.localStorage.getItem("username")
		nameDisplay.innerHTML = "Username: " + Username
		console.log("username: " + Username)
		socket.emit("Username", token, Username)
	} else {
		Username = username.value
		nameDisplay.innerHTML = "Username: " + Username
		console.log("username: " + Username)
		socket.emit("Username", token, Username)
	}
}

// Character count
input.addEventListener("input", () => {
	current.innerHTML = input.value.length
})
