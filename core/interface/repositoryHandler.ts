import { Room } from "../domain/room"

export interface RepositoryHandler {
    setRoom(data: Room): Promise<void>
    getRoom(roomId: number): Promise<Room>
    updateRoom(data: Room): Promise<void>
}