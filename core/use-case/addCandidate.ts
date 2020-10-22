import { Endpoint } from "./interface/media"
import { RequestHandler } from "./interface/requestHandler"

export class AddCandidate {
    private requestHandler: RequestHandler
    private roomId: number
    private endpoint: Endpoint
    private candidates: string[]

    public constructor(requestHandler: RequestHandler, roomId: number, endpoint: Endpoint, candidates: string[]) {
        this.requestHandler = requestHandler
        this.roomId = roomId
        this.endpoint = endpoint
        this.candidates = candidates
    }

    public exec() {
        return this.requestHandler.addCandidate(this.roomId, this.endpoint, this.candidates)
    }
}