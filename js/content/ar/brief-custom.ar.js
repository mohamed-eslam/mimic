/**
 * Arabic overlay for the Custom Character Brief (js/content/brief-custom.js).
 * Transcreated for Saudi & Egyptian audiences — friendly, clear, non-technical.
 * Keys are step/question ids and option values from the English schema.
 */
export const customBriefAr = {
  title: 'موجز الشخصية المخصصة',
  steps: {
    style: { title: 'اختر أسلوب الشخصية', short: 'الأسلوب' },
    purpose: { title: 'ما الغرض من الشخصية؟', short: 'الغرض' },
    details: { title: 'التفاصيل الإبداعية', short: 'التفاصيل' },
    review: { title: 'المراجعة والإرسال', short: 'المراجعة' },
  },
  questions: {
    characterKind: {
      label: 'أسلوب الشخصية', summaryLabel: 'أسلوب الشخصية',
      options: { realistic: 'إنسان واقعي', humanlike: 'شبه بشري', cartoon3d: 'شخصية ثلاثية الأبعاد', open: 'اقترحوا الأنسب' },
    },
    secBrand: { label: 'علامتك التجارية' },
    secAbout: { label: 'عنك' },
    secProject: { label: 'مشروعك' },
    secContact: { label: 'كيف نتواصل معك؟' },
    listingName: { label: 'الشخصية المختارة' },
    packageName: { label: 'الباقة' },
    who: {
      label: 'أنا…', summaryLabel: 'نوع العميل',
      options: {
        business: { label: 'شركة / علامة تجارية', desc: 'شخصية تمثّل شركتي أو علامتي' },
        individual: { label: 'فرد / صانع محتوى', desc: 'أفاتار شخصي لمحتواي' },
        agency: { label: 'وكالة', desc: 'شخصية لأحد عملائي' },
        product: { label: 'فريق منتج / مطوّر', desc: 'شخصية لتطبيقنا أو منتجنا الذكي' },
      },
    },
    listingNote: { label: 'اخترت شخصية جاهزة من السوق، فتخطّينا أسئلة الشكل.' },
    needs: {
      label: 'أين ستستخدم الشخصية؟', summaryLabel: 'الاستخدام',
      options: {
        'ai-agent': 'شخصية لوكيل ذكاء اصطناعي', chatbot: 'شخصية لروبوت محادثة', website: 'شخصية للموقع الإلكتروني',
        mobile: 'شخصية لتطبيق الجوال', avatar: 'أفاتار رقمي شخصي', advertising: 'شخصية إعلانية',
        social: 'شخصية للسوشيال ميديا', presenter: 'مقدّم فيديو',
      },
    },
    needsNotes: { label: 'احكِ لنا أكثر عن فكرتك', placeholder: 'مثلًا: مساعد ودود في تطبيق البنك يرحّب بالعملاء الجدد…', summaryLabel: 'الفكرة' },
    likeness: {
      label: 'هل تريد أن تكون الشخصية مستوحاة من شكل شخص حقيقي (أنت مثلًا)؟', summaryLabel: 'مستوحاة من شخص حقيقي',
      options: {
        yes: { label: 'نعم — من صور مرجعية', desc: 'سترفع الصور في الخطوات التالية' },
        no: { label: 'لا — شخصية جديدة بالكامل' },
      },
    },
    likenessNote: { label: 'النتيجة تمثيل رقمي واقعي مستوحى من الصور، وليست بالضرورة نسخة مطابقة تمامًا لملامح الوجه. وتحتاج إذن استخدام صورة أي شخص يظهر فيها.' },
    gender: { label: 'المظهر (رجل / امرأة)', options: { woman: 'امرأة', man: 'رجل', open: 'اقترحوا الأنسب' } },
    age: { label: 'الفئة العمرية التقريبية (للبالغين فقط)', options: { '20s': 'العشرينات', '30s': 'الثلاثينات', '40s': 'الأربعينات', '50s+': 'الخمسينات وأكبر', open: 'اقترحوا الأنسب' } },
    styling: {
      label: 'الطابع الثقافي أو الإقليمي للإطلالة', hint: 'المقصود هنا الملابس والإطلالة فقط.',
      options: {
        'gulf-traditional': { label: 'زي خليجي تقليدي', desc: 'مثل الثوب والشماغ أو العباية' },
        'contemporary-arab': { label: 'إطلالة عربية مهنية عصرية', desc: 'لبس عمل عصري بطابع محلي' },
        international: { label: 'طابع عالمي / محايد', desc: 'إطلالة تناسب كل الأسواق' },
        open: { label: 'اقترحوا الأنسب' },
      },
    },
    clothing: {
      label: 'نوع الملابس',
      options: { traditional: 'تقليدي', 'business-formal': 'رسمي للعمل', 'smart-casual': 'كاجوال أنيق', uniform: 'زي موحّد بألوان العلامة', casual: 'كاجوال', modest: 'لبس محتشم' },
    },
    look: {
      label: 'الانطباع العام',
      options: { corporate: 'رسمي ومرتب', approachable: 'قريب وودود', creative: 'مبدع وعصري', expert: 'خبير وموثوق' },
    },
    hair: { label: 'تسريحة الشعر أو غطاء الرأس (إن وجد)', placeholder: 'مثلًا: شعر قصير، حجاب، شماغ…', summaryLabel: 'الشعر / غطاء الرأس' },
    background: {
      label: 'الخلفية',
      options: {
        transparent: { label: 'خلفية شفافة', desc: 'الأفضل للمواقع والتطبيقات' },
        studio: { label: 'خلفية استوديو', desc: 'مظهر تصوير نظيف ومحايد' },
        branded: { label: 'بيئة بهوية علامتك', desc: 'مكتب أو متجر أو مكان يعكس علامتك' },
      },
    },
    references: { label: 'صور مرجعية (اختياري)', hint: 'صور لإطلالات أو أمثلة تعجبك.', summaryLabel: 'صور مرجعية' },
    appearanceNotes: { label: 'متطلبات أخرى للشكل', placeholder: 'أي تفاصيل إضافية عن الإطلالة…', summaryLabel: 'ملاحظات الشكل' },
    traits: {
      label: 'الشخصية',
      options: { professional: 'مهنية', friendly: 'ودودة', confident: 'واثقة', calm: 'هادئة', energetic: 'حيوية', formal: 'رسمية', casual: 'عفوية' },
    },
    language: { label: 'اللغة', options: { arabic: 'العربية', english: 'الإنجليزية', both: 'الاثنتان' } },
    dialect: { label: 'أسلوب الكلام بالعربي', options: { saudi: 'اللهجة السعودية', egyptian: 'اللهجة المصرية', msa: 'العربية الفصحى المبسّطة' } },
    brandName: { label: 'اسم العلامة التجارية' },
    industry: { label: 'المجال', placeholder: 'مثلًا: بنوك، تجارة إلكترونية، صحة' },
    website: { label: 'رابط الموقع' },
    audience: { label: 'الجمهور المستهدف', placeholder: 'مثلًا: الشباب المهنيون، أصحاب المشاريع الصغيرة' },
    market: { label: 'السوق المستهدف', options: { 'Saudi Arabia': 'السعودية', Egypt: 'مصر', GCC: 'دول الخليج', Europe: 'أوروبا', 'United States': 'الولايات المتحدة' } },
    brandColors: { label: 'ألوان العلامة' },
    logo: { label: 'شعار العلامة' },
    guidelines: { label: 'دليل الهوية البصرية' },
    characterName: { label: 'الاسم المفضّل للشخصية', placeholder: 'اتركه فارغًا إن أردت أن نقترح عليك' },
    personalStyle: { label: 'أسلوب حضورك الشخصي', options: { professional: 'مهني', lifestyle: 'لايف ستايل', educational: 'تعليمي', entertainment: 'ترفيهي', luxury: 'فاخر' } },
    personPhotos: { label: 'صور مرجعية للشخص', hint: 'صور واضحة بإضاءة جيدة (من الأمام ومن زاوية جانبية) تعطي أفضل نتيجة.', summaryLabel: 'الصور المرجعية' },
    usage: { label: 'أين ستستخدم الأفاتار؟', placeholder: 'مثلًا: منشورات إنستغرام وصور مصغّرة ليوتيوب' },
    likenessConsent: { label: 'أؤكد أن الصور المرفوعة ملكي أو أن لدي إذنًا باستخدام صورة كل شخص يظهر فيها.', summaryLabel: 'إذن استخدام الصور' },
    deliverables: {
      label: 'ما الذي تريد استلامه؟',
      options: {
        png: 'صورة الشخصية بخلفية شفافة (PNG)', poses: 'وضعيات متعددة', expressions: 'تعابير وجه مختلفة',
        social: 'تصاميم للسوشيال ميديا', ads: 'تصاميم إعلانية', video: 'فيديو ترويجي',
        'web-assets': 'ملفات للموقع الإلكتروني', 'chatbot-assets': 'ملفات لروبوت المحادثة', 'app-assets': 'ملفات لتطبيق الجوال',
      },
    },
    integration: {
      label: 'تحتاج مساعدة في دمج الشخصية؟', summaryLabel: 'المساعدة في الدمج',
      options: {
        none: 'لا، أحتاج ملفات الشخصية فقط.', website: 'نعم، في موقعي الإلكتروني.', mobile: 'نعم، في تطبيق الجوال.',
        'ai-agent': 'نعم، في وكيل الذكاء الاصطناعي الحالي.', chatbot: 'نعم، في روبوت المحادثة.', help: 'أحتاج مساعدة في اتخاذ القرار.',
      },
    },
    webPlatform: { label: 'على أي منصة بُني موقعك؟', options: { 'Custom-built': 'برمجة خاصة', 'Not sure': 'لست متأكدًا' } },
    webUrl: { label: 'رابط الموقع' },
    appPlatform: { label: 'على أي منصة؟', options: { Both: 'الاثنتان', 'Not sure': 'لست متأكدًا' } },
    appTech: { label: 'تقنية التطبيق (إن كنت تعرفها)', placeholder: 'مثلًا: Flutter أو React Native أو Swift' },
    aiPlatform: { label: 'ما المنصة أو الجهة التي تشغّله؟', placeholder: 'مثلًا: نظام داخلي، منصة شات بوت، مزوّد ذكاء اصطناعي — أو «لست متأكدًا»' },
    aiLive: { label: 'هل يعمل حاليًا؟', options: { live: 'يعمل', building: 'قيد التطوير', planned: 'لم يبدأ بعد' } },
    aiNote: { label: 'ندمج الهوية البصرية للشخصية وواجهتها. أما نماذج الذكاء الاصطناعي وأنظمة الشات بوت ومنطق المحادثة فلها نطاق وتسعير منفصلان.' },
    integrationNote: { label: 'لا بأس إن لم تكن متأكدًا — سيقترح فريقنا الأنسب بعد مراجعة الموجز.' },
    timeline: { label: 'المدة المتوقعة', options: { asap: 'في أقرب وقت', '2-4w': 'من أسبوعين لشهر', '1-2m': 'من شهر لشهرين', flexible: 'مرن' } },
    budget: { label: 'الميزانية التقريبية (اختياري، بالدولار)', options: { '<1k': 'أقل من 1,000$', '1-5k': 'من 1,000$ إلى 5,000$', '5-15k': 'من 5,000$ إلى 15,000$', '15k+': 'أكثر من 15,000$', unsure: 'لم أحدد بعد' } },
    notes: { label: 'ملاحظات إضافية', placeholder: 'مواعيد مهمة، تاريخ الإطلاق، أو أي شيء ثاني…' },
    contactName: { label: 'اسمك' },
    email: { label: 'بريد العمل الإلكتروني', hint: 'إن كنت فردًا، يمكنك استخدام بريدك الشخصي.' },
    phone: { label: 'رقم الجوال أو واتساب' },
    contactMethod: { label: 'كيف تفضّل أن نتواصل معك؟', options: { email: 'البريد الإلكتروني', phone: 'مكالمة', whatsapp: 'واتساب' } },
  },
};
