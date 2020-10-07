import express from "express"
import socketio from "socket.io"
import { Route } from "./route"
import { Socket } from "./socket"
import { Api } from "./api"
import path from "path"

function init() {
    const app = express()
    const io = socketio()
    app.use(express.static(path.resolve(__dirname, "public")))
    new Route(app, io)
    new Api(app)
    new Socket(io)
    const server = app.listen(9090, () => console.log(9090))
    io.listen(server)
}

init()