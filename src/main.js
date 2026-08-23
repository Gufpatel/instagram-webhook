export default async ({ req, res, log }) => {
    // 1. Grab the challenge directly from Appwrite's parsed query object
    const challenge = req.query ? req.query['hub.challenge'] : null;
    
    // 2. Log it so we can see it working
    log('Intercepted Challenge: ' + challenge);
    
    // 3. If Meta sends a challenge, bounce it back immediately in plain text
    if (challenge) {
        return res.text(challenge);
    }
    
    // Default response for anything else
    return res.text('Ready for webhooks!');
};
