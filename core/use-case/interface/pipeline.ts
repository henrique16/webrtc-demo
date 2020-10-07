import { Room } from "../../domain/room"
import { Media } from "./media"

export interface Pipeline {
    room: Room
    id: string
    sessionId: string
    medias: Media[]
}