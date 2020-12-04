const Room = function (id) {
    this.id = id
}

// init client
var participant

window.onload = (event) => {
    const id = Math.floor(Math.random() * 1000)
    const room = new Room(123)
    const requestHandler = new IoRequestHandler()
    const sendElement = document.getElementById("send")
    participant = new Participant(id, room, requestHandler)
    getMedias(participant.room.id)
    sendElement.onclick = send
}

async function send(event) {
    try {
        const element = event.target
        element.onclick = null
        const endpoint = await participant.sendMedia()
        element.onclick = (event) => dispose(event, endpoint)
        element.value = "close"
    }
    catch (error) {
        console.error(error)
        element.onclick = send
    }
}

async function getMedias(roomId) {
    try {
        const medias = await participant.getMedias(roomId)
        for (const media of medias) {
            await participant.getMedia(media.endpoint)
        }
    }
    catch (error) {
        console.error(error)
    }
}

async function dispose(event, endpoint) {
    try {
        const element = event.target
        const video = document.getElementById(participant.id)
        element.onclick = null
        participant.peer.dispose()
        video.remove()
        await participant.closeMedia(participant.room.id, endpoint)
        element.onclick = send
        element.value = "send"
    }
    catch (error) {
        console.error(error)
        element.onclick = (event) => dispose(event, endpoint)
    }
}