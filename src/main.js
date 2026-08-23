export default async ({ req, res, log }) => {
    // 1. Combine everything Appwrite gives us into one giant string
    const allData = (req.url || "") + (req.queryString || "") + (req.path || "");
    
    // 2. Use a brute-force regex to hunt for "hub.challenge=" and grab the exact numbers
    const match = allData.match(/hub\.challenge=([0-9]+)/);
    
    if (match && match[1]) {
        const challenge = match[1];
        log("Intercepted: " + challenge);
        
        // 3. Send back ONLY the exact numbers. No headers, no JSON, pure raw string.
        return res.send(challenge, 200);
    }
    
    log("No challenge found. Data was: " + allData);
    return res.send("Webhook live", 200);
};
