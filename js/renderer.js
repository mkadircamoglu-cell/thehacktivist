/* ============================================= */
/*       ANA RENDER MOTORU (DOM GÜNCELLEME)       */
/* ============================================= */

const Renderer = (function () {

    /**
     * Config verisini alıp tüm sayfayı render eder
     * @param {Object} config - Parsed config objesi
     */
    function render(config) {
        if (!config) {
            console.error('[Renderer] Config verisi bulunamadı.');
            return;
        }

        // 1. CSS değişkenlerini ayarla
        applyCSSVariables(config);
        // 2. Profil bilgilerini render et
        renderProfile(config.profile);
        // 3. Glassmorphism kutusunu ayarla
        renderGlass(config.appearance);
        // 4. Avatar efektlerini uygula
        renderAvatarEffect(config.effects);
        // 5. Başlık efektlerini uygula
        renderTitleEffect(config.effects, config.profile.username);
        // 6. Sosyal medya ikonları oluştur
        renderSocials(config.socials, config.icons, config.appearance);
        
        // 7. YEREL VİDEO SES KONTROLÜNÜ BAŞLAT (Burayı ekledik!)
        initLocalVideoSound(config.audio);
        
        // 9. Glow efektlerini uygula
        GlowManager.apply(config.effects);
        GlowManager.setGlowColor(config.appearance.accentColor);
        // 10. Kutu renk değiştirme
        renderBoxColors(config.effects.changeBoxColors);
        // 11. Blog butonunu render et
        BlogButtonRenderer.render(config);

        console.log('[Renderer] Sayfa render tamamlandı.');
    }

    /* ========================================= */
    /*        CSS DEĞİŞKENLERİNİ AYARLA          */
    /* ========================================= */

    function applyCSSVariables(config) {
        const root = document.documentElement;
        const a = config.appearance;

        root.style.setProperty('--bg-color', a.backgroundColor);
        root.style.setProperty('--text-color', a.textColor);
        root.style.setProperty('--accent-color', a.accentColor);
        root.style.setProperty('--icon-color', a.iconColor);
        root.style.setProperty('--primary-color', a.primaryColor);
        root.style.setProperty('--secondary-color', a.secondaryColor);

        // RGB versiyonları (glassmorphism için)
        root.style.setProperty('--primary-color-rgb', ConfigLoader.hexToRgb(a.primaryColor));
        root.style.setProperty('--secondary-color-rgb', ConfigLoader.hexToRgb(a.secondaryColor));
        root.style.setProperty('--accent-color-rgb', ConfigLoader.hexToRgb(a.accentColor));

        // Opaklık ve bulanıklık
        root.style.setProperty('--profile-opacity', a.profileOpacity);
        root.style.setProperty('--profile-blur', a.profileBlur + 'px');

        // Body arka plan rengi
        document.body.style.backgroundColor = a.backgroundColor;
    }

    /* ========================================= */
    /*           PROFİL BİLGİLERİ RENDER          */
    /* ========================================= */

    function renderProfile(profile) {
        // Kullanıcı adı
        const usernameEl = document.getElementById('username');
        if (usernameEl) {
            usernameEl.textContent = profile.username || 'Kullanıcı';
        }

        // Açıklama
        const descEl = document.getElementById('description');
        if (descEl) {
            descEl.textContent = profile.description || '';
        }

        // Avatar
        const avatarEl = document.getElementById('avatar');
        if (avatarEl && profile.avatarURL) {
            avatarEl.src = profile.avatarURL;
            avatarEl.onerror = function () {
                this.src = 'assets/images/default-avatar.png';
            };
        }

        // Konum
        const locationContainer = document.getElementById('location-container');
        const locationText = document.getElementById('location-text');
        if (locationContainer && locationText) {
            if (profile.location && profile.location.trim() !== '') {
                locationText.textContent = profile.location;
                locationContainer.classList.remove('hidden');
            } else {
                locationContainer.classList.add('hidden');
            }
        }
    }

    /* ========================================= */
    /*       GLASSMORPHISM KUTUSU AYARLARI         */
    /* ========================================= */

    function renderGlass(appearance) {
        const card = document.getElementById('profile-card');
        if (!card) return;

        // Gradyan aç/kapat
        if (!appearance.gradientEnabled) {
            card.classList.add('no-gradient');
        } else {
            card.classList.remove('no-gradient');
        }

        // Inline stil ile dinamik arka plan
        const opacity = appearance.profileOpacity;
        const primaryRgb = ConfigLoader.hexToRgb(appearance.primaryColor);
        const secondaryRgb = ConfigLoader.hexToRgb(appearance.secondaryColor);

        if (appearance.gradientEnabled) {
            card.style.background = `linear-gradient(135deg, rgba(${primaryRgb}, ${opacity}), rgba(${secondaryRgb}, ${opacity}))`;
        } else {
            card.style.background = `rgba(${primaryRgb}, ${opacity})`;
        }

        card.style.backdropFilter = `blur(${appearance.profileBlur}px)`;
        card.style.webkitBackdropFilter = `blur(${appearance.profileBlur}px)`;
    }

    /* ========================================= */
    /*           AVATAR EFEKTLERİ                 */
    /* ========================================= */

    function renderAvatarEffect(effects) {
        const container = document.getElementById('avatar-container');
        if (!container) return;

        // Önceki efekt sınıflarını temizle
        container.classList.remove('effect-glow', 'effect-ring-pulse', 'effect-rotate');

        const effect = effects.avatarEffect || 'none';
        if (effect !== 'none') {
            container.classList.add('effect-' + effect);
        }
    }

    /* ========================================= */
    /*           BAŞLIK (TİTLE) EFEKTLERİ         */
    /* ========================================= */

    function renderTitleEffect(effects, username) {
        const usernameEl = document.getElementById('username');
        const wrapper = document.getElementById('username-wrapper');
        if (!usernameEl || !wrapper) return;

        // Önceki efekt sınıflarını temizle
        usernameEl.classList.remove('effect-typing', 'effect-glitch', 'effect-wave');

        // Glow efekti için her zaman data-text ekle (yansıma efekti için gerekli)
        usernameEl.setAttribute('data-text', username);

        // Animasyonlu başlık kapalıysa çık
        if (!effects.animatedTitle) return;

        var effect = effects.titleEffect || 'none';

        switch (effect) {
            case 'typing':
                usernameEl.classList.add('effect-typing');
                break;

            case 'glitch':
                usernameEl.classList.add('effect-glitch');
                break;

            case 'wave':
                applyWaveEffect(usernameEl, username);
                break;

            default:
                break;
        }
    }

    /**
     * Wave efekti: Her harfi ayrı <span> içine sarar
     */
    function applyWaveEffect(element, text) {
        element.textContent = '';
        element.classList.add('effect-wave');

        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
            span.style.setProperty('--char-index', i);
            element.appendChild(span);
        }
    }

    /* ========================================= */
    /*       SOSYAL MEDYA İKONLARI RENDER          */
    /* ========================================= */

    function renderSocials(socials, iconsConfig, appearance) {
        const container = document.getElementById('socials-container');
        if (!container) return;

        // Konteyneri temizle
        container.innerHTML = '';

        if (!socials || socials.length === 0) {
            // Sosyal link yoksa ayırıcıyı da gizle
            const divider = document.getElementById('divider');
            if (divider) divider.style.display = 'none';
            return;
        }

        // Platform → SVG ikon eşlemesi
        const iconSVGs = {
            telegram: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,

            github: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,

            mail: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,

            web: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
        };

        socials.forEach(function (social) {
            if (!social.url || social.url.trim() === '') return;

            const link = document.createElement('a');
            link.href = social.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'social-link';
            link.setAttribute('aria-label', social.platform);
            link.setAttribute('data-platform', social.platform);

            // İkon seç
            const iconHTML = iconSVGs[social.platform] || iconSVGs.web;
            link.innerHTML = iconHTML;

            // İkon rengi
            const svgEl = link.querySelector('svg');
            if (svgEl) {
                svgEl.style.color = appearance.iconColor || '#ffffff';

                // Monochrome modu
                if (iconsConfig && iconsConfig.monochrome) {
                    svgEl.style.color = appearance.iconColor || '#ffffff';
                }
            }

            container.appendChild(link);
        });
    }

    /* ========================================= */
    /*        KUTU RENK DEĞİŞTİRME               */
    /* ========================================= */

    function renderBoxColors(enabled) {
        const card = document.getElementById('profile-card');
        if (!card) return;

        if (enabled) {
            card.classList.add('custom-colors');
        } else {
            card.classList.remove('custom-colors');
        }
    }
    /* ========================================= */
    /*        YEREL VİDEO SES KONTROLÜ           */
    /* ========================================= */
    function initLocalVideoSound(audioConfig) {
        const video = document.getElementById('bg-video');
        const btn = document.getElementById('sound-toggle');
        const iconMuted = document.getElementById('icon-muted');
        const iconUnmuted = document.getElementById('icon-unmuted');

        // Eğer video yoksa, buton yoksa veya admin panelinden kapalıysa hiçbir şey yapma
        if (!video || !btn || !audioConfig || !audioConfig.soundControl) return;

        // Butonu görünür yap
        btn.classList.remove('hidden');

        // Butona tıklanınca olacaklar
        btn.addEventListener('click', function () {
            // Videonun sesini aç/kapat (true/false)
            video.muted = !video.muted;

            // Duruma göre ikonları değiştir
            if (video.muted) {
                iconMuted.classList.remove('hidden');
                iconUnmuted.classList.add('hidden');
            } else {
                iconMuted.classList.add('hidden');
                iconUnmuted.classList.remove('hidden');
            }
        });
    }

    // Public API
    return {
        render
    };

})();
/* ============================================= */
/*    🆕 BLOG BUTONU RENDER & GLASSMORPHISM       */
/* ============================================= */

