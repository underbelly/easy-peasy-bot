module.exports = Object.freeze({ startGameMessage: {
        "blocks": [
            {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "A Foosball game is about to go down!"
			}
		},
		{
			"type": "section",
			"fields": [
				{
					"type": "mrkdwn",
					"text": "*Challengers:*\n• Howa\n• Craig\n• Brad"
				},
                {
                    "type": "mrkdwn",
                    "text": "*Status:* Waiting for 1 more"
                }

			]
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Join"
					},
					"style": "primary",
					"value": "add_user_to_game"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"emoji": true,
						"text": "Leave"
					},
					"style": "danger",
					"value": "remove_user_from_game"
				}
			]
		}
        ]
	}
});
