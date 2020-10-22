import { Express } from "express"
import socketio from "socket.io"

export class Route {
    private route: Express
    private io: socketio.Server

    public constructor(route: Express, io: socketio.Server) {
        this.route = route
        this.io = io
        this.exec()
    }

    private exec() {
        
        this.route.get("/", (req, res, next) => {
            res.status(200).sendFile("index.html")
        })
    }
}