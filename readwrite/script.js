document.addEventListener("DOMContentLoaded", function() {
    setColor(window.location.host)
})

function setColor(url) {
    // open the dat archive
    var archive = new DatArchive(url)
    try {
        // fetch a file from the archive
        archive.readFile("local.json").then((contents) => {
            var color = JSON.parse(contents).color
            document.body.style.backgroundColor = color
        })
    } catch (e) {
        console.error(e)
    }
}

function save() {
    var colorValue = getInput("color-input")
    document.body.style.backgroundColor = colorValue
    var archive = new DatArchive(window.location.host)
    archive.writeFile("local.json", JSON.stringify({color: colorValue}, null, 2)) 
}

function enter(e) {
    if (e.key == "Enter") {
        if (e.target.id === "color-input") {
            save()
        } else if (e.target.id === "dat-input") {
            fetch()
        }
    }
}

function fetch() {
    var url = getInput("dat-input")
    setColor(url)
}

function getInput(name) {
    var input = document.getElementById(name)
    var val = input.value
    input.value = ""
    return val
}
