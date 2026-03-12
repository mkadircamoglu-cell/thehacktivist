/* ============================================= */
/*     ADMIN PANELİ: CONFIG.JSON İÇE AKTARMA      */
/* ============================================= */

const AdminImport = (function () {

    'use strict';

    function init() {
        const importInput = document.getElementById('import-config');
        if (!importInput) return;

        importInput.addEventListener('change', handleImport);
    }

    /**
     * Seçilen JSON dosyasını okur ve formu doldurur
     * @param {Event} event - File input change event
     */
    function handleImport(event) {
        const file = event.target.files[0];

        // Dosya seçilmedi
        if (!file) return;

        // Dosya tipi kontrolü
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            Toast.show('Lütfen geçerli bir .json dosyası seçin.', 'error');
            resetInput(event.target);
            return;
        }

        // Dosya boyutu kontrolü (max 1MB)
        if (file.size > 1024 * 1024) {
            Toast.show('Dosya boyutu 1MB\'dan büyük olamaz.', 'error');
            resetInput(event.target);
            return;
        }

        // Dosyayı oku
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const content = e.target.result;
                const config = JSON.parse(content);

                // Yapı doğrulama
                if (!isValidConfigStructure(config)) {
                    Toast.show('Geçersiz config yapısı. Dosya beklenen formatta değil.', 'error');
                    resetInput(event.target);
                    return;
                }

                // Formu doldur
                AdminPanel.populateForm(config);

                Toast.show('config.json başarıyla yüklendi! (' + file.name + ')', 'success');
                console.log('[AdminImport] Config içe aktarıldı:', config);

            } catch (parseError) {
                console.error('[AdminImport] JSON parse hatası:', parseError);
                Toast.show('JSON dosyası okunamadı: ' + parseError.message, 'error');
            }

            resetInput(event.target);
        };

        reader.onerror = function () {
            console.error('[AdminImport] Dosya okuma hatası.');
            Toast.show('Dosya okunurken hata oluştu.', 'error');
            resetInput(event.target);
        };

        reader.readAsText(file, 'UTF-8');
    }

    /**
     * Config objesinin temel yapısını kontrol eder
     * En az beklenen ana anahtarların varlığını doğrular
     * @param {Object} config
     * @returns {boolean}
     */
    function isValidConfigStructure(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }

        // En az bir beklenen anahtar olmalı
        const expectedKeys = ['profile', 'background', 'appearance', 'effects', 'audio', 'icons', 'socials'];
        let matchCount = 0;

        expectedKeys.forEach(function (key) {
            if (config.hasOwnProperty(key)) {
                matchCount++;
            }
        });

        // En az 3 ana anahtar eşleşmeli
        if (matchCount < 3) {
            return false;
        }

        // profile varsa obje mi kontrol et
        if (config.profile && typeof config.profile !== 'object') {
            return false;
        }

        // socials varsa array mi kontrol et
        if (config.socials && !Array.isArray(config.socials)) {
            return false;
        }

        return true;
    }

    /**
     * File input'u sıfırlar (aynı dosyayı tekrar seçebilmek için)
     */
    function resetInput(input) {
        if (input) {
            input.value = '';
        }
    }

    /* ========================================= */
    /*      DRAG & DROP DESTEĞI (BONUS)            */
    /* ========================================= */

    function initDragDrop() {
        const body = document.body;
        let dragCounter = 0;

        // Tarayıcı varsayılan davranışını engelle
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
            body.addEventListener(eventName, function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Sürükleme başladığında
        body.addEventListener('dragenter', function () {
            dragCounter++;
            body.classList.add('drag-active');
        });

        // Sürükleme alanından çıkınca
        body.addEventListener('dragleave', function () {
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                body.classList.remove('drag-active');
            }
        });

        // Dosya bırakıldığında
        body.addEventListener('drop', function (e) {
            dragCounter = 0;
            body.classList.remove('drag-active');

            const files = e.dataTransfer.files;
            if (files.length === 0) return;

            const file = files[0];

            // JSON dosyası mı kontrol et
            if (!file.name.endsWith('.json') && file.type !== 'application/json') {
                Toast.show('Lütfen geçerli bir .json dosyası bırakın.', 'error');
                return;
            }

            // Dosya boyutu kontrolü
            if (file.size > 1024 * 1024) {
                Toast.show('Dosya boyutu 1MB\'dan büyük olamaz.', 'error');
                return;
            }

            // FileReader ile oku
            const reader = new FileReader();

            reader.onload = function (ev) {
                try {
                    const config = JSON.parse(ev.target.result);

                    if (!isValidConfigStructure(config)) {
                        Toast.show('Geçersiz config yapısı.', 'error');
                        return;
                    }

                    AdminPanel.populateForm(config);
                    Toast.show('config.json sürükle-bırak ile yüklendi!', 'success');
                    console.log('[AdminImport] Drag&Drop ile config yüklendi:', config);

                } catch (err) {
                    Toast.show('JSON dosyası okunamadı: ' + err.message, 'error');
                }
            };

            reader.onerror = function () {
                Toast.show('Dosya okunurken hata oluştu.', 'error');
            };

            reader.readAsText(file, 'UTF-8');
        });

        console.log('[AdminImport] Drag & Drop desteği aktif.');
    }

    /* ========================================= */
    /*         SAYFA YÜKLENME TETİKLEYİCİ         */
    /* ========================================= */

    function onReady() {
        init();
        initDragDrop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    return {
        handleImport,
        isValidConfigStructure
    };

})();