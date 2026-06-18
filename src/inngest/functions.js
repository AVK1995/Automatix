import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { SYSTEM_STATUS, NODE_TYPES } from "@/constants";

export const executeWorkflow = inngest.createFunction(
  { 
    id: "execute-workflow", 
    name: "Execute Workflow Engine",
    triggers: [{ event: "engine/workflow.start" }]
  },
  async ({ event, step }) => {
    const { executionLogId } = event.data;

    // 1. Fetch Execution Log & Workflow
    const execution = await step.run("Fetch Workflow Data", async () => {
      return prisma.executionLog.findUnique({
        where: { id: executionLogId },
        include: { workflow: true },
      });
    });

    if (!execution || !execution.workflow) {
       throw new Error("Execution Log or Workflow not found");
    }

    const nodes = Array.isArray(execution.workflow.nodesJson) 
        ? execution.workflow.nodesJson 
        : [];

    // 2. Iterate through visual nodes sequentially
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Update Node State in Database
      await step.run(`Update State: Node ${node.id}`, async () => {
        await prisma.executionLog.update({
          where: { id: executionLogId },
          data: { currentNodeState: { step: node.type, nodeId: node.id, title: node.title } }
        });
      });

      // Smart Delay Engine
      if (node.type === NODE_TYPES.DELAY) {
        const amount = node.config?.amount || 1;
        const unit = node.config?.unit || 'minutes';
        
        // Inngest sleep accepts strings like "1m", "2h", "1d"
        // Ensure unit starts with a valid character
        const unitChar = unit.charAt(0).toLowerCase(); 
        const sleepDuration = `${amount}${unitChar}`;
        
        // This halts Vercel compute and resumes later automatically (Durable Execution)
        await step.sleep(`Wait for Node ${node.id}`, sleepDuration);
      }

      // Action Node
      if (node.type === NODE_TYPES.ACTION) {
        // Pre-Flight Guard: The Kill Switch Check
        // We MUST check the database again because hours/days may have passed during a sleep()
        const isActive = await step.run(`Check Kill Switch (Node ${node.id})`, async () => {
          const currentLog = await prisma.executionLog.findUnique({
            where: { id: executionLogId },
            select: { status: true }
          });
          return currentLog?.status === SYSTEM_STATUS.ACTIVE;
        });

        // Abort if cancelled by a webhook
        if (!isActive) {
          await step.run("Abort Workflow", async () => {
            console.log(`Workflow ${executionLogId} aborted due to Kill Switch.`);
          });
          return { aborted: true, reason: 'Kill Switch Engaged' };
        }

        // Execute Mock Action
        await step.run(`Execute Action (Node ${node.id})`, async () => {
          console.log(`Executing Action [${node.title}]:`, node.config);
          // E.g., await fetch('https://api.resend.com/emails', ...)
        });
      }
    }

    // 3. Mark Workflow Completed
    await step.run("Mark Completed", async () => {
      await prisma.executionLog.update({
        where: { id: executionLogId },
        data: { status: SYSTEM_STATUS.COMPLETED },
      });
    });

    return { success: true, executionLogId };
  }
);
