import axios from 'axios';

export default async ({ req, res, log, error }) => {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    // 1. Meta Webhook Verification Handshake
    if (req.method === 'GET' || req.method === 'get') {
        const urlStr = req.url || "";
        const queryPart = urlStr.includes('?') ? urlStr.split('?')[1] : (req.queryString || "");
        const params = new URLSearchParams(queryPart);
        
        const challenge = params.get('hub.challenge');
        if (challenge) {
            return res.send(challenge, 200, { 'Content-Type': 'text/plain' });
        }
        return res.send('Webhook active', 200);
    }

    // 2. Incoming Event Processing
    if (req.method === 'POST' || req.method === 'post') {
        let body = req.bodyJson;
        if (!body && typeof req.body === 'string') {
            try {
                body = JSON.parse(req.body);
            } catch (e) {
                body = null;
            }
        } else if (!body) {
            body = req.body;
        }

        if (body && body.entry) {
            for (const entry of body.entry) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            const commentValue = change.value;
                            const commentText = commentValue?.text?.toLowerCase() || "";
                            const commentId = commentValue?.id;

                            log(`Received comment: "${commentText}" with ID: ${commentId}`);

                            // Keyword filter
                            if (commentText.includes('app') || commentText.includes('video')) {
                                try {
                                    // Official Meta Private Reply payload
                                    const response = await axios.post(
                                        `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                                        {
                                            recipient: {
                                                comment_id: commentId
                                            },
                                            message: {
                                                text: 'Thanks for your interest! Here is your download link: https://yourlink.com'
                                            }
                                        }
                                    );
                                    log(`Private reply sent successfully. Message ID: ${response.data.message_id}`);
                                } catch (err) {
                                    error(`Failed to send DM: ${JSON.stringify(err.response?.data || err.message)}`);
                                }
                            }
                        }
                    }
                }
            }
        }
        return res.send('EVENT_RECEIVED', 200);
    }

    return res.send('Method Not Allowed', 405);
};
