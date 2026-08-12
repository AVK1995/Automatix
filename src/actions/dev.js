'use server';

import { exec } from 'child_process';

let isRunning = false;
let inngestProcess = null;



export async function checkInngestStatus() {
  if (process.env.NODE_ENV === 'production') return false;
  
  return new Promise((resolve) => {
    exec('netstat -aon | findstr :8288 | findstr LISTENING', { windowsHide: true }, (error, stdout) => {
      if (stdout && stdout.trim().length > 0) {
        isRunning = true;
        resolve(true);
      } else {
        isRunning = false;
        resolve(false);
      }
    });
  });
}

export async function stopInngestDevServer() {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Not available in production' };
  }
  
  if (isRunning) {
    try {
      // Force kill only the process LISTENING on port 8288 (avoids killing Next.js client connection)
      exec(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :8288 ^| findstr LISTENING') do taskkill /f /pid %a`, { windowsHide: true });
      if (inngestProcess) {
        inngestProcess.kill();
      }
    } catch (e) {
      console.error('Error killing Inngest:', e);
    }
    isRunning = false;
    inngestProcess = null;
  }
  return { success: true };
}

export async function startInngestDevServer() {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Not available in production' };
  }
  
  if (!isRunning) {
    isRunning = true;
    try {
      inngestProcess = exec('npx inngest-cli@latest dev', { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          console.error('Inngest server error:', error);
          isRunning = false;
          inngestProcess = null;
        }
      });
    } catch (e) {
      console.error('Failed to start Inngest dev server:', e);
      isRunning = false;
      inngestProcess = null;
      return { success: false, error: e.message };
    }
  }

  return { success: true };
}

