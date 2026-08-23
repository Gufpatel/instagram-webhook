import axios from 'axios';

export default async ({ req, res, log, error }) => {
    // Make sure these are set in your Appwrite Variables!
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    // 1. Handle Meta Webhook Verification (GET requests)
    if (req.method === 'GET' || req.method === 'get') {
        const urlStr = req.url || "";
        const queryPart = urlStr.includes('?') ? urlStr.split('?')[1] : (req.queryString || "");
        const params = new URLSearchParams(queryPart);
        
        const challenge = params.get('hub.challenge');
        if (challenge) {
            log('Verification ping received from Meta.');
            return res.send(challenge, 200, { 'Content-Type': 'text/plain' });
        }
        return res.send('Webhook endpoint is live.', 200);
    }

    // 2. Handle Incoming Instagram Comments (POST requests)
    if (req.method === 'POST' || req.method === 'post') {
        // Safely parse the incoming JSON from Meta
        const body = req.bodyJson || (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);

        if (body && body.object === 'instagram') {
            for (const entry of body.entry || []) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'comments') {
                            const commentText = change.value.text?.toLowerCase();
                            const commenterId = change.value.from.id;

                            // TRIGGER WORDS: Customize these if needed!
                            if (commentText && (commentText.includes('video') || commentText.includes('app'))) {
                                try {
                                    await axios.post(
                                        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                                        {
                                            recipient: { id: commenterId },
                                            message: { text: 'Thanks for your interest! Download the Vaidehi Cinema app here: https://yourlink.com' }
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
        return res.send('EVENT_RECEIVED', 200);
    }

    return res.send('Method Not Allowed', 405);
};
