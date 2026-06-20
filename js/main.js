/**
 * THE MD CODE - Main JavaScript Engine
 * Handles: i18n, RTL/LTR, Forms, Tabs, Auth Gate, Print, Supabase Sync
 */

// ============================================
// SUPABASE INITIALIZATION
// ============================================
const SUPABASE_URL = 'https://fcelaqzradnxhuupzfuf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZWxhcXpyYWRueGh1dXB6ZnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODM0OTMsImV4cCI6MjA5NzU1OTQ5M30.PSjR4oBM8ioU0ezyIzDl3YnE_FMOPl-giLWeYxm8oZ4';

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ============================================
// I18N & LANGUAGE SWITCHER
// ============================================
const I18N = {
    currentLang: localStorage.getItem('mdcode-lang') || 'ar',
    
    init() {
        this.applyLanguage(this.currentLang);
        this.setupToggle();
    },
    
    setupToggle() {
        const toggles = document.querySelectorAll('.lang-toggle-btn');
        toggles.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.switchLanguage(lang);
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
        
        document.querySelectorAll('.lang-ar').forEach(el => {
            el.style.display = lang === 'ar' ? '' : 'none';
        });
        document.querySelectorAll('.lang-en').forEach(el => {
            el.style.display = lang === 'en' ? '' : 'none';
        });
        
        document.querySelectorAll('[data-placeholder-ar]').forEach(el => {
            el.placeholder = lang === 'ar' ? el.dataset.placeholderAr : el.dataset.placeholderEn;
        });
        
        document.querySelectorAll('[data-text-ar]').forEach(el => {
            el.textContent = lang === 'ar' ? el.dataset.textAr : el.dataset.textEn;
        });
        
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    },
    
    get(key) {
        const dict = TRANSLATIONS[this.currentLang];
        return dict && dict[key] ? dict[key] : key;
    }
};

const TRANSLATIONS = {
    ar: {
        submitSuccess: 'تم الإرسال بنجاح!',
        submitError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        requiredField: 'هذا الحقل مطلوب',
        invalidEmail: 'البريد الإلكتروني غير صالح',
        invalidPhone: 'رقم الهاتف غير صالح',
        loading: 'جاري الإرسال...',
        gateTitle: 'الوصول المتميز',
        gateDesc: 'قم بتسجيل الدخول للوصول إلى هذا المحتوى الحصري.',
        gateBtn: 'تسجيل الدخول',
        printBtn: 'طباعة',
        close: 'إغلاق',
        selectOption: 'اختر...'
    },
    en: {
        submitSuccess: 'Submitted successfully!',
        submitError: 'An error occurred. Please try again.',
        requiredField: 'This field is required',
        invalidEmail: 'Invalid email address',
        invalidPhone: 'Invalid phone number',
        loading: 'Sending...',
        gateTitle: 'Premium Access',
        gateDesc: 'Please log in to access this exclusive content.',
        gateBtn: 'Log In',
        printBtn: 'Print',
        close: 'Close',
        selectOption: 'Select...'
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
        
        if (!name.value.trim()) { this.showFieldError(name, I18N.get('requiredField')); valid = false; }
        else this.clearFieldError(name);
        
        if (email.value && !this.validateEmail(email.value)) { 
            this.showFieldError(email, I18N.get('invalidEmail')); valid = false; 
        } else this.clearFieldError(email);
        
        if (phone.value && !this.validatePhone(phone.value)) { 
            this.showFieldError(phone, I18N.get('invalidPhone')); valid = false; 
        } else this.clearFieldError(phone);
        
        if (!message.value.trim()) { this.showFieldError(message, I18N.get('requiredField')); valid = false; }
        else this.clearFieldError(message);
        
        if (!valid) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = I18N.get('loading');
        
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
            
            this.showSuccess(form, I18N.get('submitSuccess'));
            form.reset();
        } catch (err) {
            console.error('Contact form error:', err);
            this.showError(form, I18N.get('submitError'));
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
        if (!name.value.trim()) { this.showFieldError(name, I18N.get('requiredField')); valid = false; }
        else this.clearFieldError(name);
        
        if (phone.value && !this.validatePhone(phone.value)) { 
            this.showFieldError(phone, I18N.get('invalidPhone')); valid = false; 
        } else this.clearFieldError(phone);
        
        if (!valid) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = I18N.get('loading');
        
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
            
            this.showSuccess(form, I18N.get('submitSuccess'));
            form.reset();
        } catch (err) {
            console.error('Lead form error:', err);
            this.showError(form, I18N.get('submitError'));
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
        if (!name.value.trim()) { this.showFieldError(name, I18N.get('requiredField')); valid = false; }
        else this.clearFieldError(name);
        
        if (!phone.value.trim()) { this.showFieldError(phone, I18N.get('requiredField')); valid = false; }
        else this.clearFieldError(phone);
        
        if (!valid) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = I18N.get('loading');
        
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
            
            this.showSuccess(form, I18N.get('submitSuccess'));
            form.reset();
        } catch (err) {
            console.error('Booking form error:', err);
            this.showError(form, I18N.get('submitError'));
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
        alert.style.cssText = 'background: #d4edda; color: #155724; padding: 1rem; border-radius: 12px; margin-top: 1rem; text-align: center;';
        alert.textContent = message;
        form.parentElement.appendChild(alert);
        
        setTimeout(() => alert.remove(), 5000);
    },
    
    showError(form, message) {
        const existing = form.parentElement.querySelector('.form-alert');
        if (existing) existing.remove();
        
        const alert = document.createElement('div');
        alert.className = 'form-alert';
        alert.style.cssText = 'background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 12px; margin-top: 1rem; text-align: center;';
        alert.textContent = message;
        form.parentElement.appendChild(alert);
        
        setTimeout(() => alert.remove(), 5000);
    }
};

