/* ============================================= */
/*       YOUTUBE ARKA PLAN VIDEO YÖNETİCİSİ      */
/*              (GÜNCELLENMİŞ)                    */
/* ============================================= */

const YouTubeBG = (function () {

    let isMuted = true;
    let videoID = '';
    let playerReady = false;

    /**
     * YouTube arka plan videosunu başlatır
     * @param {string} id - YouTube video ID
     * @param {boolean} soundControl - Ses kontrol butonu gösterilsin mi
     */
    function init(id, soundControl) {
        const container = document.getElementById('youtube-bg');
        const iframe = document.getElementById('youtube-player');

        videoID = (id || '').trim();

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
        console.log('[YouTubeBG] iframe src:', src);

        // Ses kontrol butonunu yönet
        if (soundControl) {
            initSoundToggle();
        }
    }

    /**
     * Ses kontrol butonunu aktifleştirir
     */
    function initSoundToggle() {
        const btn = document.getElementById('sound-toggle');
        const iconMuted = document.getElementById('icon-muted');
        const iconUnmuted = document.getElementById('icon-unmuted');

        if (!btn) return;

        btn.classList.remove('hidden');

        btn.addEventListener('click', function () {
            isMuted = !isMuted;

            // iframe src'deki mute parametresini değiştir
            const iframe = document.getElementById('youtube-player');
            if (iframe) {
                // postMessage ile kontrol dene
                try {
                    if (isMuted) {
                        postCommand('mute');
                    } else {
                        postCommand('unMute');
                    }
                } catch (e) {
                    // Fallback: src değiştir
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