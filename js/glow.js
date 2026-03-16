/* ============================================= */
/*           GLOW (IŞILTI) EFEKT YÖNETİCİSİ      */
/* ============================================= */

const GlowManager = (function () {

    /**
     * Glow efektlerini config'e göre uygular
     * @param {Object} effects - config.effects objesi
     */
    function apply(effects) {
        if (!effects) return;

        // Kullanıcı adı glow
        applyUsernameGlow(effects.glowUsername);

        // Açıklama glow
        applyDescriptionGlow(effects.glowUsername);

        // Konum glow
        applyLocationGlow(effects.glowUsername);

        // Sosyal ikonlar glow
        applySocialsGlow(effects.glowSocials);

        // Badge'ler glow
        applyBadgesGlow(effects.glowBadges);

        // Blog butonu glow
        applyBlogButtonGlow(effects.glowSocials);

        console.log('[GlowManager] Glow efektleri uygulandı.');
    }

    /**
     * Kullanıcı adına glow efekti uygular/kaldırır
     */
    function applyUsernameGlow(enabled) {
        const username = document.getElementById('username');
        if (!username) return;

        if (enabled) {
            username.classList.add('glow-active');
        } else {
            username.classList.remove('glow-active');
        }
    }

    /**
     * Açıklama metnine glow efekti uygular/kaldırır
     */
    function applyDescriptionGlow(enabled) {
        const description = document.getElementById('description');
        if (!description) return;

        if (enabled) {
            description.classList.add('glow-active');
        } else {
            description.classList.remove('glow-active');
        }
    }

    /**
     * Konum metnine ve ikonuna glow efekti uygular/kaldırır
     */
    function applyLocationGlow(enabled) {
        const locationText = document.querySelector('.location-text');
        const locationIcon = document.querySelector('.location-icon');

        if (locationText) {
            if (enabled) {
                locationText.classList.add('glow-active');
            } else {
                locationText.classList.remove('glow-active');
            }
        }

        if (locationIcon) {
            if (enabled) {
                locationIcon.classList.add('glow-active');
            } else {
                locationIcon.classList.remove('glow-active');
            }
        }
    }

    /**
     * Sosyal medya ikonlarına glow efekti uygular/kaldırır
     */
    function applySocialsGlow(enabled) {
        const socialLinks = document.querySelectorAll('.social-link');

        socialLinks.forEach(function (link) {
            if (enabled) {
                link.classList.add('glow-active');
            } else {
                link.classList.remove('glow-active');
            }
        });
    }

    /**
     * Badge'lere glow efekti
     */
    function applyBadgesGlow(enabled) {
        const badges = document.querySelectorAll('.badge');

        badges.forEach(function (badge) {
            if (enabled) {
                badge.classList.add('glow-active');
            } else {
                badge.classList.remove('glow-active');
            }
        });
    }

    /**
     * Blog butonuna glow efekti uygular/kaldırır
     */
    function applyBlogButtonGlow(enabled) {
        const blogBtn = document.getElementById('blog-button');
        if (!blogBtn) return;

        if (enabled) {
            blogBtn.classList.add('glow-active');
        } else {
            blogBtn.classList.remove('glow-active');
        }
    }

    /**
     * Özel glow rengi ayarlar
     * @param {string} color - Hex renk kodu
     */
    function setGlowColor(color) {
        if (!color) return;

        const rgb = ConfigLoader.hexToRgb(color);
        document.documentElement.style.setProperty('--glow-color', color);
        document.documentElement.style.setProperty('--glow-color-rgb', rgb);
    }

    // Public API
    return {
        apply,
        setGlowColor
    };

})();