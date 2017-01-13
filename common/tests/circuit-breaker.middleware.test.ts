import * as supertest from "supertest-as-promised";
import * as express from "express";
import * as CircuitBreaker from "../middlewares/circuit-breaker";

let app = express();

describe("Circuit Breaker Middleware", () => {
    it("should return error when in 'open' state", () => {
        // app.use(Heartbeat);

        // return supertest(app)
        //     .get("/ping")
        //     .send()
        //     .expect(200);
    });
});
