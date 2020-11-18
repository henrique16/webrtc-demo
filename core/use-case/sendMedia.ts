import { Media } from "./interface/media"
import { Callback, RequestHandler } from "./interface/requestHandler"
import { SaveError } from "./saveError"

export class SendMedia {
    private requestHandler: RequestHandler
    private roomId: number
    private sdp: string
    private callback: Callback

    public constructor(
        requestHandler: RequestHandler,
        roomId: number,
        sdp: string,
        callback: Callback
    ) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.sdp = sdp
        this.callback = callback
    }

    public exec(): Promise<Media> {
        return this.requestHandler.sendMedia(this.roomId, this.sdp, this.callback)
            .catch(error => {
                const name = `SendMedia-${Date.now()}`
                const saveError = new SaveError(name, error)
                saveError.exec()
                return error
            })
    }
}