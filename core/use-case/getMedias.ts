import { GetMedia } from "./getMedia"
import { Media } from "./interface/media"
import { Callback, RequestHandler } from "./interface/requestHandler"
import { RoomsController } from "./roomsController"

export class GetMedias {
    private roomsController: RoomsController
    private roomId: number

    public constructor(
        roomsController: RoomsController,
        roomId: number,
    ) {
        this.roomsController = roomsController
        this.roomId = roomId
    }

    public exec(): Promise<Media[]> {
        return this.roomsController.getMedias(this.roomId)
    }
}