import { Express } from "express"
import _path from "path"
import _socketio from "socket.io"

export class Route {
    private route: Express
    private io: _socketio.Server

    public constructor(route: Express, io: _socketio.Server) {
        this.route = route
        this.io = io
        this.exec()
    }

    private exec() {
        
        this.route.get("/", (req, res, next) => {
            res.status(200).sendFile(_path.join(__dirname, "/public", "/view", "index.html"))
        })
    }
}