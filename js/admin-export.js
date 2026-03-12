/* ============================================= */
/*     ADMIN PANELİ: CONFIG.JSON DIŞA AKTARMA     */
/* ============================================= */

const AdminExport = (function () {

    'use strict';

    function init() {
        const exportBtn = document.getElementById('export-config');
        if (!exportBtn) return;

        exportBtn.addEventListener('click', handleExport);
    }

    /**
     * Formdaki verileri config.json olarak indirtir
     */
    function handleExport() {
        try {
            // 1. Config objesini oluştur
            const config = AdminPanel.buildConfig();

            // 2. Doğrulama
            const errors = validateConfig(config);
            if (errors.length > 0) {
                errors.forEach(function (err) {
                    Toast.show(err, 'error');
                });
                return;
            }

            // 3. JSON string oluştur (güzel formatlanmış)
            const jsonString = JSON.stringify(config, null, 4);

            // 4. Blob oluştur
            const blob = new Blob([jsonString], {
                type: 'application/json;charset=utf-8'
            });

            // 5. İndirme linki oluştur ve tetikle
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'config.json';
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            // 6. Temizlik
            setTimeout(function () {
                URL.revokeObjectURL(url);
                document.body.removeChild(link);
            }, 100);

            // 7. Başarı bildirimi
            Toast.show('config.json başarıyla indirildi!', 'success');
            console.log('[AdminExport] Config dışa aktarıldı:', config);

        } catch (error) {
            console.error('[AdminExport] Dışa aktarma hatası:', error);
            Toast.show('Dışa aktarma sırasında hata oluştu: ' + error.message, 'error');
        }
    }

    /**
     * Config objesini doğrular
     * @param {Object} config
     * @returns {string[]} Hata mesajları dizisi
     */
    function validateConfig(config) {
        const errors = [];

        // Kullanıcı adı kontrolü
        if (!config.profile || !config.profile.username || config.profile.username.trim() === '') {
            errors.push('Kullanıcı adı boş bırakılamaz.');
        }

        // Kullanıcı adı uzunluk kontrolü
        if (config.profile && config.profile.username && config.profile.username.length > 50) {
            errors.push('Kullanıcı adı 50 karakterden uzun olamaz.');
        }

        // Açıklama uzunluk kontrolü
        if (config.profile && config.profile.description && config.profile.description.length > 500) {
            errors.push('Açıklama 500 karakterden uzun olamaz.');
        }

        // YouTube ID formatı (varsa)
        if (config.background && config.background.youtubeVideoID) {
            const ytid = config.background.youtubeVideoID.trim();
            if (ytid !== '' && !/^[a-zA-Z0-9_-]{11}$/.test(ytid)) {
                errors.push('YouTube Video ID formatı geçersiz (11 karakter olmalı).');
            }
        }

        // Renk formatları kontrolü
        const colorFields = [
            { key: 'accentColor', label: 'Vurgu Rengi' },
            { key: 'textColor', label: 'Metin Rengi' },
            { key: 'backgroundColor', label: 'Arka Plan Rengi' },
            { key: 'iconColor', label: 'İkon Rengi' },
            { key: 'primaryColor', label: 'Birincil Renk' },
            { key: 'secondaryColor', label: 'İkincil Renk' }
        ];

        colorFields.forEach(function (field) {
            const val = config.appearance ? config.appearance[field.key] : null;
            if (val && !isValidHex(val)) {
                errors.push(field.label + ' geçersiz hex renk kodu: ' + val);
            }
        });

        // Opaklık aralığı
        if (config.appearance) {
            const op = config.appearance.profileOpacity;
            if (op !== undefined && (op < 0 || op > 1)) {
                errors.push('Profil opaklığı 0-1 aralığında olmalı.');
            }
        }

        // Bulanıklık aralığı
        if (config.appearance) {
            const bl = config.appearance.profileBlur;
            if (bl !== undefined && (bl < 0 || bl > 100)) {
                errors.push('Profil bulanıklığı 0-100 aralığında olmalı.');
            }
        }

        // Sosyal medya URL kontrolü
        if (config.socials && config.socials.length > 0) {
            config.socials.forEach(function (social, index) {
                if (social.url && !isValidURL(social.url)) {
                    errors.push((social.platform || 'Sosyal #' + (index + 1)) + ' URL formatı geçersiz.');
                }
            });
        }

        return errors;
    }

    /**
     * Hex renk kodu doğrulama
     */
    function isValidHex(str) {
        return /^#[0-9A-Fa-f]{6}$/.test(str);
    }

    /**
     * URL doğrulama (basit)
     */
    function isValidURL(str) {
        // mailto: desteği
        if (str.startsWith('mailto:')) return true;

        try {
            new URL(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ========================================= */
    /*         SAYFA YÜKLENME TETİKLEYİCİ         */
    /* ========================================= */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        handleExport,
        validateConfig
    };

})();