// ============================================
// TABS SYSTEM (Resources Page)
// ============================================
const TabSystem = {
    init() {
        const tabNavs = document.querySelectorAll('.tab-nav');
        tabNavs.forEach(nav => {
            const buttons = nav.querySelectorAll('.tab-btn');
            const panels = document.querySelectorAll('.tab-panel');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.tab;
                    
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    panels.forEach(p => {
                        p.classList.toggle('active', p.dataset.panel === target);
                    });
                });
            });
        });
    }
};

// ============================================
// AUTH GATE (Download Protection)
// ============================================
const AuthGate = {
    async checkAuth() {
        if (!supabaseClient) return false;
        const { data: { session } } = await supabaseClient.auth.getSession();
        return !!session;
    },
    
    init() {
        document.querySelectorAll('.gated-download').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const isAuth = await this.checkAuth();
                if (!isAuth) {
                    e.preventDefault();
                    this.showGateOverlay(btn.closest('.glass-card'));
                } else {
                    this.logDownload(btn.dataset.asset);
                }
            });
        });
    },
    
    showGateOverlay(container) {
        let overlay = container.querySelector('.gate-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'gate-overlay';
            overlay.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${I18N.get('gateTitle')}</h3>
                <p style="color: rgba(26,37,54,0.7); margin-bottom: 1.5rem; max-width: 300px;">${I18N.get('gateDesc')}</p>
                <button class="btn-primary" onclick="window.location.href='../contact.html'">${I18N.get('gateBtn')}</button>
            `;
            container.style.position = 'relative';
            container.appendChild(overlay);
        }
        overlay.classList.remove('hidden');
    },
    
    async logDownload(asset) {
        if (!supabaseClient) return;
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                await supabaseClient.from('download_logs').insert([{
                    user_id: user.id,
                    downloaded_asset: asset
                }]);
            }
        } catch (err) {
            console.error('Download log error:', err);
        }
    }
};

// ============================================
// PRINT FUNCTIONALITY
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
// MOBILE NAVIGATION
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
// SMOOTH SCROLL & ANIMATIONS
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
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    I18N.init();
    FormHandler.init();
    TabSystem.init();
    AuthGate.init();
    PrintSystem.init();
    MobileNav.init();
    AnimationSystem.init();
});

window.I18N = I18N;
window.FormHandler = FormHandler;
