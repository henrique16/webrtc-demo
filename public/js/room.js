class Room {
    constructor(id) {
        this.id = id
    }
}

class IoRequestHandler {
    constructor() {
        this.socket = io("http://localhost:9090")
    }

    sendMedia = (roomId, userId, sdp) => {
        return new Promise((resolve, reject) => {
            this.socket.emit("sendMedia", { roomId, userId, sdp })
            this.socket.on("sendMedia-ok", message => resolve(message))
            this.socket.on("sendMedia-error", message => reject(message))
        })
    }

    getMedia = (roomId, endpointSender, sdp) => {
        return new Promise((resolve, reject) => {
            this.socket.emit("getMedia", { roomId, endpointSender, sdp })
            this.socket.on("getMedia-ok", message => resolve(message))
            this.socket.on("getMedia-error", message => reject(message))
        })
    }

    getMedias = (roomId) => {
        return new Promise((resolve, reject) => {
            this.socket.emit("getMedias", { roomId })
            this.socket.on("getMedias-ok", message => resolve(message))
            this.socket.on("getMedias-error", message => reject(message))
        })
    }

    addIceCandidate = (roomId, endpoint, candidates) => {
        this.socket.emit("addIceCandidate", { roomId, endpoint, candidates })
    }

    closeMedia = (roomId, endpoint) => {
        return new Promise((resolve, reject) => {
            this.socket.emit("closeMedia", { roomId, endpoint })
            this.socket.on("closeMedia-ok", () => resolve())
            this.socket.on("closeMedia-error", () => reject(error))
        })
    }

    onNewMedia = (callback) => {
        this.socket.on("newMedia", message => callback(message))
    }

    onAddIceCandidateSend = (callback) => {
        this.socket.on("addIceCandidateSend", message => callback(message))
    }

    onAddIceCandidateGet = (callback) => {
        this.socket.on("addIceCandidateGet", message => callback(message))
    }

    onDisposeMedia = (callback) => {
        this.socket.on("disposeMedia", message => callback(message))
    }
}

class Participant {
    constructor(id, room, requestHandler) {
        this.id = id
        this.room = room
        this.requestHandler = requestHandler
        this.peer = null
        this.peerRecv = { id: null }
        this.sendCandidates = []
        this.recvCandidates = []
        this.onNewMedia()
        this.onAddIceCandidateSend()
        this.onAddIceCandidateGet()
        this.onDisposeMedia()
    }

    onNewMedia = () => {
        this.requestHandler.onNewMedia((message) => {
            const endpointSender = message.endpointSender
            this.getMedia(endpointSender)
                .then(() => { })
                .catch(error => console.error(error))
        })
    }

    onAddIceCandidateSend = () => {
        this.requestHandler.onAddIceCandidateSend((message) => {
            const candidate = message.candidate
            this.peer.addIceCandidate(candidate)
        })
    }

    onAddIceCandidateGet = () => {
        this.requestHandler.onAddIceCandidateGet((message) => {
            const endpointSender = message.endpointSender
            const candidate = message.candidate
            this.peerRecv[endpointSender.id].addIceCandidate(candidate)
        })
    }

    onDisposeMedia = () => {
        this.requestHandler.onDisposeMedia((message) => {
            const endpointSender = message.endpointSender
            const video = document.getElementById(endpointSender.id)
            this.peerRecv[endpointSender.id].dispose()
            video.remove()
            delete this.peerRecv[endpointSender.id]
        })
    }

