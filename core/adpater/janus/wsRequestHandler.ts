// import { RequestHandler, Data } from "../../use-case/interface/requestHandler"
// import { RepositoryHandler } from "../../interface/repositoryHandler"
// import config from "../../config/index"
// import Ws from "ws"
// import shortid from "shortid"

// interface Callback {
//     (data: Data, error?: any): void
// }

// export class WsRequestHandler implements RequestHandler {
//     private repositoryHandler: RepositoryHandler
//     private controller: Map<string, Callback>
//     private ws: Ws | null

//     public constructor(repositoryHandler: RepositoryHandler) {
//         this.repositoryHandler = repositoryHandler
//         this.controller = new Map<string, Callback>()
//         this.ws = null
//     }

//     public createRoom(roomId: number): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             this.repositoryHandler.getRoom(roomId)
//                 .then(room => {
//                     return resolve({
//                         message: {
//                             session_id: room.sessionId,
//                             // sender: room.sender
//                         },
//                         roomId: room.roomId
//                     })
//                 })
//                 .catch(async () => {
//                     this.createRoomThis(roomId)
//                         .then(data => resolve(data))
//                         .catch(error => reject(error))
//                 })
//         })
//     }

//     private createRoomThis(roomId: number): Promise<Data> {
//         return new Promise(async (resolve, reject) => {
//             try {
//                 await this.connect()
//                 var data = await this.create()
//                 data = await this.attach(data)
//                 data.roomId = roomId
//                 data = await this.room(data)
//                 data.roomId = roomId
//                 // await this.repositoryHandler.setRoom({
//                 //     roomId: roomId,
//                 //     sessionId: data.message.session_id,
//                 //     endpoints: Room
//                 // })
//                 return resolve(data)
//             }
//             catch (error) {
//                 return reject(error)
//             }
//         })
//     }

//     public sendMedia(data: Data): Promise<Data> {
//         return Promise.resolve({ message: "" })

//         // this.attach(data, (dataAttach: Data, error?: any) => {
//         //     if (error) return responseHandler.error()
//         //     dataAttach.candidate = data.candidate
//         //     dataAttach.roomId = data.roomId
//         //     this.trickle(dataAttach)
//         //     this.joinPublisher(dataAttach, (dataJoin: Data, error?: any) => {
//         //         if (error) return responseHandler.error()
//         //         dataJoin.sdp = data.sdp
//         //         dataJoin.type = data.type
//         //         this.publish(dataJoin, (dataPublish: Data, error?: any) => {
//         //             if (error) return responseHandler.error()
//         //             const sender: string = dataPublish.message.sender.toString()
//         //             this.setInEndpoints(sender, dataPublish)
//         //             responseHandler.success()
//         //         })
//         //     })
//         // })
//     }

//     private connect(): Promise<void> {
//         return new Promise((resolve, reject) => {
//             const exec = () => {
//                 if (this.ws && this.ws.readyState === this.ws.OPEN) {
//                     return resolve()
//                 }
//                 else if (this.ws && this.ws.readyState === this.ws.CONNECTING) {
//                     setTimeout(() => exec(), 500)
//                 }
//                 else if (this.ws && this.ws.readyState === this.ws.CLOSED) {
//                     this.ws.terminate()
//                     this.ws = null
//                     this.open()
//                         .then(() => resolve())
//                         .catch(() => reject())
//                 }
//                 else {
//                     this.open()
//                         .then(() => resolve())
//                         .catch(() => reject())
//                 }
//             }
//             exec()
//         })
//     }

//     private open(): Promise<void> {
//         return new Promise((resolve, reject) => {
//             this.ws = new Ws(config.janus.ws.url, config.janus.ws.protocol)
//             this.ws.on("open", () => {
//                 console.log("WEBSOCKET OPEN")
//                 this.listener()
//                 return resolve()
//             })
//             this.ws.on("error", (error) => {
//                 console.error(error)
//                 this.ws = null
//                 return reject()
//             })
//         })
//     }

//     private listener(): void {
//         this.ws?.on("message", (data: Ws.Data) => {
//             const message: any = JSON.parse(data.toString())
//             const transaction: string = message.transaction
//             // console.log(message)
//             switch (message.janus) {
//                 case "ack":
//                     break
//                 case "error":
//                     this.getInController(transaction)
//                         .then(callback => {
//                             const data: Data = { message: message }
//                             callback(data, data)
//                             this.deleteInController(transaction)
//                         })
//                         .catch(() => { })
//                     break
//                 default:
//                     this.getInController(transaction)
//                         .then(callback => {
//                             const data: Data = { message: message }
//                             callback(data)
//                             this.deleteInController(transaction)
//                         })
//                         .catch(() => { })
//                     break
//             }
//         })
//         this.ws?.on("close", (code, reason) => {
//             this.ws = null
//         })
//     }

