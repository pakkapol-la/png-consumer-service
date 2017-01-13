
export interface MessageManager {
    
    listenReceiveMessage(): Promise<void>;
    
};

export default MessageManager;
