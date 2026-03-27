/* ============================================= */
/*    IN-APP TARAYICI ALGILAMA & UYARI SİSTEMİ   */
/* ============================================= */

const InAppDetector = (function () {

    /**
     * Instagram, Facebook, Twitter vb. in-app tarayıcıyı tespit eder
     */
    function isInAppBrowser() {
        var ua = navigator.userAgent || navigator.vendor || '';
        var inAppPatterns = [
            'Instagram',
            'FBAN',
            'FBAV',
            'FB_IAB',
            'Twitter',
            'Line',
            'Snapchat',
            'Pinterest',
            'LinkedIn',
            'TikTok',
            'BytedanceWebview'
        ];

        for (var i = 0; i < inAppPatterns.length; i++) {
            if (ua.indexOf(inAppPatterns[i]) > -1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Hangi platform olduğunu tespit eder
     */
    function getPlatformName() {
        var ua = navigator.userAgent || '';

        if (ua.indexOf('Instagram') > -1) return 'Instagram';
        if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) return 'Facebook';
        if (ua.indexOf('Twitter') > -1) return 'Twitter';
        if (ua.indexOf('TikTok') > -1 || ua.indexOf('BytedanceWebview') > -1) return 'TikTok';
        if (ua.indexOf('LinkedIn') > -1) return 'LinkedIn';
        if (ua.indexOf('Pinterest') > -1) return 'Pinterest';
        if (ua.indexOf('Line') > -1) return 'Line';
        if (ua.indexOf('Snapchat') > -1) return 'Snapchat';

        return 'uygulama';
    }

    /**
     * Dış tarayıcıda açma banner'ı gösterir
     */
    function showBanner() {
        if (!isInAppBrowser()) return;

        var platform = getPlatformName();
        var currentURL = window.location.href;

        // Zaten banner varsa tekrar ekleme
        if (document.getElementById('inapp-banner')) return;

        var banner = document.createElement('div');
        banner.id = 'inapp-banner';
        banner.innerHTML =
            '<div class="inapp-banner-content">' +
                '<div class="inapp-banner-text">' +
                    '<span class="inapp-banner-title">Daha iyi deneyim için</span>' +
                    '<span class="inapp-banner-sub">' + platform + ' tarayıcısı sesi desteklemiyor</span>' +
                '</div>' +
                '<div class="inapp-banner-actions">' +
                    '<a href="' + currentURL + '" target="_blank" rel="noopener" class="inapp-banner-btn" id="open-external">Tarayıcıda Aç</a>' +
                    '<button class="inapp-banner-close" id="close-inapp-banner" aria-label="Kapat">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(banner);

        // Kapatma butonu
        var closeBtn = document.getElementById('close-inapp-banner');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                banner.classList.add('inapp-banner-hide');
                setTimeout(function () {
                    if (banner.parentNode) {
                        banner.parentNode.removeChild(banner);
                    }
                }, 300);
            });
        }

        // Android'de intent ile dış tarayıcıda açma
        var openBtn = document.getElementById('open-external');
        if (openBtn) {
            openBtn.addEventListener('click', function (e) {
                if (/Android/i.test(navigator.userAgent)) {
                    e.preventDefault();
                    var intentURL = 'intent://' + currentURL.replace(/^https?:\/\//, '') +
                        '#Intent;scheme=https;package=com.android.chrome;end';
                    window.location.href = intentURL;

                    setTimeout(function () {
                        window.open(currentURL, '_system');
                    }, 1000);
                }
            });
        }

        console.log('[InAppDetector] ' + platform + ' in-app tarayıcı tespit edildi, banner gösterildi.');
    }

    /**
     * In-app tarayıcıda ses butonunu yeniden yapılandırır
     */
    function overrideSoundButton() {
        if (!isInAppBrowser()) return;

        var soundBtn = document.getElementById('sound-toggle');
        if (!soundBtn) return;

        var newSoundBtn = soundBtn.cloneNode(true);
        soundBtn.parentNode.replaceChild(newSoundBtn, soundBtn);
        newSoundBtn.classList.remove('hidden');

        newSoundBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Banner yoksa göster
            if (!document.getElementById('inapp-banner')) {
                showBanner();
            }

            // Banner'ı titret
            var bannerEl = document.getElementById('inapp-banner');
            if (bannerEl) {
                bannerEl.classList.add('inapp-banner-shake');
                setTimeout(function () {
                    bannerEl.classList.remove('inapp-banner-shake');
                }, 600);
            }
        });

        console.log('[InAppDetector] Ses butonu in-app moduna alındı.');
    }

    return {
        isInAppBrowser: isInAppBrowser,
        getPlatformName: getPlatformName,
        showBanner: showBanner,
        overrideSoundButton: overrideSoundButton
    };

})();


