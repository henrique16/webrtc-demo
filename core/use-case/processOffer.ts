import { Media } from "./interface/media"
import { RequestHandler } from "./interface/requestHandler"

export class ProcessOffer {
    private requestHandler: RequestHandler
    private roomId: number
    private userId: number
    private sdp: string

    public constructor(
        requestHandler: RequestHandler,
        roomId: number,
        userId: number,
        sdp: string
    ) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.userId = userId
        this.sdp = sdp
    }

    public exec(): Promise<Media> {
        return this.requestHandler.processOffer(this.roomId, this.userId, this.sdp)
    }
}