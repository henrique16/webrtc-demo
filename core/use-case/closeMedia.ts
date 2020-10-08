import { Endpoint } from "./interface/media"
import { RequestHandler } from "./interface/requestHandler"

export class CloseMedia {
    private requestHandler: RequestHandler
    private roomId: number
    private endpoint: Endpoint

    public constructor(
        requestHandler: RequestHandler,
        roomId: number,
        endpoint: Endpoint
    ) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.endpoint = endpoint
    }

    public exec() {
        return this.requestHandler.closeMedia(this.roomId, this.endpoint)
    }
}