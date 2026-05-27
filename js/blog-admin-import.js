/* ============================================= */
/*        BLOG ADMIN — İÇE AKTARMA (IMPORT)      */
/*    blog.json dosyası yükleyip listeyi doldurma  */
/* ============================================= */

const BlogAdminImport = (function () {

    /* ========================================= */
    /*              BAŞLATICI                     */
    /* ========================================= */

    function init() {
        var importFile = document.getElementById('import-file');

        if (importFile) {
            importFile.addEventListener('change', handleFileSelect);
        }
    }

    /* ========================================= */
    /*          DOSYA SEÇİMİ İŞLEME              */
    /* ========================================= */

    function handleFileSelect(e) {
        var file = e.target.files[0];

        if (!file) return;

        // Dosya tipi kontrolü
        if (!file.name.endsWith('.json')) {
            BlogAdmin.showToast('Lütfen .json uzantılı bir dosya seçin.', 'error');
            resetFileInput(e.target);
            return;
        }

        // Dosya boyutu kontrolü (maks 5MB)
        if (file.size > 5 * 1024 * 1024) {
            BlogAdmin.showToast('Dosya boyutu 5MB\'dan küçük olmalıdır.', 'error');
            resetFileInput(e.target);
            return;
        }

        // Dosyayı oku
        var reader = new FileReader();

        reader.onload = function (event) {
            try {
                var content = event.target.result;
                var data = JSON.parse(content);

                processImport(data);

            } catch (err) {
                console.error('[BlogAdminImport] JSON parse hatası:', err);
                BlogAdmin.showToast('Geçersiz JSON dosyası. Dosya formatını kontrol edin.', 'error');
            }
        };

        reader.onerror = function () {
            BlogAdmin.showToast('Dosya okunurken bir hata oluştu.', 'error');
        };

        reader.readAsText(file, 'UTF-8');

        // Input'u sıfırla (aynı dosya tekrar seçilebilsin)
        resetFileInput(e.target);
    }

    /* ========================================= */
    /*          İÇE AKTARMA İŞLEMİ               */
    /* ========================================= */

    /**
     * JSON verisini parse edip blog admin'e aktarır
     * @param {Object|Array} data - JSON verisi
     */
    function processImport(data) {
        var posts = [];

        // Farklı JSON yapılarını destekle
        if (Array.isArray(data)) {
            // Direkt dizi: [{ ... }, { ... }]
            posts = data;
        } else if (data.posts && Array.isArray(data.posts)) {
            // Obje içinde posts dizisi: { "posts": [{ ... }] }
            posts = data.posts;
        } else {
            BlogAdmin.showToast('Tanınmayan JSON yapısı. "posts" dizisi bulunamadı.', 'error');
            return;
        }

        // Her yazıyı doğrula ve temizle
        var validPosts = [];
        var skipped = 0;

        posts.forEach(function (post, index) {
            var validated = validatePost(post, index);

            if (validated) {
                validPosts.push(validated);
            } else {
                skipped++;
            }
        });

        if (validPosts.length === 0) {
            BlogAdmin.showToast('İçe aktarılabilecek geçerli yazı bulunamadı.', 'warning');
            return;
        }

        // Mevcut yazılara ekle veya üzerine yaz
        var existingPosts = BlogAdmin.getPosts();

        if (existingPosts.length > 0) {
            // Mevcut veriler varsa birleştir (aynı ID'leri güncelle, yenileri ekle)
            validPosts = mergePosts(existingPosts, validPosts);

            BlogAdmin.showToast(
                validPosts.length + ' yazı içe aktarıldı (birleştirildi).' +
                (skipped > 0 ? ' ' + skipped + ' yazı atlandı.' : ''),
                'success'
            );
        } else {
            BlogAdmin.showToast(
                validPosts.length + ' yazı içe aktarıldı.' +
                (skipped > 0 ? ' ' + skipped + ' yazı atlandı.' : ''),
                'success'
            );
        }

        // Admin'e aktar
        BlogAdmin.setPosts(validPosts);

        console.log('[BlogAdminImport] ' + validPosts.length + ' yazı içe aktarıldı.');
    }

    /* ========================================= */
    /*            YAZI DOĞRULAMA                  */
    /* ========================================= */

    /**
     * Tek bir yazı objesini doğrular ve temizler
     * @param {Object} post - Ham yazı verisi
     * @param {number} index - Sıra numarası
     * @returns {Object|null} Temizlenmiş yazı veya null
     */
    function validatePost(post, index) {
        if (!post || typeof post !== 'object') return null;

        // Başlık zorunlu
        var title = (post.title || '').trim();
        if (!title) {
            console.warn('[BlogAdminImport] Yazı #' + (index + 1) + ' atlandı: Başlık yok.');
            return null;
        }

        return {
            id: post.id || (index + 1),
            title: title,
            date: (post.date || '').trim(),
            tag: (post.tag || '').trim(),
            excerpt: (post.excerpt || '').trim(),
            cover: (post.cover || '').trim(),
            slug: (post.slug || '').trim(),
            content: (post.content || '').trim()
        };
    }

    /* ========================================= */
    /*         YAZILARI BİRLEŞTİRME              */
    /* ========================================= */

    /**
     * Mevcut yazılarla yeni yazıları birleştirir
     * Aynı slug veya ID varsa günceller, yoksa ekler
     * @param {Array} existing - Mevcut yazılar
     * @param {Array} incoming - Yeni gelen yazılar
     * @returns {Array} Birleştirilmiş yazı listesi
     */
    function mergePosts(existing, incoming) {
        var merged = existing.slice(); // Kopyala

        incoming.forEach(function (newPost) {
            // Aynı slug veya ID'ye sahip mevcut yazıyı bul
            var existIndex = merged.findIndex(function (p) {
                return (newPost.slug && p.slug === newPost.slug) ||
                       (newPost.id && p.id === newPost.id);
            });

            if (existIndex !== -1) {
                // Güncelle
                merged[existIndex] = newPost;
                merged[existIndex].id = merged[existIndex].id || newPost.id;
            } else {
                // Yeni ekle — benzersiz ID ata
                var maxId = 0;
                merged.forEach(function (p) {
                    if (p.id > maxId) maxId = p.id;
                });
                newPost.id = maxId + 1;
                merged.push(newPost);
            }
        });

        return merged;
    }

    /* ========================================= */
    /*          DOSYA INPUT SIFIRLAMA             */
    /* ========================================= */

    function resetFileInput(input) {
        if (input) input.value = '';
    }

    /* ========================================= */
    /*              PUBLIC API                   */
    /* ========================================= */

    return {
        init: init
    };

})();


/* ============================================= */
/*         SAYFA YÜKLENDIĞINDE BAŞLAT             */
/* ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    BlogAdminImport.init();
});