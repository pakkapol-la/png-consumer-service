import PushMessages from "../models/pushmessages";

interface Database {
    connect(url: string, options?: any): Promise<Database>;
    disconnect(): Promise<void>;    
    updatePushMessagesBeforeSent(push_message: PushMessages): Promise<PushMessages>; 
    updatePushMessagesAfterSent(push_message: PushMessages): Promise<PushMessages>;   
}

export default Database;
