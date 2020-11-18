import { pipeline } from "stream"
import { EditorOptions } from "typescript"
import { Endpoint, Media } from "./interface/media"
import { Pipeline } from "./interface/pipeline"

export class RoomsController {
    private controller: Map<number, Pipeline>

    public constructor() {
        this.controller = new Map<number, Pipeline>()
    }

    public set(pipeline: Pipeline): void {
        this.controller.set(pipeline.roomId, pipeline)
    }

    public get(roomId: number): Promise<Pipeline> {
        const pipeline = this.controller.get(roomId)
        if (!pipeline) return Promise.reject("there isn't roomId")
        return Promise.resolve(pipeline)
    }

    public del(roomId: number): Promise<void> {
        const del: boolean = this.controller.delete(roomId)
        if (!del) return Promise.reject("there isn't roomId")
        return Promise.resolve()
    }

    public setMedia(roomId: number, media: Media): Promise<void> {
        return new Promise((resolve, reject) => {
            this.get(roomId)
                .then(pipeline => {
                    pipeline.medias.push(media)
                    return resolve()
                })
                .catch(error => reject(error))
        })
    }

    public getMedias(roomId: number): Promise<Media[]> {
        return new Promise((resolve, reject) => {
            this.get(roomId)
                .then(pipeline => {
                    return resolve(pipeline.medias)
                })
                .catch(error => reject(error))
        })
    }

    public getMedia(roomId: number, endpoint: Endpoint): Promise<Media> {
        return new Promise((resolve, reject) => {
            this.get(roomId)
                .then(pipeline => {
                    const media = pipeline.medias.find(x => x.endpoint.id === endpoint.id)
                    if (!media) return reject(`there isn't media ${endpoint.id}`)
                    return resolve(media)
                })
                .catch(error => reject(error))
        })
    }

    public deleteMedia(roomId: number, endpoint: Endpoint): Promise<void> {
        return new Promise((resolve, reject) => {
            this.get(roomId)
                .then(pipeline => {
                    const index = pipeline.medias.findIndex(x => x.endpoint.id === endpoint.id)
                    if (index === -1) return reject("there isn't this media")
                    pipeline.medias.splice(index, 1)
                    return resolve()
                })
                .catch(error => reject(error))

        })
    }

    public initialState(): void {
        this.controller = new Map<number, Pipeline>()
    }

    public initialStateMedia(): void {
        this.controller.forEach(pipeline => {
            pipeline.medias = []
        })
    }
}