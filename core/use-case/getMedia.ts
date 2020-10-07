import { Endpoint } from "./interface/media"
import { Callback, RequestHandler } from "./interface/requestHandler"

export class GetMedia {
    private requestHandler: RequestHandler
    private roomId: number
    private endpoint: Endpoint
    private callback: Callback

    public constructor(requestHandler: RequestHandler, roomId: number, endpoint: Endpoint, callback: Callback) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.endpoint = endpoint
        this.callback = callback
    }

    public exec() {
        return this.requestHandler.getMedia(this.roomId, this.endpoint, this.callback)
    }
}