    sendMedia = () => {
        return new Promise((resolve, reject) => {
            const requestHandler = this.requestHandler
            const roomId = this.room.id
            const userId = this.id
            const video = this.getSendVideo(userId)
            const constraints = {
                video: { width: 350, height: 200, framerate: 15 }
            }
            const options = {
                localVideo: video,
                onicecandidate: (candidate) => {
                    this.sendCandidates.push(candidate)
                },
                mediaConstraints: constraints
            }
            var sendCandidates = this.sendCandidates
            this.peer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                if (error) return reject(error)
                this.generateOffer((error, sdp) => {
                    if (error) return reject(error)
                    requestHandler.sendMedia(roomId, userId, sdp)
                        .then(message => {
                            const endpoint = message.endpoint
                            const sdpAnswer = message.sdpAnswer
                            requestHandler.addIceCandidate(roomId, endpoint, sendCandidates)
                            sendCandidates = []
                            this.processAnswer(sdpAnswer, (error) => {
                                if (error) return reject(error)
                                document.body.appendChild(video)
                                return resolve(endpoint)
                            })
                        })
                        .catch(message => {
                            console.log(message.error)
                            return reject(message.error)
                        })
                })
            })
        })
    }

    getMedia = (endpointSender) => {
        return new Promise((resolve, reject) => {
            const requestHandler = this.requestHandler
            const roomId = this.room.id
            const video = this.getRecvVideo(endpointSender)
            const constraints = {
                video: { width: 350, height: 200, framerate: 15 }
            }
            const options = {
                remoteVideo: video,
                onicecandidate: (candidate) => {
                    this.sendCandidates.push(candidate)
                },
                mediaConstraints: constraints
            }
            var recvCandidates = this.recvCandidates
            this.peerRecv[endpointSender.id] = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                if (error) return reject(error)
                this.generateOffer((error, sdp) => {
                    if (error) return reject(error)
                    requestHandler.getMedia(roomId, endpointSender, sdp)
                        .then(message => {
                            const endpoint = message.endpoint
                            const sdpAnswer = message.sdpAnswer
                            requestHandler.addIceCandidate(roomId, endpoint, recvCandidates)
                            recvCandidates = []
                            this.processAnswer(sdpAnswer, (error) => {
                                if (error) return reject(error)
                                document.body.appendChild(video)
                                return resolve(endpoint)
                            })
                        })
                        .catch(message => reject(message.error))
                })
            })
        })
    }

    getMedias = (roomId) => {
        return this.requestHandler.getMedias(roomId)
            .then(message => message.medias)
            .catch(error => error)
    }

    closeMedia = (roomId, endpoint) => {
        return this.requestHandler.closeMedia(roomId, endpoint)
    }

    getSendVideo = (userId) => {
        const video = document.createElement("video")
        video.setAttribute("playsinline", "")
        video.setAttribute("autoplay", "")
        video.setAttribute("style", "width: 350px; height: 200px; margin-top: 10px; border: solid")
        video.id = userId
        return video
    }

    getRecvVideo = (endpointSender) => {
        const video = document.createElement("video")
        video.setAttribute("playsinline", "")
        video.setAttribute("autoplay", "")
        video.setAttribute("style", "width: 350px; height: 200px; margin-top: 10px; border: solid")
        video.id = endpointSender.id
        return video
    }
}

// init client
var participant

window.addEventListener("load", (event) => {
    const requestHandler = new IoRequestHandler()
    const sendElement = document.getElementById("send")
    const id = Math.floor(Math.random() * 1000)
    const room = new Room(123)
    participant = new Participant(id, room, requestHandler)
    getMedias(participant.room.id)
    sendElement.onclick = send
})

function send(event) {
    const element = event.target
    element.onclick = null
    participant.sendMedia()
        .then(endpoint => {
            element.onclick = (event) => dispose(event, endpoint)
            element.value = "close"
        })
        .catch(error => {
            console.error(error)
            element.onclick = send
        })
}

function getMedias(roomId) {
    participant.getMedias(roomId)
        .then(async medias => {
            try {
                for (const media of medias) {
                    await participant.getMedia(media.endpoint)
                }
            }
            catch (error) {
                console.error(error)
            }
        })
        .catch(() => console.log("there are no media in the room"))
}

function dispose(event, endpoint) {
    const element = event.target
    const video = document.getElementById(participant.id)
    element.onclick = null
    participant.peer.dispose()
    video.remove()
    participant.closeMedia(participant.room.id, endpoint)
        .then(() => {
            element.onclick = send
            element.value = "send"
        })
        .catch(error => {
            console.error(error)
            element.onclick = (event) => dispose(event, endpoint)
        })
}