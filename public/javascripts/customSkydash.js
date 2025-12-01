(function() {
    function isMobile() {
        return window.matchMedia('(max-width: 991.98px)').matches;
    }

    function closeSidebar() {
        $('#sidebar').removeClass('active');
        $('body').removeClass('sidebar-mobile-open');
    }

    $(document).on('click', '.navbar-toggler[data-toggle="offcanvas"]', function() {
        if (isMobile()) {
            setTimeout(function() {
                $('body').toggleClass('sidebar-mobile-open', $('#sidebar').hasClass('active'));
            }, 0);
        }
    });

    $(document).on('click', function(e) {
        if (!isMobile()) return;
        var $target = $(e.target);
        var clickInsideSidebar = $target.closest('#sidebar').length > 0;
        var clickOnToggler = $target.closest('.navbar-toggler[data-toggle="offcanvas"]').length > 0;
        if (!clickInsideSidebar && !clickOnToggler) {
            closeSidebar();
        }
    });

    $(document).on('click', '#sidebar .nav-link', function(e) {
        if (!isMobile()) return;
        var $link = $(this);
        var isCollapseToggle = ($link.attr('data-toggle') === 'collapse');
        if (isCollapseToggle) return;
    });

    $(document).on('keydown', function(e) {
        if (isMobile() && e.key === 'Escape') {
            closeSidebar();
        }
    });

    $(window).on('resize', function() {
        if (!isMobile()) {
            $('body').removeClass('sidebar-mobile-open');
            $('#sidebar').removeClass('active');
        }
    });

    $(window).on('beforeunload', function() {
        if (isMobile()) {
            closeSidebar();
        }
    });

    function showLoading() {
        var overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    }

    function hideLoading() {
        var overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    $(document).on('submit', 'form[data-loading], form', function() {
        showLoading();
    });

    var pendingDeleteUrl = null;
    $(document).on('click', '.btn-delete', function() {
        pendingDeleteUrl = this.getAttribute('data-url');
        $('#modalConfirmDelete').modal('show');
    });

    $(document).on('click', '#btnConfirmDelete', function() {
        if (!pendingDeleteUrl) return;
        $('#modalConfirmDelete').modal('hide');
        showLoading();
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = pendingDeleteUrl;
        document.body.appendChild(form);
        form.submit();
    });
})();

(function(){
    function showImagePreview(src){
        var modal = document.getElementById('globalImagePreviewModal');
        if (!modal) return;
        var img = modal.querySelector('#globalImagePreviewEl');
        if (!img) return;
        
        img.style.width = 'auto';
        img.style.height = 'auto';
        
        img.onload = function(){
            var naturalWidth = this.naturalWidth;
            var naturalHeight = this.naturalHeight;
            var maxWidth = window.innerWidth * 0.9;
            var maxHeight = (window.innerHeight - 200) * 0.8;
            var ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
            
            this.style.width = (naturalWidth * ratio) + 'px';
            this.style.height = (naturalHeight * ratio) + 'px';
        };
        
        if (img.complete && img.naturalWidth > 0) {
            img.onload();
        }
        
        img.src = src;
        $('#globalImagePreviewModal').modal('show');
    }

    $(document).on('click', '.img-click-preview, #previewTambah, #previewEdit, #detailCover', function(){
        var src = this.getAttribute('data-src') || this.getAttribute('src');
        if (!src) return;
        showImagePreview(src);
    });

    window.addEventListener('preview-image', function(e){
        if (!e || !e.detail || !e.detail.src) return;
        showImagePreview(e.detail.src);
    });
})();

(function() {
    function setupPasswordToggle() {
        $(document).on('click', '.password-toggle-btn', function() {
            var $btn = $(this);
            var targetId = $btn.data('target');
            var $input = $('#' + targetId);
            var $icon = $btn.find('i');

            if ($input.attr('type') === 'password') {
                $input.attr('type', 'text');
                $icon.removeClass('mdi-eye-off').addClass('mdi-eye');
            } else {
                $input.attr('type', 'password');
                $icon.removeClass('mdi-eye').addClass('mdi-eye-off');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPasswordToggle);
    } else {
        setupPasswordToggle();
    }
})();

(function() {
    function dismissFlash(el) {
        if (!el) return;
        el.style.animation = 'flash-out 180ms ease-in forwards';
        setTimeout(function(){
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }, 200);
    }

    function setupFlash() {
        var container = document.querySelector('.flash-container');
        if (!container) return;

        var flashes = container.querySelectorAll('.flash');
        flashes.forEach(function(el){
            var closeBtn = el.querySelector('.flash-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(){ dismissFlash(el); });
            }
            if (el.classList.contains('flash-success')) {
                setTimeout(function(){ dismissFlash(el); }, 6000);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFlash);
    } else {
        setupFlash();
    }
})();

(function() {
    function setupImagePreview() {
        $(document).on('change', 'input[type="file"][accept*="image"][data-preview]', function(e) {
            const files = e.target.files;
            const previewId = this.getAttribute('data-preview') || 'previewTambah';
            const preview = document.getElementById(previewId);
            const previewContainer = document.getElementById(previewId + 'Container');
            
            if (files.length > 0) {
                if (files.length === 1 && !this.hasAttribute('multiple')) {
                    // Single file preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (preview) {
                            preview.src = e.target.result;
                            // pastikan modal pratinjau juga memakai gambar terbaru
                            preview.setAttribute('data-src', e.target.result);
                            preview.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(files[0]);
                } else {
                    // Multiple files preview
                    if (previewContainer) {
                        previewContainer.innerHTML = '';
                        preview.style.display = 'block';
                        
                        Array.from(files).forEach((file, index) => {
                            if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    const img = document.createElement('img');
                                    img.src = e.target.result;
                                    img.className = 'img-click-preview';
                                    img.style.cssText = 'height:60px;width:auto;border-radius:6px;object-fit:cover;cursor:zoom-in;margin:2px;';
                                    img.alt = 'preview ' + (index + 1);
                                    previewContainer.appendChild(img);
                                };
                                reader.readAsDataURL(file);
                            }
                        });
                    }
                }
            } else {
                // Jika tidak ada file, sembunyikan preview dan reset src
                if (preview) {
                    preview.style.display = 'none';
                    preview.src = '#';
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupImagePreview);
    } else {
        setupImagePreview();
    }
})();

(function() {
    // Image preview manager with remove button
    function ImagePreviewManager(inputElement, containerId) {
        this.input = inputElement;
        this.container = document.getElementById(containerId);
        this.files = [];
        this.init();
    }

    ImagePreviewManager.prototype.init = function() {
        if (!this.container) return;
        
        const self = this;
        
        this.input.addEventListener('change', function(e) {
            const newFiles = Array.from(e.target.files || []);
            if (newFiles.length === 0) return;
            
            const existingFileKeys = self.files.map(function(item) {
                return item.file.name + item.file.size + item.file.lastModified;
            });
            
            const filesToAdd = [];
            newFiles.forEach(function(file) {
                if (!file.type.startsWith('image/')) return;
                
                const fileKey = file.name + file.size + file.lastModified;
                if (existingFileKeys.indexOf(fileKey) === -1) {
                    filesToAdd.push(file);
                }
            });
            
            if (filesToAdd.length === 0) {
                self.updateFileInput();
                return;
            }
            
            let loadedCount = 0;
            const totalFiles = filesToAdd.length;
            
            filesToAdd.forEach(function(file) {
                self.addFile(file, function() {
                    loadedCount++;
                    if (loadedCount === totalFiles) {
                        self.updateFileInput();
                    }
                });
            });
        });

        // Handle remove button clicks and image preview
        this.container.addEventListener('click', function(e) {
            const removeBtn = e.target.closest('.image-preview-remove');
            if (removeBtn) {
                e.stopPropagation();
                e.preventDefault();
                const index = parseInt(removeBtn.getAttribute('data-index'));
                if (!isNaN(index)) {
                    self.removeFile(index);
                }
                return;
            }
            
            // Handle image click for preview
            const item = e.target.closest('.image-preview-item');
            if (item) {
                const img = item.querySelector('img');
                if (img && img.src) {
                    const event = new CustomEvent('preview-image', { 
                        detail: { src: img.src } 
                    });
                    window.dispatchEvent(event);
                }
            }
        });
    };

    ImagePreviewManager.prototype.addFile = function(file, callback) {
        const self = this;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileObj = {
                file: file,
                dataUrl: e.target.result
            };
            self.files.push(fileObj);
            const index = self.files.length - 1;
            self.renderPreview(index, file.name, e.target.result);
            
            if (callback && typeof callback === 'function') {
                callback();
            }
        };
        
        reader.onerror = function() {
            console.error('Error reading file:', file.name);
            if (callback && typeof callback === 'function') {
                callback();
            }
        };
        
        reader.readAsDataURL(file);
    };

    ImagePreviewManager.prototype.removeFile = function(index) {
        if (index < 0 || index >= this.files.length) return;
        this.files.splice(index, 1);
        this.renderAll();
        this.updateFileInput();
    };

    ImagePreviewManager.prototype.renderPreview = function(index, filename, dataUrl) {
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.setAttribute('data-index', index);
        
        item.innerHTML = `
            <img src="${dataUrl}" alt="${filename}" class="img-click-preview">
            <button type="button" class="image-preview-remove" data-index="${index}" aria-label="Hapus gambar">
                <i class="mdi mdi-close"></i>
            </button>
            <div class="image-preview-filename">${filename}</div>
        `;
        
        this.container.appendChild(item);
    };

    ImagePreviewManager.prototype.renderAll = function() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        const self = this;
        this.files.forEach(function(item, index) {
            self.renderPreview(index, item.file.name, item.dataUrl);
        });
    };

    ImagePreviewManager.prototype.updateFileInput = function() {
        if (!this.input) return;
        
        try {
            const dt = new DataTransfer();
            const self = this;
            let addedCount = 0;
            
            this.files.forEach(function(item) {
                if (item && item.file) {
                    try {
                        dt.items.add(item.file);
                        addedCount++;
                    } catch (err) {
                        console.error('Error adding file to DataTransfer:', err, item.file.name);
                    }
                }
            });
            
            this.input.files = dt.files;
            
            if (this.input.files.length !== this.files.length) {
                console.warn('File count mismatch. Expected:', this.files.length, 'Got:', this.input.files.length, 'Added:', addedCount);
                
                if (this.input.files.length < this.files.length) {
                    console.warn('Some files were not added. Trying to re-add...');
                    setTimeout(function() {
                        self.updateFileInput();
                    }, 100);
                }
            }
        } catch (err) {
            console.error('Error updating file input:', err);
        }
    };

    // Initialize image preview managers
    function initImagePreviewManagers() {
        const inputs = document.querySelectorAll('input[type="file"][accept*="image"][data-preview-container]');
        inputs.forEach(function(input) {
            const containerId = input.getAttribute('data-preview-container');
            if (containerId) {
                new ImagePreviewManager(input, containerId);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImagePreviewManagers);
    } else {
        initImagePreviewManagers();
    }
})();