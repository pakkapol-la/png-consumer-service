import Config from "../../common/config";
import * as bluebird from "bluebird";
import * as amqp from "amqplib";
import CircuitBreaker from "../../common/circuit-breaker";
import * as MessagingManager from "../messaging-manager";

import Logger from "../../common/logger";
import * as MainConst from "../../common/mainconstant";
import * as Routes from "../../routes";
import MessageBroker from "../../adapters/messaging";
import * as FactoryService from "../../common/factory-service";


export class RabbitMQMessagingManager implements MessagingManager.MessageManager {
    
    listenReceiveMessage() {
        return new Promise<void>((resolve, reject) => {

            try{   
                         
                let broker: MessageBroker = Routes.getFactoryService().message_broker;

                broker.willReceiveMessage();

            } catch(error) {
                Logger.error("Process " + process.pid +` MessageManagerError: ${error.toString()}`);
            }   
      
        });
    }


};

export default RabbitMQMessagingManager;
