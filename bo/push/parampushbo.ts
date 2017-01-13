import { BaseRequestPushBO } from "./baserequestpushbo";

export class ParamPushBO extends BaseRequestPushBO {  
   
    user_id?: string;
    cif?: string;
    citizen_id?: string;    
}

export default ParamPushBO;