var messages = []

document.addEventListener("DOMContentLoaded", function() {
    readChat(window.location.host)
})

function readRemote() {
    var peer = document.getElementById("peer").value
    readChat(peer)
}

function appendNewPeer(peer) {
    var peerList = document.getElementById("peers")
    var newPeer = document.createElement("li")
    newPeer.textContent = peer
    peerList.appendChild(newPeer)
}

function readChat(dat) {
    var archive = new DatArchive(dat)
    appendNewPeer(dat)
    // register for periodic lookups on remote peer 
    // see https://beakerbrowser.com/docs/tutorials/listen-for-file-changes.html
    var fileEvents = archive.createFileActivityStream()
    fileEvents.addEventListener('changed', e => {
        console.log(e.path, 'changed')
        getMessages()
    })

    function getMessages() {
        archive.readFile("chat.json").then((contents) => {
            var chat = JSON.parse(contents)
            // fetch the new messages by comparing timestamps
            var newMessages = chat.messages.filter((msg) => {
                msg.author = chat.name
                for (var i = 0; i < messages.length; i++) {
                    var existing = messages[i]
                    if (parseInt(existing.time) === parseInt(msg.time)) {
                        return false
                    }
                }
                return true
            })
            messages = messages.concat(newMessages)
            renderMessages()
        })
    }
    getMessages()
}

function renderMessages() {
    var messageElements = messages.map(createMessageEl)
    var parent = document.createElement("div")
    parent.id = "chat"
    messageElements.forEach((el) => {
        parent.appendChild(el)
    })
    var chat = document.getElementById("chat")
    chat.replaceWith(parent)
}

function saveMsg() {
    var chat = document.getElementById("chatbox")
    var msg = chat.value
    // clear input
    chat.value = ""
    var archive = new DatArchive(window.location.host)
    // fetch the old 
    archive.readFile("chat.json").then((contents) => {
        var messages = JSON.parse(contents)
        messages.messages.push({msg: msg, time: Date.now()})
        // save the new 
        archive.writeFile("chat.json", JSON.stringify(messages))
    })
}

function appendMessage(msg) {
    var line = createMessageEl(msg)
    var chat = document.getElementById("chat")
    chat.appendChild(line)
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function createMessageEl(msg) {
    var parent = document.createElement("div")
    parent.classList.add("msg")
    var text = document.createElement("div")
    text.classList.add("msg-txt")
    text.textContent = `<${msg.author}> ${msg.msg}`
    var time = document.createElement("div")
    time.classList.add("msg-time")
    var d = new Date(msg.time)
    // time.textContent = d.toISOString().split("T")[0]
    time.textContent = `${d.getHours()}:${d.getMinutes()}:${pad(d.getSeconds(), 2)}`

    parent.appendChild(text)
    parent.appendChild(time)
    return parent
}
