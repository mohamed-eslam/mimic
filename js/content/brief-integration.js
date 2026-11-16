/**
 * Integration Request — wizard schema (English).
 * Designed for non-technical customers: every technical question is optional
 * or has a "Not sure" answer.
 */
import { findListing } from '../data/catalog.js';
import { pick } from '../i18n/index.js';

const isAI = (a) => ['ai-agent', 'chatbot'].includes(a.platform);

export const integrationSchema = {
  id: 'integration',
  title: 'Integration Request',
  leadType: 'brief',
  requestType: () => 'integration',

  /** ?platform=website|mobile|ai-agent|chatbot & ?character=<id> */
  prefill(query) {
    const out = {};
    const platform = query.get('platform');
    if (['website', 'mobile', 'ai-agent', 'chatbot'].includes(platform)) out.platform = platform;
    const listing = findListing(query.get('character'));
    if (listing) { out.characterSource = 'marketplace'; out.listingName = `${pick(listing.name)} — ${pick(listing.title)}`; }
    return out;
  },

  steps: [
    {
      id: 'platform',
      title: 'Where should your character live?',
      short: 'Platform',
      intro: 'No technical knowledge needed — choose the closest option, or let us help.',
      questions: [
        {
          id: 'platform', type: 'cards', label: 'What platform do you currently use?', required: true, other: true, summaryLabel: 'Platform',
          options: [
            { value: 'website', label: 'Website', icon: 'globe' },
            { value: 'mobile', label: 'Mobile app', icon: 'layers' },
            { value: 'ai-agent', label: 'AI agent / assistant', icon: 'sparkle' },
            { value: 'chatbot', label: 'Chatbot', icon: 'chat' },
            { value: 'unsure', label: 'I’m not sure — help me choose', icon: 'compass' },
          ],
        },
        {
          id: 'existing', type: 'list', label: 'Do you already have a working product?', required: true, summaryLabel: 'Existing product',
          options: [
            { value: 'live', label: 'Yes, it’s live' },
            { value: 'building', label: 'It’s in development' },
            { value: 'none', label: 'Not yet' },
          ],
        },
        { id: 'productUrl', type: 'url', label: 'Link to your product, if available', placeholder: 'https://' },
      ],
    },
    {
      id: 'tech',
      title: 'About your technology',
      short: 'Technology',
      intro: 'Skip anything you don’t know — our developers will ask the right questions later.',
      questions: [
        {
          id: 'stack', type: 'chips', multiple: true, label: 'What technology do you use, if known?', other: true, summaryLabel: 'Technology',
          options: ['WordPress', 'Shopify', 'Webflow', 'React / Next.js', 'Flutter', 'React Native', 'Native iOS / Android', 'I don’t know'].map((l) => ({ value: l, label: l })),
        },
        {
          id: 'team', type: 'list', label: 'Do you have an internal development team?', required: true, summaryLabel: 'Development team',
          options: [
            { value: 'in-house', label: 'Yes, in-house developers' },
            { value: 'agency', label: 'We work with an external agency' },
            { value: 'none', label: 'No development team' },
          ],
        },
      ],
    },
    {
      id: 'experience',
      title: 'How should the character behave?',
      short: 'Experience',
      questions: [
        {
          id: 'placement', type: 'chips', multiple: true, label: 'Where should the character appear?', required: true, other: true, summaryLabel: 'Placement',
          options: [
            { value: 'floating', label: 'Floating assistant in the corner' }, { value: 'chat', label: 'Inside a chat window' },
            { value: 'onboarding', label: 'Onboarding screens' }, { value: 'hero', label: 'Homepage / landing hero' },
            { value: 'help', label: 'Help & support pages' }, { value: 'unsure', label: 'Not sure' },
          ],
        },
        {
          id: 'interaction', type: 'chips', multiple: true, label: 'What should happen when users interact with it?', other: true, summaryLabel: 'Interaction',
          options: [
            { value: 'greet', label: 'Greets visitors' }, { value: 'open-chat', label: 'Opens a chat' }, { value: 'guide', label: 'Guides users step by step' },
            { value: 'react', label: 'Reacts to user actions' }, { value: 'visual', label: 'Visual presence only' }, { value: 'unsure', label: 'Not sure' },
          ],
        },
        {
          id: 'scope', type: 'list', label: 'Do you need visual integration only, or conversational AI too?', required: true, summaryLabel: 'Scope',
          options: [
            { value: 'visual', label: 'Visual integration only', desc: 'Character, UI and interaction states' },
            { value: 'conversational', label: 'Visual + conversational AI', desc: 'We coordinate with your AI provider; AI services are scoped separately' },
            { value: 'unsure', label: 'Not sure — help me decide' },
          ],
        },
        { id: 'aiNote', type: 'note', tone: 'info', label: 'MIMIC doesn’t automatically provide your AI model, chatbot backend or conversation intelligence. Our team scopes these separately if you need them.', showIf: (a) => a.scope === 'conversational' || isAI(a) },
      ],
    },
    {
      id: 'character',
      title: 'Your character',
      short: 'Character',
      questions: [
        { id: 'listingName', type: 'readonly', label: 'Selected character', showIf: (a) => Boolean(a.listingName) },
        {
          id: 'characterSource', type: 'list', label: 'Which character should we integrate?', required: true, summaryLabel: 'Character',
          options: [
            { value: 'marketplace', label: 'A character from the MIMIC marketplace' },
            { value: 'custom', label: 'A custom character (requested or in progress)' },
            { value: 'own', label: 'A character we already own' },
            { value: 'none', label: 'We don’t have one yet' },
          ],
        },
        { id: 'characterFiles', type: 'files', label: 'Your existing character files (optional)', showIf: (a) => a.characterSource === 'own', summaryLabel: 'Character files' },
        {
          id: 'assetsConsent', type: 'consent', required: true, showIf: (a, ctx) => (ctx.files.characterFiles ?? []).length > 0,
          label: 'I confirm that we own these files or have permission to use them, including the likeness of any person shown.',
          summaryLabel: 'Rights confirmed',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Timeline & contact',
      short: 'Contact',
      questions: [
        {
          id: 'timeline', type: 'chips', label: 'Expected timeline', required: true,
          options: [{ value: 'asap', label: 'As soon as possible' }, { value: '1m', label: 'Within a month' }, { value: '1-3m', label: '1–3 months' }, { value: 'flexible', label: 'Flexible' }],
        },
        { id: 'contactName', type: 'text', label: 'Contact name', required: true },
        { id: 'company', type: 'text', label: 'Company' },
        { id: 'email', type: 'email', label: 'Business email', required: true, placeholder: 'name@company.com' },
        { id: 'phone', type: 'tel', label: 'Phone or WhatsApp', placeholder: '+966 …' },
        {
          id: 'contactMethod', type: 'chips', label: 'Preferred contact method', required: true,
          options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone call' }, { value: 'whatsapp', label: 'WhatsApp' }],
        },
        { id: 'contactConsent', type: 'consent', required: true, label: 'Yes, I’d like the MIMIC team to contact me about this request.', summaryLabel: 'Contact permission' },
      ],
    },
    { id: 'review', title: 'Review your request', short: 'Review', type: 'review' },
  ],
};
