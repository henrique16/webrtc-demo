import { Endpoint } from "./interface/media"
import { RequestHandler } from "./interface/requestHandler"

export class AddCandidate {
    private requestHandler: RequestHandler
    private roomId: number
    private endpoint: Endpoint
    private candidate: string

    public constructor(requestHandler: RequestHandler, roomId: number, endpoint: Endpoint, candidate: string) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.endpoint = endpoint
        this.candidate = candidate
    }

    public exec() {
        this.requestHandler.addCandidate(this.roomId, this.endpoint, this.candidate)
    }
}