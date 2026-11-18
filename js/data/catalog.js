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
 * `media` (optional) points at supplied artwork that doesn't follow the folder
 * convention — files keep their original names in assets/characters/:
 *   image → main portrait path
 *   fit   → 'cover' for full-bleed studio photos (subject centred on a wide
 *           plain backdrop: only empty backdrop is trimmed, never the person);
 *           'contain' (default) for transparent cutouts
 *   focus → object-position for cover framing (default 'center top')
 *   video → optional real talking-character clip (muted loop, played by ui/character-video.js);
 *           the portrait stays as poster + fallback. Only files verified frame-by-frame.
 *
 * Filter values are keys; their display labels live in the i18n dictionaries
 * (catalog.values.*), so filters and cards are fully bilingual.
 */
/** Primary category (character type). Shown as the main segmented filter. */
export const KINDS = ['realistic', 'humanlike', 'cartoon3d', 'mascot'];

export const FILTERS = {
  market: ['saudi', 'egyptian', 'international'],
  style: ['professional', 'corporate', 'friendly', 'casual'],
  presentation: ['female', 'male'],
  useCase: ['website-assistant', 'app-assistant', 'ai-agent', 'customer-service', 'marketing', 'presenter'],
};

export const POSES = ['front', 'welcome', 'pointing', 'explaining', 'thinking'];
export const EXPRESSIONS = ['neutral', 'smile', 'thinking', 'surprised'];

/** Supplied studio portraits (1376×768, plain backdrop). Original filenames preserved. */
const asset = (file) => `assets/characters/${encodeURIComponent(file)}`;
const photo = (file, { focus, video } = {}) => ({
  image: asset(file), fit: 'cover', ...(focus ? { focus } : {}), ...(video ? { video: asset(video) } : {}),
});

const character = (def) => ({
  sample: true,
  kind: 'realistic',
  expressions: ['neutral', 'smile'],
  customization: { available: [], notAvailable: ['face'] },
  ...def,
  folder: `assets/characters/${def.id}/`,
});

export const CATALOG = [
  character({
    id: 'faisal',
    media: photo('magnific_premium-photorealistic-aigenerated-saudi_6AHF1WNiJO.png', { video: 'magnific_animate-the-exact-character_ksDqrda16B.mp4' }),
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
    media: photo('magnific_she-should-have-distinctive-natural-facial-features_tCi6G7vmZJ.png', { video: 'magnific_animate-the-exact-character_bxTQkJL5Y2.mp4' }),
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
    media: photo('magnific_he-should-look_ksDMoXo16B.png', { video: 'magnific_video-generator_cplz7IH0eP.mp4' }),
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
    media: photo('magnific_premium-photorealistic-aigenerated-egyptian_u5nzVmXQLD.png', { video: 'magnific_video-generator_Ebzv0qbuuO.mp4' }),
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
    media: photo('magnific_photorealistic-male-digital-assistant_Bh4P627oQR.png'),
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
    media: photo('magnific_premium-photorealistic-aigenerated-egyptian_s7oBmBBl8e.png', { video: 'magnific_video-generator_huR8zyWvqL.mp4' }),
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
    media: photo('magnific_he-should-have-a-mature_s7oBhWYl8e (1).png'),
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
    media: photo('magnific_she-should-look_1lpDovir4r.png', { video: 'magnific_animate-the-exact-character_If6XhiztvE.mp4' }),
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
  character({
    id: 'nova',
    kind: 'humanlike',
    media: photo('magnific_premium-photorealistic-nearhuman_bxT0XgK5Y2.png'),
    name: { en: 'Nova', ar: 'نوفا' },
    title: { en: 'Digital presenter', ar: 'مقدّمة رقمية' },
    description: {
      en: 'A near-human digital presenter for product tours, announcements and explainers.',
      ar: 'مقدّمة رقمية شبه بشرية لجولات المنتج والإعلانات والشروحات.',
    },
    market: 'international', style: 'professional', presentation: 'female', ageRange: '30s',
    personality: ['professional', 'calm'],
    useCases: ['presenter', 'marketing'],
    poses: ['front'],
    expressions: ['smile'],
    customization: { available: ['name', 'background'], notAvailable: ['face'] },
  }),
  character({
    id: 'milo',
    kind: 'cartoon3d',
    media: photo('magnific_premium-stylized-3d-egyptian-male-character_LwBXvCuswO.png', { video: 'magnific_video-generator_UPmsORHwny.mp4' }),
    name: { en: 'Milo', ar: 'ميلو' },
    title: { en: 'In-app assistant', ar: 'مساعد داخل التطبيق' },
    description: {
      en: 'A friendly stylized 3D guide for onboarding and in-app help.',
      ar: 'مرشد ودود بأسلوب ثلاثي الأبعاد للتعريف بالتطبيق والمساعدة داخله.',
    },
    market: 'egyptian', style: 'friendly', presentation: 'male', ageRange: '20s',
    personality: ['friendly'],
    useCases: ['app-assistant', 'customer-service'],
    poses: ['front'],
    expressions: ['smile'],
    customization: { available: ['name', 'background'], notAvailable: ['face'] },
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
