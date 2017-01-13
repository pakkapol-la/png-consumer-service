import { Router } from "express";

import Heartbeat from "../common/heartbeat";
import * as FactoryService from "../common/factory-service";

const router = Router();

router.use(Heartbeat);

export default router;


let factory_service: FactoryService.FactoryService;

export function setFactoryService(factory_service: FactoryService.FactoryService): void{
    this.factory_service = factory_service;
};

export function getFactoryService(): FactoryService.FactoryService{
    return this.factory_service;
};
