import { Callback, Data, RequestHandler } from "../../use-case/interface/requestHandler"
import { RoomsController } from "../../use-case/roomsController"
import { Pipeline } from "../../use-case/interface/pipeline"
import { Endpoint, Media } from "../../use-case/interface/media"
import kurento from "kurento-client"
import config from "../../config/"
import shortid from "shortid"
import Ws from "ws"

export class WsRequestHandler implements RequestHandler {
    private roomsController: RoomsController
    private controller: Map<string, Callback>
    private ws: Ws | null

    public constructor(roomController: RoomsController) {
        this.roomsController = roomController
        this.controller = new Map<string, Callback>()
        this.ws = null
    }

    public async processOffer(roomId: number, userId: number, sdp: string): Promise<Media> {
        try {
            const pipeline = await this.createMediaPipeline(roomId, userId)
            var data = await this.createEndpoint(pipeline)
            const endpointId = data.message.result.value
            data = await this.connectEndpoint(endpointId, pipeline)
            data = await this.processOfferEndpoint(endpointId, sdp, pipeline)
            const sdpAnswer = data.message.result.value
            const media: Media = {
                endpoint: { id: endpointId },
                sdpAnswer: sdpAnswer
            }
            await this.roomsController.setMedia(roomId, media)
            return Promise.resolve(media)
        }
        catch (error) {
            return Promise.reject(error)
        }
    }

    public getMedia(roomId: number, endpoint: Endpoint, callback: Callback): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const pipeline = await this.roomsController.getInController(roomId)
                const media = await this.roomsController.getMedia(roomId, endpoint)
                await this.subscribe("OnIceCandidate", media.endpoint.id, pipeline)
                await this.gatherCandidatesThis(media.endpoint.id, pipeline, callback)
                return resolve()
            }
            catch (error) {
                return reject(error)
            }
        })
    }

    public addCandidate(roomId: number, endpoint: Endpoint, candidate: string): void {
        const iceCandidate = kurento.getComplexType("IceCandidate")(candidate)
        this.roomsController.getInController(roomId)
            .then(pipeline => {
                const id = shortid.generate()
                const msg = {
                    "id": id,
                    "method": "invoke",
                    "params": {
                        "object": endpoint.id,
                        "operation": "addIceCandidate",
                        "operationParams": {
                            "candidate": iceCandidate
                        },
                        "sessionId": pipeline.sessionId
                    },
                    "jsonrpc": "2.0"
                }
                this.ws?.send(JSON.stringify(msg), (error) => {
                    if (error) console.error(error)
                })
            })
            .catch(error => console.error(error))
    }

    private async createMediaPipeline(roomId: number, userId: number): Promise<Pipeline> {
        return new Promise((resolve, reject) => {
            this.connect()
                .then(() => {
                    this.roomsController.getInController(roomId)
                        .then(pipeline => resolve(pipeline))
                        .catch(() => {
                            this.createMediaPipelineKurento()
                                .then(data => {
                                    const pipeline: Pipeline = {
                                        room: { roomId: roomId, userId: userId },
                                        id: data.message.result.value,
                                        sessionId: data.message.result.sessionId,
                                        medias: []
                                    }
                                    this.roomsController.setInController(pipeline)
                                    return resolve(pipeline)
                                })
                                .catch(error => reject(error))
                        })
                })
                .catch(error => reject(error))
        })
    }

    private createMediaPipelineKurento(): Promise<Data> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "create",
                "params": {
                    "type": "MediaPipeline",
                    "constructorParams": {},
                    "properties": {}
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
    }

    private createEndpoint(pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "create",
                "params": {
                    "type": "WebRtcEndpoint",
                    "constructorParams": {
                        "mediaPipeline": pipeline.id
                    },
                    "properties": {},
                    "sessionId": pipeline.sessionId
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
    }

    private connectEndpoint(endpointId: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "invoke",
                "params": {
                    "object": endpointId,
                    "operation": "connect",
                    "operationParams": {
                        "sink": endpointId
                    },
                    "sessionId": pipeline.sessionId
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
    }

    private processOfferEndpoint(endpointId: string, sdp: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "invoke",
                "params": {
                    "object": endpointId,
                    "operation": "processOffer",
                    "operationParams": {
                        "offer": sdp
                    },
                    "sessionId": pipeline.sessionId
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
    }

    private subscribe(type: string, endpointId: string, pipeline: Pipeline): Promise<Data> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "subscribe",
                "params": {
                    "type": type,
                    "object": endpointId,
                    "sessionId": pipeline.sessionId
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
    }

    private gatherCandidatesThis(endpointId: string, pipeline: Pipeline, callback: Callback): Promise<void> {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "invoke",
                "params": {
                    "object": endpointId,
                    "operation": "gatherCandidates",
                    "sessionId": pipeline.sessionId
                },
                "jsonrpc": "2.0"
            }
            this.setInController(endpointId, callback)
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                this.deleteInController(endpointId)
                if (error) return reject(error)
                return resolve()
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    this.deleteInController(endpointId)
                    return reject(error)
                }
            })
        })
    }

    private ping() {
        return new Promise((resolve, reject) => {
            const id = shortid.generate()
            const msg = {
                "id": id,
                "method": "ping",
                "params": {
                    "interval": 240000
                },
                "jsonrpc": "2.0"
            }
            this.setInController(id, (data: Data, error?: any) => {
                this.deleteInController(id)
                if (error) return reject(error)
                return resolve(data)
            })
            this.ws?.send(JSON.stringify(msg), (error) => {
                if (error) {
                    this.deleteInController(id)
                    return reject(error)
                }
            })
        })
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
            this.ws = new Ws(config.kurento.ws.url)
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
            const id: string = message.id
            // console.log(message)
            if (message.hasOwnProperty("error")) {
                this.getInController(id)
                    .then(callback => {
                        const data: Data = { message: message }
                        callback(data, data)
                    })
                    .catch(() => { })
                return
            }
            else if (message.method && message.method === "onEvent") {
                this.event(message)
                return
            }
            this.getInController(id)
                .then(callback => {
                    const data: Data = { message: message }
                    callback(data)
                })
                .catch(() => { })
        })
        this.ws?.on("close", (code, reason) => {
            this.ws = null
        })
    }

    private event(message: any) {
        switch (message.params.value.type) {
            case "OnIceCandidate":
                this.getInController(message.params.value.object)
                    .then(callback => callback({
                        message: {
                            candidate: kurento.getComplexType("IceCandidate")(
                                message.params.value.data.candidate
                            )
                        }
                    }))
                    .catch(() => { })
                break
            default:
                break
        }
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
}