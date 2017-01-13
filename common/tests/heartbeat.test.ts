import * as supertest from "supertest-as-promised";
import * as express from "express";
import Heartbeat from "../heartbeat";

let app = express();

describe("Heartbeat", () => {
    it("should working on /ping path", () => {
        app.use(Heartbeat);

        return supertest(app)
            .get("/ping")
            .send()
            .expect(200);
    });

    it("format should be correct", () => {
        app.use(Heartbeat);

        return supertest(app)
            .get("/ping")
            .send()
            .expect(200)
            .then(response => {
                let body = response.body;
            });
    });
});
