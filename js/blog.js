/* ============================================= */
/*         BLOG SAYFASI ANA SCRIPT                */
/*   blog.json → Fetch → Parse → DOM Render       */
/*   Hibrit Yaklaşım: Kartlar harici URL'ye       */
/*   (Medium, Dev.to vb.) yönlendirir             */
/* ============================================= */

const BlogApp = (function () {

    /* ========================================= */
    /*              DOM REFERANSLARI              */
    /* ========================================= */

    const DOM = {
        grid: document.getElementById('blog-grid'),
        loader: document.getElementById('blog-loader'),
        empty: document.getElementById('blog-empty'),
        error: document.getElementById('blog-error'),
        retry: document.getElementById('blog-retry'),
        scrollTop: document.getElementById('scroll-top'),
        footerYear: document.getElementById('footer-year')
    };

    /* ========================================= */
    /*              YAPILANDIRMA                  */
    /* ========================================= */

    const CONFIG = {
        dataURL: 'blog.json',
        scrollTopThreshold: 300,
        months: [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ]
    };

    /* ========================================= */
    /*              BAŞLATICI (INIT)              */
    /* ========================================= */

    function init() {
        console.log('[BlogApp] Başlatılıyor...');

        // Footer yılını ayarla
        setFooterYear();

        // Scroll olaylarını dinle
        initScrollEvents();

        // Tekrar dene butonunu dinle
        initRetryButton();

        // Blog verilerini yükle
        loadPosts();
    }

    /* ========================================= */
    /*          BLOG VERİLERİNİ YÜKLE            */
    /* ========================================= */

    function loadPosts() {
        showLoader();
        hideError();
        hideEmpty();
        clearGrid();

        fetch(CONFIG.dataURL)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP Hata: ' + response.status);
                }
                return response.json();
            })
            .then(function (data) {
                handleData(data);
            })
            .catch(function (err) {
                console.error('[BlogApp] Veri yükleme hatası:', err);
                handleError();
            });
    }

    /* ========================================= */
    /*           VERİYİ İŞLE & RENDER ET          */
    /* ========================================= */

    function handleData(data) {
        hideLoader();

        // JSON yapısını kontrol et
        var posts = Array.isArray(data) ? data : (data.posts || []);

        if (!posts || posts.length === 0) {
            showEmpty();
            console.log('[BlogApp] Hiç yazı bulunamadı.');
            return;
        }

        // Tarihe göre sırala (en yeni en üstte)
        posts.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        // Kartları render et
        renderCards(posts);

        console.log('[BlogApp] ' + posts.length + ' yazı yüklendi.');
    }

    /* ========================================= */
    /*          BLOG KARTLARINI RENDER ET          */
    /* ========================================= */

    function renderCards(posts) {
        if (!DOM.grid) return;

        var fragment = document.createDocumentFragment();

        posts.forEach(function (post, index) {
            var card = createCard(post, index);
            if (card) {
                fragment.appendChild(card);
            }
        });

        DOM.grid.appendChild(fragment);
    }

    /**
     * Tek bir blog kartı oluşturur
     * @param {Object} post - Yazı verisi
     * @param {number} index - Sıra numarası (animasyon gecikmesi için)
     * @returns {HTMLElement} article elementi
     */
    function createCard(post, index) {
        var article = document.createElement('article');
        article.className = 'blog-card';
        article.setAttribute('data-id', post.id || index);
        article.style.setProperty('--card-index', index);

        // URL durumunu kontrol et
        var hasURL = post.url && post.url.trim() !== '';
        var hasCover = post.cover && post.cover.trim() !== '';

        // URL yoksa kartı soluk göster
        if (!hasURL) {
            article.classList.add('no-url');
        }

        // Kapak görseli yoksa sınıf ekle
        if (!hasCover) {
            article.classList.add('no-cover');
        }

        // Kart HTML içeriği
        var html = '';

        // --- Kapak görseli ---
        if (hasCover) {
            html += '<div class="blog-card-cover">';
            html += '<img src="' + escapeHTML(post.cover) + '" alt="' + escapeHTML(post.title || '') + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">';
            html += '<div class="blog-card-cover-overlay"></div>';

            // Harici link rozeti (kapak görseli üstünde)
            if (hasURL) {
                html += '<div class="blog-card-badge">';
                html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
                html += '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>';
                html += '<polyline points="15 3 21 3 21 9"/>';
                html += '<line x1="10" y1="14" x2="21" y2="3"/>';
                html += '</svg>';
                html += '</div>';
            }

            html += '</div>';
        }

        // --- İçerik alanı ---
        html += '<div class="blog-card-content">';

        // Meta bilgiler
        html += '<div class="blog-card-meta">';
        if (post.date) {
            html += '<time class="blog-card-date" datetime="' + escapeHTML(post.date) + '">' + formatDate(post.date) + '</time>';
        }
        if (post.tag && post.tag.trim() !== '') {
            html += '<span class="blog-card-tag">' + escapeHTML(post.tag) + '</span>';
        }
        html += '</div>';

        // Başlık
        html += '<h2 class="blog-card-title">' + escapeHTML(post.title || 'Başlıksız Yazı') + '</h2>';

        // Özet
        if (post.excerpt && post.excerpt.trim() !== '') {
            html += '<p class="blog-card-excerpt">' + escapeHTML(post.excerpt) + '</p>';
        }

        // Footer — Devamını Oku / Yakında
        html += '<div class="blog-card-footer">';

        if (hasURL) {
            // URL varsa → "Devamını Oku" + ok ikonu + platform bilgisi
            var platformName = detectPlatform(post.url);

            html += '<span class="blog-card-readmore">';
            html += platformName ? ('Okumaya Git · ' + platformName) : 'Devamını Oku';
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
            html += '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>';
            html += '<polyline points="15 3 21 3 21 9"/>';
            html += '<line x1="10" y1="14" x2="21" y2="3"/>';
            html += '</svg>';
            html += '</span>';
        } else {
            // URL yoksa → "Yakında" etiketi
            html += '<span class="blog-card-coming-soon">';
            html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
            html += '<circle cx="12" cy="12" r="10"/>';
            html += '<polyline points="12 6 12 12 16 14"/>';
            html += '</svg>';
            html += 'Yakında';
            html += '</span>';
        }

        html += '</div>';
        html += '</div>'; // .blog-card-content sonu

        // Glow efekti
        html += '<div class="blog-card-glow"></div>';

        article.innerHTML = html;

        // Kart tıklama olayı
        article.addEventListener('click', function () {
            handleCardClick(post);
        });

        return article;
    }

    /* ========================================= */
    /*          KART TIKLAMA YÖNETİMİ            */
    /* ========================================= */

    /**
     * Blog kartına tıklandığında çalışır
     * URL varsa harici platformda açar (Medium, Dev.to vb.)
     * URL yoksa kullanıcıya bilgi verir
     * @param {Object} post - Yazı verisi
     */
    function handleCardClick(post) {
        var hasURL = post.url && post.url.trim() !== '';

        if (hasURL) {
            // Harici linki yeni sekmede aç
            window.open(post.url, '_blank', 'noopener,noreferrer');
            console.log('[BlogApp] Harici yazı açıldı: ' + post.title);
        } else {
            // URL yoksa kartı hafifçe titret (görsel geri bildirim)
            var card = DOM.grid.querySelector('[data-id="' + post.id + '"]');
            if (card) {
                card.classList.add('shake');
                setTimeout(function () {
                    card.classList.remove('shake');
                }, 500);
            }
            console.log('[BlogApp] Yazı henüz yayınlanmadı: ' + post.title);
        }
    }

    /* ========================================= */
    /*          PLATFORM TESPİT FONKSİYONU       */
    /* ========================================= */

    /**
     * URL'den hangi platformda yayınlandığını tespit eder
     * @param {string} url - Yazı URL'si
     * @returns {string|null} Platform adı veya null
     */
    function detectPlatform(url) {
        if (!url) return null;

        var lower = url.toLowerCase();

        if (lower.includes('medium.com'))      return 'Medium';
        if (lower.includes('dev.to'))          return 'Dev.to';
        if (lower.includes('hashnode'))         return 'Hashnode';
        if (lower.includes('substack.com'))    return 'Substack';
        if (lower.includes('wordpress.com'))   return 'WordPress';
        if (lower.includes('blogger.com'))     return 'Blogger';
        if (lower.includes('ghost.io'))        return 'Ghost';
        if (lower.includes('notion.so') || lower.includes('notion.site')) return 'Notion';
        if (lower.includes('telegraph'))       return 'Telegraph';
        if (lower.includes('github.io') || lower.includes('github.com')) return 'GitHub';

        return null;
    }

    /* ========================================= */
    /*             TARİH FORMATLAMA              */
    /* ========================================= */

    /**
     * ISO tarih stringini Türkçe formata çevirir
     * "2025-01-15" → "15 Ocak 2025"
     * @param {string} dateStr - ISO tarih
     * @returns {string} Formatlanmış tarih
     */
    function formatDate(dateStr) {
        try {
            var parts = dateStr.split('-');
            var year = parts[0];
            var monthIndex = parseInt(parts[1], 10) - 1;
            var day = parseInt(parts[2], 10);

            if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
                return dateStr;
            }

            return day + ' ' + CONFIG.months[monthIndex] + ' ' + year;
        } catch (e) {
            return dateStr;
        }
    }

    /* ========================================= */
    /*            HTML ESCAPE FONKSİYONU          */
    /* ========================================= */

    /**
     * XSS koruması için HTML özel karakterlerini escape eder
     * @param {string} str - Escape edilecek metin
     * @returns {string} Güvenli metin
     */
    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /* ========================================= */
    /*          DURUM YÖNETİM FONKSİYONLARI       */
    /* ========================================= */

    function showLoader() {
        if (DOM.loader) DOM.loader.classList.remove('hidden');
    }

    function hideLoader() {
        if (DOM.loader) DOM.loader.classList.add('hidden');
    }

    function showEmpty() {
        if (DOM.empty) DOM.empty.classList.remove('hidden');
    }

    function hideEmpty() {
        if (DOM.empty) DOM.empty.classList.add('hidden');
    }

    function showError() {
        if (DOM.error) DOM.error.classList.remove('hidden');
    }

    function hideError() {
        if (DOM.error) DOM.error.classList.add('hidden');
    }

    function handleError() {
        hideLoader();
        hideEmpty();
        showError();
    }

    function clearGrid() {
        if (DOM.grid) DOM.grid.innerHTML = '';
    }

    /* ========================================= */
    /*         TEKRAR DENE BUTONU                 */
    /* ========================================= */

    function initRetryButton() {
        if (!DOM.retry) return;

        DOM.retry.addEventListener('click', function () {
            console.log('[BlogApp] Tekrar yükleniyor...');
            loadPosts();
        });
    }

    /* ========================================= */
    /*          SCROLL OLAYLARI                   */
    /* ========================================= */

    function initScrollEvents() {
        var ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Scroll Top butonu tıklama
        if (DOM.scrollTop) {
            DOM.scrollTop.addEventListener('click', function () {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    /**
     * Scroll pozisyonuna göre "Yukarı Çık" butonunu göster/gizle
     */
    function handleScroll() {
        if (!DOM.scrollTop) return;

        var scrollY = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollY > CONFIG.scrollTopThreshold) {
            DOM.scrollTop.classList.remove('hidden');
            DOM.scrollTop.classList.add('visible');
        } else {
            DOM.scrollTop.classList.remove('visible');
            setTimeout(function () {
                if (window.pageYOffset <= CONFIG.scrollTopThreshold) {
                    DOM.scrollTop.classList.add('hidden');
                }
            }, 300);
        }
    }

    /* ========================================= */
    /*            FOOTER YILI AYARLA              */
    /* ========================================= */

    function setFooterYear() {
        if (DOM.footerYear) {
            DOM.footerYear.textContent = new Date().getFullYear();
        }
    }

    /* ========================================= */
    /*              PUBLIC API                    */
    /* ========================================= */

    return {
        init: init
    };

})();


/* ============================================= */
/*         SAYFA YÜKLENDIĞINDE BAŞLAT             */
/* ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    BlogApp.init();
});