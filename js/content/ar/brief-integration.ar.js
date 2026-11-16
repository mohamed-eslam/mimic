/** Arabic overlay for the Integration Request (js/content/brief-integration.js). */
export const integrationAr = {
  title: 'طلب دمج الشخصية',
  steps: {
    platform: { title: 'أين تريد أن تظهر الشخصية؟', short: 'المنصة', intro: 'لا تحتاج إلى خبرة تقنية — اختر الأقرب لك، أو دعنا نساعدك.' },
    tech: { title: 'عن التقنية لديكم', short: 'التقنية', intro: 'تخطَّ أي سؤال لا تعرف إجابته — سيسألك مطوّرونا عن التفاصيل لاحقًا.' },
    experience: { title: 'كيف تتفاعل الشخصية؟', short: 'التجربة' },
    character: { title: 'الشخصية', short: 'الشخصية' },
    contact: { title: 'المدة والتواصل', short: 'التواصل' },
    review: { title: 'راجع طلبك', short: 'المراجعة' },
  },
  questions: {
    platform: {
      label: 'ما المنصة التي تستخدمها حاليًا؟', summaryLabel: 'المنصة',
      options: { website: 'موقع إلكتروني', mobile: 'تطبيق جوال', 'ai-agent': 'وكيل / مساعد ذكاء اصطناعي', chatbot: 'روبوت محادثة', unsure: 'لست متأكدًا — ساعدوني في الاختيار' },
    },
    existing: {
      label: 'هل لديك منتج يعمل حاليًا؟', summaryLabel: 'المنتج الحالي',
      options: { live: 'نعم، يعمل', building: 'قيد التطوير', none: 'ليس بعد' },
    },
    productUrl: { label: 'رابط المنتج (إن وجد)' },
    stack: { label: 'ما التقنية التي تستخدمونها؟ (إن كنت تعرفها)', summaryLabel: 'التقنية', options: { 'Native iOS / Android': 'iOS / Android أصلي', 'I don’t know': 'لا أعرف' } },
    team: {
      label: 'هل لديكم فريق تطوير داخلي؟', summaryLabel: 'فريق التطوير',
      options: { 'in-house': 'نعم، مطوّرين داخليين', agency: 'نتعامل مع وكالة خارجية', none: 'ليس لدينا فريق تطوير' },
    },
    placement: {
      label: 'أين تظهر الشخصية؟', summaryLabel: 'مكان الظهور',
      options: { floating: 'مساعد عائم في زاوية الشاشة', chat: 'داخل نافذة المحادثة', onboarding: 'شاشات التعريف للمستخدم الجديد', hero: 'الصفحة الرئيسية', help: 'صفحات المساعدة والدعم', unsure: 'لست متأكدًا' },
    },
    interaction: {
      label: 'ماذا يحدث عندما يتفاعل معها المستخدم؟', summaryLabel: 'التفاعل',
      options: { greet: 'ترحّب بالزوار', 'open-chat': 'تفتح المحادثة', guide: 'ترشد المستخدم خطوة بخطوة', react: 'تتفاعل مع تصرفات المستخدم', visual: 'حضور بصري فقط', unsure: 'لست متأكدًا' },
    },
    scope: {
      label: 'هل تحتاج إلى دمج بصري فقط، أم مع محادثة ذكية؟', summaryLabel: 'النطاق',
      options: {
        visual: { label: 'دمج بصري فقط', desc: 'الشخصية والواجهة وحالات التفاعل' },
        conversational: { label: 'دمج بصري + محادثة ذكية', desc: 'ننسّق مع مزوّد الذكاء الاصطناعي لديكم، وخدماته لها نطاق منفصل' },
        unsure: { label: 'لست متأكدًا — ساعدوني في القرار' },
      },
    },
    aiNote: { label: 'لا يوفّر MIMIC نموذج الذكاء الاصطناعي أو نظام الشات بوت أو منطق المحادثة بشكل تلقائي. وإن احتجت إليها، يحدّد فريقنا نطاقها معك بشكل منفصل.' },
    listingName: { label: 'الشخصية المختارة' },
    characterSource: {
      label: 'أي شخصية سندمجها؟', summaryLabel: 'الشخصية',
      options: { marketplace: 'شخصية من سوق MIMIC', custom: 'شخصية مخصصة (طلبتها أو قيد التنفيذ)', own: 'شخصية نملكها مسبقًا', none: 'ليست لدينا شخصية بعد' },
    },
    characterFiles: { label: 'ملفات شخصيتكم الحالية (اختياري)', summaryLabel: 'ملفات الشخصية' },
    assetsConsent: { label: 'أؤكد أننا نملك هذه الملفات أو لدينا إذن باستخدامها، بما في ذلك صورة أي شخص يظهر فيها.', summaryLabel: 'تأكيد الحقوق' },
    timeline: { label: 'المدة المتوقعة', options: { asap: 'في أقرب وقت', '1m': 'خلال شهر', '1-3m': 'من شهر إلى ثلاثة', flexible: 'مرن' } },
    contactName: { label: 'اسمك' },
    company: { label: 'الشركة' },
    email: { label: 'بريد العمل الإلكتروني' },
    phone: { label: 'رقم الجوال أو واتساب' },
    contactMethod: { label: 'كيف تفضّل أن نتواصل معك؟', options: { email: 'البريد الإلكتروني', phone: 'مكالمة', whatsapp: 'واتساب' } },
    contactConsent: { label: 'نعم، أوافق أن يتواصل معي فريق MIMIC بخصوص هذا الطلب.', summaryLabel: 'الموافقة على التواصل' },
  },
};
