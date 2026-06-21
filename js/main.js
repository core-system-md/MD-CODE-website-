/**
 * THE MD CODE - Main JavaScript Engine
 */

// ============================================
// SUPABASE
// ============================================
const SUPABASE_URL = 'https://fcelaqzradnxhuupzfuf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZWxhcXpyYWRueGh1dXB6ZnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODM0OTMsImV4cCI6MjA5NzU1OTQ5M30.PSjR4oBM8ioU0ezyIzDl3YnE_FMOPl-giLWeYxm8oZ4';

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ============================================
// WHATSAPP HELPER (للتواصل فقط)
// ============================================
const WhatsAppAlert = {
    PHONE: '962786595990',
    
    sendContact(data) {
        const msg = `*رسالة جديدة - THE MD CODE* 📩

*الاسم:* ${data.name}
*الإيميل:* ${data.email || '—'}
*الهاتف:* ${data.phone || '—'}

*الرسالة:*
${data.message}

*التاريخ:* ${new Date().toLocaleString('ar-SA')}`;
        
        window.open(`https://wa.me/${this.PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    }
};

// ============================================
// I18N
// ============================================
const I18N = {
    currentLang: localStorage.getItem('mdcode-lang') || 'ar',

    init() {
        this.applyLanguage(this.currentLang);
        this.setupToggle();
    },

    setupToggle() {
        document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLanguage(e.target.dataset.lang);
            });
        });
    },

    switchLanguage(lang) {
        if (lang === this.currentLang) return;
        this.currentLang = lang;
        localStorage.setItem('mdcode-lang', lang);
        this.applyLanguage(lang);
    },

    applyLanguage(lang) {
        document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        document.querySelectorAll('.lang-ar').forEach(el => el.style.display = lang === 'ar' ? '' : 'none');
        document.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
    }
};

// ============================================
// FORM HANDLERS
// ============================================
const FormHandler = {
    init() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }

        document.querySelectorAll('.lead-form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleLeadSubmit(e));
        });

        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        }
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    validatePhone(phone) {
        return /^[+]?[\d\s\-()]{7,20}$/.test(phone);
    },

    showFieldError(input, message) {
        const existing = input.parentElement.querySelector('.field-error');
        if (existing) existing.remove();
        const error = document.createElement('span');
        error.className = 'field-error';
        error.style.cssText = 'color: #e74c3c; font-size: 0.8rem; margin-top: 0.25rem; display: block;';
        error.textContent = message;
        input.parentElement.appendChild(error);
        input.style.borderColor = '#e74c3c';
    },

    clearFieldError(input) {
        const existing = input.parentElement.querySelector('.field-error');
        if (existing) existing.remove();
        input.style.borderColor = '';
    },

    async handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        let valid = true;
        const name = form.querySelector('[name="name"]');
        const email = form.querySelector('[name="email"]');
        const phone = form.querySelector('[name="phone"]');
        const message = form.querySelector('[name="message"]');

        if (!name.value.trim()) { this.showFieldError(name, 'هذا الحقل مطلوب'); valid = false; }
        else this.clearFieldError(name);

        if (email.value && !this.validateEmail(email.value)) {
            this.showFieldError(email, 'البريد الإلكتروني غير صالح'); valid = false;
        } else this.clearFieldError(email);

        if (phone.value && !this.validatePhone(phone.value)) {
            this.showFieldError(phone, 'رقم الهاتف غير صالح'); valid = false;
        } else this.clearFieldError(phone);

        if (!message.value.trim()) { this.showFieldError(message, 'هذا الحقل مطلوب'); valid = false; }
        else this.clearFieldError(message);

        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        try {
            if (!supabaseClient) throw new Error('Supabase not initialized');

            const { error } = await supabaseClient
                .from('contacts')
                .insert([{
                    name: name.value.trim(),
                    phone: phone.value.trim(),
                    email: email.value.trim(),
                    message: message.value.trim(),
                    submitted_lang: I18N.currentLang
                }]);

            if (error) throw error;

            // ✅ فتح واتساب تلقائياً
            WhatsAppAlert.sendContact({
                name: name.value.trim(),
                email: email.value.trim(),
                phone: phone.value.trim(),
                message: message.value.trim()
            });

            // ✅ رسالة نجاح واضحة
            this.showSuccess(form, '✅ تم إرسال رسالتك بنجاح! سوف نتواصل معك في أقرب وقت. جاري فتح واتساب...');
            form.reset();

        } catch (err) {
            console.error('Contact form error:', err);
            this.showError(form, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    async handleLeadSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        const name = form.querySelector('[name="name"]');
        const phone = form.querySelector('[name="phone"]');
        const email = form.querySelector('[name="email"]');
        const source = form.querySelector('[name="source_assessment"]');

        let valid = true;
        if (!name.value.trim()) { this.showFieldError(name, 'هذا الحقل مطلوب'); valid = false; }
        else this.clearFieldError(name);

        if (phone.value && !this.validatePhone(phone.value)) {
            this.showFieldError(phone, 'رقم الهاتف غير صالح'); valid = false;
        } else this.clearFieldError(phone);

        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        try {
            if (!supabaseClient) throw new Error('Supabase not initialized');

            const rawData = {};
            form.querySelectorAll('input, select, textarea').forEach(field => {
                if (field.name) rawData[field.name] = field.value;
            });

            const { error } = await supabaseClient
                .from('leads')
                .insert([{
                    name: name.value.trim(),
                    phone: phone.value.trim(),
                    email: email ? email.value.trim() : null,
                    source_assessment: source ? source.value : null,
                    raw_data: rawData,
                    submitted_lang: I18N.currentLang
                }]);

            if (error) throw error;

            this.showSuccess(form, '✅ تم الإرسال بنجاح!');
            form.reset();
        } catch (err) {
            console.error('Lead form error:', err);
            this.showError(form, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    async handleBookingSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        const name = form.querySelector('[name="name"]');
        const phone = form.querySelector('[name="phone"]');
        const email = form.querySelector('[name="email"]');
        const clinic = form.querySelector('[name="clinic_name"]');

        let valid = true;
        if (!name.value.trim()) { this.showFieldError(name, 'هذا الحقل مطلوب'); valid = false; }
        else this.clearFieldError(name);

        if (!phone.value.trim()) { this.showFieldError(phone, 'هذا الحقل مطلوب'); valid = false; }
        else this.clearFieldError(phone);

        if (!valid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        try {
            if (!supabaseClient) throw new Error('Supabase not initialized');

            const { error } = await supabaseClient
                .from('leads')
                .insert([{
                    name: name.value.trim(),
                    phone: phone.value.trim(),
                    email: email ? email.value.trim() : null,
                    source_assessment: 'Diagnostic Consultation Booking',
                    raw_data: { clinic_name: clinic ? clinic.value : '' },
                    submitted_lang: I18N.currentLang
                }]);

            if (error) throw error;

            this.showSuccess(form, '✅ تم الإرسال بنجاح!');
            form.reset();
        } catch (err) {
            console.error('Booking form error:', err);
            this.showError(form, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    },

    showSuccess(form, message) {
        const existing = form.parentElement.querySelector('.form-alert');
        if (existing) existing.remove();

        const alert = document.createElement('div');
        alert.className = 'form-alert';
        alert.style.cssText = 'background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px; margin-top: 1rem; text-align: center; font-weight: 600;';
        alert.textContent = message;
        form.parentElement.appendChild(alert);

        setTimeout(() => alert.remove(), 8000);
    },

    showError(form, message) {
        const existing = form.parentElement.querySelector('.form-alert');
        if (existing) existing.remove();

        const alert = document.createElement('div');
        alert.className = 'form-alert';
        alert.style.cssText = 'background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 12px; margin-top: 1rem; text-align: center; font-weight: 600;';
        alert.textContent = message;
        form.parentElement.appendChild(alert);

        setTimeout(() => alert.remove(), 5000);
    }
};

// ============================================
// TABS SYSTEM
// ============================================
const TabSystem = {
    init() {
        document.querySelectorAll('.tab-nav').forEach(nav => {
            const buttons = nav.querySelectorAll('.tab-btn');
            const panels = document.querySelectorAll('.tab-panel');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.tab;
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
                });
            });
        });
    }
};

// ============================================
// DOWNLOAD GATE (Supabase فقط - بدون واتساب)
// ============================================
const DownloadGate = {
    COUNTRIES: [
        { code: 'JO', name: 'الأردن', flag: '🇯🇴', dial: '+962', regex: /^7[789]\d{7}$/, len: 9 },
        { code: 'SA', name: 'السعودية', flag: '🇸🇦', dial: '+966', regex: /^5\d{8}$/, len: 9 },
        { code: 'AE', name: 'الإمارات', flag: '🇦🇪', dial: '+971', regex: /^5\d{8}$/, len: 9 },
        { code: 'KW', name: 'الكويت', flag: '🇰🇼', dial: '+965', regex: /^[569]\d{7}$/, len: 8 },
        { code: 'QA', name: 'قطر', flag: '🇶🇦', dial: '+974', regex: /^[357]\d{7}$/, len: 8 },
        { code: 'BH', name: 'البحرين', flag: '🇧🇭', dial: '+973', regex: /^[356]\d{7}$/, len: 8 },
        { code: 'OM', name: 'عُمان', flag: '🇴🇲', dial: '+968', regex: /^[79]\d{7}$/, len: 8 },
        { code: 'EG', name: 'مصر', flag: '🇪🇬', dial: '+20', regex: /^1[0125]\d{8}$/, len: 10 },
        { code: 'IQ', name: 'العراق', flag: '🇮🇶', dial: '+964', regex: /^7[789]\d{8}$/, len: 10 },
        { code: 'LB', name: 'لبنان', flag: '🇱🇧', dial: '+961', regex: /^[378]\d{6,7}$/, len: 7 },
        { code: 'PS', name: 'فلسطين', flag: '🇵🇸', dial: '+970', regex: /^5\d{7}$/, len: 8 },
        { code: 'YE', name: 'اليمن', flag: '🇾🇪', dial: '+967', regex: /^7[789]\d{7}$/, len: 9 },
        { code: 'MA', name: 'المغرب', flag: '🇲🇦', dial: '+212', regex: /^[67]\d{8}$/, len: 9 },
        { code: 'TN', name: 'تونس', flag: '🇹🇳', dial: '+216', regex: /^[259]\d{7}$/, len: 8 },
        { code: 'DZ', name: 'الجزائر', flag: '🇩🇿', dial: '+213', regex: /^[567]\d{8}$/, len: 9 },
        { code: 'LY', name: 'ليبيا', flag: '🇱🇾', dial: '+218', regex: /^9[12]\d{7}$/, len: 9 },
        { code: 'SD', name: 'السودان', flag: '🇸🇩', dial: '+249', regex: /^[19]\d{8}$/, len: 9 },
        { code: 'MR', name: 'موريتانيا', flag: '🇲🇷', dial: '+222', regex: /^[234]\d{7}$/, len: 8 },
        { code: 'SO', name: 'الصومال', flag: '🇸🇴', dial: '+252', regex: /^[567]\d{7}$/, len: 8 },
        { code: 'DJ', name: 'جيبوتي', flag: '🇩🇯', dial: '+253', regex: /^[78]\d{6}$/, len: 7 },
        { code: 'TR', name: 'تركيا', flag: '🇹🇷', dial: '+90', regex: /^5\d{9}$/, len: 10 },
        { code: 'IR', name: 'إيران', flag: '🇮🇷', dial: '+98', regex: /^9\d{9}$/, len: 10 },
        { code: 'IL', name: 'إسرائيل', flag: '🇮🇱', dial: '+972', regex: /^5\d{8}$/, len: 9 },
        { code: 'DE', name: 'ألمانيا', flag: '🇩🇪', dial: '+49', regex: /^1\d{10,11}$/, len: 11 },
        { code: 'FR', name: 'فرنسا', flag: '🇫🇷', dial: '+33', regex: /^[67]\d{8}$/, len: 9 },
        { code: 'IT', name: 'إيطاليا', flag: '🇮🇹', dial: '+39', regex: /^3\d{9,10}$/, len: 10 },
        { code: 'ES', name: 'إسبانيا', flag: '🇪🇸', dial: '+34', regex: /^[67]\d{8}$/, len: 9 },
        { code: 'NL', name: 'هولندا', flag: '🇳🇱', dial: '+31', regex: /^6\d{8}$/, len: 9 },
        { code: 'BE', name: 'بلجيكا', flag: '🇧🇪', dial: '+32', regex: /^4\d{8}$/, len: 9 },
        { code: 'AT', name: 'النمسا', flag: '🇦🇹', dial: '+43', regex: /^6\d{8,9}$/, len: 9 },
        { code: 'PT', name: 'البرتغال', flag: '🇵🇹', dial: '+351', regex: /^9\d{8}$/, len: 9 },
        { code: 'SE', name: 'السويد', flag: '🇸🇪', dial: '+46', regex: /^7\d{8,9}$/, len: 9 },
        { code: 'DK', name: 'الدنمارك', flag: '🇩🇰', dial: '+45', regex: /^[234567]\d{7}$/, len: 8 },
        { code: 'FI', name: 'فنلندا', flag: '🇫🇮', dial: '+358', regex: /^4\d{8}$/, len: 9 },
        { code: 'IE', name: 'أيرلندا', flag: '🇮🇪', dial: '+353', regex: /^8\d{8}$/, len: 9 },
        { code: 'PL', name: 'بولندا', flag: '🇵🇱', dial: '+48', regex: /^[5789]\d{8}$/, len: 9 },
        { code: 'GR', name: 'اليونان', flag: '🇬🇷', dial: '+30', regex: /^6\d{9}$/, len: 10 },
        { code: 'CZ', name: 'التشيك', flag: '🇨🇿', dial: '+420', regex: /^[7]\d{8}$/, len: 9 },
        { code: 'HU', name: 'المجر', flag: '🇭🇺', dial: '+36', regex: /^[237]\d{8}$/, len: 9 },
        { code: 'RO', name: 'رومانيا', flag: '🇷🇴', dial: '+40', regex: /^7\d{8}$/, len: 9 },
        { code: 'BG', name: 'بلغاريا', flag: '🇧🇬', dial: '+359', regex: /^8\d{8}$/, len: 9 },
        { code: 'HR', name: 'كرواتيا', flag: '🇭🇷', dial: '+385', regex: /^9\d{8}$/, len: 9 },
        { code: 'SK', name: 'سلوفاكيا', flag: '🇸🇰', dial: '+421', regex: /^9\d{8}$/, len: 9 },
        { code: 'SI', name: 'سلوفينيا', flag: '🇸🇮', dial: '+386', regex: /^[345]\d{7}$/, len: 8 },
        { code: 'LT', name: 'ليتوانيا', flag: '🇱🇹', dial: '+370', regex: /^6\d{7}$/, len: 8 },
        { code: 'LV', name: 'لاتفيا', flag: '🇱🇻', dial: '+371', regex: /^[257]\d{7}$/, len: 8 },
        { code: 'EE', name: 'إستونيا', flag: '🇪🇪', dial: '+372', regex: /^[578]\d{7}$/, len: 8 },
        { code: 'LU', name: 'لوكسمبورغ', flag: '🇱🇺', dial: '+352', regex: /^6\d{8}$/, len: 9 },
        { code: 'MT', name: 'مالطا', flag: '🇲🇹', dial: '+356', regex: /^[79]\d{7}$/, len: 8 },
        { code: 'CY', name: 'قبرص', flag: '🇨🇾', dial: '+357', regex: /^9\d{7}$/, len: 8 },
        { code: 'US', name: 'الولايات المتحدة', flag: '🇺🇸', dial: '+1', regex: /^[2-9]\d{9}$/, len: 10 },
        { code: 'CA', name: 'كندا', flag: '🇨🇦', dial: '+1', regex: /^[2-9]\d{9}$/, len: 10 },
        { code: 'MX', name: 'المكسيك', flag: '🇲🇽', dial: '+52', regex: /^1\d{10}$/, len: 11 },
        { code: 'GB', name: 'المملكة المتحدة', flag: '🇬🇧', dial: '+44', regex: /^7\d{9}$/, len: 10 },
        { code: 'CH', name: 'سويسرا', flag: '🇨🇭', dial: '+41', regex: /^7\d{8}$/, len: 9 },
        { code: 'NO', name: 'النرويج', flag: '🇳🇴', dial: '+47', regex: /^[49]\d{7}$/, len: 8 },
        { code: 'AU', name: 'أستراليا', flag: '🇦🇺', dial: '+61', regex: /^4\d{8}$/, len: 9 },
        { code: 'NZ', name: 'نيوزيلندا', flag: '🇳🇿', dial: '+64', regex: /^2\d{8,9}$/, len: 9 },
        { code: 'IN', name: 'الهند', flag: '🇮🇳', dial: '+91', regex: /^[6789]\d{9}$/, len: 10 },
        { code: 'PK', name: 'باكستان', flag: '🇵🇰', dial: '+92', regex: /^3\d{9}$/, len: 10 },
        { code: 'BD', name: 'بنغلاديش', flag: '🇧🇩', dial: '+880', regex: /^1\d{9}$/, len: 10 },
        { code: 'ZA', name: 'جنوب أفريقيا', flag: '🇿🇦', dial: '+27', regex: /^[678]\d{8}$/, len: 9 },
        { code: 'NG', name: 'نيجيريا', flag: '🇳🇬', dial: '+234', regex: /^[789]\d{9}$/, len: 10 },
        { code: 'KE', name: 'كينيا', flag: '🇰🇪', dial: '+254', regex: /^[71]\d{8}$/, len: 9 },
        { code: 'BR', name: 'البرازيل', flag: '🇧🇷', dial: '+55', regex: /^[1-9]\d{10}$/, len: 11 },
        { code: 'AR', name: 'الأرجنتين', flag: '🇦🇷', dial: '+54', regex: /^[1-9]\d{9,10}$/, len: 10 },
        { code: 'RU', name: 'روسيا', flag: '🇷🇺', dial: '+7', regex: /^[89]\d{9}$/, len: 10 },
        { code: 'CN', name: 'الصين', flag: '🇨🇳', dial: '+86', regex: /^1[3456789]\d{9}$/, len: 11 },
        { code: 'JP', name: 'اليابان', flag: '🇯🇵', dial: '+81', regex: /^[789]\d{9}$/, len: 10 },
        { code: 'KR', name: 'كوريا الجنوبية', flag: '🇰🇷', dial: '+82', regex: /^1\d{8,9}$/, len: 9 },
        { code: 'ID', name: 'إندونيسيا', flag: '🇮🇩', dial: '+62', regex: /^8\d{9,11}$/, len: 10 },
        { code: 'MY', name: 'ماليزيا', flag: '🇲🇾', dial: '+60', regex: /^1\d{8,9}$/, len: 9 },
        { code: 'SG', name: 'سنغافورة', flag: '🇸🇬', dial: '+65', regex: /^[89]\d{7}$/, len: 8 },
        { code: 'TH', name: 'تايلاند', flag: '🇹🇭', dial: '+66', regex: /^[689]\d{8}$/, len: 9 },
        { code: 'PH', name: 'الفلبين', flag: '🇵🇭', dial: '+63', regex: /^9\d{9}$/, len: 10 },
        { code: 'VN', name: 'فيتنام', flag: '🇻🇳', dial: '+84', regex: /^[35789]\d{8}$/, len: 9 },
    ],

    detectedCountry: null,

    init() {
        this.detectCountry();

        document.querySelectorAll('.gated-download').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const asset = btn.dataset.asset;

                if (sessionStorage.getItem(`downloaded_${asset}`)) {
                    this.openFile(asset);
                    return;
                }

                this.showDownloadForm(asset);
            });
        });
    },

    async detectCountry() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            this.detectedCountry = data.country_code;
        } catch (e) {
            this.detectedCountry = 'JO';
        }
    },

    showDownloadForm(asset) {
        let modal = document.getElementById('download-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'download-modal';
            modal.innerHTML = this.buildModalHTML();
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'flex';
        }

        this.fillCountrySelect();

        if (this.detectedCountry) {
            const select = modal.querySelector('[name="country_code"]');
            const option = select.querySelector(`option[data-code="${this.detectedCountry}"]`);
            if (option) select.value = option.value;
        }

        this.updatePhonePlaceholder();

        modal.querySelector('[name="country_code"]').addEventListener('change', () => this.updatePhonePlaceholder());

        const form = modal.querySelector('.download-form');
        form.onsubmit = (e) => this.handleSubmit(e, form, asset);

        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        modal.querySelector('.modal-backdrop').onclick = (e) => {
            if (e.target === modal.querySelector('.modal-backdrop')) modal.style.display = 'none';
        };

        this.applyModalLanguage();
    },

    buildModalHTML() {
        const countryOptions = this.COUNTRIES.map(c =>
            `<option value="${c.dial}" data-code="${c.code}" data-regex="${c.regex.source}" data-len="${c.len}">${c.flag} ${c.name} (${c.dial})</option>`
        ).join('');

        return `
        <div class="modal-backdrop" style="position:fixed; inset:0; background:rgba(26,37,54,0.75); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px);">
            <div class="modal-content" style="background:#F9F9F9; padding:2rem; border-radius:20px; max-width:480px; width:100%; text-align:center; box-shadow:0 25px 80px rgba(0,0,0,0.35); direction:rtl;">

                <div style="width:64px; height:64px; background:linear-gradient(135deg,#005B5C,#C5A059); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; box-shadow:0 4px 15px rgba(0,91,92,0.3);">
                    <svg width="28" height="28" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>

                <h3 style="font-size:1.35rem; font-weight:700; color:#1A2536; margin-bottom:0.4rem;">
                    <span class="lang-ar">الوصول إلى الملف</span>
                    <span class="lang-en" style="display:none">Access File</span>
                </h3>
                <p style="color:rgba(26,37,54,0.65); margin-bottom:1.5rem; font-size:0.9rem; line-height:1.5;">
                    <span class="lang-ar">أكمل بياناتك للحصول على الملف مباشرةً</span>
                    <span class="lang-en" style="display:none">Complete your details to get the file instantly</span>
                </p>

                <form class="download-form" style="display:flex; flex-direction:column; gap:0.85rem; text-align:right;">

                    <div class="form-group" style="text-align:right;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#1A2536; margin-bottom:0.3rem;">
                            <span class="lang-ar">الاسم الكامل *</span>
                            <span class="lang-en" style="display:none">Full Name *</span>
                        </label>
                        <input type="text" name="full_name" required
                            style="width:100%; padding:0.8rem 1rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.95rem; background:white; color:#1A2536; box-sizing:border-box;"
                            onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                    </div>

                    <div class="form-group" style="text-align:right;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#1A2536; margin-bottom:0.3rem;">
                            <span class="lang-ar">البريد الإلكتروني *</span>
                            <span class="lang-en" style="display:none">Email Address *</span>
                        </label>
                        <input type="email" name="email" required
                            style="width:100%; padding:0.8rem 1rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.95rem; background:white; color:#1A2536; direction:ltr; text-align:right; box-sizing:border-box;"
                            onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                    </div>

                    <div class="form-group" style="text-align:right;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#1A2536; margin-bottom:0.3rem;">
                            <span class="lang-ar">رقم الواتساب *</span>
                            <span class="lang-en" style="display:none">WhatsApp Number *</span>
                        </label>
                        <div style="display:flex; gap:0.5rem;">
                            <select name="country_code" required
                                style="padding:0.8rem 0.5rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.9rem; background:white; color:#1A2536; min-width:110px; cursor:pointer;">
                                <option value="" disabled selected>🌍 اختر الدولة</option>
                                ${countryOptions}
                                <option value="custom" data-code="CUSTOM">✏️ أخرى (يدوي)</option>
                            </select>
                            <input type="tel" name="phone" required placeholder="مثال: 78 659 5990"
                                style="flex:1; padding:0.8rem 1rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.95rem; background:white; color:#1A2536; direction:ltr; text-align:left; box-sizing:border-box;"
                                onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                        </div>
                        <div class="custom-dial-container" style="display:none; margin-top:0.5rem;">
                            <input type="text" name="custom_dial" placeholder="مثال: +123"
                                style="width:100%; padding:0.6rem 1rem; border:2px solid #E8E4E1; border-radius:8px; font-size:0.9rem; background:white; color:#1A2536; direction:ltr; box-sizing:border-box;"
                                onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                            <small style="color:#888; font-size:0.75rem; display:block; margin-top:0.2rem;">أدخل المفتاح الدولي يدوياً (مثال: +123)</small>
                        </div>
                        <small class="phone-hint" style="display:block; color:#888; font-size:0.75rem; margin-top:0.3rem;"></small>
                    </div>

                    <div class="form-group" style="text-align:right;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#1A2536; margin-bottom:0.3rem;">
                            <span class="lang-ar">اسم العيادة / المركز الطبي *</span>
                            <span class="lang-en" style="display:none">Clinic / Medical Center Name *</span>
                        </label>
                        <input type="text" name="clinic_name" required
                            style="width:100%; padding:0.8rem 1rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.95rem; background:white; color:#1A2536; box-sizing:border-box;"
                            onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                    </div>

                    <div class="form-group" style="text-align:right;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#1A2536; margin-bottom:0.3rem;">
                            <span class="lang-ar">الاختصاص *</span>
                            <span class="lang-en" style="display:none">Specialty *</span>
                        </label>
                        <input type="text" name="specialty" required
                            style="width:100%; padding:0.8rem 1rem; border:2px solid #E8E4E1; border-radius:10px; font-size:0.95rem; background:white; color:#1A2536; box-sizing:border-box;"
                            onfocus="this.style.borderColor='#005B5C'" onblur="this.style.borderColor='#E8E4E1'">
                    </div>

                    <input type="hidden" name="asset" value="">

                    <button type="submit" class="btn-gold" style="width:100%; padding:1rem; border:none; border-radius:12px; cursor:pointer; font-weight:700; font-size:1rem; margin-top:0.5rem; background:linear-gradient(135deg,#C5A059,#B08D4E); color:white;">
                        <span class="lang-ar">📥 تحميل الملف</span>
                        <span class="lang-en" style="display:none">📥 Download File</span>
                    </button>

                    <button type="button" class="close-modal" style="background:none; border:none; color:#888; cursor:pointer; font-size:0.85rem; padding:0.5rem;">
                        <span class="lang-ar">إلغاء</span>
                        <span class="lang-en" style="display:none">Cancel</span>
                    </button>
                </form>

                <div class="form-message" style="margin-top:1rem; display:none; padding:0.875rem; border-radius:10px; font-size:0.85rem; font-weight:500;"></div>
            </div>
        </div>`;
    },

    fillCountrySelect() {
        const select = document.querySelector('#download-modal [name="country_code"]');
        if (!select || select.options.length > 2) return;
        while (select.options.length > 2) select.remove(1);
        this.COUNTRIES.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.dial;
            opt.dataset.code = c.code;
            opt.dataset.regex = c.regex.source;
            opt.dataset.len = c.len;
            opt.textContent = `${c.flag} ${c.name} (${c.dial})`;
            select.insertBefore(opt, select.lastElementChild);
        });
    },

    updatePhonePlaceholder() {
        const select = document.querySelector('#download-modal [name="country_code"]');
        const input = document.querySelector('#download-modal [name="phone"]');
        const hint = document.querySelector('#download-modal .phone-hint');
        const customContainer = document.querySelector('#download-modal .custom-dial-container');
        if (!select || !input) return;

        const selected = select.options[select.selectedIndex];
        if (selected.value === 'custom') {
            customContainer.style.display = 'block';
            input.placeholder = 'أدخل الرقم مع المفتاح';
            hint.textContent = 'أدخل المفتاح الدولي يدوياً في الحقل أعلاه، ثم الرقم هنا';
            return;
        }

        customContainer.style.display = 'none';
        const len = selected.dataset.len;
        const dial = selected.value;
        let example = '';
        if (len == 7) example = '123 4567';
        else if (len == 8) example = '12 345 678';
        else if (len == 9) example = '12 345 6789';
        else if (len == 10) example = '12 345 67890';
        else if (len == 11) example = '123 456 78901';
        input.placeholder = `مثال: ${example}`;
        hint.textContent = `أدخل ${len} رقماً بعد ${dial}`;
    },

    applyModalLanguage() {
        const lang = I18N.currentLang;
        const modal = document.getElementById('download-modal');
        modal.querySelectorAll('.lang-ar').forEach(el => el.style.display = lang === 'ar' ? '' : 'none');
        modal.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
        modal.querySelector('.modal-content').style.direction = lang === 'ar' ? 'rtl' : 'ltr';
    },

    async handleSubmit(e, form, asset) {
        e.preventDefault();

        const fullName = form.querySelector('[name="full_name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const countrySelect = form.querySelector('[name="country_code"]');
        const countryCode = countrySelect.value;
        const phone = form.querySelector('[name="phone"]').value.trim().replace(/\s/g, '');
        const clinicName = form.querySelector('[name="clinic_name"]').value.trim();
        const specialty = form.querySelector('[name="specialty"]').value.trim();
        const msgDiv = document.querySelector('#download-modal .form-message');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!fullName || fullName.length < 3) {
            this.showMessage(msgDiv, 'الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            this.showMessage(msgDiv, 'الرجاء إدخال بريد إلكتروني صالح', 'error');
            return;
        }

        let fullPhone, countryName, countryCodeStr;

        if (countryCode === 'custom') {
            const customDial = form.querySelector('[name="custom_dial"]').value.trim();
            if (!customDial || !customDial.startsWith('+')) {
                this.showMessage(msgDiv, 'الرجاء إدخال مفتاح دولي صالح يبدأ بـ +', 'error');
                return;
            }
            if (!phone || phone.length < 6) {
                this.showMessage(msgDiv, 'الرجاء إدخال رقم هاتف صالح', 'error');
                return;
            }
            fullPhone = customDial + phone;
            countryName = 'أخرى';
            countryCodeStr = 'CUSTOM';
        } else {
            const selectedOption = countrySelect.selectedOptions[0];
            countryName = selectedOption.textContent.split(' ').slice(1, -1).join(' ');
            countryCodeStr = selectedOption.dataset.code;
            const regexStr = selectedOption.dataset.regex;
            const expectedLen = parseInt(selectedOption.dataset.len);
            const regex = new RegExp(regexStr);

            if (!phone || !regex.test(phone)) {
                this.showMessage(msgDiv, `رقم الواتساب غير صالح لـ ${countryName}. يجب أن يكون ${expectedLen} رقماً.`, 'error');
                return;
            }
            fullPhone = countryCode + phone;
        }

        if (!clinicName || clinicName.length < 2) {
            this.showMessage(msgDiv, 'الرجاء إدخال اسم العيادة / المركز الطبي', 'error');
            return;
        }
        if (!specialty || specialty.length < 2) {
            this.showMessage(msgDiv, 'الرجاء إدخال الاختصاص', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="lang-ar">⏳ جاري الحفظ...</span><span class="lang-en" style="display:none">⏳ Saving...</span>';

        const fileName = this.getFileName(asset);

        try {
            if (supabaseClient) {
                const { error } = await supabaseClient
                    .from('leads')
                    .insert([{
                        name: fullName,
                        phone: fullPhone,
                        email: email,
                        source_assessment: `Resource Download: ${fileName}`,
                        raw_data: {
                            asset: asset,
                            clinic_name: clinicName,
                            specialty: specialty,
                            country: countryName,
                            country_code: countryCodeStr,
                            type: 'download',
                            page: 'resources'
                        },
                        submitted_lang: I18N.currentLang
                    }]);

                if (error) throw error;
            }

            if (supabaseClient) {
                await supabaseClient.from('download_logs').insert([{
                    downloaded_asset: asset,
                    user_id: null,
                    downloaded_at: new Date().toISOString()
                }]);
            }

            sessionStorage.setItem(`downloaded_${asset}`, 'true');

            this.showMessage(msgDiv, '✅ تم الحفظ! جاري فتح الملف...', 'success');

            setTimeout(() => {
                document.getElementById('download-modal').style.display = 'none';
                this.openFile(asset);
            }, 1200);

        } catch (err) {
            console.error('Supabase error:', err);
            this.showMessage(msgDiv, '❌ حدث خطأ في الحفظ. حاول مرة أخرى.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="lang-ar">📥 تحميل الملف</span><span class="lang-en" style="display:none">📥 Download File</span>';
        }
    },

    showMessage(el, text, type) {
        el.textContent = text;
        el.style.display = 'block';
        if (type === 'error') {
            el.style.background = '#fdeaea';
            el.style.color = '#c62828';
            el.style.border = '1px solid #ef9a9a';
        } else {
            el.style.background = '#e8f5e9';
            el.style.color = '#2e7d32';
            el.style.border = '1px solid #a5d6a7';
        }
    },

    openFile(asset) {
        const fileMap = {
            'reception-manual': '/assets/downloads/reception-manual.pdf',
            'financial-manual': '/assets/downloads/financial-manual.pdf',
            'training-manual': '/assets/downloads/training-manual.pdf',
            'assessment-templates': '/assets/downloads/assessment-templates.pdf'
        };
        const filePath = fileMap[asset] || `/assets/downloads/${asset}.pdf`;
        window.open(filePath, '_blank');
    },

    getFileName(asset) {
        const names = {
            'reception-manual': 'دليل استقبال المرضى',
            'financial-manual': 'دليل التحليل المالي',
            'training-manual': 'دليل تدريب الكادر',
            'assessment-templates': 'قوالب التقييم'
        };
        return names[asset] || asset;
    }
};

// ============================================
// PRINT
// ============================================
const PrintSystem = {
    init() {
        document.querySelectorAll('.print-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.printTarget;
                const target = document.getElementById(targetId);
                if (target) {
                    this.printElement(target);
                } else {
                    window.print();
                }
            });
        });
    },

    printElement(element) {
        const printWindow = window.open('', '_blank');
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(s => s.outerHTML).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="${document.documentElement.dir}" lang="${document.documentElement.lang}">
            <head>
                <meta charset="UTF-8">
                <title>Print - THE MD CODE</title>
                ${styles}
                <style>
                    body { padding: 2rem; background: white; }
                    .no-print { display: none !important; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }
};

// ============================================
// MOBILE NAV
// ============================================
const MobileNav = {
    init() {
        const toggle = document.getElementById('mobile-nav-toggle');
        const menu = document.getElementById('mobile-nav-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }
    }
};

// ============================================
// ANIMATIONS
// ============================================
const AnimationSystem = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.glass-card, .assessment-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        const style = document.createElement('style');
        style.textContent = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
        document.head.appendChild(style);
    }
};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    I18N.init();
    FormHandler.init();
    TabSystem.init();
    DownloadGate.init();
    PrintSystem.init();
    MobileNav.init();
    AnimationSystem.init();
});

window.I18N = I18N;
window.FormHandler = FormHandler;
