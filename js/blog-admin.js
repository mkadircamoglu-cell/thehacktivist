/* ============================================= */
/*        BLOG ADMIN PANELİ ANA MANTIK           */
/* ============================================= */
const BlogAdmin = (function () {
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
        postContent: document.getElementById('post-content'), // URL yerine Content
        
        titleCount: document.getElementById('title-count'),
        excerptCount: document.getElementById('excerpt-count'),
        
        postsList: document.getElementById('posts-list'),
        emptyList: document.getElementById('empty-list'),
        searchInput: document.getElementById('search-input'),
        postCount: document.getElementById('post-count'),
        
        previewTitle: document.getElementById('preview-title'),
        previewDate: document.getElementById('preview-date'),
        previewTag: document.getElementById('preview-tag'),
        previewExcerpt: document.getElementById('preview-excerpt'),
        previewCoverImg: document.getElementById('preview-cover-img'),
        previewCover: document.getElementById('preview-cover'),
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

    let posts = [];
    let editingId = null;
    let deleteTargetId = null;

    const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    function init() {
        setDefaultDate();
        bindEvents();
        if (loadFromStorage()) {
            renderList();
            updatePostCount();
        } else {
            loadFromJSON();
        }
    }

    function bindEvents() {
        if (DOM.form) DOM.form.addEventListener('submit', handleFormSubmit);
        if (DOM.formResetBtn) DOM.formResetBtn.addEventListener('click', resetForm);
        
        ['postTitle', 'postDate', 'postTag', 'postExcerpt', 'postCover', 'postContent'].forEach(id => {
            if (DOM[id]) DOM[id].addEventListener('input', () => {
                updatePreview();
                if (id === 'postTitle') updateCharCount(DOM.postTitle, DOM.titleCount, 120);
                if (id === 'postExcerpt') updateCharCount(DOM.postExcerpt, DOM.excerptCount, 300);
            });
        });
        
        if (DOM.searchInput) DOM.searchInput.addEventListener('input', handleSearch);
        if (DOM.deleteCancel) DOM.deleteCancel.addEventListener('click', closeDeleteModal);
        if (DOM.deleteConfirm) DOM.deleteConfirm.addEventListener('click', confirmDelete);
        if (DOM.clearAllBtn) DOM.clearAllBtn.addEventListener('click', openClearModal);
        if (DOM.clearCancel) DOM.clearCancel.addEventListener('click', closeClearModal);
        if (DOM.clearConfirm) DOM.clearConfirm.addEventListener('click', confirmClearAll);
    }

    function handleFormSubmit(e) {
        e.preventDefault(); // SAYFA YENİLENMESİNİ ENGELLEYEN HAYATİ KOD
        
        const title = DOM.postTitle.value.trim();
        const date = DOM.postDate.value;
        const tag = DOM.postTag.value.trim();
        const excerpt = DOM.postExcerpt.value.trim();
        const cover = DOM.postCover.value.trim();
        const content = DOM.postContent.value.trim();

        if (!title || !date || !excerpt) {
            showToast('Lütfen zorunlu alanları doldurun.', 'error');
            return;
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 80);

        if (editingId !== null) {
            const index = posts.findIndex(p => p.id === editingId);
            if (index !== -1) {
                posts[index] = { ...posts[index], title, date, tag, excerpt, cover, content, slug };
                showToast('Yazı güncellendi!', 'success');
            }
            editingId = null;
        } else {
            const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
            posts.push({ id: newId, title, date, tag, excerpt, cover, content, slug });
            showToast('Yazı eklendi!', 'success');
        }

        saveToStorage();
        renderList();
        updatePostCount();
        resetForm();
    }

    function updatePreview() {
        const title = DOM.postTitle.value.trim() || 'Yazı başlığı buraya gelecek...';
        const date = DOM.postDate.value ? formatDate(DOM.postDate.value) : 'Tarih seçilmedi';
        const tag = DOM.postTag.value.trim();
        const excerpt = DOM.postExcerpt.value.trim() || 'Özet metni buraya gelecek...';
        const cover = DOM.postCover.value.trim();
        const content = DOM.postContent.value.trim();

        if (DOM.previewTitle) DOM.previewTitle.textContent = title;
        if (DOM.previewDate) DOM.previewDate.textContent = date;
        if (DOM.previewExcerpt) DOM.previewExcerpt.textContent = excerpt;
        
        if (DOM.previewTag) {
            DOM.previewTag.textContent = tag;
            DOM.previewTag.style.display = tag ? 'inline-block' : 'none';
        }

        if (DOM.previewCoverImg && DOM.previewCover) {
            if (cover) {
                DOM.previewCoverImg.src = cover;
                DOM.previewCover.style.display = 'block';
            } else {
                DOM.previewCover.style.display = 'none';
            }
        }

        if (DOM.previewReadmore) {
            DOM.previewReadmore.innerHTML = content ? 'Okumaya Başla &rarr;' : 'Yakında...';
        }
    }

    function renderList(filterStr = '') {
        if (!DOM.postsList) return;
        DOM.postsList.innerHTML = '';
        
        let filtered = posts;
        if (filterStr) {
            const q = filterStr.toLowerCase();
            filtered = posts.filter(p => (p.title && p.title.toLowerCase().includes(q)) || (p.tag && p.tag.toLowerCase().includes(q)));
        }
        
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filtered.length === 0) {
            if (DOM.emptyList) DOM.emptyList.classList.remove('hidden');
            return;
        }
        if (DOM.emptyList) DOM.emptyList.classList.add('hidden');
        
        filtered.forEach(post => {
            const div = document.createElement('div');
            div.className = 'ba-post-item' + (editingId === post.id ? ' active' : '');
            
            const hasContent = post.content && post.content.trim() !== '';
            const statusClass = hasContent ? 'published' : 'draft';
            const statusText = hasContent ? 'Yayında' : 'Taslak';

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
                    <button class="ba-btn-icon edit-btn" data-id="${post.id}">E</button>
                    <button class="ba-btn-icon delete-btn" data-id="${post.id}">X</button>
                </div>
            `;
            
            div.querySelector('.edit-btn').addEventListener('click', e => { e.stopPropagation(); startEdit(post.id); });
            div.querySelector('.delete-btn').addEventListener('click', e => { e.stopPropagation(); openDeleteModal(post.id); });
            div.addEventListener('click', () => startEdit(post.id));
            DOM.postsList.appendChild(div);
        });
    }

    function startEdit(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        editingId = id;
        
        DOM.postId.value = post.id;
        DOM.postTitle.value = post.title || '';
        DOM.postDate.value = post.date || '';
        DOM.postTag.value = post.tag || '';
        DOM.postExcerpt.value = post.excerpt || '';
        DOM.postCover.value = post.cover || '';
        DOM.postContent.value = post.content || '';

        DOM.formSubmitBtn.textContent = 'Güncelle';
        DOM.formResetBtn.classList.remove('hidden');
        
        updatePreview();
        renderList();
    }

    function resetForm() {
        editingId = null;
        DOM.form.reset();
        setDefaultDate();
        DOM.formSubmitBtn.textContent = 'Yazı Ekle';
        DOM.formResetBtn.classList.add('hidden');
        updatePreview();
        renderList();
    }

    function loadFromStorage() {
        try {
            const data = localStorage.getItem('blog_admin_posts');
            if (data) { posts = JSON.parse(data); return true; }
        } catch (e) {} return false;
    }

    function saveToStorage() { localStorage.setItem('blog_admin_posts', JSON.stringify(posts)); }
    
    function loadFromJSON() {
        fetch('blog.json')
            .then(r => r.json())
            .then(data => { posts = Array.isArray(data) ? data : (data.posts || []); saveToStorage(); renderList(); updatePostCount(); })
            .catch(() => { renderList(); updatePostCount(); });
    }

    function openDeleteModal(id) { deleteTargetId = id; DOM.deleteModal.classList.remove('hidden'); }
    function closeDeleteModal() { deleteTargetId = null; DOM.deleteModal.classList.add('hidden'); }
    function confirmDelete() {
        posts = posts.filter(p => p.id !== deleteTargetId);
        if (editingId === deleteTargetId) resetForm();
        saveToStorage(); renderList(); updatePostCount(); closeDeleteModal(); showToast('Silindi', 'success');
    }

    function openClearModal() { if (posts.length > 0) DOM.clearModal.classList.remove('hidden'); }
    function closeClearModal() { DOM.clearModal.classList.add('hidden'); }
    function confirmClearAll() { posts = []; resetForm(); saveToStorage(); renderList(); updatePostCount(); closeClearModal(); }

    function handleSearch() { renderList(DOM.searchInput.value); }
    function updatePostCount() { if (DOM.postCount) DOM.postCount.textContent = posts.length + ' yazı'; }
    function setDefaultDate() {
        if (!DOM.postDate) return;
        const d = new Date();
        DOM.postDate.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function updateCharCount(inp, cnt, max) { if (cnt) cnt.textContent = inp.value.length; }
    function formatDate(dStr) {
        try { const p = dStr.split('-'); return `${parseInt(p[2])} ${MONTHS[parseInt(p[1])-1]} ${p[0]}`; } catch(e) { return dStr; }
    }
    function escapeHTML(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
    
    function showToast(msg, type='info') {
        if (!DOM.toastContainer) return;
        const t = document.createElement('div');
        t.className = `ba-toast ${type}`;
        t.innerHTML = `<span>${escapeHTML(msg)}</span>`;
        DOM.toastContainer.appendChild(t);
        setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, 3000);
    }

    return { init, getPosts: () => posts, setPosts: (p) => { posts = p; saveToStorage(); renderList(); updatePostCount(); } };
})();

document.addEventListener('DOMContentLoaded', BlogAdmin.init);
