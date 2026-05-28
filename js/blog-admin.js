/* ============================================= */
/*        BLOG ADMIN PANELİ ANA MANTIK           */
/*    CRUD İşlemleri + Canlı Önizleme + Arama    */
/* ============================================= */
const BlogAdmin = (function () {
    /* ========================================= */
    /*              DOM REFERANSLARI              */
    /* ========================================= */
    const DOM = {
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
        postContent: document.getElementById('post-content'), // URL yerine Content geldi
        
        titleCount: document.getElementById('title-count'),
        excerptCount: document.getElementById('excerpt-count'),
        
        postsList: document.getElementById('posts-list'),
        emptyList: document.getElementById('empty-list'),
        searchInput: document.getElementById('search-input'),
        postCount: document.getElementById('post-count'),
        
        previewCard: document.getElementById('preview-card'),
        previewCover: document.getElementById('preview-cover'),
        previewCoverImg: document.getElementById('preview-cover-img'),
        previewDate: document.getElementById('preview-date'),
        previewTag: document.getElementById('preview-tag'),
        previewTitle: document.getElementById('preview-title'),
        previewExcerpt: document.getElementById('preview-excerpt'),
        previewReadmore: document.getElementById('preview-readmore'),
        
        deleteModal: document.getElementById('delete-modal'),
        deleteModalText: document.getElementById('delete-modal-text'),
        deleteCancel: document.getElementById('delete-cancel'),
        deleteConfirm: document.getElementById('delete-confirm'),
        
        clearModal: document.getElementById('clear-modal'),
        clearCancel: document.getElementById('clear-cancel'),
        clearConfirm: document.getElementById('clear-confirm'),
        clearAllBtn: document.getElementById('clear-all-btn'),
        
        toastContainer: document.getElementById('toast-container')
    };

    var posts = [];
    var editingId = null;
    var deleteTargetId = null;

    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    function init() {
        setDefaultDate();
        bindEvents();
        var loaded = loadFromStorage();
        if (loaded) {
            renderList();
            updatePostCount();
        } else {
            loadFromJSON();
        }
    }

    function loadFromStorage() {
        try {
            var stored = localStorage.getItem('blog_admin_posts');
            if (stored) {
                var parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    posts = parsed;
                    return true;
                }
            }
        } catch (e) { console.warn(e); }
        return false;
    }

    function loadFromJSON() {
        fetch('blog.json')
            .then(res => { if (!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                var loaded = Array.isArray(data) ? data : (data.posts || []);
                if (loaded.length > 0) {
                    posts = loaded;
                    saveToStorage();
                    renderList();
                    updatePostCount();
                } else {
                    renderList();
                    updatePostCount();
                }
            })
            .catch(err => {
                renderList();
                updatePostCount();
            });
    }

    function saveToStorage() {
        try { localStorage.setItem('blog_admin_posts', JSON.stringify(posts)); } catch (e) {}
    }

    function bindEvents() {
        if (DOM.form) DOM.form.addEventListener('submit', handleFormSubmit);
        if (DOM.formResetBtn) DOM.formResetBtn.addEventListener('click', resetForm);
        
        if (DOM.postTitle) DOM.postTitle.addEventListener('input', function () { updateCharCount(this, DOM.titleCount, 120); updatePreview(); });
        if (DOM.postExcerpt) DOM.postExcerpt.addEventListener('input', function () { updateCharCount(this, DOM.excerptCount, 300); updatePreview(); });
        if (DOM.postDate) DOM.postDate.addEventListener('input', updatePreview);
        if (DOM.postTag) DOM.postTag.addEventListener('input', updatePreview);
        if (DOM.postCover) DOM.postCover.addEventListener('input', updatePreview);
        if (DOM.postContent) DOM.postContent.addEventListener('input', updatePreview); // URL yerine Content geldi
        
        if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearch);
        if (DOM.deleteCancel) DOM.deleteCancel.addEventListener('click', closeDeleteModal);
        if (DOM.deleteConfirm) DOM.deleteConfirm.addEventListener('click', confirmDelete);
        if (DOM.clearAllBtn) DOM.clearAllBtn.addEventListener('click', openClearModal);
        if (DOM.clearCancel) DOM.clearCancel.addEventListener('click', closeClearModal);
        if (DOM.clearConfirm) DOM.clearConfirm.addEventListener('click', confirmClearAll);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        var title = DOM.postTitle.value.trim();
        var date = DOM.postDate.value;
        var tag = DOM.postTag.value.trim();
        var excerpt = DOM.postExcerpt.value.trim();
        var cover = DOM.postCover.value.trim();
        var content = DOM.postContent.value.trim();

        if (!title) { showToast('Başlık zorunludur.', 'error'); return; }
        if (!date) { showToast('Tarih zorunludur.', 'error'); return; }
        if (!excerpt) { showToast('Özet zorunludur.', 'error'); return; }

        var slug = generateSlug(title);

        if (editingId !== null) {
            var index = posts.findIndex(p => p.id === editingId);
            if (index !== -1) {
                posts[index].title = title;
                posts[index].date = date;
                posts[index].tag = tag;
                posts[index].excerpt = excerpt;
                posts[index].cover = cover;
                posts[index].content = content;
                posts[index].slug = slug;
                showToast('Yazı güncellendi!', 'success');
            }
            editingId = null;
        } else {
            var newId = generateId();
            posts.push({
                id: newId,
                title: title,
                date: date,
                tag: tag,
                excerpt: excerpt,
                cover: cover,
                content: content,
                slug: slug
            });
            showToast('Yazı eklendi!', 'success');
        }

        saveToStorage();
        renderList();
        updatePostCount();
        resetForm();
    }

    function startEdit(id) {
        var post = posts.find(p => p.id === id);
        if (!post) return;
        editingId = id;
        DOM.postId.value = id;
        DOM.postTitle.value = post.title || '';
        DOM.postDate.value = post.date || '';
        DOM.postTag.value = post.tag || '';
        DOM.postExcerpt.value = post.excerpt || '';
        DOM.postCover.value = post.cover || '';
        DOM.postContent.value = post.content || '';
        
        updateCharCount(DOM.postTitle, DOM.titleCount, 120);
        updateCharCount(DOM.postExcerpt, DOM.excerptCount, 300);
        
        DOM.formPanelTitle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Yazıyı Düzenle';
        DOM.formSubmitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Güncelle';
        DOM.formResetBtn.classList.remove('hidden');
        
        highlightListItem(id);
        updatePreview();
        DOM.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openDeleteModal(id) {
        var post = posts.find(p => p.id === id);
        if (!post) return;
        deleteTargetId = id;
        DOM.deleteModalText.textContent = '"' + post.title + '" yazısını silmek istediğinize emin misiniz?';
        DOM.deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteTargetId = null;
        if (DOM.deleteModal) DOM.deleteModal.classList.add('hidden');
    }

    function confirmDelete() {
        if (deleteTargetId === null) return;
        var index = posts.findIndex(p => p.id === deleteTargetId);
        if (index !== -1) {
            posts.splice(index, 1);
            if (editingId === deleteTargetId) resetForm();
            saveToStorage();
            renderList();
            updatePostCount();
            showToast('Yazı silindi.', 'success');
        }
        closeDeleteModal();
    }

    function openClearModal() {
        if (posts.length === 0) return;
        DOM.clearModal.classList.remove('hidden');
    }

    function closeClearModal() { DOM.clearModal.classList.add('hidden'); }

    function confirmClearAll() {
        posts = [];
        resetForm();
        saveToStorage();
        renderList();
        updatePostCount();
        closeClearModal();
        showToast('Tüm yazılar silindi.', 'success');
    }

    function renderList(filter) {
        if (!DOM.postsList) return;
        DOM.postsList.innerHTML = '';
        var filtered = posts;
        
        if (filter && filter.trim() !== '') {
            var q = filter.toLowerCase();
            filtered = posts.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.tag && p.tag.toLowerCase().includes(q)));
        }
        
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filtered.length === 0) {
            if (DOM.emptyList) DOM.emptyList.classList.remove('hidden');
            return;
        }
        if (DOM.emptyList) DOM.emptyList.classList.add('hidden');
        
        var fragment = document.createDocumentFragment();
        filtered.forEach(post => fragment.appendChild(createListItem(post)));
        DOM.postsList.appendChild(fragment);
    }

    function createListItem(post) {
        var div = document.createElement('div');
        div.className = 'ba-post-item' + (editingId === post.id ? ' active' : '');
        div.setAttribute('data-id', post.id);
        
        var hasContent = post.content && post.content.trim() !== '';
        var statusClass = hasContent ? 'published' : 'draft';
        var statusText = hasContent ? 'Yayında' : 'Taslak';
        
        div.innerHTML = `
            <div class="ba-post-item-info">
                <span class="ba-post-item-title">${escapeHTML(post.title)}</span>
                <div class="ba-post-item-meta">
                    <span class="ba-post-item-date">${formatDate(post.date)}</span>
                    <span class="ba-post-item-tag">${escapeHTML(post.tag)}</span>
                    <span class="ba-post-item-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="ba-post-item-actions">
                <button class="ba-btn-icon edit-btn" data-id="${post.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="ba-btn-icon delete-btn" data-id="${post.id}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"/></svg></button>
            </div>
        `;
        
        div.querySelector('.edit-btn').addEventListener('click', e => { e.stopPropagation(); startEdit(post.id); });
        div.querySelector('.delete-btn').addEventListener('click', e => { e.stopPropagation(); openDeleteModal(post.id); });
        div.addEventListener('click', () => startEdit(post.id));
        
        return div;
    }

    function updatePreview() {
        var title = DOM.postTitle ? DOM.postTitle.value.trim() : '';
        var date = DOM.postDate ? DOM.postDate.value : '';
        var tag = DOM.postTag ? DOM.postTag.value.trim() : '';
        var excerpt = DOM.postExcerpt ? DOM.postExcerpt.value.trim() : '';
        var cover = DOM.postCover ? DOM.postCover.value.trim() : '';
        var content = DOM.postContent ? DOM.postContent.value.trim() : '';

        if (DOM.previewTitle) DOM.previewTitle.textContent = title || 'Yazı başlığı buraya gelecek...';
        if (DOM.previewDate) DOM.previewDate.textContent = date ? formatDate(date) : 'Tarih seçilmedi';
        
        if (DOM.previewTag) {
            DOM.previewTag.textContent = tag;
            tag ? DOM.previewTag.classList.remove('hidden') : DOM.previewTag.classList.add('hidden');
        }
        if (DOM.previewExcerpt) DOM.previewExcerpt.textContent = excerpt || 'Özet metni buraya gelecek...';
        
        if (DOM.previewCover && DOM.previewCoverImg) {
            if (cover) {
                DOM.previewCoverImg.src = cover;
                DOM.previewCoverImg.onerror = () => DOM.previewCover.classList.add('hidden');
                DOM.previewCoverImg.onload = () => DOM.previewCover.classList.remove('hidden');
            } else {
                DOM.previewCover.classList.add('hidden');
            }
        }

        if (DOM.previewReadmore) {
            if (content) {
                DOM.previewReadmore.innerHTML = 'Okumaya Başla <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
            } else {
                DOM.previewReadmore.innerHTML = 'Yakında <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
            }
        }
    }

    function resetForm() {
        editingId = null;
        if (DOM.form) DOM.form.reset();
        if (DOM.postId) DOM.postId.value = '';
        setDefaultDate();
        
        if (DOM.formPanelTitle) DOM.formPanelTitle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Yeni Yazı Ekle';
        if (DOM.formSubmitBtn) DOM.formSubmitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Yazı Ekle';
        if (DOM.formResetBtn) DOM.formResetBtn.classList.add('hidden');
        
        if (DOM.titleCount) DOM.titleCount.textContent = '0';
        if (DOM.excerptCount) DOM.excerptCount.textContent = '0';
        clearListHighlight();
        updatePreview();
    }

    function handleSearch() { renderList(DOM.searchInput ? DOM.searchInput.value : ''); }

    function updateCharCount(input, counter, max) {
        if (!input || !counter) return;
        var length = input.value.length;
        counter.textContent = length;
        counter.parentElement.className = 'ba-char-count' + (length >= max ? ' limit-reached' : (length >= max * 0.85 ? ' limit-near' : ''));
    }

    function highlightListItem(id) {
        clearListHighlight();
        var item = DOM.postsList.querySelector(`[data-id="${id}"]`);
        if (item) item.classList.add('active');
    }

    function clearListHighlight() {
        if (!DOM.postsList) return;
        DOM.postsList.querySelectorAll('.ba-post-item.active').forEach(el => el.classList.remove('active'));
    }

    function updatePostCount() {
        if (DOM.postCount) DOM.postCount.textContent = posts.length + ' yazı';
    }

    function setDefaultDate() {
        if (!DOM.postDate) return;
        var today = new Date();
        DOM.postDate.value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }

    function generateId() {
        var maxId = 0;
        posts.forEach(p => { if (p.id > maxId) maxId = p.id; });
        return maxId + 1;
    }

    function generateSlug(title) {
        var trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
        return title.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => trMap[m]).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
    }

    function formatDate(dateStr) {
        try {
            var parts = dateStr.split('-');
            return parseInt(parts[2], 10) + ' ' + MONTHS[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
        } catch (e) { return dateStr; }
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type) {
        if (!DOM.toastContainer) return;
        var toast = document.createElement('div');
        toast.className = 'ba-toast ' + (type || 'info');
        toast.innerHTML = '<span>' + escapeHTML(message) + '</span>';
        DOM.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    return {
        init: init,
        getPosts: () => posts,
        setPosts: newPosts => { posts = newPosts; saveToStorage(); renderList(); updatePostCount(); },
        showToast: showToast
    };
})();

document.addEventListener('DOMContentLoaded', BlogAdmin.init);
