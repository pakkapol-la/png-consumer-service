import { ResultBO } from "./result";

export class ResponseFCMBO {
    
    //Unique ID (number) identifying the multicast message.
	multicast_id: number;

	//Number of messages that were processed without an error.
	success?: number;

	//Number of messages that could not be processed.
	failure?: number;

	//Number of results that contain a canonical registration token.
	canonical_ids?: number;

	/*
	Array of objects representing the status of the messages processed.
	The objects are listed in the same order as the request
	(i.e., for each registration ID in the request, its result is listed in the same index in the response).
	*/
	results: ResultBO[];
    
}

export default ResponseFCMBO;