import { RequestHandler, Data, Callback } from "../../use-case/interface/requestHandler"
import { Media, Endpoint } from "../../use-case/interface/media"
import { RoomsController } from "../../use-case/roomsController"
import { Pipeline } from "../../use-case/interface/pipeline"
import kurento from "kurento-client"
import Ws from "ws"
import shortid from "shortid"
import config from "../../config/index"

export class WsRequestHandler implements RequestHandler {
    private roomsController: RoomsController
    private controller: Map<string, Callback>
    private ws: Ws | null

    public constructor(roomsController: RoomsController) {
        this.roomsController = roomsController
        this.controller = new Map<string, Callback>()
        this.ws = null
    }

    public async sendMedia(roomId: number, userId: number, sdp: string, callback: Callback): Promise<Media> {
        try {
            const pipeline = await this.createPipeline(roomId, userId)
            var data = await this.attach(pipeline)
            pipeline.id = data.message.data.id
            data = await this.room(roomId, pipeline)
            data = await this.joinPublisher(roomId, pipeline)
            const feed = data.message.plugindata.data.id
            data = await this.publish(sdp, pipeline)
            const media: Media = {
                endpoint: { id: pipeline.id, feed: feed },
                sdpAnswer: data.message.jsep.sdp
            }
            await this.roomsController.setMedia(roomId, media)
            return Promise.resolve(media)
        }
        catch (error) {
            return Promise.reject(error)
        }
    }

    public async getMedia(roomId: number, endpointSender: Endpoint, sdp: string, callback: Callback): Promise<Media> {
        return new Promise(async (resolve, reject) => {
            // setTimeout(async () => {
            try {
                const pipeline = await this.roomsController.get(roomId)
                var data = await this.attach(pipeline)
                pipeline.id = data.message.data.id
                data = await this.joinSubscriber(roomId, endpointSender.feed, pipeline)
                const sdpOffer = data.message.jsep.sdp
                await this.subscribe(sdpOffer, pipeline)
                return resolve({
                    endpoint: { id: pipeline.id, feed: "" },
                    sdpAnswer: sdpOffer
                })
            }
            catch (error) {
                return reject(error)
            }
            // }, 5 * 1000)
        })
    }

    public addCandidate(roomId: number, endpoint: Endpoint, candidates: string[]): void {
        const iceCandidates = candidates.map(candidate => kurento.getComplexType("IceCandidate")(candidate))
        this.roomsController.get(roomId)
            .then(pipeline => {
                this.trickle(endpoint.id, iceCandidates, pipeline)
                this.trickleComplete(endpoint.id, pipeline)
            })
            .catch(error => console.error(error))
    }

    public closeMedia(roomId: number, endpoint: Endpoint): Promise<void> {
        return Promise.resolve()
    }

