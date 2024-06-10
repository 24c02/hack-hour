import { View } from "@slack/bolt";
import { Callbacks } from "../constants.js";

export class Cancel {
    public static async cancel(thread_ts: string): Promise<View> {
        // Are you sure you want to cancel this session?
        return {
            "type": "modal",
            "callback_id": Callbacks.CANCEL,
            "title": {
                "type": "plain_text",
                "text": "End this Session Early",
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "End this session",
                "emoji": true
            },
            "close": {
                "type": "plain_text",
                "text": "Nevermind",
                "emoji": true
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Are you sure you want to end this session early?"
                    }
                }
            ],
            "private_metadata": thread_ts
        }
    }
}