export default async ({ req, res, log }) => {
    if (req.method === 'GET') {
        // Find the query string wherever Appwrite is hiding it
        const query = req.queryString || (req.url && req.url.includes('?') ? req.url.split('?')[1] : "");
        const params = new URLSearchParams(query || "");
        const challenge = params.get('hub.challenge');
        
        // THIS IS THE CRITICAL LINE: It will record exactly what Appwrite sees
        log(`Incoming Challenge: ${challenge}`); 
        
        if (challenge) {
            // Trim removes any hidden spaces/newlines, sending pure text
            return res.send(challenge.trim(), 200, { 'Content-Type': 'text/plain' });
        }
    }
    return res.send('EVENT_RECEIVED', 200);
};
