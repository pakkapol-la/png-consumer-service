
import { BaseRestBO } from "./baserestbo";
import { ParamPushBO } from "../push/parampushbo";

export class PushRestRequestBO extends BaseRestBO {  
        
    user_id?: string;
    application_id?: string;    // MyMoGSB
    interface_type?: string;    // O - ONLINE , B - BATCH
    message_type?: string;      // Corresponding to Inbox Type
    
    push_message: ParamPushBO;

}

export default PushRestRequestBO;