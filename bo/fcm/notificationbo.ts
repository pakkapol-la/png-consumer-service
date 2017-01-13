export class NotificationBO {
    
    //Indicates notification title.
	title: string;


	//optional parameters

	//Indicates notification body text.
    body?: string;

    //Indicates notification icon. Sets value to myicon for drawable resource myicon.
    icon?: string;

    /*
    Indicates a sound to play when the device receives a notification.
    Supports default or the filename of a sound resource bundled in the app. Sound files must reside in /res/raw/.
    */
    sound?: string;

    //for ios , Indicates the badge on the client app home icon.
    badge?: string;

    /*
    Indicates whether each notification results in a new entry in the notification drawer on Android.
    If not set, each request creates a new notification.
    If set, and a notification with the same tag is already being shown, the new notification replaces the existing one in the notification drawer.
    */
    tag?: string;

    //Indicates color of the icon, expressed in #rrggbb format
    color?: string;

    /*
    Indicates the action associated with a user click on the notification.
    When this is set, an activity with a matching intent filter is launched when user clicks the notification.
    */
    click_action?: string;

    /*
    Indicates the key to the body string for localization.
    Use the key in the app's string resources when populating this value.
    */
    body_loc_key?: string;

    /*
    Indicates the string value to replace format specifiers in the body string for localization.
    */
    body_loc_args?: string[];

    /*
    Indicates the key to the title string for localization.
    Use the key in the app's string resources when populating this value.
    */
    title_loc_key?: string;

    /*
    Indicates the string value to replace format specifiers in the title string for localization.
    */
    title_loc_args: string[];

    
}

export default NotificationBO;