//     private create(): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             const transaction = shortid.generate()
//             const msg = {
//                 janus: "create",
//                 transaction: transaction
//             }
//             this.setInController(transaction, (data: Data, error?: any) => {
//                 if (error) return reject(error)
//                 return resolve(data)
//             })
//             this.ws?.send(JSON.stringify(msg), (error) => {
//                 if (error) {
//                     this.deleteInController(transaction)
//                     return reject("create: didn't send")
//                 }
//             })
//         })
//     }

//     private attach(data: Data): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             const message = data.message
//             const transaction = shortid.generate()
//             const msg = {
//                 janus: "attach",
//                 plugin: "janus.plugin.videoroom",
//                 transaction: transaction,
//                 session_id: message.session_id || message.data.id
//             }
//             this.setInController(transaction, (data: Data, error?: any) => {
//                 if (error) return reject(error)
//                 return resolve(data)
//             })
//             this.ws?.send(JSON.stringify(msg), (error) => {
//                 if (error) {
//                     this.deleteInController(transaction)
//                     return reject("create: didn't send")
//                 }
//             })
//         })
//     }

//     private room(data: Data): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             const message = data.message
//             const transaction = shortid.generate()
//             const msg = {
//                 janus: "message",
//                 transaction: transaction,
//                 session_id: message.session_id,
//                 handle_id: message.data.id,
//                 body: {
//                     request: "create",
//                     publishers: 100,
//                     bitrate: 2500000,
//                     videocodec: "vp8",
//                     audiocodec: 'opus',
//                     room: data.roomId,
//                     //rec_dir: `${config.rawMjrDir}/${client.roomName}`,
//                     bitrate_cap: true,
//                     transport_wide_cc_ext: true
//                 }
//             }
//             this.setInController(transaction, (data: Data, error?: any) => {
//                 if (error) return reject(error)
//                 return resolve(data)
//             })
//             this.ws?.send(JSON.stringify(msg), (error) => {
//                 if (error) {
//                     this.deleteInController(transaction)
//                     return reject("create: didn't send")
//                 }
//             })
//         })
//     }

//     private joinPublisher(data: Data): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             const message = data.message
//             const transaction = shortid.generate()
//             const msg = {
//                 janus: "message",
//                 handle_id: message.data.id,
//                 session_id: message.session_id,
//                 transaction: transaction,
//                 body: {
//                     request: "join",
//                     room: data.roomId,
//                     ptype: "publisher",
//                     display: "no"
//                 }
//             }
//             this.setInController(transaction, (data: Data, error?: any) => {
//                 if (error) return reject(error)
//                 return resolve(data)
//             })
//             this.ws?.send(JSON.stringify(msg), (error) => {
//                 if (error) {
//                     this.deleteInController(transaction)
//                     return reject("create: didn't send")
//                 }
//             })
//         })
//     }

//     private publish(data: Data): Promise<Data> {
//         return new Promise((resolve, reject) => {
//             const message = data.message
//             const transaction = shortid.generate()
//             const isAudio = data.type === "mic" ? true : false
//             const msg = {
//                 janus: "message",
//                 jsep: {
//                     type: "offer",
//                     sdp: data.sdp
//                 },
//                 handle_id: message.sender,
//                 session_id: message.session_id,
//                 transaction: transaction,
//                 body: {
//                     request: "publish",
//                     audio: isAudio,
//                     video: !isAudio,
//                     bitrate: 2500000,
//                     record: false
//                 }
//             }
//             this.setInController(transaction, (data: Data, error?: any) => {
//                 if (error) return reject(error)
//                 return resolve(data)
//             })
//             this.ws?.send(JSON.stringify(msg), (error) => {
//                 if (error) {
//                     this.deleteInController(transaction)
//                     return reject("create: didn't send")
//                 }
//             })
//         })
//     }

//     private trickle(data: Data): void {
//         const message = data.message
//         const transaction = shortid.generate()
//         const msg = {
//             janus: "trickle",
//             candidate: data.candidate,
//             transaction: transaction,
//             session_id: message.session_id,
//             handle_id: message.sender || message.data.id
//         }
//         this.ws?.send(JSON.stringify(msg), (error) => {
//             if (error) console.error("trickle", error)
//         })
//     }

//     private getInController(key: string): Promise<Callback> {
//         const callback = this.controller.get(key)
//         if (!callback) return Promise.reject()
//         return Promise.resolve(callback)
//     }

//     private setInController(key: string, callback: Callback): void {
//         this.controller.set(key, callback)
//     }

//     private deleteInController(key: string): void {
//         this.controller.delete(key)
//     }
// }