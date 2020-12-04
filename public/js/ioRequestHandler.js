const IoRequestHandler = function () {
    this.socket = io("http://192.168.15.24:9090")
}

IoRequestHandler.prototype.sendMedia = function (roomId, userId, sdp) {
    return new Promise((resolve, reject) => {
        this.socket.emit("sendMedia", { roomId, userId, sdp })
        this.socket.on("sendMedia-ok", message => resolve(message))
        this.socket.on("sendMedia-error", message => reject(message))
    })
}

IoRequestHandler.prototype.getMedia = function (roomId, endpointSender, sdp) {
    return new Promise((resolve, reject) => {
        this.socket.emit("getMedia", { roomId, endpointSender, sdp })
        this.socket.on("getMedia-ok", message => resolve(message))
        this.socket.on("getMedia-error", message => reject(message))
    })
}

IoRequestHandler.prototype.getMedias = function (roomId) {
    return new Promise((resolve, reject) => {
        this.socket.emit("getMedias", { roomId })
        this.socket.on("getMedias-ok", message => resolve(message))
        this.socket.on("getMedias-error", message => reject(message))
    })
}

IoRequestHandler.prototype.addIceCandidate = function (roomId, endpoint, candidates) {
    this.socket.emit("addIceCandidate", { roomId, endpoint, candidates })
}

IoRequestHandler.prototype.closeMedia = function (roomId, endpoint) {
    return new Promise((resolve, reject) => {
        this.socket.emit("closeMedia", { roomId, endpoint })
        this.socket.on("closeMedia-ok", () => resolve())
        this.socket.on("closeMedia-error", () => reject(error))
    })
}

IoRequestHandler.prototype.onNewMedia = function (callback) {
    this.socket.on("newMedia", message => callback(message))
}

IoRequestHandler.prototype.onAddIceCandidateSend = function (callback) {
    this.socket.on("addIceCandidateSend", message => callback(message))
}

IoRequestHandler.prototype.onAddIceCandidateGet = function (callback) {
    this.socket.on("addIceCandidateGet", message => callback(message))
}

IoRequestHandler.prototype.onDisposeMedia = function (callback) {
    this.socket.on("disposeMedia", message => callback(message))
}