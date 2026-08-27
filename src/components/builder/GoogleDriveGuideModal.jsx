'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, AlertTriangle, ExternalLink, HardDrive, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';

export default function GoogleDriveGuideModal({ isOpen, onClose, webhookUrl, folderName = 'Automatix Uploads', provider = 'gdrive' }) {
  const [activeTab, setActiveTab] = useState('setup');
  const [mounted, setMounted] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const scriptCode = `/**
 * Automatix Cloud Storage Trigger Script (Google Drive)
 * Auto-registers background time triggers and pushes new uploads to your Automatix workflow.
 */
function setupTrigger() {
  // Clear any existing triggers to prevent duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'watchFolderForNewFiles') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create 1-minute automatic background time trigger
  ScriptApp.newTrigger('watchFolderForNewFiles')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  // Run once immediately to check folder & send test verification payload
  watchFolderForNewFiles();
  Logger.log("Google Drive Trigger registered and active!");
}

function watchFolderForNewFiles() {
  var targetFolderName = "${folderName || 'Automatix Uploads'}".trim();
  var webhookUrl = "${webhookUrl || 'https://automatix.agency/api/webhooks/incoming/YOUR_WORKFLOW_ID?token=YOUR_TOKEN'}";
  
  var folders = DriveApp.getFoldersByName(targetFolderName);
  if (!folders.hasNext()) {
    Logger.log("Folder not found: " + targetFolderName + ". Please create this folder in Google Drive.");
    return;
  }
  
  var folder = folders.next();
  var files = folder.getFiles();
  var props = PropertiesService.getScriptProperties();
  var processed = JSON.parse(props.getProperty("PROCESSED_FILES") || "{}");
  
  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();
    
    if (!processed[fileId]) {
      var fileSizeMB = (file.getSize() / (1024 * 1024)).toFixed(2);
      if (parseFloat(fileSizeMB) > 25) {
        Logger.log("Skipping file exceeding 25MB limit: " + file.getName());
        continue;
      }
      
      // Direct accessible download link
      var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
      
      var payload = {
        fileName: file.getName(),
        fileUrl: downloadUrl,
        fileType: file.getMimeType(),
        fileSizeMB: parseFloat(fileSizeMB),
        folderName: targetFolderName,
        uploadedAt: new Date().toISOString()
      };
      
      var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "bypass-tunnel-reminder": "true",
          "User-Agent": "Automatix-AppsScript"
        },
        muteHttpExceptions: true
      };
      
      try {
        var response = UrlFetchApp.fetch(webhookUrl, options);
        Logger.log("Automatix Trigger Success: " + file.getName() + " -> Code: " + response.getResponseCode());
        processed[fileId] = new Date().toISOString();
      } catch (err) {
        Logger.log("Webhook Error: " + err.message);
      }
    }
  }
  
  props.setProperty("PROCESSED_FILES", JSON.stringify(processed));
}`;

  const oneDrivePayload = `{
  "fileName": "@{triggerOutputs()?['body/Name']}",
  "fileUrl": "@{triggerOutputs()?['body/@odata.mediaEditLink']}",
  "fileType": "@{triggerOutputs()?['body/ContentType']}",
  "fileSizeMB": "@{div(triggerOutputs()?['body/Size'], 1048576)}",
  "folderName": "${folderName || 'Automatix Uploads'}"
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    toast.success('Drive Apps Script copied to clipboard!');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const copyOneDriveJson = () => {
    navigator.clipboard.writeText(oneDrivePayload);
    setCopiedJson(true);
    toast.success('Power Automate JSON payload copied!');
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto"
        >
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-white/5 bg-white/[0.02]">
            <div className="min-w-0 pr-2 flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20 flex-shrink-0">
                <HardDrive className="w-5 h-5 flex-shrink-0" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                  {provider === 'onedrive' ? 'Microsoft OneDrive Trigger Setup' : (provider === 'proton' || provider === 'custom') ? 'Custom Storage Ingestion API' : 'Google Drive Folder Trigger Setup'}
                </h2>
                <p className="text-[11px] sm:text-xs text-text-tertiary mt-0.5 truncate">
                  Automate workflow execution whenever a new file is uploaded to your cloud storage.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>

          {/* Video Guide Section for Google Drive */}
          {(!provider || provider === 'gdrive') && (
            <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 bg-black/30 border-b border-white/5 shrink-0">
              <div className="rounded-lg overflow-hidden border border-white/10 bg-black shadow-inner">
                <video 
                  src="/assets/Google Drive App Script Guide.mp4" 
                  controls 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full max-h-40 sm:max-h-56 md:max-h-64 object-contain bg-black"
                />
              </div>
            </div>
          )}

          {/* Navigation Tabs for Google Drive */}
          {(!provider || provider === 'gdrive') && (
            <div className="flex border-b border-white/5 bg-black/20 shrink-0">
              <button 
                className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                  activeTab === 'setup' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-text-secondary hover:text-white'
                }`}
                onClick={() => setActiveTab('setup')}
              >
                <span className="hidden sm:inline">1. Setup Guide</span>
                <span className="sm:hidden">1. Setup</span>
              </button>
              <button 
                className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                  activeTab === 'auth' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-text-secondary hover:text-white'
                }`}
                onClick={() => setActiveTab('auth')}
              >
                <span className="hidden sm:inline">2. Bypass "Unverified App"</span>
                <span className="sm:hidden">2. Bypass Warning</span>
              </button>
              <button 
                className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                  activeTab === 'issues' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-text-secondary hover:text-white'
                }`}
                onClick={() => setActiveTab('issues')}
              >
                <span className="hidden sm:inline">3. Troubleshooting</span>
                <span className="sm:hidden">3. Help</span>
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed custom-scrollbar">
            {provider === 'onedrive' ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>OneDrive / SharePoint Integration:</span>
                  </span>
                  <span>Power Automate connects directly to OneDrive and pushes an instant webhook to Automatix.</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">1</div>
                    <div>
                      <p className="font-medium text-white">Create Automated Flow in Power Automate</p>
                      <p className="text-xs text-text-tertiary mt-0.5">Go to <a href="https://make.powerautomate.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">make.powerautomate.com <ExternalLink className="w-3 h-3 inline" /></a> and click <strong>Create → Automated cloud flow</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">2</div>
                    <div>
                      <p className="font-medium text-white">Select OneDrive Trigger</p>
                      <p className="text-xs text-text-tertiary mt-0.5">Select <strong>When a file is created (OneDrive)</strong> and pick your folder (<strong className="text-white">{folderName || 'Automatix Uploads'}</strong>).</p>
                    </div>
                  </div>

                  <div className="bg-black/30 p-3.5 rounded-lg border border-white/5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">3</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white">Add HTTP Action with JSON Body</p>
                          <button
                            type="button"
                            onClick={copyOneDriveJson}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all font-semibold text-xs border border-blue-500/30"
                          >
                            {copiedJson ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedJson ? 'Copied Body!' : 'Copy JSON Body'}
                          </button>
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">Method: <strong>POST</strong> | URL: <code>{webhookUrl}</code></p>
                      </div>
                    </div>

                    <div className="relative pl-9">
                      <pre className="p-3 bg-black/60 border border-white/10 rounded-lg text-[11px] font-mono text-white/90 overflow-x-auto max-h-[160px] select-all">
                        {oneDrivePayload}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (provider === 'proton' || provider === 'custom') ? (
              <div className="space-y-4">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 text-xs flex items-start gap-2">
                  <span className="font-semibold flex-shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Direct Webhook / Ingestion API:</span>
                  </span>
                  <span>Trigger your workflow from any storage backend, S3, FTP, or local file watcher.</span>
                </div>

                <div className="bg-black/30 p-3.5 rounded-lg border border-white/5 space-y-2">
                  <p className="text-white font-medium">HTTP Endpoint:</p>
                  <code className="block p-2.5 bg-black/60 rounded border border-white/10 font-mono text-xs text-sky-300 select-all">
                    POST {webhookUrl}
                  </code>
                  <p className="text-xs text-text-tertiary">Content-Type: application/json</p>
                </div>
              </div>
            ) : (
              <div>
                {activeTab === 'setup' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-300 text-xs flex items-start gap-2">
                      <span className="font-semibold flex-shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>Tip:</span>
                      </span>
                      <span>Google Apps Script runs in the cloud automatically. You do not need to keep any browser tab open.</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">1</div>
                        <div>
                          <p className="font-medium text-white">Create your Target Folder in Google Drive</p>
                          <p className="text-xs text-text-tertiary mt-0.5">Name it <strong className="text-white">{folderName || 'Automatix Uploads'}</strong>.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">2</div>
                        <div>
                          <p className="font-medium text-white">Open Google Apps Script</p>
                          <p className="text-xs text-text-tertiary mt-0.5">Go to <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline inline-flex items-center gap-1">script.google.com <ExternalLink className="w-3 h-3 inline" /></a> and click <strong>New project</strong>.</p>
                        </div>
                      </div>

                      <div className="bg-black/30 p-3.5 rounded-lg border border-white/5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">3</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-white">Paste the Automatix Script & Save</p>
                              <button
                                type="button"
                                onClick={copyScript}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all font-semibold text-xs border border-sky-500/30"
                              >
                                {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedScript ? 'Copied to Clipboard!' : 'Copy Script (1-Click)'}
                              </button>
                            </div>
                            <p className="text-xs text-text-tertiary mt-1">Copy the pre-configured script below and paste it into the Google Apps Script editor:</p>
                          </div>
                        </div>

                        <div className="relative pl-9">
                          <pre className="p-3 bg-black/60 border border-white/10 rounded-lg text-[11px] font-mono text-white/90 overflow-x-auto max-h-[160px] select-all">
                            {scriptCode}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-white/10 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">4</div>
                        <div>
                          <p className="font-medium text-white">Click Run on setupTrigger</p>
                          <p className="text-xs text-text-tertiary mt-0.5">Select <code className="text-sky-300 font-mono">setupTrigger</code> at the top toolbar and click <strong>Run</strong>. Authorize the permissions once when prompted — the script automatically registers the background trigger and checks your folder!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3.5 sm:p-4">
                      <h3 className="text-xs sm:text-sm font-medium text-amber-400 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" /> The "Google hasn't verified this app" Warning
                      </h3>
                      <p className="text-[11px] sm:text-xs text-amber-300 leading-relaxed">
                        Because you are running a custom script you just created in your personal account, Google will flag it as "Unverified". This is completely normal and safe since <strong>you</strong> are the one who pasted the code.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-medium text-white">How to bypass it:</h4>
                      <ol className="list-decimal pl-5 text-[11px] sm:text-xs text-text-secondary space-y-2 marker:text-text-tertiary">
                        <li>When the "Authorization required" popup appears, click <strong>Review permissions</strong>.</li>
                        <li>Select your Google account.</li>
                        <li>You will see a screen saying "Google hasn't verified this app". Click the <strong>Advanced</strong> link at the bottom left.</li>
                        <li>Click on <strong>Go to Untitled project (unsafe)</strong> (or your script name).</li>
                        <li>Finally, click <strong>Allow</strong> to grant permission to watch your Drive folder and send webhooks to Automatix.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="space-y-4">
                    <h3 className="text-xs sm:text-sm font-medium text-white mb-2">Frequently Asked Questions & Troubleshooting</h3>
                    
                    <div className="space-y-3 text-[11px] sm:text-xs text-text-secondary">
                      <div className="bg-white/5 border border-white/10 rounded-md p-3.5 space-y-1.5">
                        <h4 className="font-medium text-white">Folder not found in logs:</h4>
                        <p className="text-text-tertiary">
                          Make sure the folder name in Google Drive matches <strong className="text-white">"{folderName || 'Automatix Uploads'}"</strong> exactly.
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-md p-3.5 space-y-1.5">
                        <h4 className="font-medium text-white">Execution Logs:</h4>
                        <p className="text-text-tertiary">
                          You can view execution history anytime by clicking <strong>Executions</strong> (left sidebar in Apps Script) to see timestamps of detected uploads.
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-md p-3.5 space-y-1.5">
                        <h4 className="font-medium text-white">Max file size limit:</h4>
                        <p className="text-text-tertiary">
                          Files up to <strong>25 MB</strong> are supported per upload. Larger files are safely skipped with a log note.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3.5 sm:p-5 border-t border-white/5 bg-white/[0.02] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
