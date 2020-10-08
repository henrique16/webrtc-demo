import { Media } from "./interface/media"
import { Callback, RequestHandler } from "./interface/requestHandler"

export class SendMedia {
    private requestHandler: RequestHandler
    private roomId: number
    private userId: number
    private sdp: string
    private callback: Callback

    public constructor(
        requestHandler: RequestHandler,
        roomId: number,
        userId: number,
        sdp: string,
        callback: Callback
    ) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.userId = userId
        this.sdp = sdp
        this.callback = callback
    }

    public exec(): Promise<Media> {
        return this.requestHandler.sendMedia(this.roomId, this.userId, this.sdp, this.callback)
    }
}