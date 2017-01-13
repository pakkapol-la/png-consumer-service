import Database from "../adapters/database";
import MessageBroker from "../adapters/messaging";

export class FactoryService {    
    message_broker: MessageBroker;
    db_service: Database;
}