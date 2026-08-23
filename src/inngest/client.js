import { Inngest } from "inngest";

// Ensure local development hits the local Inngest Dev Server
if (process.env.NODE_ENV === 'development') {
  process.env.INNGEST_EVENT_API_BASE_URL = process.env.INNGEST_EVENT_API_BASE_URL || 'http://127.0.0.1:8288/';
}

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "automatix-engine",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
