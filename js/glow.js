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
/* ============================================= */
/*    🆕 BLOG BUTONU GLOW TETİKLEMESİ            */
/* ============================================= */

/**
 * Blog butonuna glow efekti uygular/kaldırır
 * Sosyal ikonların glow durumuna bağlı çalışır
 * @param {boolean} enabled - Glow aktif mi
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

// Mevcut apply fonksiyonuna blog butonu desteği ekle
const _originalApply = GlowManager.apply;

GlowManager.apply = function (effects) {
    // Önce mevcut glow'ları uygula
    _originalApply(effects);

    // Blog butonuna da glow uygula (sosyal ikonlarla aynı ayarı kullanır)
    applyBlogButtonGlow(effects.glowSocials);
};