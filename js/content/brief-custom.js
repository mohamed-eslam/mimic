/**
 * Custom Character Brief — wizard schema (English).
 * Localization: add a sibling module per locale with the same ids.
 *
 * Appearance, personality, language and dialect are independent questions:
 * nothing is inferred from appearance.
 */
import { findListing } from '../data/catalog.js';
import { pick } from '../i18n/index.js';

const PACKAGE_NAMES = {
  essentials: 'Character Essentials',
  creator: 'Content Creator Package',
  video: 'Video & Advertising Package',
  agent: 'AI Agent Character Package',
};

const isIndividual = (a) => a.who === 'individual';
const usesPhotos = (a, ctx) => a.likeness === 'yes' || (ctx.files.personPhotos ?? []).length > 0 || (ctx.files.references ?? []).length > 0;

export const customBriefSchema = {
  id: 'custom-character',
  title: 'Custom Character Brief',
  leadType: 'brief',
  requestType: (a) => (a.listing ? 'character-assets' : 'custom-character'),

  /** ?segment=business|individual & ?character=<id> & ?package=<id> & ?need=<id> */
  prefill(query, current = {}) {
    const out = {};
    const seg = query.get('segment');
    if (seg === 'individual') out.who = 'individual';
    if (seg === 'business') out.who = 'business';
    const listing = findListing(query.get('character'));
    if (listing) { out.listing = listing.id; out.listingName = `${pick(listing.name)} — ${pick(listing.title)}`; }
    const pkg = PACKAGE_NAMES[query.get('package')];
    if (pkg) { out.package = query.get('package'); out.packageName = pkg; }
    const need = query.get('need');
    if (need) out.needs = [...new Set([...(current.needs ?? []), need])];
    return out;
  },

  steps: [
    {
      id: 'who',
      title: 'Who are you?',
      short: 'About you',
      intro: 'This helps us ask only the questions that matter to you.',
      questions: [
        { id: 'listingName', type: 'readonly', label: 'Selected character', showIf: (a) => Boolean(a.listing) },
        { id: 'packageName', type: 'readonly', label: 'Package', showIf: (a) => Boolean(a.packageName) },
        {
          id: 'who', type: 'cards', label: 'I am a…', required: true, other: true, summaryLabel: 'Customer type',
          options: [
            { value: 'business', label: 'Business / Brand', desc: 'A character for my company or brand', icon: 'flag' },
            { value: 'individual', label: 'Individual / Content Creator', desc: 'A personal avatar for my content', icon: 'smile' },
            { value: 'agency', label: 'Agency', desc: 'A character for one of my clients', icon: 'brief' },
            { value: 'product', label: 'Product Team / Developer', desc: 'A character for our app or AI product', icon: 'code' },
          ],
        },
      ],
    },
    {
      id: 'needs',
      title: 'What do you need?',
      short: 'Needs',
      questions: [
        { id: 'listingNote', type: 'note', tone: 'info', label: 'You’re requesting a ready-made character from the marketplace, so appearance questions are skipped.', showIf: (a) => Boolean(a.listing) },
        {
          id: 'needs', type: 'cards', multiple: true, required: true, other: true, label: 'Where will the character be used?', summaryLabel: 'Needed for',
          options: [
            { value: 'ai-agent', label: 'AI Agent Character', icon: 'sparkle' },
            { value: 'chatbot', label: 'Chatbot Character', icon: 'chat' },
            { value: 'website', label: 'Website Character', icon: 'globe' },
            { value: 'mobile', label: 'Mobile App Character', icon: 'layers' },
            { value: 'avatar', label: 'Personal Digital Avatar', icon: 'smile' },
            { value: 'advertising', label: 'Advertising Character', icon: 'megaphone' },
            { value: 'social', label: 'Social Media Character', icon: 'image' },
            { value: 'presenter', label: 'Video Presenter', icon: 'play' },
          ],
        },
        { id: 'needsNotes', type: 'textarea', label: 'Tell us a bit more about your idea', placeholder: 'e.g. A friendly assistant for our banking app that welcomes new customers…', summaryLabel: 'Idea' },
      ],
    },
    {
      id: 'appearance',
      title: 'Character appearance',
      short: 'Appearance',
      intro: 'Describe the look you want. Choose “Open to suggestions” anywhere you’d like our designers to propose options.',
      showIf: (a) => !a.listing,
      questions: [
        {
          id: 'likeness', type: 'list', label: 'Should the character be inspired by a real person’s appearance (for example, you)?', required: true, summaryLabel: 'Based on a real person',
          options: [
            { value: 'yes', label: 'Yes — inspired by reference photos', desc: 'You’ll upload photos in the next steps' },
            { value: 'no', label: 'No — an original character' },
          ],
        },
        { id: 'likenessNote', type: 'note', tone: 'info', label: 'The result is a realistic digital representation inspired by the references — not guaranteed to be an exact replica of the person’s face. You’ll need permission to use any person’s likeness.', showIf: (a) => a.likeness === 'yes' },
        {
          id: 'gender', type: 'chips', label: 'Gender presentation', other: true,
          options: [{ value: 'woman', label: 'Woman' }, { value: 'man', label: 'Man' }, { value: 'open', label: 'Open to suggestions' }],
        },
        {
          id: 'age', type: 'chips', label: 'Approximate age range (adults only)',
          options: [{ value: '20s', label: '20s' }, { value: '30s', label: '30s' }, { value: '40s', label: '40s' }, { value: '50s+', label: '50s+' }, { value: 'open', label: 'Open to suggestions' }],
        },
        {
          id: 'styling', type: 'cards', label: 'Cultural or regional styling', other: true, hint: 'Styling describes clothing and look only.',
          options: [
            { value: 'gulf-traditional', label: 'Gulf traditional attire', desc: 'e.g. thobe and shemagh, abaya' },
            { value: 'contemporary-arab', label: 'Contemporary Arab professional', desc: 'Modern regional business styling' },
            { value: 'international', label: 'International / neutral', desc: 'Globally neutral styling' },
            { value: 'open', label: 'Open to suggestions' },
          ],
        },
        {
          id: 'clothing', type: 'chips', multiple: true, label: 'Clothing style', other: true,
          options: [
            { value: 'traditional', label: 'Traditional' }, { value: 'business-formal', label: 'Business formal' }, { value: 'smart-casual', label: 'Smart casual' },
            { value: 'uniform', label: 'Branded uniform' }, { value: 'casual', label: 'Casual' }, { value: 'modest', label: 'Modest attire' },
          ],
        },
        {
          id: 'look', type: 'list', label: 'Overall professional appearance', other: true,
          options: [
            { value: 'corporate', label: 'Polished & corporate' }, { value: 'approachable', label: 'Approachable & friendly' },
            { value: 'creative', label: 'Creative & modern' }, { value: 'expert', label: 'Senior & authoritative' },
          ],
        },
        { id: 'hair', type: 'text', label: 'Hairstyle or head covering, if relevant', placeholder: 'e.g. short dark hair, hijab, shemagh…', summaryLabel: 'Hair / head covering' },
        {
          id: 'background', type: 'cards', label: 'Background', other: true,
          options: [
            { value: 'transparent', label: 'Transparent cutout', desc: 'Best for websites and apps' },
            { value: 'studio', label: 'Studio backdrop', desc: 'Clean, neutral photo look' },
            { value: 'branded', label: 'Branded environment', desc: 'Office, store or brand setting' },
          ],
        },
        { id: 'references', type: 'files', label: 'Visual references (optional)', hint: 'Mood images, outfits or examples you like.', summaryLabel: 'Visual references' },
        { id: 'appearanceNotes', type: 'textarea', label: 'Other specific requirements', placeholder: 'Anything else about the look…', summaryLabel: 'Appearance notes' },
      ],
    },
    {
      id: 'personality',
      title: 'Personality & communication',
      short: 'Personality',
      intro: 'Personality, language and dialect are chosen independently of appearance.',
      questions: [
        {
          id: 'traits', type: 'chips', multiple: true, max: 3, label: 'Personality', other: true,
          options: ['Professional', 'Friendly', 'Confident', 'Calm', 'Energetic', 'Formal', 'Casual'].map((l) => ({ value: l.toLowerCase(), label: l })),
        },
        {
          id: 'language', type: 'chips', label: 'Language', required: true,
          options: [{ value: 'arabic', label: 'Arabic' }, { value: 'english', label: 'English' }, { value: 'both', label: 'Both' }],
        },
        {
          id: 'dialect', type: 'chips', label: 'Arabic communication style', other: true, showIf: (a) => a.language === 'arabic' || a.language === 'both',
          options: [{ value: 'saudi', label: 'Saudi Arabic' }, { value: 'egyptian', label: 'Egyptian Arabic' }, { value: 'msa', label: 'Modern Standard Arabic' }],
        },
      ],
    },
    {
      id: 'identity',
      title: 'Brand identity',
      short: 'Identity',
      questions: [
        { id: 'brandName', type: 'text', label: 'Brand name', required: true, showIf: (a) => !isIndividual(a) },
        { id: 'industry', type: 'text', label: 'Industry', placeholder: 'e.g. Banking, e-commerce, healthcare', showIf: (a) => !isIndividual(a) },
        { id: 'website', type: 'url', label: 'Website URL', placeholder: 'https://', showIf: (a) => !isIndividual(a) },
        { id: 'audience', type: 'text', label: 'Target audience', placeholder: 'e.g. young professionals, SME owners', showIf: (a) => !isIndividual(a) },
        {
          id: 'market', type: 'chips', multiple: true, label: 'Target market', other: true, showIf: (a) => !isIndividual(a),
          options: ['Saudi Arabia', 'Egypt', 'GCC', 'Europe', 'United States'].map((l) => ({ value: l, label: l })),
        },
        { id: 'brandColors', type: 'colors', label: 'Brand colors', showIf: (a) => !isIndividual(a) },
        { id: 'logo', type: 'files', label: 'Brand logo', accept: 'image/png,image/jpeg,image/webp,image/svg+xml', maxFiles: 2, showIf: (a) => !isIndividual(a) },
        { id: 'guidelines', type: 'files', label: 'Brand guidelines', accept: 'application/pdf,image/png,image/jpeg', maxFiles: 3, showIf: (a) => !isIndividual(a) },

        { id: 'characterName', type: 'text', label: 'Preferred character name', placeholder: 'Leave empty if you’d like suggestions', showIf: isIndividual },
        {
          id: 'personalStyle', type: 'chips', label: 'Personal branding style', other: true, showIf: isIndividual,
          options: ['Professional', 'Lifestyle', 'Educational', 'Entertainment', 'Luxury'].map((l) => ({ value: l.toLowerCase(), label: l })),
        },
        { id: 'personPhotos', type: 'files', label: 'Reference photographs', hint: 'Clear, well-lit photos (front and three-quarter views) work best.', showIf: (a) => isIndividual(a) || a.likeness === 'yes', summaryLabel: 'Reference photos' },
        { id: 'usage', type: 'textarea', label: 'Intended usage', placeholder: 'e.g. Instagram posts and YouTube thumbnails', showIf: isIndividual },
        {
          id: 'likenessConsent', type: 'consent', required: true,
          label: 'I confirm that I own the uploaded images or have permission to use the likeness of every person shown in them.',
          showIf: (a, ctx) => usesPhotos(a, ctx),
          summaryLabel: 'Likeness permission',
        },
      ],
    },
    {
      id: 'deliverables',
      title: 'Required deliverables',
      short: 'Deliverables',
      intro: 'These are deliverables you’re requesting — our team confirms the final scope in the proposal.',
      questions: [
        {
          id: 'deliverables', type: 'chips', multiple: true, required: true, other: true, label: 'What would you like to receive?',
          options: [
            { value: 'png', label: 'Transparent PNG character' }, { value: 'poses', label: 'Multiple character poses' }, { value: 'expressions', label: 'Facial expressions' },
            { value: 'social', label: 'Social media graphics' }, { value: 'ads', label: 'Advertising visuals' }, { value: 'video', label: 'Promotional video' },
            { value: 'web-assets', label: 'Website character assets' }, { value: 'chatbot-assets', label: 'AI chatbot character assets' }, { value: 'app-assets', label: 'Mobile app character assets' },
          ],
        },
      ],
    },
    {
      id: 'integration',
      title: 'Integration requirements',
      short: 'Integration',
      questions: [
        {
          id: 'integration', type: 'list', label: 'Do you need help integrating your character?', required: true, other: true, summaryLabel: 'Integration help',
          options: [
            { value: 'none', label: 'No, I only need the character assets.' },
            { value: 'website', label: 'Yes, into my website.' },
            { value: 'mobile', label: 'Yes, into my mobile application.' },
            { value: 'ai-agent', label: 'Yes, into my existing AI agent.' },
            { value: 'chatbot', label: 'Yes, into my chatbot.' },
            { value: 'help', label: 'I need help deciding.' },
          ],
        },
        {
          id: 'webPlatform', type: 'chips', label: 'What is your website built with?', other: true, showIf: (a) => a.integration === 'website',
          options: ['WordPress', 'Shopify', 'Webflow', 'Custom-built', 'Not sure'].map((l) => ({ value: l, label: l })),
        },
        { id: 'webUrl', type: 'url', label: 'Website address', placeholder: 'https://', showIf: (a) => a.integration === 'website' },
        {
          id: 'appPlatform', type: 'chips', label: 'Which platforms?', other: true, showIf: (a) => a.integration === 'mobile',
          options: ['iOS', 'Android', 'Both', 'Not sure'].map((l) => ({ value: l, label: l })),
        },
        { id: 'appTech', type: 'text', label: 'App technology, if known', placeholder: 'e.g. Flutter, React Native, Swift', showIf: (a) => a.integration === 'mobile' },
        { id: 'aiPlatform', type: 'text', label: 'Which platform or provider powers it?', placeholder: 'e.g. in-house, a chatbot platform, an AI provider — or “not sure”', showIf: (a) => a.integration === 'ai-agent' || a.integration === 'chatbot' },
        {
          id: 'aiLive', type: 'chips', label: 'Is it already live?', showIf: (a) => a.integration === 'ai-agent' || a.integration === 'chatbot',
          options: [{ value: 'live', label: 'Live' }, { value: 'building', label: 'In development' }, { value: 'planned', label: 'Not built yet' }],
        },
        { id: 'aiNote', type: 'note', tone: 'info', label: 'We integrate the character’s visual identity and interface. AI models, chatbot backends and conversation logic are scoped separately.', showIf: (a) => a.integration === 'ai-agent' || a.integration === 'chatbot' },
        { id: 'integrationNote', type: 'note', tone: 'info', label: 'Not sure? No problem — our team will recommend the right approach after reviewing your brief.', showIf: (a) => a.integration === 'help' },
      ],
    },
    {
      id: 'project',
      title: 'Project details',
      short: 'Details',
      questions: [
        {
          id: 'timeline', type: 'chips', label: 'Expected timeline', required: true,
          options: [{ value: 'asap', label: 'As soon as possible' }, { value: '2-4w', label: '2–4 weeks' }, { value: '1-2m', label: '1–2 months' }, { value: 'flexible', label: 'Flexible' }],
        },
        {
          id: 'budget', type: 'select', label: 'Budget range (optional, USD)',
          options: [{ value: '<1k', label: 'Under $1,000' }, { value: '1-5k', label: '$1,000 – $5,000' }, { value: '5-15k', label: '$5,000 – $15,000' }, { value: '15k+', label: '$15,000+' }, { value: 'unsure', label: 'Not sure yet' }],
        },
        { id: 'notes', type: 'textarea', label: 'Additional notes', placeholder: 'Deadlines, launch dates, anything else…' },
        { id: 'contactName', type: 'text', label: 'Contact name', required: true },
        { id: 'email', type: 'email', label: 'Business email', required: true, placeholder: 'name@company.com', hint: 'Individuals can use a personal email.' },
        { id: 'phone', type: 'tel', label: 'Phone or WhatsApp', placeholder: '+966 …' },
        {
          id: 'contactMethod', type: 'chips', label: 'Preferred contact method', required: true,
          options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone call' }, { value: 'whatsapp', label: 'WhatsApp' }],
        },
      ],
    },
    { id: 'review', title: 'Review your brief', short: 'Review', type: 'review' },
  ],
};

