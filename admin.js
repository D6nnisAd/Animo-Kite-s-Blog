document.addEventListener('DOMContentLoaded', () => {
    // General Elements
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const globalLinkForm = document.getElementById('global-link-form');
    const contactLinkInput = document.getElementById('contact-link');

    // Merchant Elements
    const merchantListAdmin = document.getElementById('merchant-list-admin');
    const merchantModalEl = document.getElementById('merchant-modal');
    const merchantModal = new bootstrap.Modal(merchantModalEl);
    const merchantModalLabel = document.getElementById('merchant-modal-label');
    const merchantForm = document.getElementById('merchant-form');
    const addMerchantBtn = document.getElementById('add-merchant-btn');
    const deleteMerchantBtn = document.getElementById('delete-merchant-btn');

    // Post Elements
    const postListAdmin = document.getElementById('post-list-admin');
    const postModalEl = document.getElementById('post-modal');
    const postModal = new bootstrap.Modal(postModalEl);
    const postModalLabel = document.getElementById('post-modal-label');
    const postForm = document.getElementById('post-form');
    const addPostBtn = document.getElementById('add-post-btn');
    const deletePostBtn = document.getElementById('delete-post-btn');
    const postTitleInput = document.getElementById('post-title');
    const postSlugInput = document.getElementById('post-slug');

    // Initialize Quill Editor
    const quill = new Quill('#post-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });

    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            loginView.style.display = 'none';
            dashboardView.style.display = 'block';
            loadDashboardData();
        } else {
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
        }
    });

    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            });
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        auth.signOut();
    });

    // Show alert
    function showAlert(message, type = 'success') {
        const dashboardAlert = document.getElementById('dashboard-alert');
        dashboardAlert.textContent = message;
        dashboardAlert.className = `alert alert-${type}`;
        dashboardAlert.style.display = 'block';
        window.scrollTo(0, 0);
        setTimeout(() => {
            dashboardAlert.style.display = 'none';
        }, 3000);
    }

    // Load data for the dashboard
    function loadDashboardData() {
        // Load global link
        db.collection('settings').doc('global').get().then(doc => {
            if (doc.exists) {
                contactLinkInput.value = doc.data().contactLink;
            }
        });
        // Load merchants
        loadMerchants();
        // Load Posts
        loadPosts();
    }
    
    // Save Global Link
    globalLinkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        const originalButtonHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;

        const link = contactLinkInput.value;
        db.collection('settings').doc('global').set({ contactLink: link })
            .then(() => showAlert('Global link updated successfully!'))
            .catch(err => showAlert(`Error: ${err.message}`, 'danger'))
            .finally(() => {
                button.disabled = false;
                button.innerHTML = originalButtonHTML;
            });
    });

    // --- MERCHANT LOGIC ---
    function loadMerchants() {
        db.collection('merchants').orderBy('name').get().then(snapshot => {
            merchantListAdmin.innerHTML = '';
            if (snapshot.empty) {
                 merchantListAdmin.innerHTML = '<p class="text-center">No merchants found. Add one to get started.</p>';
                 return;
            }
            snapshot.forEach(doc => {
                const merchant = doc.data();
                const item = document.createElement('div');
                item.className = 'item-list-item row g-3 align-items-center';
                item.innerHTML = `
                    <div class="col-md">
                        <h5 class="mb-1">${merchant.name}</h5>
                        <small class="text-muted text-break">${merchant.contactLink}</small>
                    </div>
                    <div class="col-md-auto">
                        <div class="d-flex align-items-center justify-content-start justify-content-md-end gap-3">
                            <span class="badge fs-6 rounded-pill bg-${merchant.isEnabled ? 'success' : 'secondary'}">${merchant.isEnabled ? 'Enabled' : 'Disabled'}</span>
                            <button class="btn btn-sm btn-outline-light edit-merchant-btn flex-shrink-0" data-id="${doc.id}">Edit</button>
                        </div>
                    </div>
                `;
                merchantListAdmin.appendChild(item);
            });
        });
    }

    addMerchantBtn.addEventListener('click', () => {
        merchantModalLabel.textContent = 'Add Merchant';
        merchantForm.reset();
        document.getElementById('merchant-enabled').checked = true;
        document.getElementById('merchant-id').value = '';
        deleteMerchantBtn.style.display = 'none';
    });

    merchantListAdmin.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-merchant-btn')) {
            const id = e.target.dataset.id;
            db.collection('merchants').doc(id).get().then(doc => {
                const merchant = doc.data();
                merchantModalLabel.textContent = 'Edit Merchant';
                document.getElementById('merchant-id').value = id;
                document.getElementById('merchant-name').value = merchant.name;
                document.getElementById('merchant-link').value = merchant.contactLink;
                document.getElementById('merchant-enabled').checked = merchant.isEnabled;
                deleteMerchantBtn.style.display = 'block';
                merchantModal.show();
            });
        }
    });

    merchantForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        const originalButtonHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;
        
        const id = document.getElementById('merchant-id').value;
        const data = {
            name: document.getElementById('merchant-name').value,
            contactLink: document.getElementById('merchant-link').value,
            isEnabled: document.getElementById('merchant-enabled').checked
        };

        const promise = id ? db.collection('merchants').doc(id).update(data) : db.collection('merchants').add(data);
        promise.then(() => {
            showAlert('Merchant saved successfully!');
            loadMerchants();
            merchantModal.hide();
        }).catch(err => showAlert(`Error: ${err.message}`, 'danger'))
        .finally(() => {
            button.disabled = false;
            button.innerHTML = originalButtonHTML;
        });
    });

    deleteMerchantBtn.addEventListener('click', () => {
        const id = document.getElementById('merchant-id').value;
        if (id && confirm('Are you sure you want to delete this merchant?')) {
            db.collection('merchants').doc(id).delete().then(() => {
                showAlert('Merchant deleted successfully!');
                loadMerchants();
                merchantModal.hide();
            }).catch(err => showAlert(`Error: ${err.message}`, 'danger'));
        }
    });

    // --- BLOG POST LOGIC ---

    function createSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove non-word chars
            .replace(/[\s_-]+/g, '-') // collapse whitespace and replace by -
            .replace(/^-+|-+$/g, ''); // trim -
    }

    postTitleInput.addEventListener('input', () => {
        postSlugInput.value = createSlug(postTitleInput.value);
    });

    function loadPosts() {
        db.collection('posts').orderBy('createdAt', 'desc').get().then(snapshot => {
            postListAdmin.innerHTML = '';
            if (snapshot.empty) {
                postListAdmin.innerHTML = '<p class="text-center">No posts found. Add one to get started.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const post = doc.data();
                const createdAt = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'N/A';
                const item = document.createElement('div');
                item.className = 'item-list-item row g-3 align-items-center';
                item.innerHTML = `
                    <div class="col-md">
                        <h5 class="mb-1">${post.title}</h5>
                        <small class="text-muted">By ${post.author} on ${createdAt}</small>
                    </div>
                    <div class="col-md-auto">
                        <div class="d-flex align-items-center justify-content-start justify-content-md-end gap-3">
                             <span class="badge fs-6 rounded-pill bg-${post.status === 'published' ? 'success' : 'secondary'} text-capitalize">${post.status}</span>
                            <button class="btn btn-sm btn-outline-light edit-post-btn flex-shrink-0" data-id="${doc.id}">Edit</button>
                        </div>
                    </div>
                `;
                postListAdmin.appendChild(item);
            });
        });
    }
    
    addPostBtn.addEventListener('click', () => {
        postModalLabel.textContent = 'Add New Post';
        postForm.reset();
        quill.setText(''); // Clear Quill editor
        document.getElementById('post-id').value = '';
        deletePostBtn.style.display = 'none';
    });
    
    postListAdmin.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-post-btn')) {
            const id = e.target.dataset.id;
            db.collection('posts').doc(id).get().then(doc => {
                const post = doc.data();
                postModalLabel.textContent = 'Edit Post';
                document.getElementById('post-id').value = id;
                document.getElementById('post-title').value = post.title;
                document.getElementById('post-slug').value = post.slug;
                quill.root.innerHTML = post.content; // Set Quill content
                document.getElementById('post-author').value = post.author;
                document.getElementById('post-image-url').value = post.imageUrl;
                document.getElementById('post-status').value = post.status;
                deletePostBtn.style.display = 'block';
                postModal.show();
            });
        }
    });

    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        const originalButtonHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;

        const restoreButton = () => {
            button.disabled = false;
            button.innerHTML = originalButtonHTML;
        };

        const id = document.getElementById('post-id').value;
        const now = firebase.firestore.FieldValue.serverTimestamp();
        const data = {
            title: document.getElementById('post-title').value,
            slug: document.getElementById('post-slug').value || createSlug(document.getElementById('post-title').value),
            content: quill.root.innerHTML,
            author: document.getElementById('post-author').value,
            imageUrl: document.getElementById('post-image-url').value,
            status: document.getElementById('post-status').value,
            updatedAt: now,
        };

        if (quill.getLength() <= 1) {
            showAlert('Error: Post content cannot be empty.', 'danger');
            restoreButton();
            return;
        }

        if (id) {
            db.collection('posts').doc(id).update(data)
                .then(() => {
                    showAlert('Post updated successfully!');
                    loadPosts();
                    postModal.hide();
                })
                .catch(err => showAlert(`Error: ${err.message}`, 'danger'))
                .finally(restoreButton);
        } else {
            data.createdAt = now;
            const slug = data.slug;
            db.collection('posts').where('slug', '==', slug).get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        showAlert('Error: This slug already exists. Please choose a unique one.', 'danger');
                        restoreButton();
                        return; // Exit promise chain
                    }
                    // Slug is unique, proceed to add
                    return db.collection('posts').add(data)
                        .then(() => {
                            showAlert('Post saved successfully!');
                            loadPosts();
                            postModal.hide();
                        });
                })
                .catch(err => showAlert(`Error: ${err.message}`, 'danger'))
                .finally(restoreButton);
        }
    });
    
    deletePostBtn.addEventListener('click', () => {
        const id = document.getElementById('post-id').value;
        if (id && confirm('Are you sure you want to delete this post? This cannot be undone.')) {
            db.collection('posts').doc(id).delete().then(() => {
                showAlert('Post deleted successfully!');
                loadPosts();
                postModal.hide();
            }).catch(err => showAlert(`Error: ${err.message}`, 'danger'));
        }
    });
});
