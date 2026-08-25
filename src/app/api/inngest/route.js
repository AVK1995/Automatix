import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { 
  executeWorkflow, 
  storageGracePurgeCron, 
  subscriptionRenewalCron 
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflow,
    storageGracePurgeCron,
    subscriptionRenewalCron
  ],
});
