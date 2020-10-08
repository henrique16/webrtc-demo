import { Endpoint, Media } from "./interface/media"
import { Callback, RequestHandler } from "./interface/requestHandler"

export class GetMedia {
    private requestHandler: RequestHandler
    private roomId: number
    private endpointSender: Endpoint
    private sdp: string
    private callback: Callback

    public constructor(
        requestHandler: RequestHandler,
        roomId: number,
        endpointSender: Endpoint,
        sdp: string,
        callback: Callback
    ) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.endpointSender = endpointSender
        this.sdp = sdp
        this.callback = callback
    }

    public exec(): Promise<Media> {
        return this.requestHandler.getMedia(this.roomId, this.endpointSender, this.sdp, this.callback)
    }
}