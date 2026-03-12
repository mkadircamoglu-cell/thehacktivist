/* ============================================= */
/*      ANA GİRİŞ NOKTASI (ENTRY POINT)          */
/*                                               */
/*  Sayfa yüklendiğinde çalışır:                  */
/*  1. config.json'u yükle                        */
/*  2. Sayfayı render et                          */
/*  3. Loader'ı kapat                             */
/* ============================================= */

(function () {

    'use strict';

    /**
     * Uygulamayı başlatır
     */
    async function initApp() {
        console.log('[App] Uygulama başlatılıyor...');

        try {
            // 1. Config'i yükle
            const config = await ConfigLoader.load();

            // 2. Sayfa title'ını güncelle
            if (config.profile && config.profile.username) {
                document.title = config.profile.username + ' | Profil';
            }

            // 3. Sayfayı render et
            Renderer.render(config);

            // 4. Kısa bir bekleme (animasyonların başlaması için)
            await delay(600);

            // 5. Loader'ı kapat
            hideLoader();

            console.log('[App] Uygulama hazır.');

        } catch (error) {
            console.error('[App] Başlatma hatası:', error);

            // Hata durumunda da loader'ı kapat
            hideLoader();

            // Varsayılan config ile dene
            try {
                Renderer.render(ConfigLoader.DEFAULT_CONFIG);
            } catch (e) {
                console.error('[App] Fallback render de başarısız:', e);
            }
        }
    }

    /**
     * Yükleme ekranını fade-out ile kapatır
     */
    function hideLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;

        loader.classList.add('fade-out');

        // Animasyon bittikten sonra DOM'dan kaldır
        loader.addEventListener('transitionend', function () {
            loader.remove();
        }, { once: true });

        // Fallback: transitionend tetiklenmezse 1 sn sonra kaldır
        setTimeout(function () {
            if (document.getElementById('loader')) {
                loader.remove();
            }
        }, 1000);
    }

    /**
     * Belirtilen ms kadar bekler
     * @param {number} ms - Milisaniye
     * @returns {Promise}
     */
    function delay(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    /* ========================================= */
    /*            SAYFA YÜKLENME TETİKLEYİCİ      */
    /* ========================================= */

    // DOM hazır olduğunda başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        // DOM zaten hazır
        initApp();
    }

})();