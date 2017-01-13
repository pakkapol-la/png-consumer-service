import * as supertest from "supertest-as-promised";
import * as express from "express";
import * as JSON from "../middlewares/json";

let app = express();

describe("JSON Middleware", () => {
    it("should ask for required fields", () => {
        // app.use(Heartbeat);

        // return supertest(app)
        //     .get("/ping")
        //     .send()
        //     .expect(200);
    });
});
