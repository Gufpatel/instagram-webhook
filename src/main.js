export default async ({ req, res, log }) => {
    try {
        // Safely extract the query string in Appwrite's environment
        const urlStr = req.url || "";
        const queryPart = urlStr.includes('?') ? urlStr.split('?')[1] : (req.queryString || "");
        
        const params = new URLSearchParams(queryPart);
        const challenge = params.get('hub.challenge');
        
        log("Intercepted Challenge: " + challenge);
        
        // If Meta sends a challenge, respond using Appwrite's res.send format
        if (challenge) {
            return res.send(challenge, 200, {
                'Content-Type': 'text/plain'
            });
        }
        
        // Default success response
        return res.send('Webhook endpoint is live.', 200);
        
    } catch (err) {
        log("Code Error: " + err.message);
        return res.send('Server Error', 500);
    }
};
