/* ============================================= */
/*       BLOG ADMIN — DIŞA AKTARMA (EXPORT)      */
/*    Yazıları blog.json olarak indirtme           */
/* ============================================= */

const BlogAdminExport = (function () {

    /* ========================================= */
    /*              BAŞLATICI                     */
    /* ========================================= */

    function init() {
        var exportBtn = document.getElementById('export-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', exportJSON);
        }
    }

    /* ========================================= */
    /*          JSON OLARAK DIŞA AKTAR           */
    /* ========================================= */

    function exportJSON() {
        var posts = BlogAdmin.getPosts();

        if (!posts || posts.length === 0) {
            BlogAdmin.showToast('Dışa aktarılacak yazı yok.', 'warning');
            return;
        }

        // blog.json formatına dönüştür
        var data = {
            posts: sanitizePosts(posts)
        };

        var jsonStr = JSON.stringify(data, null, 4);

        // Dosya oluştur ve indir
        downloadFile(jsonStr, 'blog.json', 'application/json');

        BlogAdmin.showToast(posts.length + ' yazı dışa aktarıldı.', 'success');
        console.log('[BlogAdminExport] blog.json indirildi. (' + posts.length + ' yazı)');
    }

    /* ========================================= */
    /*        VERİYİ TEMİZLE / FORMATLA          */
    /* ========================================= */

    /**
     * Yazıları dışa aktarım için temizler
     * Gereksiz alanları kaldırır, sıralama yapar
     */
    function sanitizePosts(posts) {
        // Tarihe göre sırala (en yeni üstte)
        var sorted = posts.slice().sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        return sorted.map(function (post, index) {
            return {
                id: index + 1,
                title: (post.title || '').trim(),
                date: (post.date || '').trim(),
                tag: (post.tag || '').trim(),
                excerpt: (post.excerpt || '').trim(),
                cover: (post.cover || '').trim(),
                slug: (post.slug || '').trim(),
                url: (post.url || '').trim()
            };
        });
    }

    /* ========================================= */
    /*           DOSYA İNDİRME FONKSİYONU        */
    /* ========================================= */

    /**
     * Metin içeriğini dosya olarak indirtir
     * @param {string} content - Dosya içeriği
     * @param {string} filename - Dosya adı
     * @param {string} mimeType - MIME tipi
     */
    function downloadFile(content, filename, mimeType) {
        var blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        var url = URL.createObjectURL(blob);

        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Temizlik
        setTimeout(function () {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
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
    BlogAdminExport.init();
});