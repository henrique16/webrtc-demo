import socketio from "socket.io"
import { WsRequestHandler } from "./core/adpater/kurento/wsRequestHandler"
import { AddCandidate } from "./core/use-case/addCandidate"
import { GetMedia } from "./core/use-case/getMedia"
import { Endpoint } from "./core/use-case/interface/media"
import { Callback, RequestHandler } from "./core/use-case/interface/requestHandler"
import { ProcessOffer } from "./core/use-case/processOffer"
import { RoomsController } from "./core/use-case/roomsController"

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

            socket.on("processOffer", message => {
                const roomId: number = message.roomId
                const userId: number = message.userId
                const sdp: string = message.sdp
                const processOffer = new ProcessOffer(requestHandler, roomId, userId, sdp)
                processOffer.exec()
                    .then(media => socket.emit("processAnswer", {
                        endpoint: media.endpoint,
                        sdpAnswer: media.sdpAnswer
                    }))
                    .catch(error => console.error(error))
            })

            socket.on("getMedia", message => {
                const roomId: number = message.roomId
                const endpoint: Endpoint = message.endpoint
                const callback: Callback = (data, error) => {
                    if (error) return console.error(error)
                    socket.emit("addIceCandidate", { candidate: data.message.candidate })
                }
                const getMedia = new GetMedia(requestHandler, roomId, endpoint, callback)
                getMedia.exec()
                    .then(() => {})
                    .catch(error => console.error(error))
            })

            socket.on("addIceCandidate", message => {
                const roomId: number = message.roomId
                const endpoint: Endpoint = message.endpoint
                const candidate: string = message.candidate
                const addCandidate = new AddCandidate(requestHandler, roomId, endpoint, candidate)
                addCandidate.exec()
            })
        })
    }
}