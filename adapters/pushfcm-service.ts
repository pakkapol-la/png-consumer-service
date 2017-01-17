import { RequestFCMBO } from "../bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "../bo/fcm/responsefcmbo";
import PushMessages from "../models/pushmessages";
import * as PushMessagesImpl from "./implementations/pushfcm-serviceimpl";


export interface PushFCMService {

    createRequestHeader(api_key: string): any;

    send(request_id: string, api_key: string, req: RequestFCMBO, msgDB: PushMessages): Promise<PushMessagesImpl.PushResult>;

}    

export default PushFCMService;