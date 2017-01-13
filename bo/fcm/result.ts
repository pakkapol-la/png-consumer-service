export class ResultBO {
    
    //The topic message ID when FCM has successfully received the request and will attempt to deliver to all subscribed devices.
	message_id: string;

	//Error that occurred when processing the message.
	error?: string;

	/*
	Optional string specifying the canonical registration token for the client app that the message was processed and sent to.
	Sender should use this value as the registration token for future requests.
	Otherwise, the messages might be rejected.
	*/
	registration_id?: string;

}

export default ResultBO;