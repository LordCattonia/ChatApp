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
const errorText = document.getElementById("error-message")
const errorModal = document.getElementById("errorModal")
const errorButton = document.getElementById("errorButton")
const colourToggle = document.getElementById("colour-toggle")
const r = document.querySelector(':root');

let isDarkMode = true
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
})

socket.on("delete", (id) => {
	console.log("attempting delete")
	document.getElementById(`msg${id}`).innerHTML = 'moderator deleted message'
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

let applyMessageHistory = (history) => {
	socket.emit("peekID", (id) => {
		if (id > 0) {
			let i = 0
			history.forEach((object) => {
				let item = "How did you send this?"
				item = `<li id="msg${i}">${object.name}: ${object.message}</li>`
				i++
				list.insertAdjacentHTML("beforeend", item.toString())
				window.scrollTo(0, document.body.scrollHeight)
			})
		}
	})
}

let requestMessageHistory = () => {
	socket.emit("requestMessageHistory", (history) => {
		msgHistory = history
		applyMessageHistory(msgHistory)
	})
}

requestMessageHistory()

// Toggles light and dark mode
let toggleDarkMode = () => {
	if (isDarkMode){
		colourToggle.innerHTML = "Click here to turn on dark mode"
		r.style.setProperty('--text-colour', '#000')
		r.style.setProperty('--background-colour', '#fff')
		r.style.setProperty('--second-background-colour', '#ddd')
		r.style.setProperty('--header-colour', '#lightgrey')
		r.style.setProperty('--modal-colour', '#fefefe')
		isDarkMode = false
	} else {
		colourToggle.innerHTML = "Click here to turn on light mode"
		r.style.setProperty('--text-colour', '#fff')
		r.style.setProperty('--background-colour', '#333')
		r.style.setProperty('--second-background-colour', '#353535')
		r.style.setProperty('--header-colour', '#222')
		r.style.setProperty('--modal-colour', '#aaa')
		isDarkMode = true
	}
}

// The script sends messages
form.addEventListener("submit", (e) => {
	e.preventDefault()
	if (Username === null || Username === "") {
		document.getElementById("id01").style.display = "block"
	} else {
		if(input.value.charAt(0) == "?") {
			runCommand(input.value)
		} else {
			if (input.value) {
				socket.emit("chat message", input.value, token)
				input.value = ``
				current.innerHTML = 0
			}
		}
	}
})
// This script recieves any errors and alerts the user
socket.on("error", (data) => {
	if(data.error){
		errorModal.style.display = 'block'
		errorText.innerHTML = data.msg
		errorButton.innerHTML = data.buttonMsg
	}
})
// This script recieves messages
socket.on("chat message", (msg, usr, id) => {
	let item = "How did you send this?"
	item = `<li id="msg${id}">${usr}: ${msg}</li>`
	list.insertAdjacentHTML("beforeend", item)
	window.scrollTo(0, document.body.scrollHeight)
})

// This script runs commands
let runCommand = (command) => {

}

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
