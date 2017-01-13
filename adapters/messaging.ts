export interface MessageContent {
    request_id: string;
    response_id: string;
    server_key: string;
    content: any;   
};


export interface MessageBroker {
    connect(url: string, options?: any): Promise<MessageBroker>;
    disconnect(): Promise<void>;
    
    willReceiveMessage(): Promise<void>;
    
};

export default MessageBroker;
