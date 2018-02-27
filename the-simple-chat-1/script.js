var messages = []
var peers = []

document.addEventListener("DOMContentLoaded", function() {
    readChat(window.location.host)
    loadFriends()
})

function loadFriends() {
    var archive = new DatArchive(window.location.host)
    archive.readFile("chat.json").then((contents) => {
        var chat = JSON.parse(contents)
        chat.friends.map(readChat)
    })
}

function readRemote() {
    var peerInput = document.getElementById("peer")
    var peer = peerInput.value
    peerInput.value = ""
    readChat(peer)
    
}

function appendNewPeer(peer) {
    peer = normalize(peer)
    if (peers.indexOf(peer) >= 0) {
        return
    }
    peers.push(peer)
    var peerList = document.getElementById("peers")
    var newPeer = document.createElement("li")
    newPeer.textContent = peer
    peerList.appendChild(newPeer)

    var archive = new DatArchive(window.location.host)
    return archive.readFile("chat.json").then((contents) => {
        var chat = JSON.parse(contents)
        if (chat.friends.indexOf(peer) < 0 && peer !== window.location.host) {
            chat.friends.push(peer)
        }
        return archive.writeFile("chat.json", JSON.stringify(chat, null, 2))
    })
}

// thx to 0xade & rotonde for this wonderful function <3
function normalize(url)
{
  if (url && url.url)
    url = url.url;
  if (!url)
    return null;

  // This is microoptimized heavily because it's called often.
  // "Make slow things fast" applies here, but not literally:
  // "Make medium-fast things being called very often even faster."
  
  if (
    url.length > 6 &&
    url[0] == 'd' && url[1] == 'a' && url[2] == 't' && url[3] == ':'
  )
    // We check if length > 6 but remove 4.
    // The other 2 will be removed below.
    url = url.substring(4);
  
  if (
    url.length > 2 &&
    url[0] == '/' && url[1] == '/'
  )
    url = url.substring(2);

  var index = url.indexOf("/");
  url = index == -1 ? url : url.substring(0, index);

  url = url.toLowerCase().trim();
  return url;
}

function compare(a, b) {
    return parseInt(a.time) < parseInt(b.time)
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
            messages.sort(compare)
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
