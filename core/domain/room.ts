export class Room {
    public roomId: number
    public userId: number

    public constructor(
        roomId: number,
        userId: number
    ) {
        this.roomId = roomId
        this.userId = userId
    }
}