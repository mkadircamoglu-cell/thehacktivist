/* ============================================= */
/*        ADMIN PANELİ ANA YÖNETİM MODÜLÜ        */
/* ============================================= */

const AdminPanel = (function () {

    'use strict';

    /* ========================================= */
    /*              ELEMENT REFERANSLARI           */
    /* ========================================= */

    const elements = {
        // Genel Özelleştirme
        username:       () => document.getElementById('input-username'),
        description:    () => document.getElementById('input-description'),
        avatarURL:      () => document.getElementById('input-avatar-url'),
        location:       () => document.getElementById('input-location'),
        youtubeID:      () => document.getElementById('input-youtube-id'),
        opacity:        () => document.getElementById('input-opacity'),
        opacityValue:   () => document.getElementById('opacity-value'),
        blur:           () => document.getElementById('input-blur'),
        blurValue:      () => document.getElementById('blur-value'),
        overlayEffect:  () => document.getElementById('input-overlay-effect'),
        titleEffect:    () => document.getElementById('input-title-effect'),
        avatarEffect:   () => document.getElementById('input-avatar-effect'),

        // Glow Toggle'ları
        glowUsername:   () => document.getElementById('toggle-glow-username'),
        glowSocials:    () => document.getElementById('toggle-glow-socials'),
        glowBadges:     () => document.getElementById('toggle-glow-badges'),

        // Renk Özelleştirme
        accentColor:    () => document.getElementById('input-accent-color'),
        pickerAccent:   () => document.getElementById('picker-accent-color'),
        textColor:      () => document.getElementById('input-text-color'),
        pickerText:     () => document.getElementById('picker-text-color'),
        bgColor:        () => document.getElementById('input-bg-color'),
        pickerBg:       () => document.getElementById('picker-bg-color'),
        iconColor:      () => document.getElementById('input-icon-color'),
        pickerIcon:     () => document.getElementById('picker-icon-color'),
        gradientToggle: () => document.getElementById('toggle-gradient'),
        primaryColor:   () => document.getElementById('input-primary-color'),
        pickerPrimary:  () => document.getElementById('picker-primary-color'),
        secondaryColor: () => document.getElementById('input-secondary-color'),
        pickerSecondary:() => document.getElementById('picker-secondary-color'),
        gradientColors: () => document.getElementById('gradient-colors'),
        gradientPreview:() => document.getElementById('gradient-preview'),

        // Diğer Özelleştirmeler
        monochrome:     () => document.getElementById('toggle-monochrome'),
        soundControl:   () => document.getElementById('toggle-sound-control'),
        animatedTitle:  () => document.getElementById('toggle-animated-title'),
        changeBoxColors:() => document.getElementById('toggle-change-box-colors'),

        // Sosyal Medya
        socialTelegram: () => document.getElementById('social-telegram'),
        socialGithub:   () => document.getElementById('social-github'),
        socialMail:     () => document.getElementById('social-mail'),
        socialWeb:      () => document.getElementById('social-web')
    };

    /* ========================================= */
    /*              BAŞLATMA (INIT)                */
    /* ========================================= */

    function init() {
        console.log('[AdminPanel] Panel başlatılıyor...');

        bindSliderEvents();
        bindColorSyncEvents();
        bindGradientToggle();
        bindGradientPreview();
        loadExistingConfig();

        console.log('[AdminPanel] Panel hazır.');
    }

    /* ========================================= */
    /*          SLIDER OLAYLARI                   */
    /* ========================================= */

    function bindSliderEvents() {
        // Opaklık slider
        const opacitySlider = elements.opacity();
        const opacityLabel = elements.opacityValue();
        if (opacitySlider && opacityLabel) {
            opacitySlider.addEventListener('input', function () {
                opacityLabel.textContent = this.value + '%';
            });
        }

        // Bulanıklık slider
        const blurSlider = elements.blur();
        const blurLabel = elements.blurValue();
        if (blurSlider && blurLabel) {
            blurSlider.addEventListener('input', function () {
                blurLabel.textContent = this.value + 'px';
            });
        }
    }

    /* ========================================= */
    /*      RENK SEÇİCİ ↔ TEXT INPUT SYNC         */
    /* ========================================= */

    function bindColorSyncEvents() {
        const colorPairs = [
            { picker: 'pickerAccent',    input: 'accentColor' },
            { picker: 'pickerText',      input: 'textColor' },
            { picker: 'pickerBg',        input: 'bgColor' },
            { picker: 'pickerIcon',      input: 'iconColor' },
            { picker: 'pickerPrimary',   input: 'primaryColor' },
            { picker: 'pickerSecondary', input: 'secondaryColor' }
        ];

        colorPairs.forEach(function (pair) {
            const picker = elements[pair.picker]();
            const input = elements[pair.input]();

            if (!picker || !input) return;

            // Picker değişince → text input güncelle
            picker.addEventListener('input', function () {
                input.value = this.value;
                updateGradientPreview();
            });

            // Text input değişince → picker güncelle
            input.addEventListener('input', function () {
                const val = this.value.trim();
                if (isValidHex(val)) {
                    picker.value = val;
                    updateGradientPreview();
                }
            });

            // Text input blur olunca # ekle
            input.addEventListener('blur', function () {
                let val = this.value.trim();
                if (val && !val.startsWith('#')) {
                    val = '#' + val;
                    this.value = val;
                    if (isValidHex(val)) {
                        picker.value = val;
                    }
                }
            });
        });
    }

    /* ========================================= */
    /*         GRADYAN TOGGLE YÖNETİMİ            */
    /* ========================================= */

    function bindGradientToggle() {
        const toggle = elements.gradientToggle();
        const colorsGroup = elements.gradientColors();

        if (!toggle || !colorsGroup) return;

        // İlk durum
        updateGradientGroupState(toggle.checked);

        toggle.addEventListener('change', function () {
            updateGradientGroupState(this.checked);
        });
    }

    function updateGradientGroupState(enabled) {
        const colorsGroup = elements.gradientColors();
        if (!colorsGroup) return;

        if (enabled) {
            colorsGroup.classList.remove('disabled');
        } else {
            colorsGroup.classList.add('disabled');
        }
    }

    /* ========================================= */
    /*        GRADYAN ÖNİZLEME GÜNCELLEMESİ       */
    /* ========================================= */

    function bindGradientPreview() {
        const inputs = [
            elements.primaryColor(),
            elements.pickerPrimary(),
            elements.secondaryColor(),
            elements.pickerSecondary(),
            elements.gradientToggle()
        ];

        inputs.forEach(function (el) {
            if (!el) return;
            el.addEventListener('input', updateGradientPreview);
            el.addEventListener('change', updateGradientPreview);
        });

        // İlk yükleme
        updateGradientPreview();
    }

    function updateGradientPreview() {
        const preview = elements.gradientPreview();
        const toggle = elements.gradientToggle();
        if (!preview) return;

        const primary = getColorValue('primaryColor', 'pickerPrimary', '#1a1a2e');
        const secondary = getColorValue('secondaryColor', 'pickerSecondary', '#16213e');

        if (toggle && toggle.checked) {
            preview.style.background = `linear-gradient(135deg, ${primary}, ${secondary})`;
        } else {
            preview.style.background = primary;
        }
    }

    /* ========================================= */
    /*     MEVCUT CONFIG'İ YÜKLEME (OPSIYONEL)     */
    /* ========================================= */

    function loadExistingConfig() {
        fetch('config.json', { cache: 'no-cache' })
            .then(function (response) {
                if (!response.ok) throw new Error('config.json bulunamadı');
                return response.json();
            })
            .then(function (config) {
                populateForm(config);
                Toast.show('Mevcut config.json yüklendi.', 'info');
                console.log('[AdminPanel] Mevcut config yüklendi.');
            })
            .catch(function (err) {
                console.log('[AdminPanel] Mevcut config yok, boş form gösteriliyor:', err.message);
            });
    }

    /* ========================================= */
    /*     CONFIG VERİSİNDEN FORMU DOLDURMA        */
    /* ========================================= */

    function populateForm(config) {
        if (!config) return;

        // --- Profil ---
        const p = config.profile || {};
        setVal('username', p.username);
        setVal('description', p.description);
        setVal('avatarURL', p.avatarURL);
        setVal('location', p.location);

        // --- Arka Plan ---
        const bg = config.background || {};
        setVal('youtubeID', bg.youtubeVideoID);
        setSelected('overlayEffect', bg.overlayEffect);

        // --- Görünüm ---
        const a = config.appearance || {};

        // Opaklık slider
        const opSlider = elements.opacity();
        const opLabel = elements.opacityValue();
        if (opSlider && a.profileOpacity !== undefined) {
            const opPercent = Math.round(a.profileOpacity * 100);
            opSlider.value = opPercent;
            if (opLabel) opLabel.textContent = opPercent + '%';
        }

        // Bulanıklık slider
        const blSlider = elements.blur();
        const blLabel = elements.blurValue();
        if (blSlider && a.profileBlur !== undefined) {
            blSlider.value = a.profileBlur;
            if (blLabel) blLabel.textContent = a.profileBlur + 'px';
        }

        // Renkler
        setColorPair('accentColor', 'pickerAccent', a.accentColor);
        setColorPair('textColor', 'pickerText', a.textColor);
        setColorPair('bgColor', 'pickerBg', a.backgroundColor);
        setColorPair('iconColor', 'pickerIcon', a.iconColor);
        setColorPair('primaryColor', 'pickerPrimary', a.primaryColor);
        setColorPair('secondaryColor', 'pickerSecondary', a.secondaryColor);

        // Gradyan toggle
        const gradToggle = elements.gradientToggle();
        if (gradToggle && a.gradientEnabled !== undefined) {
            gradToggle.checked = a.gradientEnabled;
            updateGradientGroupState(a.gradientEnabled);
        }

        // --- Efektler ---
        const ef = config.effects || {};
        setSelected('titleEffect', ef.titleEffect);
        setSelected('avatarEffect', ef.avatarEffect);
        setChecked('glowUsername', ef.glowUsername);
        setChecked('glowSocials', ef.glowSocials);
        setChecked('glowBadges', ef.glowBadges);
        setChecked('animatedTitle', ef.animatedTitle);
        setChecked('changeBoxColors', ef.changeBoxColors);

        // --- Ses ---
        const au = config.audio || {};
        setChecked('soundControl', au.soundControl);

        // --- İkonlar ---
        const ic = config.icons || {};
        setChecked('monochrome', ic.monochrome);

        // --- Sosyal Medya ---
        const socials = config.socials || [];
        populateSocials(socials);

        // Gradyan önizlemeyi güncelle
        updateGradientPreview();
    }

    /**
     * Sosyal medya inputlarını doldurur
     */
    function populateSocials(socials) {
        // Tüm sosyal inputları temizle
        const socialInputs = {
            telegram: elements.socialTelegram(),
            github: elements.socialGithub(),
            mail: elements.socialMail(),
            web: elements.socialWeb()
        };

        // Önce hepsini sıfırla
        Object.values(socialInputs).forEach(function (input) {
            if (input) input.value = '';
        });

        // Config'den doldur
        socials.forEach(function (social) {
            if (!social.platform || !social.url) return;

            const input = socialInputs[social.platform];
            if (input) {
                input.value = social.url;
            }
        });
    }

    /* ========================================= */
    /*     FORMDAN CONFIG OBJESİ OLUŞTURMA        */
    /* ========================================= */

    function buildConfig() {
        const config = {
            profile: {
                username:   getVal('username') || 'Kullanıcı',
                description: getVal('description') || '',
                location:   getVal('location') || '',
                avatarURL:  getVal('avatarURL') || 'assets/images/default-avatar.png'
            },
            background: {
                youtubeVideoID: getVal('youtubeID') || '',
                overlayEffect:  getSelected('overlayEffect') || 'none'
            },
            appearance: {
                profileOpacity:   parseFloat((getSliderVal('opacity') / 100).toFixed(2)),
                profileBlur:      parseInt(getSliderVal('blur'), 10),
                gradientEnabled:  getChecked('gradientToggle'),
                primaryColor:     getColorValue('primaryColor', 'pickerPrimary', '#1a1a2e'),
                secondaryColor:   getColorValue('secondaryColor', 'pickerSecondary', '#16213e'),
                accentColor:      getColorValue('accentColor', 'pickerAccent', '#e94560'),
                textColor:        getColorValue('textColor', 'pickerText', '#ffffff'),
                backgroundColor:  getColorValue('bgColor', 'pickerBg', '#0f0f0f'),
                iconColor:        getColorValue('iconColor', 'pickerIcon', '#ffffff')
            },
            effects: {
                animatedTitle:  getChecked('animatedTitle'),
                titleEffect:    getSelected('titleEffect') || 'none',
                glowUsername:   getChecked('glowUsername'),
                glowSocials:    getChecked('glowSocials'),
                glowBadges:     getChecked('glowBadges'),
                avatarEffect:   getSelected('avatarEffect') || 'none',
                changeBoxColors: getChecked('changeBoxColors')
            },
            audio: {
                soundControl: getChecked('soundControl')
            },
            icons: {
                monochrome: getChecked('monochrome')
            },
            socials: buildSocialsArray()
        };

        return config;
    }

    /**
     * Sosyal medya inputlarından array oluşturur
     */
    function buildSocialsArray() {
        const platforms = [
            { key: 'socialTelegram', platform: 'telegram', icon: 'assets/icons/telegram.svg' },
            { key: 'socialGithub',   platform: 'github',   icon: 'assets/icons/github.svg' },
            { key: 'socialMail',     platform: 'mail',     icon: 'assets/icons/mail.svg' },
            { key: 'socialWeb',      platform: 'web',      icon: 'assets/icons/web.svg' }
        ];

        const result = [];

        platforms.forEach(function (item) {
            const input = elements[item.key]();
            const url = input ? input.value.trim() : '';

            if (url !== '') {
                result.push({
                    platform: item.platform,
                    url: url,
                    icon: item.icon
                });
            }
        });

        return result;
    }

    /* ========================================= */
    /*          YARDIMCI FONKSİYONLAR              */
    /* ========================================= */

    /** Text / Textarea değerini okur */
    function getVal(key) {
        const el = elements[key]();
        return el ? el.value.trim() : '';
    }

    /** Text / Textarea'ya değer yazar */
    function setVal(key, value) {
        const el = elements[key]();
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /** Select değerini okur */
    function getSelected(key) {
        const el = elements[key]();
        return el ? el.value : '';
    }

    /** Select'e değer yazar */
    function setSelected(key, value) {
        const el = elements[key]();
        if (el && value !== undefined && value !== null) {
            el.value = value;
        }
    }

    /** Checkbox durumunu okur */
    function getChecked(key) {
        const el = elements[key]();
        return el ? el.checked : false;
    }

    /** Checkbox durumunu yazar */
    function setChecked(key, value) {
        const el = elements[key]();
        if (el && value !== undefined) {
            el.checked = !!value;
        }
    }

    /** Slider (range) değerini okur */
    function getSliderVal(key) {
        const el = elements[key]();
        return el ? parseInt(el.value, 10) : 0;
    }

    /** Renk değerini text input veya picker'dan okur */
    function getColorValue(inputKey, pickerKey, fallback) {
        const input = elements[inputKey]();
        const picker = elements[pickerKey]();

        if (input && input.value.trim() !== '' && isValidHex(input.value.trim())) {
            return input.value.trim();
        }

        if (picker) {
            return picker.value;
        }

        return fallback;
    }

    /** Renk çiftini (text + picker) birlikte doldurur */
    function setColorPair(inputKey, pickerKey, value) {
        if (!value) return;

        const input = elements[inputKey]();
        const picker = elements[pickerKey]();

        if (input) input.value = value;
        if (picker) picker.value = value;
    }

    /** Hex renk kodu doğrulama */
    function isValidHex(str) {
        return /^#[0-9A-Fa-f]{6}$/.test(str);
    }

    /* ========================================= */
    /*            PUBLIC API                       */
    /* ========================================= */

    return {
        init,
        buildConfig,
        populateForm,
        elements
    };

})();


/* ============================================= */
/*            TOAST BİLDİRİM SİSTEMİ             */
/* ============================================= */

const Toast = (function () {

    const DURATION = 3500; // ms

    /**
     * Toast bildirimi gösterir
     * @param {string} message - Mesaj metni
     * @param {string} type - "success", "error", "info"
     */
    function show(message, type) {
        type = type || 'info';

        const container = document.getElementById('toast-container');
        if (!container) return;

        // Toast elemanı oluştur
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;

        // İkon seç
        const iconMap = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML =
            '<span class="toast-icon">' + (iconMap[type] || 'ℹ') + '</span>' +
            '<span class="toast-message">' + escapeHTML(message) + '</span>';

        container.appendChild(toast);

        // Otomatik kaldırma
        setTimeout(function () {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', function () {
                toast.remove();
            }, { once: true });

            // Fallback
            setTimeout(function () {
                if (toast.parentNode) toast.remove();
            }, 500);
        }, DURATION);
    }

    /**
     * HTML injection koruması
     */
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return {
        show
    };

})();


/* ============================================= */
/*         SAYFA YÜKLENME TETİKLEYİCİ             */
/* ============================================= */

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AdminPanel.init);
    } else {
        AdminPanel.init();
    }
})();