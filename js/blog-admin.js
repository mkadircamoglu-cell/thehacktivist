/* ============================================= */
/*        BLOG ADMIN PANELİ ANA MANTIK           */
/*    CRUD İşlemleri + Canlı Önizleme + Arama    */
/* ============================================= */

const BlogAdmin = (function () {

    /* ========================================= */
    /*              DOM REFERANSLARI              */
    /* ========================================= */

    const DOM = {
        // Form
        form: document.getElementById('post-form'),
        formPanelTitle: document.getElementById('form-panel-title'),
        formResetBtn: document.getElementById('form-reset-btn'),
        formSubmitBtn: document.getElementById('form-submit-btn'),
        postId: document.getElementById('post-id'),
        postTitle: document.getElementById('post-title'),
        postDate: document.getElementById('post-date'),
        postTag: document.getElementById('post-tag'),
        postExcerpt: document.getElementById('post-excerpt'),
        postCover: document.getElementById('post-cover'),
        postUrl: document.getElementById('post-url'),
        titleCount: document.getElementById('title-count'),
        excerptCount: document.getElementById('excerpt-count'),

        // Liste
        postsList: document.getElementById('posts-list'),
        emptyList: document.getElementById('empty-list'),
        searchInput: document.getElementById('search-input'),
        postCount: document.getElementById('post-count'),

        // Önizleme
        previewCard: document.getElementById('preview-card'),
        previewCover: document.getElementById('preview-cover'),
        previewCoverImg: document.getElementById('preview-cover-img'),
        previewDate: document.getElementById('preview-date'),
        previewTag: document.getElementById('preview-tag'),
        previewTitle: document.getElementById('preview-title'),
        previewExcerpt: document.getElementById('preview-excerpt'),
        previewReadmore: document.getElementById('preview-readmore'),

        // Modaller
        deleteModal: document.getElementById('delete-modal'),
        deleteModalText: document.getElementById('delete-modal-text'),
        deleteCancel: document.getElementById('delete-cancel'),
        deleteConfirm: document.getElementById('delete-confirm'),
        clearModal: document.getElementById('clear-modal'),
        clearCancel: document.getElementById('clear-cancel'),
        clearConfirm: document.getElementById('clear-confirm'),
        clearAllBtn: document.getElementById('clear-all-btn'),

        // Toast
        toastContainer: document.getElementById('toast-container')
    };

    /* ========================================= */
    /*              VERİ DEPOSU                  */
    /* ========================================= */

    var posts = [];
    var editingId = null;
    var deleteTargetId = null;

    /* ========================================= */
    /*             TÜRKÇE AY İSİMLERİ            */
    /* ========================================= */

    const MONTHS = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    /* ========================================= */
    /*              BAŞLATICI (INIT)              */
    /* ========================================= */

    function init() {
        console.log('[BlogAdmin] Panel başlatılıyor...');

        setDefaultDate();
        bindEvents();

        // Önce localStorage'a bak
        var loaded = loadFromStorage();

        if (loaded) {
            renderList();
            updatePostCount();
            console.log('[BlogAdmin] Panel hazır. (' + posts.length + ' yazı localStorage\'dan)');
        } else {
            loadFromJSON();
        }
    }

    /* ========================================= */
    /*        LOCALSTORAGE'DAN YÜKLE              */
    /* ========================================= */

    function loadFromStorage() {
        try {
            var stored = localStorage.getItem('blog_admin_posts');
            if (stored) {
                var parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    posts = parsed;
                    console.log('[BlogAdmin] ' + posts.length + ' yazı localStorage\'dan okundu.');
                    return true;
                }
            }
        } catch (e) {
            console.warn('[BlogAdmin] localStorage okuma hatası:', e);
        }
        return false;
    }

    /* ========================================= */
    /*          BLOG.JSON'DAN YÜKLE              */
    /* ========================================= */

    function loadFromJSON() {
        console.log('[BlogAdmin] localStorage boş, blog.json fetch ediliyor...');

        fetch('blog.json')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (data) {
                var loaded = [];

                if (Array.isArray(data)) {
                    loaded = data;
                } else if (data && data.posts && Array.isArray(data.posts)) {
                    loaded = data.posts;
                }

                if (loaded.length > 0) {
                    posts = loaded;
                    saveToStorage();
                    renderList();
                    updatePostCount();
                    showToast(posts.length + ' yazı yüklendi.', 'success');
                    console.log('[BlogAdmin] ' + posts.length + ' yazı blog.json\'dan yüklendi.');
                } else {
                    renderList();
                    updatePostCount();
                    console.log('[BlogAdmin] blog.json boş.');
                }
            })
            .catch(function (err) {
                console.warn('[BlogAdmin] blog.json yüklenemedi:', err.message);
                renderList();
                updatePostCount();
            });
    }

    /* ========================================= */
    /*        LOCALSTORAGE'A KAYDET              */
    /* ========================================= */

    function saveToStorage() {
        try {
            localStorage.setItem('blog_admin_posts', JSON.stringify(posts));
        } catch (e) {
            console.warn('[BlogAdmin] localStorage kayıt hatası:', e);
        }
    }

    /* ========================================= */
    /*            OLAY DİNLEYİCİLERİ             */
    /* ========================================= */

    function bindEvents() {
        // Form gönderimi
        if (DOM.form) {
            DOM.form.addEventListener('submit', handleFormSubmit);
        }

        // Form sıfırlama
        if (DOM.formResetBtn) {
            DOM.formResetBtn.addEventListener('click', resetForm);
        }

        // Karakter sayaçları
        if (DOM.postTitle) {
            DOM.postTitle.addEventListener('input', function () {
                updateCharCount(this, DOM.titleCount, 120);
                updatePreview();
            });
        }

        if (DOM.postExcerpt) {
            DOM.postExcerpt.addEventListener('input', function () {
                updateCharCount(this, DOM.excerptCount, 300);
                updatePreview();
            });
        }

        // Diğer form alanları → Önizleme güncelle
        if (DOM.postDate) {
            DOM.postDate.addEventListener('input', updatePreview);
        }

        if (DOM.postTag) {
            DOM.postTag.addEventListener('input', updatePreview);
        }

        if (DOM.postCover) {
            DOM.postCover.addEventListener('input', updatePreview);
        }

        if (DOM.postUrl) {
            DOM.postUrl.addEventListener('input', updatePreview);
        }

        // Arama
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', handleSearch);
        }

        // Silme modalı
        if (DOM.deleteCancel) {
            DOM.deleteCancel.addEventListener('click', closeDeleteModal);
        }

        if (DOM.deleteConfirm) {
            DOM.deleteConfirm.addEventListener('click', confirmDelete);
        }

        // Tümünü sil modalı
        if (DOM.clearAllBtn) {
            DOM.clearAllBtn.addEventListener('click', openClearModal);
        }

        if (DOM.clearCancel) {
            DOM.clearCancel.addEventListener('click', closeClearModal);
        }

        if (DOM.clearConfirm) {
            DOM.clearConfirm.addEventListener('click', confirmClearAll);
        }

        // Modal backdrop tıklama
        document.querySelectorAll('.ba-modal-backdrop').forEach(function (backdrop) {
            backdrop.addEventListener('click', function () {
                closeDeleteModal();
                closeClearModal();
            });
        });

        // ESC tuşu ile modal kapatma
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeDeleteModal();
                closeClearModal();
            }
        });
    }

    /* ========================================= */
    /*           FORM GÖNDERİM İŞLEMİ            */
    /* ========================================= */

    function handleFormSubmit(e) {
        e.preventDefault();

        var title = DOM.postTitle.value.trim();
        var date = DOM.postDate.value;
        var tag = DOM.postTag.value.trim();
        var excerpt = DOM.postExcerpt.value.trim();
        var cover = DOM.postCover.value.trim();
        var url = DOM.postUrl.value.trim();

        // Validasyon
        if (!title) {
            showToast('Başlık alanı zorunludur.', 'error');
            DOM.postTitle.focus();
            return;
        }

        if (!date) {
            showToast('Tarih alanı zorunludur.', 'error');
            DOM.postDate.focus();
            return;
        }

        if (!excerpt) {
            showToast('Kısa özet alanı zorunludur.', 'error');
            DOM.postExcerpt.focus();
            return;
        }

        // Slug oluştur
        var slug = generateSlug(title);

        if (editingId !== null) {
            // ---- GÜNCELLEME ----
            var index = posts.findIndex(function (p) { return p.id === editingId; });

            if (index !== -1) {
                posts[index].title = title;
                posts[index].date = date;
                posts[index].tag = tag;
                posts[index].excerpt = excerpt;
                posts[index].cover = cover;
                posts[index].url = url;
                posts[index].slug = slug;

                showToast('Yazı güncellendi!', 'success');
                console.log('[BlogAdmin] Yazı güncellendi: ' + title);
            }

            editingId = null;

        } else {
            // ---- YENİ EKLEME ----
            var newId = generateId();

            var newPost = {
                id: newId,
                title: title,
                date: date,
                tag: tag,
                excerpt: excerpt,
                cover: cover,
                url: url,
                slug: slug
            };

            posts.push(newPost);

            showToast('Yazı eklendi!', 'success');
            console.log('[BlogAdmin] Yeni yazı eklendi: ' + title);
        }

        // Kaydet, listele, formu sıfırla
        saveToStorage();
        renderList();
        updatePostCount();
        resetForm();
    }

    /* ========================================= */
    /*              DÜZENLEME MODU               */
    /* ========================================= */

    function startEdit(id) {
        var post = posts.find(function (p) { return p.id === id; });
        if (!post) return;

        editingId = id;

        // Formu doldur
        DOM.postId.value = id;
        DOM.postTitle.value = post.title || '';
        DOM.postDate.value = post.date || '';
        DOM.postTag.value = post.tag || '';
        DOM.postExcerpt.value = post.excerpt || '';
        DOM.postCover.value = post.cover || '';
        DOM.postUrl.value = post.url || '';

        // Karakter sayaçlarını güncelle
        updateCharCount(DOM.postTitle, DOM.titleCount, 120);
        updateCharCount(DOM.postExcerpt, DOM.excerptCount, 300);

        // UI değiştir → Düzenleme modu
        DOM.formPanelTitle.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg> Yazıyı Düzenle';

        DOM.formSubmitBtn.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>' +
            '<polyline points="17 21 17 13 7 13 7 21"/>' +
            '<polyline points="7 3 7 8 15 8"/>' +
            '</svg> Güncelle';

        DOM.formResetBtn.classList.remove('hidden');

        // Liste öğesini vurgula
        highlightListItem(id);

        // Önizlemeyi güncelle
        updatePreview();

        // Forma scroll et
        DOM.form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('Düzenleme modu açıldı.', 'info');
    }

    /* ========================================= */
    /*              SİLME İŞLEMLERİ              */
    /* ========================================= */

    function openDeleteModal(id) {
        var post = posts.find(function (p) { return p.id === id; });
        if (!post) return;

        deleteTargetId = id;

        if (DOM.deleteModalText) {
            DOM.deleteModalText.textContent = '"' + post.title + '" yazısını silmek istediğinize emin misiniz?';
        }

        if (DOM.deleteModal) {
            DOM.deleteModal.classList.remove('hidden');
        }
    }

    function closeDeleteModal() {
        deleteTargetId = null;

        if (DOM.deleteModal) {
            DOM.deleteModal.classList.add('hidden');
        }
    }

    function confirmDelete() {
        if (deleteTargetId === null) return;

        var index = posts.findIndex(function (p) { return p.id === deleteTargetId; });

        if (index !== -1) {
            var title = posts[index].title;
            posts.splice(index, 1);

            if (editingId === deleteTargetId) {
                resetForm();
            }

            saveToStorage();
            renderList();
            updatePostCount();

            showToast('"' + title + '" silindi.', 'success');
            console.log('[BlogAdmin] Yazı silindi: ' + title);
        }

        closeDeleteModal();
    }

    /* ========================================= */
    /*          TÜMÜNÜ SİL İŞLEMLERİ             */
    /* ========================================= */

    function openClearModal() {
        if (posts.length === 0) {
            showToast('Silinecek yazı yok.', 'warning');
            return;
        }

        if (DOM.clearModal) {
            DOM.clearModal.classList.remove('hidden');
        }
    }

    function closeClearModal() {
        if (DOM.clearModal) {
            DOM.clearModal.classList.add('hidden');
        }
    }

    function confirmClearAll() {
        var count = posts.length;
        posts = [];

        resetForm();
        saveToStorage();
        renderList();
        updatePostCount();

        closeClearModal();

        showToast(count + ' yazı silindi.', 'success');
        console.log('[BlogAdmin] Tüm yazılar silindi.');
    }

    /* ========================================= */
    /*          LİSTEYİ RENDER ET                */
    /* ========================================= */

    function renderList(filter) {
        if (!DOM.postsList) return;

        DOM.postsList.innerHTML = '';

        // Filtreleme
        var filtered = posts;
        if (filter && filter.trim() !== '') {
            var q = filter.toLowerCase();
            filtered = posts.filter(function (p) {
                return (p.title && p.title.toLowerCase().includes(q)) ||
                       (p.tag && p.tag.toLowerCase().includes(q)) ||
                       (p.excerpt && p.excerpt.toLowerCase().includes(q));
            });
        }

        // Tarihe göre sırala (en yeni üstte)
        filtered.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        if (filtered.length === 0) {
            if (DOM.emptyList) DOM.emptyList.classList.remove('hidden');
            return;
        }

        if (DOM.emptyList) DOM.emptyList.classList.add('hidden');

        var fragment = document.createDocumentFragment();

        filtered.forEach(function (post) {
            var item = createListItem(post);
            if (item) fragment.appendChild(item);
        });

        DOM.postsList.appendChild(fragment);
    }

    /**
     * Tek bir yazı satırı oluşturur
     */
    function createListItem(post) {
        var div = document.createElement('div');
        div.className = 'ba-post-item';
        div.setAttribute('data-id', post.id);

        if (editingId === post.id) {
            div.classList.add('active');
        }

        var hasURL = post.url && post.url.trim() !== '';
        var statusClass = hasURL ? 'published' : 'draft';
        var statusText = hasURL ? 'Yayında' : 'Taslak';

        var html = '';

        // Bilgi
        html += '<div class="ba-post-item-info">';
        html += '<span class="ba-post-item-title">' + escapeHTML(post.title) + '</span>';
        html += '<div class="ba-post-item-meta">';
        if (post.date) {
            html += '<span class="ba-post-item-date">' + formatDate(post.date) + '</span>';
        }
        if (post.tag) {
            html += '<span class="ba-post-item-tag">' + escapeHTML(post.tag) + '</span>';
        }
        html += '<span class="ba-post-item-status ' + statusClass + '">' + statusText + '</span>';
        html += '</div>';
        html += '</div>';

        // Aksiyonlar
        html += '<div class="ba-post-item-actions">';

        // Düzenle
        html += '<button class="ba-btn-icon edit-btn" data-id="' + post.id + '" aria-label="Düzenle">';
        html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        html += '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>';
        html += '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
        html += '</svg>';
        html += '</button>';

        // Sil
        html += '<button class="ba-btn-icon delete-btn" data-id="' + post.id + '" aria-label="Sil">';
        html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        html += '<polyline points="3 6 5 6 21 6"/>';
        html += '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
        html += '</svg>';
        html += '</button>';

        html += '</div>';

        div.innerHTML = html;

        // Olay dinleyicileri
        var editBtn = div.querySelector('.edit-btn');
        var deleteBtn = div.querySelector('.delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                startEdit(post.id);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openDeleteModal(post.id);
            });
        }

        // Satıra tıklama → Düzenle
        div.addEventListener('click', function () {
            startEdit(post.id);
        });

        return div;
    }

    /* ========================================= */
    /*            CANLI ÖNİZLEME                 */
    /* ========================================= */

    function updatePreview() {
        var title = DOM.postTitle ? DOM.postTitle.value.trim() : '';
        var date = DOM.postDate ? DOM.postDate.value : '';
        var tag = DOM.postTag ? DOM.postTag.value.trim() : '';
        var excerpt = DOM.postExcerpt ? DOM.postExcerpt.value.trim() : '';
        var cover = DOM.postCover ? DOM.postCover.value.trim() : '';
        var url = DOM.postUrl ? DOM.postUrl.value.trim() : '';

        // Başlık
        if (DOM.previewTitle) {
            DOM.previewTitle.textContent = title || 'Yazı başlığı buraya gelecek...';
        }

        // Tarih
        if (DOM.previewDate) {
            DOM.previewDate.textContent = date ? formatDate(date) : 'Tarih seçilmedi';
        }

        // Etiket
        if (DOM.previewTag) {
            if (tag) {
                DOM.previewTag.textContent = tag;
                DOM.previewTag.classList.remove('hidden');
            } else {
                DOM.previewTag.classList.add('hidden');
            }
        }

        // Özet
        if (DOM.previewExcerpt) {
            DOM.previewExcerpt.textContent = excerpt || 'Kısa özet metni buraya gelecek...';
        }

        // Kapak görseli
        if (DOM.previewCover && DOM.previewCoverImg) {
            if (cover) {
                DOM.previewCoverImg.src = cover;
                DOM.previewCoverImg.onerror = function () {
                    DOM.previewCover.classList.add('hidden');
                };
                DOM.previewCoverImg.onload = function () {
                    DOM.previewCover.classList.remove('hidden');
                };
                DOM.previewCover.classList.remove('hidden');
            } else {
                DOM.previewCover.classList.add('hidden');
            }
        }

        // Devamını Oku / Platform
        if (DOM.previewReadmore) {
            if (url) {
                var platform = detectPlatform(url);
                var text = platform ? ('Okumaya Git · ' + platform) : 'Devamını Oku';
                DOM.previewReadmore.innerHTML = text +
                    ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
                    '<polyline points="15 3 21 3 21 9"/>' +
                    '<line x1="10" y1="14" x2="21" y2="3"/>' +
                    '</svg>';
            } else {
                DOM.previewReadmore.innerHTML = 'Devamını Oku' +
                    ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<line x1="5" y1="12" x2="19" y2="12"/>' +
                    '<polyline points="12 5 19 12 12 19"/>' +
                    '</svg>';
            }
        }
    }

    /* ========================================= */
    /*          PLATFORM TESPİT FONKSİYONU       */
    /* ========================================= */

    function detectPlatform(url) {
        if (!url) return null;
        var lower = url.toLowerCase();

        if (lower.includes('medium.com'))    return 'Medium';
        if (lower.includes('dev.to'))        return 'Dev.to';
        if (lower.includes('hashnode'))      return 'Hashnode';
        if (lower.includes('substack.com'))  return 'Substack';
        if (lower.includes('wordpress.com')) return 'WordPress';
        if (lower.includes('blogger.com'))   return 'Blogger';
        if (lower.includes('ghost.io'))      return 'Ghost';
        if (lower.includes('notion.so') || lower.includes('notion.site')) return 'Notion';
        if (lower.includes('telegraph'))     return 'Telegraph';
        if (lower.includes('github.io') || lower.includes('github.com')) return 'GitHub';

        return null;
    }

    /* ========================================= */
    /*              FORM SIFIRLAMA               */
    /* ========================================= */

    function resetForm() {
        editingId = null;

        if (DOM.form) DOM.form.reset();
        if (DOM.postId) DOM.postId.value = '';

        // Bugünün tarihini tekrar ayarla
        setDefaultDate();

        // UI geri yükle
        if (DOM.formPanelTitle) {
            DOM.formPanelTitle.innerHTML =
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="12" y1="5" x2="12" y2="19"/>' +
                '<line x1="5" y1="12" x2="19" y2="12"/>' +
                '</svg> Yeni Yazı Ekle';
        }

        if (DOM.formSubmitBtn) {
            DOM.formSubmitBtn.innerHTML =
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<line x1="12" y1="5" x2="12" y2="19"/>' +
                '<line x1="5" y1="12" x2="19" y2="12"/>' +
                '</svg> Yazı Ekle';
        }

        if (DOM.formResetBtn) {
            DOM.formResetBtn.classList.add('hidden');
        }

        // Karakter sayaçlarını sıfırla
        if (DOM.titleCount) DOM.titleCount.textContent = '0';
        if (DOM.excerptCount) DOM.excerptCount.textContent = '0';

        // Aktif satır vurgusunu kaldır
        clearListHighlight();

        // Önizlemeyi sıfırla
        updatePreview();
    }

    /* ========================================= */
    /*                ARAMA                      */
    /* ========================================= */

    function handleSearch() {
        var query = DOM.searchInput ? DOM.searchInput.value : '';
        renderList(query);
    }

    /* ========================================= */
    /*          KARAKTER SAYACI                   */
    /* ========================================= */

    function updateCharCount(input, counter, max) {
        if (!input || !counter) return;

        var length = input.value.length;
        counter.textContent = length;

        var parent = counter.parentElement;
        if (!parent) return;

        parent.classList.remove('limit-near', 'limit-reached');

        if (length >= max) {
            parent.classList.add('limit-reached');
        } else if (length >= max * 0.85) {
            parent.classList.add('limit-near');
        }
    }

    /* ========================================= */
    /*         LİSTE VURGULAMA                   */
    /* ========================================= */

    function highlightListItem(id) {
        clearListHighlight();

        var item = DOM.postsList.querySelector('[data-id="' + id + '"]');
        if (item) {
            item.classList.add('active');
        }
    }

    function clearListHighlight() {
        if (!DOM.postsList) return;

        DOM.postsList.querySelectorAll('.ba-post-item.active').forEach(function (el) {
            el.classList.remove('active');
        });
    }

    /* ========================================= */
    /*          YAZI SAYACI GÜNCELLE              */
    /* ========================================= */

    function updatePostCount() {
        if (DOM.postCount) {
            var count = posts.length;
            DOM.postCount.textContent = count + ' yazı';
        }
    }

    /* ========================================= */
    /*          VARSAYILAN TARİH AYARLA           */
    /* ========================================= */

    function setDefaultDate() {
        if (!DOM.postDate) return;

        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var dd = String(today.getDate()).padStart(2, '0');

        DOM.postDate.value = yyyy + '-' + mm + '-' + dd;
    }

    /* ========================================= */
    /*            YARDIMCI FONKSİYONLAR           */
    /* ========================================= */

    /**
     * Benzersiz ID oluşturur
     */
    function generateId() {
        var maxId = 0;
        posts.forEach(function (p) {
            if (p.id && p.id > maxId) maxId = p.id;
        });
        return maxId + 1;
    }

    /**
     * Başlıktan URL-dostu slug oluşturur
     */
    function generateSlug(title) {
        var trMap = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
        };

        return title
            .replace(/[çğıöşüÇĞİÖŞÜ]/g, function (match) { return trMap[match] || match; })
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 80);
    }

    /**
     * Tarih formatlama: "2025-01-15" → "15 Ocak 2025"
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

            return day + ' ' + MONTHS[monthIndex] + ' ' + year;
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * XSS koruması
     */
    function escapeHTML(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /* ========================================= */
    /*           TOAST BİLDİRİM SİSTEMİ          */
    /* ========================================= */

    function showToast(message, type) {
        if (!DOM.toastContainer) return;

        type = type || 'info';

        var icons = {
            success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        var toast = document.createElement('div');
        toast.className = 'ba-toast ' + type;
        toast.innerHTML = (icons[type] || icons.info) + '<span>' + escapeHTML(message) + '</span>';

        DOM.toastContainer.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('fade-out');
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /* ========================================= */
    /*              PUBLIC API                   */
    /* ========================================= */

    return {
        init: init,
        getPosts: function () { return posts; },
        setPosts: function (newPosts) {
            posts = newPosts;
            saveToStorage();
            renderList();
            updatePostCount();
        },
        showToast: showToast
    };

})();


/* ============================================= */
/*         SAYFA YÜKLENDIĞINDE BAŞLAT             */
/* ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    BlogAdmin.init();
});