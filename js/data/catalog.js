/**
 * Character Marketplace — centralized character configuration.
 *
 * Every attribute below is EXPLICITLY configured product metadata. Nothing is
 * inferred from a person's appearance: market styling, presentation,
 * personality and use cases are product decisions made by the MIMIC team.
 *
 * Assets live in `assets/characters/<id>/` and are discovered at runtime by
 * services/asset-service.js using the naming convention:
 *   main.webp | main.png            → main transparent cutout (required to publish)
 *   pose-<pose>.webp | .png         → one file per declared pose
 *   expression-<expr>.webp | .png   → one file per declared expression
 * Missing files fall back to a labeled placeholder and are listed by
 * `CharacterLab.assetReport()` in the browser console.
 *
 * Filter values are keys; their display labels live in the i18n dictionaries
 * (catalog.values.*), so filters and cards are fully bilingual.
 */
export const FILTERS = {
  market: ['saudi', 'egyptian', 'international'],
  style: ['professional', 'corporate', 'friendly', 'casual'],
  presentation: ['female', 'male'],
  useCase: ['website-assistant', 'ai-agent', 'customer-service', 'marketing', 'presenter'],
};

export const POSES = ['front', 'welcome', 'pointing', 'explaining', 'thinking'];
export const EXPRESSIONS = ['neutral', 'smile', 'thinking', 'surprised'];

const character = (def) => ({
  sample: true,
  expressions: ['neutral', 'smile'],
  customization: { available: [], notAvailable: ['face'] },
  ...def,
  folder: `assets/characters/${def.id}/`,
});

