import * as express from "express";
import * as _ from "lodash";
import CircuitBreaker from "../circuit-breaker";

function need(keys: string[]){
    return (
        req: express.Request, res: express.Response,
        next: express.NextFunction
    ) => {
        let circuitOpen = keys.some((key) => {
            return !CircuitBreaker.getStatus(key);
        });

        if(!circuitOpen){
            return next();
        }

        res.status(503).json({
            status: "1",
            error_code: "",
            error_message: "Service Temporarily Unavailable"
        });
    };
}

export { need as require };
