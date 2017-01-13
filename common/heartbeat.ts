import { Router } from "express";
import CircuitBreaker from "./circuit-breaker";

const router = Router();

router.route("/ping").get(
    (request, response) => {
        let heartbeat: {[key: string]: any} = {
            timestamp: new Date().toISOString()
        };

        let status = CircuitBreaker.getAllStatus();
        if(status){
            heartbeat["status"] = status;
        }

        response.json(heartbeat);
    }
);

export default router;
