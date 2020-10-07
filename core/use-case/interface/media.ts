export interface Endpoint {
    id: string
}

export interface Media {
    endpoint: Endpoint
    sdpAnswer: string
}