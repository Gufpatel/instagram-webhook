export default async ({ req, res }) => {
    if (req.method === 'GET') {
        // Extract the query string safely from Appwrite
        const query = req.queryString || (req.url ? req.url.split('?')[1] : "");
        const params = new URLSearchParams(query || "");
        const challenge = params.get('hub.challenge');
        
        if (challenge) {
            // Blindly return exactly what Meta wants, in pure plain text
            return res.send(challenge, 200, { 'Content-Type': 'text/plain' });
        }
    }
    
    // Default response for anything else
    return res.send('EVENT_RECEIVED', 200);
};
