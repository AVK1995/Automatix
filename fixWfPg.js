require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const result = await pool.query("SELECT id, name, \"nodesJson\" FROM \"Workflow\" WHERE name = 'Alpha Test Automation'");
  const wf = result.rows[0];
  
  if (!wf) {
    console.log("Workflow not found");
    return;
  }
  
  let nodes = typeof wf.nodesJson === 'string' ? JSON.parse(wf.nodesJson) : wf.nodesJson;
  
  nodes = nodes.map(node => {
    if (node.type === 'TRIGGER' || node.type === 'trigger') {
      return { ...node, parentId: null }; // Trigger must have null parent
    }
    if (node.id === 'node-1783490333222') {
      return { ...node, parentId: 'node-1782908816894' }; // Sheets follows DateFormatter
    }
    return node;
  });
  
  await pool.query("UPDATE \"Workflow\" SET \"nodesJson\" = $1 WHERE id = $2", [JSON.stringify(nodes), wf.id]);
  
  console.log("Fixed Workflow:", wf.name);
  await pool.end();
}

main().catch(console.error);
