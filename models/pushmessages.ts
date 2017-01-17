export interface PushMessages {
    id?: string;
    request_id: string;
    application_id: string;
    user_id: string;
    started_time: Date;
    put_time: Date;
    pulled_time: Date;    
    sent_time: Date;
    received_time: Date;
    elapsed: number;
    status: number;
    error_code: string;
	error_message: string;
    interface_type: string;
    message_type: number;
    worker_id: string;
    push_provider_code: string;
    push_token_id: string;
    push_message: any;
    
};

export default PushMessages;


