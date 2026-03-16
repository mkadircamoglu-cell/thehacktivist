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

        // Sosyal ikonlar glow
        applySocialsGlow(effects.glowSocials);

        // Badge'ler glow
        applyBadgesGlow(effects.glowBadges);

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
     * Badge'lere glow efekti (şimdilik placeholder)
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