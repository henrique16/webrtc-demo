import { Room } from "../../domain/room"
import { Endpoint, Media } from "./media"

export interface Pipeline {
    room: Room
    id: string
    sessionId: string
    medias: Media[]
}