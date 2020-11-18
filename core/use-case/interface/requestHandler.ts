import { Endpoint, Media } from "./media"

export interface Data {
    message: any
}

export interface Callback {
    (data: Data, error?: string): void
}

export interface RequestHandler {
    sendMedia: (roomId: number, sdp: string, callback: Callback) => Promise<Media>
    getMedia: (roomId: number, endpointSender: Endpoint, sdp: string, callback: Callback) => Promise<Media>
    addCandidate: (roomId: number, endpoint: Endpoint, candidates: string[]) => void
    closeMedia: (roomId: number, endpoint: Endpoint) => Promise<void>
}