import { Endpoint, Media } from "./media"

export interface Data {
    message: any
}

export interface Callback {
    (data: Data, error?: any): void
}

export interface RequestHandler {
    processOffer: (roomId: number, userId: number, sdp: string) => Promise<Media>
    getMedia: (roomId: number, endpoint: Endpoint, callback: Callback) => Promise<void>
    addCandidate: (roomId: number, endpoint: Endpoint, candidate: string) => void
}