    private connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const exec = () => {
                if (this.ws && this.ws.readyState === this.ws.OPEN) {
                    return resolve()
                }
                else if (this.ws && this.ws.readyState === this.ws.CONNECTING) {
                    setTimeout(() => exec(), 500)
                }
                else if (this.ws && this.ws.readyState === this.ws.CLOSED) {
                    this.ws.terminate()
                    this.ws = null
                    this.open()
                        .then(() => resolve())
                        .catch(() => reject())
                }
                else {
                    this.open()
                        .then(() => resolve())
                        .catch(() => reject())
                }
            }
            exec()
        })
    }

    private open(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new Ws(config.janus.ws.url, config.janus.ws.protocol)
            this.ws.on("open", () => {
                console.log("WEBSOCKET OPEN")
                this.listener()
                return resolve()
            })
            this.ws.on("error", (error) => {
                console.error(error)
                this.ws = null
                return reject()
            })
        })
    }

    private listener(): void {
        this.ws?.on("message", (data: Ws.Data) => {
            const message: any = JSON.parse(data.toString())
            const transaction: string = message.transaction
            console.log(message)
            switch (message.janus) {
                case "ack":
                    break
                case "error":
                    this.getInController(transaction)
                        .then(callback => {
                            const data: Data = { message: message }
                            callback(data, data)
                        })
                        .catch(() => { })
                    break
                case "trickle":
                    console.log("TRRIIIIIIIIIIIIIIICKE")
                    break
                default:
                    this.getInController(transaction)
                        .then(callback => {
                            const data: Data = { message: message }
                            callback(data)
                        })
                        .catch(() => { })
                    break
            }
        })
        this.ws?.on("close", (code, reason) => {
            this.ws = null
        })
    }

    private createPipeline(roomId: number, userId: number): Promise<Pipeline> {
        return new Promise(async (resolve, reject) => {
            this.connect()
                .then(() => {
                    this.roomsController.get(roomId)
                        .then(pipeline => resolve(pipeline))
                        .catch(() => {
                            this.create()
                                .then(data => {
                                    const pipeline: Pipeline = {
                                        room: { roomId: roomId, userId: userId },
                                        id: data.message.data.id,
                                        sessionId: data.message.data.id,
                                        medias: []
                                    }
                                    this.roomsController.set(pipeline)
                                    return resolve(pipeline)
                                })
                                .catch(error => reject(error))
                        })
                })
                .catch(error => reject(error))
        })
    }

    private create(): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                janus: "create",
                transaction: transaction
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private attach(pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                janus: "attach",
                plugin: "janus.plugin.videoroom",
                transaction: transaction,
                session_id: pipeline.sessionId
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private room(roomId: number, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                janus: "message",
                transaction: transaction,
                session_id: pipeline.sessionId,
                handle_id: pipeline.id,
                body: {
                    request: "create",
                    publishers: 100,
                    bitrate: 2500000,
                    videocodec: "vp8",
                    audiocodec: 'opus',
                    room: roomId,
                    //rec_dir: `${config.rawMjrDir}/${client.roomName}`,
                    bitrate_cap: true,
                    transport_wide_cc_ext: true
                }
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private joinPublisher(roomId: number, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                janus: "message",
                handle_id: pipeline.id,
                session_id: pipeline.sessionId,
                transaction: transaction,
                body: {
                    request: "join",
                    room: roomId,
                    ptype: "publisher",
                    display: "no"
                }
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private joinSubscriber(roomId: number, endpointSenderId: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                handle_id: pipeline.id,
                janus: "message",
                session_id: pipeline.sessionId,
                transaction: transaction,
                body: {
                    request: "join",
                    room: roomId,
                    ptype: "subscriber",
                    feed: endpointSenderId
                },
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private publish(sdp: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            // const isAudio = data.type === "mic" ? true : false
            const msg = {
                janus: "message",
                jsep: {
                    type: "offer",
                    sdp: sdp
                },
                handle_id: pipeline.id,
                session_id: pipeline.sessionId,
                transaction: transaction,
                body: {
                    request: "publish",
                    // audio: isAudio,
                    // video: !isAudio,
                    bitrate: 2500000,
                    record: false
                }
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private subscribe(sdp: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const transaction = shortid.generate()
            const msg = {
                body: {
                    request: "start",
                    room: pipeline.room.roomId
                },
                jsep: {
                    type: "answer",
                    sdp: sdp
                },
                handle_id: pipeline.id,
                janus: "message",
                session_id: pipeline.sessionId,
                transaction: transaction
            }
            this.setInController(transaction, (data: Data, error?: any) => {
                this.deleteInController(transaction)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(transaction)
                    return reject(error)
                }
            })
        })
    }

    private trickle(endpointId: string, candidates: string[], pipeline: Pipeline): void {
        const transaction = shortid.generate()
        const msg = {
            janus: "trickle",
            candidate: candidates,
            transaction: transaction,
            session_id: pipeline.sessionId,
            handle_id: endpointId
        }
        this.ws?.send(JSON.stringify(msg), (error) => {
            if (error) console.error("trickle", error)
        })
    }

    private trickleComplete(endpointId: string, pipeline: Pipeline): void {
        const transaction = shortid.generate()
        const msg = {
            janus: "trickle",
            transaction: transaction,
            candidate: {
                "complete": true
            },
            session_id: pipeline.sessionId,
            handle_id: endpointId
        }
        this.ws?.send(JSON.stringify(msg), (error) => {
            if (error) console.error("trickle", error)
        })
    }

    private getInController(key: string): Promise<Callback> {
        const callback = this.controller.get(key)
        if (!callback) return Promise.reject()
        return Promise.resolve(callback)
    }

    private setInController(key: string, callback: Callback): void {
        this.controller.set(key, callback)
    }

    private deleteInController(key: string): void {
        this.controller.delete(key)
    }

    private getInCandidateController(key: string): Promise<Callback> {
        const callback = this.controller.get(key)
        if (!callback) return Promise.reject()
        return Promise.resolve(callback)
    }

    private setInCandidateController(key: string, callback: Callback): void {
        this.controller.set(key, callback)
    }

    private deleteInCandidateController(key: string): void {
        this.controller.delete(key)
    }

    private getInMediaController(key: string): Promise<Callback> {
        const callback = this.controller.get(key)
        if (!callback) return Promise.reject()
        return Promise.resolve(callback)
    }

    private setInMediaController(key: string, callback: Callback): void {
        this.controller.set(key, callback)
    }

    private deleteInMediaController(key: string): void {
        this.controller.delete(key)
    }
}