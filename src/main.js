import axios from 'axios';

export default async ({ req, res, log, error }) => {
    // Environment variables set in your Appwrite Settings
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    // 1. Meta Webhook Handshake Verification (GET request)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            log('Webhook verified successfully!');
            return res.text(challenge, 200);
        }
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

                            // Trigger keyword check (e.g. "video", "app", etc.)
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

        // Meta requires an immediate 200 response
        return res.text('EVENT_RECEIVED', 200);
    }

    return res.text('Method Not Allowed', 405);
};
