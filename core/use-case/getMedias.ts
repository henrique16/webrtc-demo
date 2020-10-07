import { GetMedia } from "./getMedia"
import { Callback, RequestHandler } from "./interface/requestHandler"
import { RoomsController } from "./roomsController"

export class GetMedias {
    private requestHandler: RequestHandler
    private roomsController: RoomsController
    private roomId: number
    private callback: Callback

    public constructor(requestHandler: RequestHandler, roomsController: RoomsController, roomId: number, callback: Callback) {
        this.requestHandler = requestHandler
        this.roomsController = roomsController
        this.roomId = roomId
        this.callback = callback
    }

    public exec(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const medias = await this.roomsController.getMedias(this.roomId)
                await Promise.all((medias.map(media => {
                    this.requestHandler.getMedia(this.roomId, media.endpoint, this.callback)
                })))
                return resolve()
            }
            catch (error) {
                return reject(error)
            }
        })
    }
}