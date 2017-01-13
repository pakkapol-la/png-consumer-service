import { NotificationBO } from "./notificationbo";

export class RequestFCMBO {
    public static PRIORITY_HIGH: string = "high";
	public static PRIORITY_NORMAL: string = "normal";

	public static DATA_PAYLOAD_KEY_MESSAGE: string = "message";

    //token
    to: string;

    //list of token when use with send device group
	registration_ids: string[];

	/*
	This parameter specifies a logical expression of conditions that determine the message target.
	Supported condition: Topic, formatted as "'yourTopic' in topics". This value is case-insensitive.
	Supported operators: &&, ||. Maximum two operators per topic message supported.
	when use topic
	*/
	condition?: string;

	/*
	option
	When there is a newer message that renders an older, related message irrelevant to the client app,
	FCM replaces the older message. For example: send-to-sync, or outdated notification messages.
	*/
	collapse_key?: string;

	//By default, messages are sent with normal priority.
	priority?: string;

	/*
	On iOS, use this field to represent content-available in the APNS payload.
	When a notification or message is sent and this is set to true, an inactive client app is awoken.
	On Android, data messages wake the app by default.
	On Chrome, currently not supported.
	*/
	content_available?: boolean;

	/*
	When this parameter is set to true,
	it indicates that the message should not be sent until the device becomes active.
	the default value is false.
	*/
	delay_while_idle?: boolean;

	/*
	This parameter specifies how long (in seconds) the message should be kept in FCM storage if the device is offline.
	The maximum time to live supported is 4 weeks, and the default value is 4 weeks.
	*/
	time_to_live?: number;

	//This parameter specifies the package name of the application where the registration tokens must match in order to receive the message.
	restricted_package_name?: string;

	/*
	This parameter, when set to true, allows developers to test a request without actually sending a message.
	The default value is false.
	*/
	dry_run?: boolean;

	//payload
	notification: NotificationBO;

	/*
	This parameter specifies the custom key-value pairs of the message's payload.
	For example, with data:{"score":"3x1"}:
	*/
	data: {[key: string]: string};

}

export default RequestFCMBO;