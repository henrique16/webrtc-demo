import { WsRequestHandler } from "./core/adpater/janus/wsRequestHandler"
import { AddCandidate } from "./core/use-case/addCandidate"
import { GetMedia } from "./core/use-case/getMedia"
import { GetMedias } from "./core/use-case/getMedias"
import { Endpoint } from "./core/use-case/interface/media"
import { Callback, RequestHandler } from "./core/use-case/interface/requestHandler"
import { SendMedia } from "./core/use-case/sendMedia"
import { RoomsController } from "./core/use-case/roomsController"
import { CloseMedia } from "./core/use-case/closeMedia"
import socketio from "socket.io"

const roomController: RoomsController = new RoomsController()
const requestHandler: RequestHandler = new WsRequestHandler(roomController)

export class Socket {
    private io: socketio.Server

    public constructor(io: socketio.Server) {
        this.io = io
        this.exec()
    }

    private exec() {
        this.io.on("connection", (socket) => {
            socket.on("sendMedia", message => {
                const roomId: number = message.roomId
                const userId: number = message.userId
                const sdp: string = message.sdp
                const callback: Callback = (data, error) => {
                    if (error) return console.error(error)
                    socket.emit("addIceCandidateSend", { candidate: data.message.candidate })
                }
                const sendMedia = new SendMedia(requestHandler, roomId, userId, sdp, callback)
                sendMedia.exec()
                    .then(media => {
                        socket.emit("sendMedia-ok", {
                            endpoint: media.endpoint,
                            sdpAnswer: media.sdpAnswer
                        })
                        socket.on('disconnect', () => {
                            this.closeMedia(roomId, media.endpoint, socket)
                        })
                        socket.broadcast.emit("newMedia", { endpointSender: media.endpoint })
                    })
                    .catch(error => socket.emit("sendMedia-error", { error: error }))
            })

            socket.on("getMedia", message => {
                const roomId: number = message.roomId
                const endpointSender: Endpoint = message.endpointSender
                const sdp: string = message.sdp
                const callback: Callback = (data, error) => {
                    if (error) return console.error(error)
                    socket.emit("addIceCandidateGet", {
                        endpointSender: endpointSender,
                        candidate: data.message.candidate
                    })
                }
                const getMedia = new GetMedia(requestHandler, roomId, endpointSender, sdp, callback)
                getMedia.exec()
                    .then(media => {
                        console.log("OOOOOOOOOOOOOKKKKKKKKKKKKKKKKKKKK")
                        socket.emit("getMedia-ok", {
                            endpoint: media.endpoint,
                            sdpAnswer: media.sdpAnswer
                        })
                    })
                    .catch(error => socket.emit("getMedia-error", { error: error }))
            })

            socket.on("getMedias", message => {
                const roomId: number = message.roomId
                const getMedias = new GetMedias(roomController, roomId)
                getMedias.exec()
                    .then(medias => socket.emit("getMedias-ok", { medias: medias }))
                    .catch(error => socket.emit("getMedias-error", { error: error }))
            })

            socket.on("addIceCandidate", message => {
                const roomId: number = message.roomId
                const endpoint: Endpoint = message.endpoint
                const candidates: string[] = message.candidates
                const addCandidate = new AddCandidate(requestHandler, roomId, endpoint, candidates)
                addCandidate.exec()
            })

            socket.on("closeMedia", message => {
                const roomId = message.roomId
                const endpoint = message.endpoint
                this.closeMedia(roomId, endpoint, socket)
            })
        })
    }

    private closeMedia(roomId: number, endpoint: Endpoint, socket: socketio.Socket) {
        const closeMedia = new CloseMedia(requestHandler, roomId, endpoint)
        closeMedia.exec()
            .then(() => socket.emit("closeMedia-ok"))
            .catch(error => socket.emit("closeMedia-error", { error: error }))
        socket.broadcast.emit("disposeMedia", { endpointSender: endpoint })
    }
}