'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, ShieldAlert, KeyRound, Database, MessageSquare, Calendar, Phone, Share2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROVIDER_GUIDES = {
  'Automatix Calendar': {
    icon: Calendar,
    tabs: {
      'Getting Started': {
        host: 'Fully Integrated Premium Feature',
        port: 'No setup required',
        steps: [
          'Click the "Automatix Calendar" card to open your Calendars Dashboard.',
          'Create a new Calendar Event. Customize the name, description, and UI theme.',
          'Add Custom Invitee Questions if you need to collect specific data (e.g., Company Name, UTM parameters).',
          'Once saved, open the Workflow Builder and add a Calendar Event Trigger.',
          'Select "Automatix Calendar" and choose the event you just created from the dropdown.',
          'Select the Trigger Event (e.g., Invitee Created) to fire this workflow when a booking occurs.',
          'Any Custom Questions you added will automatically appear as variables in downstream steps!'
        ]
      }
    }
  },
  'Calendly': {
    icon: Calendar,
    tabs: {
      'Setup Guide': {
        host: 'api.calendly.com',
        port: '443',
        steps: [
          'Log into your Calendly account.',
          <>Go to <strong>Integrations & apps</strong> in the top menu.</>,
          <>Search for <strong>API and Webhooks</strong> and click on it.</>,
          <>Under "Personal Access Tokens", click <strong>Generate New Token</strong>.</>,
          <>Name the token "Automatix" and click <strong>Create Token</strong>.</>,
          'Copy the generated token and paste it into the Connection Modal.'
        ]
      }
    }
  },
  'Cal.com': {
    icon: Calendar,
    tabs: {
      'Setup Guide': {
        host: 'api.cal.com',
        port: '443',
        steps: [
          'Log into your Cal.com account.',
          <>Navigate to <strong>Settings</strong> {'>'} <strong>Security</strong> {'>'} <strong>API Keys</strong>.</>,
          <>Click <strong>New API Key</strong> in the top right.</>,
          'Add a note (e.g. "Automatix") and click Save.',
          'Copy the generated API Key and paste it into the Connection Modal.'
        ]
      }
    }
  },
  'Instagram': {
    icon: Camera,
    tabs: {
      'Option A: Self-Serve': {
        steps: [
          <>Go to the <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta for Developers portal</a> and log in.</>,
          'Click the green "Create App" button.',
          'Select "Other" -> "Next", then "Business" -> "Next".',
          'Name your app and click "Create app".',
          'In the App Dashboard, go to "Use cases" in the sidebar.',
          'Find "Manage messaging & content on Instagram" and click "Customize".',
          'In the left sidebar, click on "API setup with Instagram login".',
          'Under the "2. Generate access tokens" section, click "Add an Instagram account" and follow the prompts to generate an Access Token.',
          'Go to "App settings" -> "Basic" in the main sidebar to find your App ID and App Secret.',
          'Paste the App ID, App Secret, and Access Token into the form below.',
          'Click Connect. Automatix will automatically subscribe the webhook for you!'
        ]
      },
      'Option B: Concierge Setup': {
        steps: [
          'If you prefer not to deal with Meta Developer settings, we can do it for you.',
          <>Go to your <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta Business Settings</a>.</>,
          'In the left sidebar, click on "Users" -> "Partners".',
          'Click the "Add" dropdown and select "Give a partner access to your assets".',
          'Enter the Automatix Business ID (provided by support) and click Next.',
          'Grant "Full Control" access to the Instagram accounts you want connected.',
          'Submit a request. Our admin team will complete the technical setup for you within 24 hours.'
        ]
      }
    }
  },
  'Facebook': {
    icon: Share2,
    tabs: {
      'Option A: Self-Serve': {
        steps: [
          <>Go to the <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta for Developers portal</a> and log in.</>,
          'Click the green "Create App" button.',
          'Select "Other" -> "Next", then "Business" -> "Next".',
          'Name your app and click "Create app".',
          'In the App Dashboard, go to "Use cases" in the sidebar.',
          'Find "Manage messaging & content on Facebook Pages" and click "Customize".',
          'Add your Facebook Page and generate a Page Access Token.',
          'Go to "App settings" -> "Basic" to find your App ID and App Secret.',
          'Paste the App ID, App Secret, and Page Access Token into the form below.',
          'Click Connect. Automatix will automatically subscribe the webhook for you!'
        ]
      },
      'Option B: Concierge Setup': {
        steps: [
          'If you prefer not to deal with Meta Developer settings, we can do it for you.',
          <>Go to your <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta Business Settings</a>.</>,
          'In the left sidebar, click on "Users" -> "Partners".',
          'Click the "Add" dropdown and select "Give a partner access to your assets".',
          'Enter the Automatix Business ID (provided by support) and click Next.',
          'Grant "Full Control" access to the Facebook Pages you want connected.',
          'Submit a request. Our admin team will complete the technical setup for you within 24 hours.'
        ]
      }
    }
  },
  'SMTP': {
    icon: Mail,
    tabs: {
      'Gmail': {
        host: 'smtp.gmail.com',
        port: '465 (SSL) or 587 (TLS)',
        steps: [
          <>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Google Account {'>'} Security</a>.</>,
          'Enable "2-Step Verification" if not already on.',
          <>Search for "App passwords" in your Google Account search bar (or go directly <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">here</a>).</>,
          'Create a new App Password (name it Automatix).',
          'Use your Gmail address as the User Name.',
          'Use the 16-character App Password as your Password (no spaces).'
        ]
      },
      'Outlook': {
        host: 'smtp-mail.outlook.com',
        port: '587 (TLS)',
        steps: [
          'Use your full Outlook email address as the User Name.',
          'If you have 2FA enabled, you must generate an App Password.',
          <>Go to <a href="https://account.live.com/proofs/manage/additional" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Microsoft Account {'>'} Security {'>'} Advanced security options</a>.</>,
          'Under "App passwords", click "Create a new app password".',
          'Use that password instead of your regular account password.'
        ]
      },
      'SendGrid': {
        host: 'smtp.sendgrid.net',
        port: '465 (SSL) or 587 (TLS)',
        steps: [
          <>In SendGrid, go to <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Settings {'>'} API Keys</a>.</>,
          'Create a new API Key with "Full Access" or restricted "Mail Send" access.',
          'Set User Name exactly as: apikey (this is required by SendGrid).',
          'Set your Password to the generated API Key starting with SG...',
          'Ensure your Sender Identity (From Address) is verified in SendGrid.'
        ]
      },
      'Brevo': {
        host: 'smtp-relay.brevo.com',
        port: '587 (TLS)',
        steps: [
          <>In Brevo, click your profile name top right {'>'} <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">SMTP & API</a>.</>,
          'Go to the SMTP tab and click "Generate a new SMTP key".',
          'Name your key and copy the generated password.',
          'Use the exact Login provided on that page as your User Name.',
          'Use the generated SMTP key as your Password.'
        ]
      },
      'AWS SES': {
        host: 'email-smtp.<region>.amazonaws.com',
        port: '465 (SSL) or 587 (TLS)',
        steps: [
          <>In AWS, go to <a href="https://console.aws.amazon.com/ses/home" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Amazon SES {'>'} SMTP Settings</a>.</>,
          'Click "Create My SMTP Credentials".',
          'Complete the IAM user creation process.',
          'Download or copy your SMTP Username and SMTP Password.',
          'Do NOT use your AWS Access Key ID and Secret Key here.',
          'Ensure your sending domain or email is verified in SES Identities.'
        ]
      },
      'Custom': {
        host: 'Your provider\'s host',
        port: 'Usually 465 or 587',
        steps: [
          'Locate the SMTP settings in your hosting or email provider dashboard.',
          'Ensure you are using the correct Port and Encryption method.',
          'Use your full email address as the User Name.',
          'Use your email account password (or an App Password if 2FA is active).'
        ]
      }
    }
  },
  'Google Sheets': {
    icon: Database,
    tabs: {
      'Service Account': {
        steps: [
          <>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Google Cloud Console</a>.</>,
          'Create a new Project or select an existing one.',
          'Enable the "Google Sheets API" and "Google Drive API" for your project.',
          'Go to "IAM & Admin" > "Service Accounts" and create a new Service Account.',
          'Once created, click the Service Account email, go to "Keys" > "Add Key" > "Create new key".',
          'Choose "JSON" format. The file will download to your computer.',
          'Open the JSON file. You will need the "client_email" and "private_key" to connect.',
          'IMPORTANT: You MUST share your target Google Sheet with this "client_email" address (grant Editor access) so it can read/write data!'
        ]
      }
    }
  },
  'Slack': {
    icon: MessageSquare,
    tabs: {
      'OAuth': {
        steps: [
          'Simply click "Connect" and log into your Slack workspace.',
          'Review the permissions requested by Automatix.',
          'Click "Allow" to grant Automatix access to post messages and read channels.'
        ]
      }
    }
  },
  'Calendly': {
    icon: Calendar,
    tabs: {
      'Personal Access Token': {
        steps: [
          'Log in to your Calendly account.',
          <>Go to <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Integrations & apps {'>'} API & Webhooks</a>.</>,
          'Click on "Generate New Token" under the Personal Access Tokens section.',
          'Name your token (e.g. "Automatix") and click Create.',
          'Copy the token and paste it into the Automatix connection field.'
        ]
      }
    }
  },
  'WhatsApp': {
    icon: Phone,
    tabs: {
      'Option A: Self-Serve': {
        steps: [
          <>Go to the <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta for Developers portal</a> and log in.</>,
          'Click the green "Create App" button.',
          'Select "Other" -> "Next", then "Business" -> "Next".',
          'Name your app and click "Create app".',
          'In the App Dashboard, go to "Add Product" and set up "WhatsApp".',
          'Follow the prompts to connect your WhatsApp Business Account and phone number.',
          'Go to your Meta Business Settings -> System Users.',
          'Create a System User, generate a permanent token with "whatsapp_business_messaging" permission.',
          'Go to "App settings" -> "Basic" to find your App ID and App Secret.',
          'Paste the App ID, App Secret, and the permanent System User Token into the form below.'
        ]
      },
      'Option B: Concierge': {
        steps: [
          'Grant the Automatix Business Manager Partner Access in your Facebook Business settings.',
          'Select "Concierge Setup" below and our admin team will handle it.'
        ]
      }
    }
  },
  'Default': {
    icon: Share2,
    tabs: {
      'API Key': {
        steps: [
          'Log into your dashboard for this service.',
          'Navigate to the "Developer", "API", or "Integrations" section.',
          'Generate a new API Key with the necessary read/write permissions.',
          'Copy the API Key and paste it into Automatix.',
          'Keep your API Key secure and do not share it.'
        ]
      }
    }
  }
};

