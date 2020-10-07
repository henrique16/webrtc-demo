import { RepositoryHandler } from "../interface/repositoryHandler"
import { Room } from "../domain/room"

export class MapRepositoryHandler implements RepositoryHandler {
    private constroller: Map<number, Room>

    public constructor() {
        this.constroller = new Map<number, Room>()
    }

    public setRoom(data: Room): Promise<void> {
        if (!data || !data.roomId) return Promise.reject("there isn't roomId")
        this.constroller.set(data.roomId, data)
        return Promise.resolve()
    }

    public getRoom(roomId: number): Promise<Room> {
        const room = this.constroller.get(roomId)
        if (!room) return Promise.reject("there isn't roomId in repository")
        return Promise.resolve(room)
    }

    public updateRoom(data: Room): Promise<void> {
        if (!data || !data.roomId) return Promise.reject("there isn't roomId")
        this.constroller.set(data.roomId, data)
        return Promise.resolve()
    }
}