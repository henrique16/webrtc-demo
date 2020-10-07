// import { Data, RequestHandler } from "../use-case/interface/requestHandler"
// import axios, { AxiosStatic } from "axios"
// import config from "../config/index"
// import shortid from "shortid"

// interface Callback {
//     (data: Data, error?: any): void
// }

// export class HttpRequestHandler implements RequestHandler {
//     private request: AxiosStatic
//     private url: string
//     public dataRoom: Data | null

//     public constructor() {
//         this.request = axios
//         this.url = config.janus.http.url
//         this.dataRoom = null
//     }

//     public createRoom(roomId: number): Promise<Data> {
//         return Promise.resolve({ message: "message" })
//         // const start = Date.now()
//         // this.create((dataCreate: Data, error?: any) => {
//         //     if (error) return responseHandler.error()
//         //     this.attach(dataCreate, (dataAttach: Data, error?: any) => {
//         //         if (error) return responseHandler.error()
//         //         dataAttach.roomId = roomId
//         //         this.room(dataAttach, (dataRoom: Data, error?: any) => {
//         //             if (error) return responseHandler.error()
//         //             dataRoom.roomId = roomId
//         //             this.dataRoom = dataRoom
//         //             console.log(Date.now() - start)
//         //             responseHandler.success()
//         //         })
//         //     })
//         // })
//     }

//     public sendMedia(data: Data): Promise<Data> {
//         return Promise.resolve({ message: "message" })
//     }

//     private create(callback: Callback): void {
//         const transaction = shortid.generate()
//         const body = {
//             janus: "create",
//             transaction: transaction
//         }
//         this.request.post(`${this.url}`, body)
//             .then(response => {
//                 const data: Data = { message: response.data }
//                 this.execCallback(data, callback)
//             })
//             .catch(error => {
//                 console.error(error)
//                 const data: Data = { message: null }
//                 callback(data, "error")
//             })
//     }

//     private attach(data: Data, callback: Callback): void {
//         const message = data.message
//         const transaction = shortid.generate()
//         const body = {
//             janus: "attach",
//             plugin: "janus.plugin.videoroom",
//             transaction: transaction,
//             session_id: message.session_id || message.data.id
//         }
//         this.request.post(`${this.url}`, body)
//             .then(response => {
//                 const data: Data = { message: response.data }
//                 this.execCallback(data, callback)
//             })
//             .catch(error => {
//                 console.error(error)
//                 const data: Data = { message: null }
//                 callback(data, "error")
//             })
//     }

//     private room(data: Data, callback: Callback): void {
//         const message = data.message
//         const transaction = shortid.generate()
//         const body = {
//             janus: "message",
//             transaction: transaction,
//             session_id: message.session_id,
//             handle_id: message.data.id,
//             body: {
//                 request: "create",
//                 publishers: 100,
//                 bitrate: 2500000,
//                 videocodec: "vp8",
//                 audiocodec: 'opus',
//                 room: data.roomId,
//                 //rec_dir: `${config.rawMjrDir}/${client.roomName}`,
//                 bitrate_cap: true,
//                 transport_wide_cc_ext: true
//             }
//         }
//         this.request.post(`${this.url}`, body)
//             .then(response => {
//                 const data: Data = { message: response.data }
//                 this.execCallback(data, callback)
//             })
//             .catch(error => {
//                 console.error(error)
//                 const data: Data = { message: null }
//                 callback(data, "error")
//             })
//     }

//     private execCallback(data: Data, callback: Callback): void {
//         console.log(data.message)
//         switch (data.message.janus) {
//             case "ack":
//                 break
//             case "error":
//                 callback(data, "error")
//                 break
//             default:
//                 callback(data)
//                 break
//         }
//     }
// }