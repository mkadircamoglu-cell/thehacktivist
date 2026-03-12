/* ============================================= */
/*          CONFIG.JSON YÜKLEYICI MODÜL           */
/* ============================================= */

const ConfigLoader = (function () {

    // Varsayılan config yapısı (config.json yüklenemezse kullanılır)
    const DEFAULT_CONFIG = {
        profile: {
            username: "Kullanıcı",
            description: "Açıklama girilmemiş.",
            location: "",
            avatarURL: "assets/images/default-avatar.png"
        },
        background: {
            youtubeVideoID: "",
            overlayEffect: "none"
        },
        appearance: {
            profileOpacity: 0.5,
            profileBlur: 20,
            gradientEnabled: true,
            primaryColor: "#1a1a2e",
            secondaryColor: "#16213e",
            accentColor: "#e94560",
            textColor: "#ffffff",
            backgroundColor: "#0f0f0f",
            iconColor: "#ffffff"
        },
        effects: {
            animatedTitle: false,
            titleEffect: "none",
            glowUsername: false,
            glowSocials: false,
            glowBadges: false,
            avatarEffect: "none",
            changeBoxColors: false
        },
        audio: {
            soundControl: false
        },
        icons: {
            monochrome: false
        },
        socials: []
    };

    /**
     * config.json dosyasını fetch ile yükler
     * @returns {Promise<Object>} Parsed config objesi
     */
    async function load() {
        try {
            const response = await fetch('config.json', {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const config = await response.json();
            console.log('[ConfigLoader] config.json başarıyla yüklendi.');

            // Eksik alanları varsayılanlarla doldur
            return mergeWithDefaults(config, DEFAULT_CONFIG);
        } catch (error) {
            console.warn('[ConfigLoader] config.json yüklenemedi, varsayılanlar kullanılıyor:', error.message);
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }

    /**
     * Kullanıcı config'ini varsayılanlarla birleştirir (derin merge)
     * Eksik alanlar varsayılan değerle doldurulur
     */
    function mergeWithDefaults(userConfig, defaults) {
        const result = JSON.parse(JSON.stringify(defaults));

        for (const key in userConfig) {
            if (!userConfig.hasOwnProperty(key)) continue;

            if (
                typeof userConfig[key] === 'object' &&
                userConfig[key] !== null &&
                !Array.isArray(userConfig[key]) &&
                typeof defaults[key] === 'object' &&
                defaults[key] !== null &&
                !Array.isArray(defaults[key])
            ) {
                result[key] = mergeWithDefaults(userConfig[key], defaults[key]);
            } else {
                result[key] = userConfig[key];
            }
        }

        return result;
    }

    /**
     * Hex renk kodunu RGB değerlerine çevirir
     * "#e94560" → "233, 69, 96"
     */
    function hexToRgb(hex) {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
    }

    // Public API
    return {
        load,
        hexToRgb,
        DEFAULT_CONFIG
    };

})();