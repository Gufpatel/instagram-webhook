import axios from 'axios';

export default async ({ req, res, log, error }) => {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    // 1. Webhook Verification Handshake
    if (req.method === 'GET' || req.method === 'get') {
        const urlStr = req.url || "";
        const queryPart = urlStr.includes('?') ? urlStr.split('?')[1] : (req.queryString || "");
        const params = new URLSearchParams(queryPart);
        const challenge = params.get('hub.challenge');
        if (challenge) return res.send(challenge, 200, { 'Content-Type': 'text/plain' });
        return res.send('Webhook active', 200);
    }

    // 2. Incoming Event Processing
    if (req.method === 'POST' || req.method === 'post') {
        try {
            let body = req.body;
            if (typeof body === 'string') {
                body = JSON.parse(body);
            }

            if (body && body.entry) {
                for (const entry of body.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'comments') {
                                const commentText = change.value?.text?.toLowerCase() || "";
                                const commentId = change.value?.id;
                                
                                log(`Captured Real Comment: "${commentText}" (ID: ${commentId})`);

                                // Expanded triggers: catches "app", "want", "video", etc.
                                if (commentText.includes('app') || commentText.includes('video') || commentText.includes('want')) {
                                    log("Trigger matched! Sending Private Reply...");
                                    
                                    const response = await axios.post(
                                        `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                                        {
                                            recipient: { comment_id: commentId },
                                            message: { text: 'Thanks for your interest! Download the Vaidehi Cinema app here: https://yourlink.com' }
                                        }
                                    );
                                    log("DM Sent Successfully! Message ID: " + response.data.message_id);
                                } else {
                                    log("Comment did not contain trigger words.");
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            error("API Error: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        }
        return res.send('EVENT_RECEIVED', 200);
    }

    return res.send('Method Not Allowed', 405);
};
