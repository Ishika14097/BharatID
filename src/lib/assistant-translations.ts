/**
 * Multi-Language Support System for Bharat ID AI Assistant
 * 
 * Supported Languages:
 * - English (en)
 * - Hindi (hi)
 * - Tamil (ta)
 * - Telugu (te)
 * - Kannada (ka)
 * - Malayalam (ml)
 * 
 * Translation coverage includes:
 * - UI Elements
 * - Government Procedures
 * - Document Names
 * - Common Phrases
 * - Error Messages
 */

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'ka' | 'ml';

/**
 * Translation dictionary entry
 */
export interface TranslationEntry {
  [key: string]: string;
}

/**
 * Complete translation dictionary
 */
export interface TranslationDictionary {
  [language: string]: TranslationEntry;
}

/**
 * Multi-Language Manager
 */
export class LanguageManager {
  private translations: TranslationDictionary = {};

  constructor() {
    this.initializeTranslations();
  }

  /**
   * Get translated string
   */
  public translate(key: string, language: SupportedLanguage = 'en'): string {
    if (!this.translations[language]) {
      console.warn(`Language ${language} not supported, falling back to English`);
      return this.translations['en'][key] || key;
    }

    return this.translations[language][key] || this.translations['en'][key] || key;
  }

  /**
   * Get all translations for a language
   */
  public getAllTranslations(language: SupportedLanguage): TranslationEntry {
    return this.translations[language] || this.translations['en'];
  }

