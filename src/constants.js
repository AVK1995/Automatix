export const SYSTEM_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PARTIALLY_FAILED: 'PARTIALLY_FAILED',
};

export const NODE_TYPES = {
  TRIGGER: 'TRIGGER',
  ACTION: 'ACTION',
  DELAY: 'DELAY',
  CONDITION: 'CONDITION',
  REMINDER_SEQUENCE: 'REMINDER_SEQUENCE',
};

export const DEFAULT_NODE_PAYLOAD = {
  id: '',
  type: NODE_TYPES.TRIGGER,
  title: 'New Node',
  config: {},
};

export const MOCK_WORKFLOW_DATA = [
  {
    id: 'node-1',
    type: NODE_TYPES.TRIGGER,
    title: 'Incoming Webhook',
    config: { provider: 'Custom', url: 'https://api.automatix.com/hook/123' }
  },
  {
    id: 'node-2',
    type: NODE_TYPES.DELAY,
    title: 'Smart Delay',
    config: { amount: 2, unit: 'hours' }
  },
  {
    id: 'node-3',
    type: NODE_TYPES.ACTION,
    title: 'Send Email',
    config: { provider: 'Resend', to: 'customer@example.com' }
  }
];

export const THEME_COLORS = {
  BACKGROUND: '#111111',
  CARD: '#1A1A1A',
  BORDER: '#333333',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A3A3A3',
  ACCENT_VIOLET: '#8C7AE6',
  ACCENT_BLUE: '#3B82F6',
};
