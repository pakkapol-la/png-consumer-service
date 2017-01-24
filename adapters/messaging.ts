export interface MessageContent {
    record_id: string;
    request_id: string;
    response_id: string;
    server_key: string;
    platform: string;
    started_time: Date;
    content: any;   
};


export interface MessageBroker {
    connect(url: string, options?: any): Promise<MessageBroker>;
    disconnect(): Promise<void>;
       
    willReceiveMessage(): Promise<void>;
};

export default MessageBroker;
