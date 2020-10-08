import { Endpoint, Media } from "./media"

export interface Data {
    message: any
}

export interface Callback {
    (data: Data, error?: any): void
}

export interface RequestHandler {
    sendMedia: (roomId: number, userId: number, sdp: string, callback: Callback) => Promise<Media>
    getMedia: (roomId: number, endpointSender: Endpoint, sdp: string, callback: Callback) => Promise<Media>
    addCandidate: (roomId: number, endpoint: Endpoint, candidate: string) => void
}