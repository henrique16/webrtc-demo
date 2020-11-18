import { Media } from "./media"

export interface Pipeline {
    roomId: number
    id: string
    sessionId: string
    medias: Media[]
}