const BlogButtonRenderer = (function () {

    /**
     * Blog butonuna glassmorphism stilini uygular
     * Profil kartıyla aynı arka plan, blur ve gradyan ayarlarını alır
     * @param {Object} config - Parsed config objesi
     */
    function render(config) {
        const blogBtn = document.getElementById('blog-button');
        if (!blogBtn) return;

        const a = config.appearance;

        // Gradyan aç/kapat
        if (!a.gradientEnabled) {
            blogBtn.classList.add('no-gradient');
        } else {
            blogBtn.classList.remove('no-gradient');
        }

        // Profil kartıyla aynı arka plan stilini uygula
        const opacity = a.profileOpacity;
        const primaryRgb = ConfigLoader.hexToRgb(a.primaryColor);
        const secondaryRgb = ConfigLoader.hexToRgb(a.secondaryColor);

        if (a.gradientEnabled) {
            blogBtn.style.background = `linear-gradient(135deg, rgba(${primaryRgb}, ${opacity}), rgba(${secondaryRgb}, ${opacity}))`;
        } else {
            blogBtn.style.background = `rgba(${primaryRgb}, ${opacity})`;
        }

        blogBtn.style.backdropFilter = `blur(${a.profileBlur}px)`;
        blogBtn.style.webkitBackdropFilter = `blur(${a.profileBlur}px)`;

        // Kutu renk değiştirme aktifse border vurgusu
        if (config.effects && config.effects.changeBoxColors) {
            blogBtn.style.borderColor = `rgba(${ConfigLoader.hexToRgb(a.accentColor)}, 0.2)`;
        }

        // Metin rengi
        blogBtn.style.color = a.textColor || '#ffffff';

        console.log('[BlogButtonRenderer] Blog butonu render edildi.');
    }

    return {
        render
    };

})();