export default function ConnectionGuideModal({ isOpen, onClose, providerName }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  // Default to the first tab when provider changes or opens
  useEffect(() => {
    if (isOpen) {
      const providerData = PROVIDER_GUIDES[providerName] || PROVIDER_GUIDES['Default'];
      const firstTab = Object.keys(providerData.tabs)[0];
      setActiveTab(firstTab);
    }
  }, [isOpen, providerName]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const providerData = PROVIDER_GUIDES[providerName] || PROVIDER_GUIDES['Default'];
  const activeGuide = providerData.tabs[activeTab];
  const Icon = providerData.icon;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border-subtle rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-accent-blue">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">{providerName} Setup Guide</h2>
                    <p className="text-xs text-text-secondary mt-0.5">Instructions on how to connect your account.</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              {Object.keys(providerData.tabs).length > 1 && (
                <div className="flex overflow-x-auto border-b border-border-subtle scrollbar-hide bg-black/20 shrink-0">
                  {Object.keys(providerData.tabs).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab 
                          ? 'border-accent-blue text-accent-blue bg-accent-blue/5' 
                          : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {activeGuide && (
                  <div className="space-y-6">
                    {/* Host/Port for SMTP only */}
                    {activeGuide.host && activeGuide.port && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background border border-border-subtle rounded-md p-4">
                          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Host</p>
                          <p className="text-sm font-medium text-white font-mono">{activeGuide.host}</p>
                        </div>
                        <div className="bg-background border border-border-subtle rounded-md p-4">
                          <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Port</p>
                          <p className="text-sm font-medium text-white font-mono">{activeGuide.port}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <KeyRound size={16} className="text-accent-violet" />
                        Step-by-Step Instructions
                      </h4>
                      <div className="space-y-4">
                        {activeGuide.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0 text-xs font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <div className="text-sm text-text-secondary leading-relaxed pt-1">
                              {step}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {providerName === 'SMTP' && (
                      <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-orange-400 flex items-center gap-2 mb-2">
                          <ShieldAlert size={16} />
                          Deliverability Warning
                        </h4>
                        <p className="text-xs text-orange-400/80 leading-relaxed">
                          To prevent your automated emails from going to Spam, ensure your "From Address" matches the domain authorized by this SMTP provider. If you use a custom domain, ensure your SPF, DKIM, and DMARC records are configured with your DNS host.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-subtle bg-white/5 flex justify-end shrink-0">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:opacity-90 transition-opacity"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
