export interface Endpoint {
    id: string
    feed: string
}

export interface Media {
    endpoint: Endpoint
    sdpAnswer: string
}