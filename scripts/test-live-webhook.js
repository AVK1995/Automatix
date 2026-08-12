const crypto = require('crypto');
const http = require('http');

// ==========================================
// CONFIGURATION
// ==========================================
// 1. Enter your Workflow ID and Webhook Token from the Automatix Builder UI
const WORKFLOW_ID = 'YOUR_WORKFLOW_ID'; 
const WEBHOOK_TOKEN = 'YOUR_WEBHOOK_TOKEN';

// 2. Enter your Meta App Secret (from the Meta App Dashboard -> App settings -> Basic)
const APP_SECRET = 'YOUR_META_APP_SECRET';

// 3. Enter your Instagram Scoped ID (IGSID)
// You can find this using the Graph API Explorer: 
// GET /v19.0/me/conversations?fields=participants
const IGSID = 'YOUR_IGSID';

// 4. The message text you want to simulate sending to your bot
const MESSAGE_TEXT = 'Ready';

// 5. Your local server URL (usually http://localhost:3000)
const BASE_URL = 'http://localhost:3000';
// ==========================================

const targetUrl = new URL(`/api/webhooks/incoming/${WORKFLOW_ID}?token=${WEBHOOK_TOKEN}`, BASE_URL);

// Construct the Meta Webhook Payload
const payload = {
  object: "instagram",
  entry: [
    {
      id: "00000000000000000", // Dummy Page/Account ID, not strictly validated by our app
      time: Date.now(),
      messaging: [
        {
          sender: { id: IGSID },
          recipient: { id: "00000000000000000" },
          timestamp: Date.now(),
          message: {
            mid: `mid.${Date.now()}`,
            text: MESSAGE_TEXT
          }
        }
      ]
    }
  ]
};

const payloadString = JSON.stringify(payload);

// Generate the X-Hub-Signature-256
const signature = crypto
  .createHmac('sha256', APP_SECRET)
  .update(payloadString, 'utf8')
  .digest('hex');

const xHubSignature = `sha256=${signature}`;

console.log('Sending Simulated Webhook...');
console.log(`URL: ${targetUrl.toString()}`);
console.log(`Message: "${MESSAGE_TEXT}" from sender: ${IGSID}`);

const options = {
  hostname: targetUrl.hostname,
  port: targetUrl.port,
  path: targetUrl.pathname + targetUrl.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payloadString),
    'x-hub-signature-256': xHubSignature
  }
};

const req = http.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response Body: ${responseBody}`);
    if (res.statusCode === 200) {
      console.log('\n✅ Webhook delivered successfully! Check your local server logs and your phone to see the live DM.');
    } else {
      console.log('\n❌ Webhook delivery failed.');
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Error connecting to server: ${e.message}`);
});

req.write(payloadString);
req.end();
