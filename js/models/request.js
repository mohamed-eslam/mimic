/**
 * Service request model (custom character briefs, integration requests, contact).
 *
 * Internal lifecycle (operations):
 *   new → review → clarification → proposal → approval → production → delivery → completed
 * Customers see a simplified status (CUSTOMER_STATUS). Internal team routing
 * (creative / operations / development) is metadata for the backend — the
 * frontend never invents team activity.
 */
export const LIFECYCLE = ['new', 'review', 'clarification', 'proposal', 'approval', 'production', 'delivery', 'completed'];

export const CUSTOMER_STATUS = {
  new: 'Received',
  review: 'In review',
  clarification: 'Waiting for your input',
  proposal: 'Proposal ready',
  approval: 'Waiting for your approval',
  production: 'In progress',
  delivery: 'Delivering',
  completed: 'Completed',
};

/** Simplified customer timeline (what a customer is shown). */
export const CUSTOMER_TIMELINE = [
  { key: 'received', label: 'Received', covers: ['new'] },
  { key: 'review', label: 'Review & proposal', covers: ['review', 'clarification', 'proposal', 'approval'] },
  { key: 'production', label: 'Design & development', covers: ['production'] },
  { key: 'delivered', label: 'Delivered', covers: ['delivery', 'completed'] },
];

export const REQUEST_TYPES = {
  'custom-character': { label: 'Custom character design', teams: ['operations', 'creative'] },
  'character-assets': { label: 'Character asset delivery', teams: ['operations', 'creative'] },
  integration: { label: 'Website / app / AI agent integration', teams: ['operations', 'development'] },
  contact: { label: 'General enquiry', teams: ['operations'] },
};

const makeRef = () => `CL-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

/**
 * Build the request record sent to the backend. `status` always starts at 'new' —
 * only the operations system may advance it.
 */
export function createRequest({ type, answers, brief, attachments = [] }) {
  return {
    schema: 'character-lab.request/v1',
    clientRef: makeRef(),
    type,
    typeLabel: REQUEST_TYPES[type]?.label ?? type,
    routeTo: REQUEST_TYPES[type]?.teams ?? ['operations'],
    status: 'new',
    answers,
    brief,             // structured, human-readable brief for the team
    attachments,       // [{ question, name, size, type }] — files are sent as multipart parts
    createdAt: new Date().toISOString(),
  };
}

/** Index of a lifecycle status in the simplified customer timeline. */
export const timelineIndex = (status) => CUSTOMER_TIMELINE.findIndex((s) => s.covers.includes(status));