export const CATALOG = [
  character({
    id: 'faisal',
    name: { en: 'Faisal', ar: 'فيصل' },
    title: { en: 'Corporate host in traditional attire', ar: 'مضيف رسمي بالزي التقليدي' },
    description: {
      en: 'A composed, welcoming host in a white thobe and shemagh — a natural fit for banking, government services and premium brands.',
      ar: 'حضور هادئ ومرحِّب بالثوب الأبيض والشماغ، مناسب جدًا للبنوك والخدمات الحكومية والعلامات الفاخرة.',
    },
    market: 'saudi', style: 'corporate', presentation: 'male', ageRange: '30s',
    personality: ['professional', 'calm'],
    useCases: ['ai-agent', 'website-assistant', 'presenter'],
    poses: ['front', 'welcome', 'explaining'],
    expressions: ['neutral', 'smile'],
    customization: { available: ['name', 'poses', 'background', 'brandAccents'], notAvailable: ['face', 'outfit'] },
  }),
  character({
    id: 'reem',
    name: { en: 'Reem', ar: 'ريم' },
    title: { en: 'Business consultant', ar: 'مستشارة أعمال' },
    description: {
      en: 'A confident professional in contemporary business attire — ideal for fintech, consulting and B2B assistants.',
      ar: 'مستشارة واثقة بإطلالة عمل عصرية، مثالية للتقنية المالية والاستشارات والمساعدين الذكيين للشركات.',
    },
    market: 'saudi', style: 'professional', presentation: 'female', ageRange: '20s',
    personality: ['professional', 'friendly'],
    useCases: ['ai-agent', 'customer-service', 'website-assistant'],
    poses: ['front', 'welcome', 'pointing', 'explaining'],
    expressions: ['neutral', 'smile', 'thinking'],
    customization: { available: ['name', 'poses', 'background', 'outfitColor'], notAvailable: ['face'] },
  }),
  character({
    id: 'karim',
    name: { en: 'Karim', ar: 'كريم' },
    title: { en: 'Business professional', ar: 'رجل أعمال' },
    description: {
      en: 'An approachable professional in a tailored suit — for corporate websites, onboarding and product guidance.',
      ar: 'شخصية مهنية قريبة من الناس ببدلة أنيقة، مناسبة لمواقع الشركات وتجارب التعريف بالمنتج وإرشاد المستخدمين.',
    },
    market: 'egyptian', style: 'corporate', presentation: 'male', ageRange: '30s',
    personality: ['professional', 'friendly'],
    useCases: ['website-assistant', 'presenter', 'marketing'],
    poses: ['front', 'welcome', 'pointing'],
    customization: { available: ['name', 'poses', 'background'], notAvailable: ['face', 'outfit'] },
  }),
  character({
    id: 'nour',
    name: { en: 'Nour', ar: 'نور' },
    title: { en: 'Customer service representative', ar: 'ممثلة خدمة عملاء' },
    description: {
      en: 'A warm, reassuring support face with a branded-uniform option — for help centers, chat support and service apps.',
      ar: 'وجه دافئ يبعث على الاطمئنان، مع إمكانية زي يحمل ألوان علامتك — مثالية لمراكز المساعدة والدعم عبر المحادثة.',
    },
    market: 'egyptian', style: 'friendly', presentation: 'female', ageRange: '20s',
    personality: ['friendly', 'calm'],
    useCases: ['customer-service', 'ai-agent', 'website-assistant'],
    poses: ['front', 'welcome', 'explaining', 'thinking'],
    expressions: ['neutral', 'smile', 'thinking'],
    customization: { available: ['name', 'uniformColor', 'poses', 'headset'], notAvailable: ['face'] },
  }),
  character({
    id: 'adam',
    name: { en: 'Adam', ar: 'آدم' },
    title: { en: 'International digital assistant', ar: 'مساعد رقمي بطابع عالمي' },
    description: {
      en: 'A modern, neutral look for global products and multilingual experiences.',
      ar: 'إطلالة عصرية ومحايدة تناسب المنتجات العالمية والتجارب متعددة اللغات.',
    },
    market: 'international', style: 'casual', presentation: 'male', ageRange: '30s',
    personality: ['friendly', 'calm'],
    useCases: ['ai-agent', 'website-assistant', 'customer-service'],
    poses: ['front', 'welcome', 'pointing', 'thinking'],
    customization: { available: ['name', 'poses', 'background', 'outfitColor'], notAvailable: ['face'] },
  }),
  character({
    id: 'lina',
    name: { en: 'Lina', ar: 'لينا' },
    title: { en: 'Digital presenter', ar: 'مقدّمة محتوى رقمي' },
    description: {
      en: 'A confident on-camera presence for product explainers, ads and social campaigns.',
      ar: 'حضور واثق أمام الكاميرا لشرح المنتجات والإعلانات وحملات التواصل الاجتماعي.',
    },
    market: 'international', style: 'professional', presentation: 'female', ageRange: '30s',
    personality: ['confident', 'energetic'],
    useCases: ['presenter', 'marketing', 'website-assistant'],
    poses: ['front', 'pointing', 'explaining'],
    expressions: ['neutral', 'smile', 'surprised'],
    customization: { available: ['name', 'poses', 'background'], notAvailable: ['face', 'outfit'] },
  }),
  character({
    id: 'omar',
    name: { en: 'Omar', ar: 'عمر' },
    title: { en: 'Senior advisor', ar: 'مستشار أول' },
    description: {
      en: 'A seasoned, trustworthy advisor for finance, healthcare and premium service brands — available in formal and business variants.',
      ar: 'مستشار خبير يمنح الثقة لقطاعات المال والصحة والخدمات الراقية، بنسختين: رسمية وعملية.',
    },
    market: 'saudi', style: 'corporate', presentation: 'male', ageRange: '40s+',
    personality: ['calm', 'professional'],
    useCases: ['presenter', 'website-assistant', 'marketing'],
    poses: ['front', 'welcome', 'explaining'],
    customization: { available: ['name', 'variant', 'poses'], notAvailable: ['face'] },
  }),
  character({
    id: 'salma',
    name: { en: 'Salma', ar: 'سلمى' },
    title: { en: 'Lifestyle & social host', ar: 'مقدّمة محتوى لايف ستايل' },
    description: {
      en: 'A relatable, upbeat host for social media content, ads and consumer brands.',
      ar: 'شخصية قريبة ومليانة طاقة لمحتوى السوشيال ميديا والإعلانات والعلامات الاستهلاكية.',
    },
    market: 'egyptian', style: 'casual', presentation: 'female', ageRange: '20s',
    personality: ['friendly', 'energetic'],
    useCases: ['marketing', 'presenter'],
    poses: ['front', 'welcome', 'pointing'],
    expressions: ['neutral', 'smile', 'surprised'],
    customization: { available: ['name', 'poses', 'background', 'outfitColor'], notAvailable: ['face'] },
  }),
];

export const findListing = (id) => CATALOG.find((c) => c.id === id) ?? null;

/** Files a listing should have, by convention (for discovery and the missing-asset report). */
export function expectedAssets(listing) {
  return {
    main: ['main.webp', 'main.png'],
    poses: Object.fromEntries(listing.poses.map((p) => [p, [`pose-${p}.webp`, `pose-${p}.png`]])),
    expressions: Object.fromEntries(listing.expressions.map((e) => [e, [`expression-${e}.webp`, `expression-${e}.png`]])),
  };
}
