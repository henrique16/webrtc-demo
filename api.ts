import { Express } from "express"

export class Api {
    private api: Express

    public constructor(api: Express) {
        this.api = api
        this.exec()
    }

    private exec() {

        this.api.get("/", (req, res, next) => {

        })
        
    }
}