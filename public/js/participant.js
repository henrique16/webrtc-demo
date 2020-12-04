const Participant = function (id, room, requestHandler) {
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

Participant.prototype.onNewMedia = function () {
    this.requestHandler.onNewMedia((message) => {
        const endpointSender = message.endpointSender
        this.getMedia(endpointSender)
            .then(() => { })
            .catch(error => console.error(error))
    })
}

Participant.prototype.onAddIceCandidateSend = function () {
    this.requestHandler.onAddIceCandidateSend((message) => {
        const candidate = message.candidate
        this.peer.addIceCandidate(candidate)
    })
}

Participant.prototype.onAddIceCandidateGet = function () {
    this.requestHandler.onAddIceCandidateGet((message) => {
        const endpointSender = message.endpointSender
        const candidate = message.candidate
        this.peerRecv[endpointSender.id].addIceCandidate(candidate)
    })
}

Participant.prototype.onDisposeMedia = function () {
    this.requestHandler.onDisposeMedia((message) => {
        const endpointSender = message.endpointSender
        const video = document.getElementById(endpointSender.id)
        this.peerRecv[endpointSender.id].dispose()
        video.remove()
        delete this.peerRecv[endpointSender.id]
    })
}

Participant.prototype.sendMedia = function () {
    return new Promise((resolve, reject) => {
        const requestHandler = this.requestHandler
        const roomId = this.room.id
        const userId = this.id
        const video = this.getSendVideo(userId)
        const constraints = {
            video: { width: 350, height: 200, framerate: 15 },
            audio: true
        }
        const options = {
            localVideo: video,
            onicecandidate: (candidate) => {
                this.sendCandidates.push(candidate)
            },
            mediaConstraints: constraints
        }
        var sendCandidates = this.sendCandidates
        this.peer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            try {
                if (error) throw error
                this.generateOffer(async (error, sdp) => {
                    if (error) throw error
                    const message = await requestHandler.sendMedia(roomId, userId, sdp)
                    const endpoint = message.endpoint
                    const sdpAnswer = message.sdpAnswer
                    requestHandler.addIceCandidate(roomId, endpoint, sendCandidates)
                    sendCandidates = []
                    this.processAnswer(sdpAnswer, (error) => {
                        if (error) throw error
                        document.body.appendChild(video)
                        return resolve(endpoint)
                    })
                })
            }
            catch (error) {
                console.error(error)
                return reject(error)
            }
        })
    })
}

Participant.prototype.getMedia = function (endpointSender) {
    return new Promise((resolve, reject) => {
        const requestHandler = this.requestHandler
        const roomId = this.room.id
        const video = this.getRecvVideo(endpointSender)
        const constraints = {
            video: { width: 350, height: 200, framerate: 15 },
            audio: true
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
            try {
                if (error) return reject(error)
                this.generateOffer(async (error, sdp) => {
                    if (error) throw error
                    const message = await requestHandler.getMedia(roomId, endpointSender, sdp)
                    const endpoint = message.endpoint
                    const sdpAnswer = message.sdpAnswer
                    requestHandler.addIceCandidate(roomId, endpoint, recvCandidates)
                    recvCandidates = []
                    this.processAnswer(sdpAnswer, (error) => {
                        if (error) throw error
                        video.onplay = (event) => document.body.appendChild(event.target)
                        return resolve(endpoint)
                    })
                })
            }
            catch (error) {
                console.error(error)
                return reject(error)
            }
        })
    })
}

Participant.prototype.getMedias = function (roomId) {
    return this.requestHandler.getMedias(roomId)
        .then(message => message.medias)
        .catch(error => error)
}

Participant.prototype.closeMedia = function (roomId, endpoint) {
    return this.requestHandler.closeMedia(roomId, endpoint)
}

Participant.prototype.getSendVideo = function (userId) {
    const video = document.createElement("video")
    video.setAttribute("playsinline", "")
    video.setAttribute("autoplay", "")
    video.setAttribute("style", "width: 350px; height: 200px; margin-top: 10px; border: solid")
    video.id = userId
    return video
}

Participant.prototype.getRecvVideo = function (endpointSender) {
    const video = document.createElement("video")
    video.setAttribute("playsinline", "")
    video.setAttribute("autoplay", "")
    video.setAttribute("style", "width: 350px; height: 200px; margin-top: 10px; border: solid")
    video.id = endpointSender.id
    return video
}