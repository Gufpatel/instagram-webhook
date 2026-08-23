import axios from 'axios';

export default async ({ req, res, log, error }) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    // 1. Meta Webhook Handshake Verification (GET request)
    if (req.method === 'GET') {
        // Appwrite stores query params differently based on versions. We check all locations.
        let mode = req.query ? req.query['hub.mode'] : null;
        let token = req.query ? req.query['hub.verify_token'] : null;
        let challenge = req.query ? req.query['hub.challenge'] : null;

        if (!mode) {
            const queryStr = req.queryString || (req.url && req.url.includes('?') ? req.url.split('?')[1] : "");
            const params = new URLSearchParams(queryStr);
            mode = params.get('hub.mode');
            token = params.get('hub.verify_token');
            challenge = params.get('hub.challenge');
        }

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            log(`Webhook verified successfully! Challenge: ${challenge}`);
            // Appwrite's res.text() guarantees a raw string/int return without JSON wrappers
            return res.text(challenge);
        }
        
        error(`Validation failed. Expected: ${VERIFY_TOKEN} | Got: ${token}`);
        return res.text('Forbidden', 403);
    }

    // 2. Handling Incoming Instagram Comments (POST request)
    if (req.method === 'POST') {
        const body = req.bodyJson || (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);

        if (body && body.object === 'instagram') {
            for (const entry of body.entry || []) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            const commentText = change.value.text?.toLowerCase();
                            const commenterId = change.value.from.id;

                            if (commentText && (commentText.includes('video') || commentText.includes('app'))) {
                                try {
                                    await axios.post(
                                        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                                        {
                                            recipient: { id: commenterId },
                                            message: { text: 'Thanks for your interest! Here is your link: https://yourlink.com' }
                                        }
                                    );
                                    log(`DM sent successfully to user: ${commenterId}`);
                                } catch (err) {
                                    error('Error sending DM: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
                                }
                            }
                        }
                    }
                }
            }
        }
        return res.text('EVENT_RECEIVED', 200);
    }

    return res.text('Method Not Allowed', 405);
};
