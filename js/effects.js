/* ============================================= */
/*     OVERLAY EFEKTLERİ (KAR TANESİ / MATRIX)   */
/*              (TAMAMEN YENİDEN YAZILDI)          */
/* ============================================= */

const Effects = (function () {

    'use strict';

    let canvas = null;
    let ctx = null;
    let animationId = null;
    let currentEffect = 'none';
    let isRunning = false;

    // Kar tanesi parçacıkları
    let snowParticles = [];

    // Matrix sütunları
    let matrixDrops = [];
    let matrixFontSize = 14;
    let matrixColumnCount = 0;

    /**
     * Efekt sistemini başlatır
     * @param {string} effect - "none", "snow", "matrix"
     */
    function init(effect) {
        canvas = document.getElementById('effects-canvas');

        if (!canvas) {
            console.warn('[Effects] Canvas elementi bulunamadı.');
            return;
        }

        ctx = canvas.getContext('2d');

        if (!ctx) {
            console.warn('[Effects] Canvas context alınamadı.');
            return;
        }

        currentEffect = (effect || 'none').toLowerCase().trim();

        if (currentEffect === 'none') {
            canvas.classList.remove('active');
            console.log('[Effects] Efekt: yok.');
            return;
        }

        // Canvas boyutunu ayarla
        setCanvasSize();

        // Pencere boyutu değişince
        window.addEventListener('resize', handleResize);

        // Efekti başlat
        if (currentEffect === 'snow') {
            createSnowParticles();
            isRunning = true;
            canvas.classList.add('active');
            requestAnimationFrame(snowLoop);
            console.log('[Effects] Kar efekti başlatıldı. Parçacık sayısı:', snowParticles.length);

        } else if (currentEffect === 'matrix') {
            createMatrixDrops();
            isRunning = true;
            canvas.classList.add('active');
            requestAnimationFrame(matrixLoop);
            console.log('[Effects] Matrix efekti başlatıldı. Sütun sayısı:', matrixColumnCount);
        }
    }

    /**
     * Canvas boyutunu pencereye eşitler
     */
    function setCanvasSize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    /**
     * Pencere boyutu değişince
     */
    let resizeTimer = null;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            setCanvasSize();
            if (currentEffect === 'snow') {
                createSnowParticles();
            } else if (currentEffect === 'matrix') {
                createMatrixDrops();
            }
        }, 250);
    }

    /* ========================================= */
    /*         KAR TANESİ EFEKTİ                  */
    /* ========================================= */

    function createSnowParticles() {
        snowParticles = [];

        // Ekran genişliğine göre parçacık sayısı
        var count = Math.max(80, Math.floor(canvas.width / 8));
        if (count > 300) count = 300;

        for (var i = 0; i < count; i++) {
            snowParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3.5 + 0.5,
                speedY: Math.random() * 1.2 + 0.3,
                speedX: Math.random() * 0.6 - 0.3,
                opacity: Math.random() * 0.7 + 0.3,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.03 + 0.01
            });
        }
    }

    function snowLoop() {
        if (!isRunning || currentEffect !== 'snow' || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < snowParticles.length; i++) {
            var p = snowParticles[i];

            // Hareket hesapla
            p.wobble += p.wobbleSpeed;
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.wobble) * 0.4;

            // Ekrandan çıkınca yukarıdan geri getir
            if (p.y > canvas.height + 5) {
                p.y = -5;
                p.x = Math.random() * canvas.width;
            }
            if (p.x > canvas.width + 5) {
                p.x = -5;
            }
            if (p.x < -5) {
                p.x = canvas.width + 5;
            }

            // Kar tanesini çiz
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + p.opacity + ')';
            ctx.fill();

            // Büyük tanelere hafif glow ekle
            if (p.radius > 2) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, ' + (p.opacity * 0.15) + ')';
                ctx.fill();
            }
        }

        animationId = requestAnimationFrame(snowLoop);
    }

    /* ========================================= */
    /*          MATRIX KODU EFEKTİ                */
    /* ========================================= */

    var matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';

    function createMatrixDrops() {
        matrixColumnCount = Math.floor(canvas.width / matrixFontSize);
        matrixDrops = [];

        for (var i = 0; i < matrixColumnCount; i++) {
            matrixDrops.push(Math.random() * -100);
        }
    }

    function matrixLoop() {
        if (!isRunning || currentEffect !== 'matrix' || !ctx) return;

        // İz efekti için yarı saydam siyah katman
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = matrixFontSize + 'px "JetBrains Mono", "Courier New", monospace';

        for (var i = 0; i < matrixDrops.length; i++) {
            // Rastgele karakter seç
            var char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
            var x = i * matrixFontSize;
            var y = matrixDrops[i] * matrixFontSize;

            // Baştaki karakter parlak beyaz, gerisı yeşil
            if (Math.random() > 0.5) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = '#00ff41';
            }

            ctx.globalAlpha = Math.random() * 0.5 + 0.5;
            ctx.fillText(char, x, y);
            ctx.globalAlpha = 1;

            // Aşağı düş
            matrixDrops[i]++;

            // Ekrandan çıkınca rastgele sıfırla
            if (y > canvas.height && Math.random() > 0.975) {
                matrixDrops[i] = 0;
            }
        }

        animationId = requestAnimationFrame(matrixLoop);
    }

    /* ========================================= */
    /*           DURDUR / TEMİZLE                  */
    /* ========================================= */

    function destroy() {
        isRunning = false;
        currentEffect = 'none';

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        snowParticles = [];
        matrixDrops = [];

        if (canvas) {
            canvas.classList.remove('active');
        }

        window.removeEventListener('resize', handleResize);
    }

    // Public API
    return {
        init: init,
        destroy: destroy
    };

})();