  /**
   * Check if language is supported
   */
  public isLanguageSupported(language: string): language is SupportedLanguage {
    return ['en', 'hi', 'ta', 'te', 'ka', 'ml'].includes(language);
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'हिन्दी' },
      { code: 'ta', name: 'தமிழ்' },
      { code: 'te', name: 'తెలుగు' },
      { code: 'ka', name: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'മലയാളം' }
    ];
  }

  /**
   * Initialize all translations
   */
  private initializeTranslations(): void {
    this.translations = {
      en: this.getEnglishTranslations(),
      hi: this.getHindiTranslations(),
      ta: this.getTamilTranslations(),
      te: this.getTeluguTranslations(),
      ka: this.getKannadaTranslations(),
      ml: this.getMalayalamTranslations()
    };
  }

  /**
   * English Translations
   */
  private getEnglishTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'Bharat ID Assistant',
      'chat.subtitle': 'Your AI guide for government documents',
      'chat.placeholder': 'Ask me anything about your documents...',
      'chat.send': 'Send',
      'chat.clear': 'Clear Conversation',
      'chat.export': 'Export',
      'chat.language': 'Language',
      'chat.thinking': 'Thinking...',
      'chat.error': 'Error sending message. Please try again.',

      // Document Types
      'doc.passport': 'Passport',
      'doc.driving_license': 'Driving License',
      'doc.kyc': 'KYC',
      'doc.aadhaar': 'Aadhaar',
      'doc.pan': 'PAN',

      // Document Status
      'status.pending': 'Pending',
      'status.submitted': 'Submitted',
      'status.verified': 'Verified',
      'status.expired': 'Expired',

      // Procedures
      'proc.passport_renewal': 'Passport Renewal',
      'proc.kyc_verification': 'KYC Verification',
      'proc.address_update': 'Address Update',
      'proc.document_verification': 'Document Verification',
      'proc.form_submission': 'Form Submission',

      // Common Questions
      'faq.what_documents': 'What documents do I need?',
      'faq.how_to_renew': 'How do I renew my passport?',
      'faq.verification_failed': 'Why did my verification fail?',
      'faq.how_long': 'How long does it take?',
      'faq.where_to_apply': 'Where do I apply?',

      // Tips and Hints
      'tip.clear_documents': 'Make sure all document copies are clear and legible',
      'tip.valid_address': 'Ensure your address is up to date',
      'tip.keep_originals': 'Keep original documents safe',
      'tip.visit_office': 'You can visit the nearest office for assistance',

      // Messages
      'msg.welcome': 'Hello! I\'m your Bharat ID Assistant. How can I help you today?',
      'msg.help': 'You can ask me about:\n• Passport renewal\n• KYC verification\n• Document requirements\n• Verification issues\n• Form filling',
      'msg.processing': 'Processing your request...',
      'msg.no_context': 'Please provide more details for a better answer.',

      // Buttons
      'btn.explain_procedure': 'Explain Procedure',
      'btn.suggest_documents': 'Suggest Documents',
      'btn.explain_error': 'Explain Error',
      'btn.get_help': 'Get Help',
      'btn.submit': 'Submit',
      'btn.cancel': 'Cancel',

      // Errors
      'error.network': 'Network error. Please check your connection.',
      'error.invalid_input': 'Invalid input. Please try again.',
      'error.server_error': 'Server error. Please try later.',
      'error.not_found': 'Information not found.',

      // Form Fields
      'form.document_type': 'Document Type',
      'form.upload': 'Upload Document',
      'form.select': 'Select',
      'form.required': 'This field is required',
      'form.invalid': 'Invalid input',
      'form.confirmation': 'Are you sure?',
    };
  }

  /**
   * Hindi Translations
   */
  private getHindiTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'भारत आईडी सहायक',
      'chat.subtitle': 'सरकारी दस्तावेजों के लिए आपका AI गाइड',
      'chat.placeholder': 'अपने दस्तावेजों के बारे में मुझसे कुछ भी पूछें...',
      'chat.send': 'भेजें',
      'chat.clear': 'बातचीत साफ करें',
      'chat.export': 'निर्यात करें',
      'chat.language': 'भाषा',
      'chat.thinking': 'सोच रहे हैं...',
      'chat.error': 'संदेश भेजने में त्रुटि। कृपया पुनः प्रयास करें।',

      // Document Types
      'doc.passport': 'पासपोर्ट',
      'doc.driving_license': 'ड्राइविंग लाइसेंस',
      'doc.kyc': 'केवाईसी',
      'doc.aadhaar': 'आधार',
      'doc.pan': 'पैन',

      // Document Status
      'status.pending': 'लंबित',
      'status.submitted': 'जमा किया गया',
      'status.verified': 'सत्यापित',
      'status.expired': 'समाप्त हो गया',

      // Procedures
      'proc.passport_renewal': 'पासपोर्ट नवीनीकरण',
      'proc.kyc_verification': 'केवाईसी सत्यापन',
      'proc.address_update': 'पता अपडेट',
      'proc.document_verification': 'दस्तावेज सत्यापन',
      'proc.form_submission': 'फॉर्म जमा करना',

      // Common Questions
      'faq.what_documents': 'मुझे कौन से दस्तावेज चाहिए?',
      'faq.how_to_renew': 'मैं अपना पासपोर्ट कैसे नवीनीकृत करूं?',
      'faq.verification_failed': 'मेरी सत्यापन विफल क्यों हुई?',
      'faq.how_long': 'इसमें कितना समय लगता है?',
      'faq.where_to_apply': 'मैं कहां आवेदन करूं?',

      // Tips and Hints
      'tip.clear_documents': 'सभी दस्तावेज की कॉपी स्पष्ट और पठनीय होनी चाहिए',
      'tip.valid_address': 'सुनिश्चित करें कि आपका पता अद्यतन है',
      'tip.keep_originals': 'मूल दस्तावेज सुरक्षित रखें',
      'tip.visit_office': 'आप सहायता के लिए निकटतम कार्यालय जा सकते हैं',

      // Messages
      'msg.welcome': 'नमस्ते! मैं आपका भारत आईडी सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
      'msg.help': 'आप मुझसे पूछ सकते हैं:\n• पासपोर्ट नवीनीकरण\n• केवाईसी सत्यापन\n• दस्तावेज आवश्यकताएं\n• सत्यापन समस्याएं\n• फॉर्म भरना',
      'msg.processing': 'आपके अनुरोध को प्रोसेस कर रहे हैं...',
      'msg.no_context': 'बेहतर उत्तर के लिए कृपया अधिक विवरण प्रदान करें।',

      // Buttons
      'btn.explain_procedure': 'प्रक्रिया समझाएं',
      'btn.suggest_documents': 'दस्तावेज सुझाएं',
      'btn.explain_error': 'त्रुटि समझाएं',
      'btn.get_help': 'सहायता प्राप्त करें',
      'btn.submit': 'जमा करें',
      'btn.cancel': 'रद्द करें',

      // Errors
      'error.network': 'नेटवर्क त्रुटि। कृपया अपने कनेक्शन की जांच करें।',
      'error.invalid_input': 'अमान्य इनपुट। कृपया पुनः प्रयास करें।',
      'error.server_error': 'सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।',
      'error.not_found': 'जानकारी नहीं मिली।',

      // Form Fields
      'form.document_type': 'दस्तावेज प्रकार',
      'form.upload': 'दस्तावेज अपलोड करें',
      'form.select': 'चुनें',
      'form.required': 'यह फील्ड आवश्यक है',
      'form.invalid': 'अमान्य इनपुट',
      'form.confirmation': 'क्या आप सुनिश्चित हैं?',
    };
  }

  /**
   * Tamil Translations
   */
  private getTamilTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'பாரத ஐடி உதவியாளர்',
      'chat.subtitle': 'அரசாங்க ஆவணங்களுக்கான உங்கள் AI வழிகாட்டி',
      'chat.placeholder': 'உங்கள் ஆவணங்களைப் பற்றி என்னிடம் எதையும் கேளுங்கள்...',
      'chat.send': 'அனுப்பு',
      'chat.clear': 'உரையாடல் அழிக்கவும்',
      'chat.export': 'ஏற்றுமதி',
      'chat.language': 'மொழி',
      'chat.thinking': 'சிந்திக்கிறது...',
      'chat.error': 'செய்தி அனுப்புவதில் பிழை। மீண்டும் முயற்சிக்கவும்.',

      // Document Types
      'doc.passport': 'பாஸ்போர்ட்',
      'doc.driving_license': 'ஓட்டுநர் உரிமம்',
      'doc.kyc': 'கேவாईசி',
      'doc.aadhaar': 'ஆதார்',
      'doc.pan': 'பான்',

      // Document Status
      'status.pending': 'நிலுவையில் உள்ளது',
      'status.submitted': 'சமர்ப்பிக்கப்பட்டது',
      'status.verified': 'சரிபார்க்கப்பட்டது',
      'status.expired': 'காலாவதி ஆனது',

      // Procedures
      'proc.passport_renewal': 'பாஸ்போர்ட் புதுப்பிப்பு',
      'proc.kyc_verification': 'கேவாईசி சரிபார்ப்பு',
      'proc.address_update': 'முகவரி புதுப்பிப்பு',
      'proc.document_verification': 'ஆவணம் சரிபார்ப்பு',
      'proc.form_submission': 'படிவம் சமர்ப்பிப்பு',

      // Common Questions
      'faq.what_documents': 'என்ன ஆவணங்கள் தேவை?',
      'faq.how_to_renew': 'நான் என் பாஸ்போர்ட்டை எவ்வாறு புதுப்பிக்க வேண்டும்?',
      'faq.verification_failed': 'எனது சரிபார்ப்பு ஏன் தோல்வியடைந்தது?',
      'faq.how_long': 'இதற்கு எவ்வளவு நேரம் ஆகும்?',
      'faq.where_to_apply': 'நான் எங்கு விண்ணப்பிக்க வேண்டும்?',

      // Tips and Hints
      'tip.clear_documents': 'அனைத்து ஆவண நகல்கள் தெளிவாகவும் படிக்கக்கூடியதாகவும் இருக்க வேண்டும்',
      'tip.valid_address': 'உங்கள் முகவரி சரியாக இருப்பதை உறுதிசெய்யவும்',
      'tip.keep_originals': 'அசல் ஆவணங்களை பாதுகாப்பாக வைத்திருங்கள்',
      'tip.visit_office': 'உதவிக்கு நீங்கள் அருகிலுள்ள அலுவலகத்திற்குச் செல்லலாம்',

      // Messages
      'msg.welcome': 'வணக்கம்! நான் உங்கள் பாரத ஐடி உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      'msg.help': 'நீங்கள் என்னிடம் கேட்கலாம்:\n• பாஸ்போர்ட் புதுப்பிப்பு\n• கேவாईசி சரிபார்ப்பு\n• ஆவணம் தேவைகள்\n• சரிபார்ப்பு சிக்கல்கள்\n• படிவம் நிரப்புதல்',
      'msg.processing': 'உங்கள் கோரிக்கை செயல்பட்டு வருகிறது...',
      'msg.no_context': 'சிறந்த பதிலுக்கு தயவுசெய்து மேலும் விவரங்களை வழங்கவும்.',

      // Buttons
      'btn.explain_procedure': 'நடைமுறையை விளக்கவும்',
      'btn.suggest_documents': 'ஆவணங்களை பரிந்துரைக்கவும்',
      'btn.explain_error': 'பிழையை விளக்கவும்',
      'btn.get_help': 'உதவி பெறவும்',
      'btn.submit': 'சமர்ப்பிக்கவும்',
      'btn.cancel': 'ரத்து செய்க',

      // Errors
      'error.network': 'நெட்வர்க் பிழை. உங்கள் இணைப்பைச் சரிபார்க்கவும்.',
      'error.invalid_input': 'செல்லாத உள்ளீடு. மீண்டும் முயற்சிக்கவும்.',
      'error.server_error': 'சேவையக பிழை. பின்னர் முயற்சிக்கவும்.',
      'error.not_found': 'தகவல் கிடைக்கவில்லை.',

      // Form Fields
      'form.document_type': 'ஆவணம் வகை',
      'form.upload': 'ஆவணம் பதிவேற்றவும்',
      'form.select': 'தேர்ந்தெடுக்கவும்',
      'form.required': 'இந்த புலம் தேவைப்படுகிறது',
      'form.invalid': 'செல்லாத உள்ளீடு',
      'form.confirmation': 'நீங்கள் உறுதியாக இருக்கிறீர்களா?',
    };
  }

  /**
   * Telugu Translations
   */
  private getTeluguTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'భారత ఐడి సహాయకుడు',
      'chat.subtitle': 'ఖైదీ పత్రాల కోసం మీ AI గైడ్',
      'chat.placeholder': 'మీ పత్రాల గురించి నన్ను ఏదైనా అడగండి...',
      'chat.send': 'పంపండి',
      'chat.clear': 'సంభాషణ తీసివేయండి',
      'chat.export': 'ఎగుమతి',
      'chat.language': 'భాష',
      'chat.thinking': 'ఆలోచిస్తున్నాను...',
      'chat.error': 'సందేశం పంపడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.',

      // Document Types
      'doc.passport': 'పాస్‌పోర్ట్',
      'doc.driving_license': 'డ్రైవింగ్ లైసెన్స్',
      'doc.kyc': 'కేవైసీ',
      'doc.aadhaar': 'ఆధార్',
      'doc.pan': 'పాన్',

      // Document Status
      'status.pending': 'పెండింగ్',
      'status.submitted': 'సమర్పించిన',
      'status.verified': 'ధృవీకరించిన',
      'status.expired': 'గడువు ముగిసిన',

      // Procedures
      'proc.passport_renewal': 'పాస్‌పోర్ట్ నవీకరణ',
      'proc.kyc_verification': 'కేవైసీ ధృవీకరణ',
      'proc.address_update': 'చిరునామా నవీకరణ',
      'proc.document_verification': 'పత్రం ధృవీకరణ',
      'proc.form_submission': 'ఫారమ్ సమర్పణ',

      // Common Questions
      'faq.what_documents': 'నాకు ఏ పత్రాలు కావాలి?',
      'faq.how_to_renew': 'నా పాస్‌పోర్ట్‌ను ఎలా నవీకరించాలి?',
      'faq.verification_failed': 'నా ధృవీకరణ ఎందుకు విఫలమైంది?',
      'faq.how_long': 'ఇది ఎంత సమయం తీసుకుంటుంది?',
      'faq.where_to_apply': 'నేను ఎక్కడ దరఖాస్తు చేయాలి?',

      // Tips and Hints
      'tip.clear_documents': 'అన్ని పత్రం నకళ్లు స్పష్టంగా మరియు పఠనీయమైనవి ఉండాలి',
      'tip.valid_address': 'మీ చిరునామా అప్‌డేట్ చేయబడిందని నిర్ధారించుకోండి',
      'tip.keep_originals': 'అసలు పత్రాలను సురక్షితంగా ఉంచండి',
      'tip.visit_office': 'సహాయం కోసం మీరు సమీప కార్యాలయానికి వెళ్లవచ్చు',

      // Messages
      'msg.welcome': 'నమస్కారం! నేను మీ భారత ఐడి సహాయకుడిని. నేను ఎలా సహాయం చేయగలను?',
      'msg.help': 'మీరు నన్ను అడగవచ్చు:\n• పాస్‌పోర్ట్ నవీకరణ\n• కేవైసీ ధృవీకరణ\n• పత్రం అవసరాలు\n• ధృవీకరణ సమస్యలు\n• ఫారమ్ నింపడం',
      'msg.processing': 'మీ అభ్యర్థనను ప్రక్రియ చేస్తున్నాం...',
      'msg.no_context': 'మెరుగైన సమాధానం కోసం దయచేసి మరిన్ని వివరాలను అందించండి.',

      // Buttons
      'btn.explain_procedure': 'ప్రక్రియ వివరించండి',
      'btn.suggest_documents': 'పత్రాలను సూచించండి',
      'btn.explain_error': 'లోపం వివరించండి',
      'btn.get_help': 'సహాయం పొందండి',
      'btn.submit': 'సమర్పించండి',
      'btn.cancel': 'రద్దు చేయండి',

      // Errors
      'error.network': 'నెట్‌వర్క్ ఎర్రర్. దయచేసి మీ కనెక్షన్‌ను తనిఖీ చేయండి.',
      'error.invalid_input': 'చెల్లని ఇన్‌పుట్. దయచేసి మళ్లీ ప్రయత్నించండి.',
      'error.server_error': 'సర్వర్ ఎర్రర్. దయచేసి తర్వాత ప్రయత్నించండి.',
      'error.not_found': 'సమాచారం కనుగొనబడలేదు.',

      // Form Fields
      'form.document_type': 'పత్రం రకం',
      'form.upload': 'పత్రం అప్‌లోడ్ చేయండి',
      'form.select': 'ఎంచుకోండి',
      'form.required': 'ఈ ఫీల్డ్ అవసరం',
      'form.invalid': 'చెల్లని ఇన్‌పుట్',
      'form.confirmation': 'మీరు నిశ్చితమైనారా?',
    };
  }

  /**
   * Kannada Translations
   */
  private getKannadaTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'ಭಾರತ ಐಡಿ ಸಹಾಯಕ',
      'chat.subtitle': 'ಸರಕಾರಿ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳಿಗಾಗಿ ನಿಮ್ಮ ಎಐ ಮಾರ್ಗದರ್ಶಕ',
      'chat.placeholder': 'ನಿಮ್ಮ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ...',
      'chat.send': 'ಕಳುಹಿಸಿ',
      'chat.clear': 'ಸಂವಾದ ಅಳಿಸಿ',
      'chat.export': 'ರಫ್ತು',
      'chat.language': 'ಭಾಷೆ',
      'chat.thinking': 'ಚಿಂತನೆ ಮಾಡುತ್ತಿದ್ದೇನೆ...',
      'chat.error': 'ಸಂದೇಶ ಕಳುಹಿಸುವಲ್ಲಿ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',

      // Document Types
      'doc.passport': 'ಪಾಸ್‌ಪೋರ್ಟ್',
      'doc.driving_license': 'ಚಾಲನ ಲೈಸೆನ್ಸ್',
      'doc.kyc': 'ಕೆವೈಸಿ',
      'doc.aadhaar': 'ಆಧಾರ್',
      'doc.pan': 'ಪ್ಯಾನ್',

      // Document Status
      'status.pending': 'ಬಾಕಿ',
      'status.submitted': 'ಸಲ್ಲಿಸಲಾದ',
      'status.verified': 'ಪರಿಶೀಲಿತ',
      'status.expired': 'ಕಾಲಾವಧಿ ಮೀರಿದೆ',

      // Procedures
      'proc.passport_renewal': 'ಪಾಸ್‌ಪೋರ್ಟ್ ನವೀಕರಣ',
      'proc.kyc_verification': 'ಕೆವೈಸಿ ಪರಿಶೀಲನೆ',
      'proc.address_update': 'ವಿಳಾಸ ನವೀಕರಣ',
      'proc.document_verification': 'ಡಾಕ್ಯುಮೆಂಟ್ ಪರಿಶೀಲನೆ',
      'proc.form_submission': 'ಫಾರ್ಮ್ ಸಲ್ಲಿಕೆ',

      // Common Questions
      'faq.what_documents': 'ನನಗೆ ಯಾವ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳು ಬೇಕು?',
      'faq.how_to_renew': 'ನಾನು ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್‌ನವನ್ನು ಹೇಗೆ ನವೀಕರಿಸಲಿ?',
      'faq.verification_failed': 'ನನ್ನ ಪರಿಶೀಲನೆ ಏಕೆ ವಿಫಲವಾಯಿತು?',
      'faq.how_long': 'ಇದು ಎಷ್ಟು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ?',
      'faq.where_to_apply': 'ನಾನು ಎಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಿ?',

      // Tips and Hints
      'tip.clear_documents': 'ಎಲ್ಲಾ ಡಾಕ್ಯುಮೆಂಟ್ ನಕಲುಗಳು ಸ್ಪಷ್ಟ ಮತ್ತು ಓದಬಹುದಾಗಿರಬೇಕು',
      'tip.valid_address': 'ನಿಮ್ಮ ವಿಳಾಸ ಅಪ್‌ಡೇಟ್ ಆಗಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ',
      'tip.keep_originals': 'ಮೂಲ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಇರಿಸಿ',
      'tip.visit_office': 'ನೀವು ಸಹಾಯಕ್ಕಾಗಿ ಹತ್ತಿರದ ಕಛೇರಿಗೆ ಹೋಗಬಹುದು',

      // Messages
      'msg.welcome': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಭಾರತ ಐಡಿ ಸಹಾಯಕ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
      'msg.help': 'ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು:\n• ಪಾಸ್‌ಪೋರ್ಟ್ ನವೀಕರಣ\n• ಕೆವೈಸಿ ಪರಿಶೀಲನೆ\n• ಡಾಕ್ಯುಮೆಂಟ್ ಅವಶ್ಯಕತೆಗಳು\n• ಪರಿಶೀಲನೆ ಸಮಸ್ಯೆಗಳು\n• ಫಾರ್ಮ್ ಭರ್ತಿ',
      'msg.processing': 'ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತಿದ್ದೇನೆ...',
      'msg.no_context': 'ಉತ್ತಮ ಉತ್ತರದ ಸಲುವಾಗಿ ದಯವಿಟ್ಟು ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.',

      // Buttons
      'btn.explain_procedure': 'ಕಾರ್ಯವಿಧಾನ ವಿವರಿಸಿ',
      'btn.suggest_documents': 'ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳನ್ನು ಸೂಚಿಸಿ',
      'btn.explain_error': 'ದೋಷ ವಿವರಿಸಿ',
      'btn.get_help': 'ಸಹಾಯ ಪಡೆಯಿರಿ',
      'btn.submit': 'ಸಲ್ಲಿಸಿ',
      'btn.cancel': 'ರದ್ದು ಮಾಡಿ',

      // Errors
      'error.network': 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
      'error.invalid_input': 'ಅಮಾನ್ಯ ಇನ್‌ಪುಟ್. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
      'error.server_error': 'ಸರ್ವರ್ ದೋಷ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.',
      'error.not_found': 'ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ.',

      // Form Fields
      'form.document_type': 'ಡಾಕ್ಯುಮೆಂಟ್ ಪ್ರಕಾರ',
      'form.upload': 'ಡಾಕ್ಯುಮೆಂಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      'form.select': 'ಆರಿಸಿ',
      'form.required': 'ಈ ಕ್ಷೇತ್ರ ಅವಶ್ಯಕ',
      'form.invalid': 'ಅಮಾನ್ಯ ಇನ್‌ಪುಟ್',
      'form.confirmation': 'ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?',
    };
  }

  /**
   * Malayalam Translations
   */
  private getMalayalamTranslations(): TranslationEntry {
    return {
      // UI Labels
      'chat.title': 'ഭാരത ഐഡി സഹായി',
      'chat.subtitle': 'സർക്കാർ പ്രമാണങ്ങളുടെ നിങ്ങളുടെ AI ഗൈഡ്',
      'chat.placeholder': 'നിങ്ങളുടെ പ്രമാണങ്ങളെക്കുറിച്ച് എന്നോട് എന്തും ചോദിക്കുക...',
      'chat.send': 'അയയ്ക്കുക',
      'chat.clear': 'സംഭാഷണം മായ്ക്കുക',
      'chat.export': 'കയറ്റുമതി',
      'chat.language': 'ഭാഷ',
      'chat.thinking': 'ചിന്തിക്കുന്നു...',
      'chat.error': 'സന്ദേശം അയയ്ക്കാനുണ്ടായ പിഴവ്. വീണ്ടും ശ്രമിക്കുക.',

      // Document Types
      'doc.passport': 'പാസ്പോർട്ട്',
      'doc.driving_license': 'ഡ്രൈവിംഗ് ലൈസൻസ്',
      'doc.kyc': 'കെവൈസി',
      'doc.aadhaar': 'ആധാർ',
      'doc.pan': 'പാൻ',

      // Document Status
      'status.pending': 'പെൻഡിങ്ങ്',
      'status.submitted': 'സമർപ്പിച്ച',
      'status.verified': 'സ്ഥിരീകരിച്ച',
      'status.expired': 'കാലാവധി കഴിഞ്ഞ',

      // Procedures
      'proc.passport_renewal': 'പാസ്പോർട്ട് പുതുക്കൽ',
      'proc.kyc_verification': 'കെവൈസി സ്ഥിരീകരണം',
      'proc.address_update': 'വിലാസ അപ്ഡേറ്റ്',
      'proc.document_verification': 'പ്രമാണം സ്ഥിരീകരണം',
      'proc.form_submission': 'ഫോം സമർപ്പണം',

      // Common Questions
      'faq.what_documents': 'എനിക്ക് ഏത് പ്രമാണങ്ങൾ ആവശ്യമാണ്?',
      'faq.how_to_renew': 'എന്റെ പാസ്പോർട്ട് നന്നാക്കുന്നത് എങ്ങനെ?',
      'faq.verification_failed': 'എന്റെ സ്ഥിരീകരണം വിജയിക്കാതെ പോയത് എന്ത്?',
      'faq.how_long': 'ഇതിന് എത്ര സമയമെടുക്കും?',
      'faq.where_to_apply': 'ഞാൻ എവിടെ അപേക്ഷിക്കണം?',

      // Tips and Hints
      'tip.clear_documents': 'എല്ലാ പ്രമാണ പകർപ്പുകളും വ്യക്തവും വായനയോഗ്യവുമായിരിക്കണം',
      'tip.valid_address': 'നിങ്ങളുടെ വിലാസം അപ്ഡേറ്റ് ചെയ്തിരിക്കുന്നത് ഉറപ്പാക്കുക',
      'tip.keep_originals': 'യഥാർത്ഥ പ്രമാണങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കുക',
      'tip.visit_office': 'സഹായത്തിനായി നിങ്ങൾ ഏറ്റവും അടുത്ത ഓഫീസിലേക്ക് പോകാം',

      // Messages
      'msg.welcome': 'സ്വാഗതം! ഞാൻ നിങ്ങളുടെ ഭാരത ഐഡി സഹായി. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
      'msg.help': 'നിങ്ങൾ എന്നോട് ചോദിക്കാം:\n• പാസ്പോർട്ട് പുതുക്കൽ\n• കെവൈസി സ്ഥിരീകരണം\n• പ്രമാണ ആവശ്യകതകൾ\n• സ്ഥിരീകരണ പ്രശ്നങ്ങൾ\n• ഫോം നിരപൂരണം',
      'msg.processing': 'നിങ്ങളുടെ അഭ്യർത്ഥന പ്രോസസ് ചെയ്യുകയാണ്...',
      'msg.no_context': 'മികച്ച ഉത്തരത്തിനായി കൂടുതൽ വിശദാംശങ്ങൾ നൽകുക.',

      // Buttons
      'btn.explain_procedure': 'നടപടിക്രമം വിശദീകരിക്കുക',
      'btn.suggest_documents': 'പ്രമാണങ്ങൾ നിർദ്ദേശിക്കുക',
      'btn.explain_error': 'പിഴവ് വിശദീകരിക്കുക',
      'btn.get_help': 'സഹായം നേടുക',
      'btn.submit': 'സമർപ്പിക്കുക',
      'btn.cancel': 'റദ്ദാക്കുക',

      // Errors
      'error.network': 'നെറ്റ്വർക്ക് പിഴവ്. ദയവായി നിങ്ങളുടെ കണക്ഷൻ പരിശോധിക്കുക.',
      'error.invalid_input': 'അസാധുവായ ഇൻപുട്ട്. വീണ്ടും ശ്രമിക്കുക.',
      'error.server_error': 'സെർവർ പിഴവ്. പിന്നീട് ശ്രമിക്കുക.',
      'error.not_found': 'വിവരങ്ങൾ കണ്ടെത്താനായില്ല.',

      // Form Fields
      'form.document_type': 'പ്രമാണ തരം',
      'form.upload': 'പ്രമാണം അപ്‌ലോഡ് ചെയ്യുക',
      'form.select': 'തിരഞ്ഞെടുക്കുക',
      'form.required': 'ഈ ഫീൽഡ് ആവശ്യമാണ്',
      'form.invalid': 'അസാധുവായ ഇൻപുട്ട്',
      'form.confirmation': 'നിങ്ങൾ സ്ഥിരീകരിച്ചതാണോ?',
    };
  }
}

// Export singleton instance
export const languageManager = new LanguageManager();