/* ============================================= */
/*       YOUTUBE ARKA PLAN VIDEO YÖNETİCİSİ      */
/* ============================================= */

const YouTubeBG = (function () {

    let isMuted = true;
    let videoID = '';
    let playerReady = false;
    let isInApp = false;

    /**
     * YouTube arka plan videosunu başlatır
     * @param {string} id - YouTube video ID
     * @param {boolean} soundControl - Ses kontrol butonu gösterilsin mi
     */
    function init(id, soundControl) {
        const container = document.getElementById('youtube-bg');
        const iframe = document.getElementById('youtube-player');

        videoID = (id || '').trim();

        // In-app tarayıcı kontrolü
        isInApp = InAppDetector.isInAppBrowser();

        if (isInApp) {
            InAppDetector.showBanner();
        }

        if (!videoID) {
            container.classList.add('no-video');
            console.log('[YouTubeBG] Video ID girilmemiş, arka plan düz renk.');
            return;
        }

        // iframe src oluştur
        const params = [
            'autoplay=1',
            'mute=1',
            'loop=1',
            'controls=0',
            'showinfo=0',
            'rel=0',
            'modestbranding=1',
            'iv_load_policy=3',
            'disablekb=1',
            'fs=0',
            'playsinline=1',
            'enablejsapi=1',
            'playlist=' + videoID
        ].join('&');

        const src = 'https://www.youtube-nocookie.com/embed/' + videoID + '?' + params;

        // iframe yükleme durumunu dinle
        iframe.addEventListener('load', function () {
            playerReady = true;
            console.log('[YouTubeBG] Video iframe yüklendi.');
        });

        // Hata durumunu dinle
        iframe.addEventListener('error', function () {
            console.warn('[YouTubeBG] Video yüklenemedi, fallback arka plan kullanılıyor.');
            container.classList.add('no-video');
        });

        iframe.src = src;
        console.log('[YouTubeBG] Video yükleniyor:', videoID);

        // Ses kontrol butonunu yönet
        if (soundControl) {
            if (isInApp) {
                // In-app tarayıcıda ses butonunu override et
                InAppDetector.overrideSoundButton();
            } else {
                // Normal tarayıcıda standart ses kontrolü
                initSoundToggle();
            }
        }
    }

    /**
     * Ses kontrol butonunu aktifleştirir (normal tarayıcılar)
     */
    function initSoundToggle() {
        const btn = document.getElementById('sound-toggle');
        const iconMuted = document.getElementById('icon-muted');
        const iconUnmuted = document.getElementById('icon-unmuted');

        if (!btn) return;

        btn.classList.remove('hidden');

        btn.addEventListener('click', function () {
            isMuted = !isMuted;

            const iframe = document.getElementById('youtube-player');
            if (iframe) {
                try {
                    if (isMuted) {
                        postCommand('mute');
                    } else {
                        postCommand('unMute');
                    }
                } catch (e) {
                    if (isMuted) {
                        iframe.src = iframe.src.replace('mute=0', 'mute=1');
                    } else {
                        iframe.src = iframe.src.replace('mute=1', 'mute=0');
                    }
                }
            }

            // İkon değiştir
            if (isMuted) {
                iconMuted.classList.remove('hidden');
                iconUnmuted.classList.add('hidden');
            } else {
                iconMuted.classList.add('hidden');
                iconUnmuted.classList.remove('hidden');
            }
        });
    }

    /**
     * YouTube iframe API'ye postMessage komutu gönderir
     */
    function postCommand(command) {
        const iframe = document.getElementById('youtube-player');
        if (!iframe || !iframe.contentWindow) return;

        iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: command,
            args: []
        }), '*');
    }

    /**
     * Video overlay karartmasını ayarla
     * @param {number} opacity - 0 ile 1 arası
     */
    function setOverlayOpacity(opacity) {
        const overlay = document.getElementById('youtube-overlay');
        if (overlay) {
            overlay.style.background = 'rgba(0, 0, 0, ' + opacity + ')';
        }
    }

    // Public API
    return {
        init,
        setOverlayOpacity
    };

})();