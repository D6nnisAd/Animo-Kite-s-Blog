// Function to apply the global contact link
function applyGlobalLink(db) {
    const globalLinkRef = db.collection('settings').doc('global');
    
    globalLinkRef.get().then((doc) => {
        if (doc.exists && doc.data().contactLink) {
            const contactLink = doc.data().contactLink;
            const elements = document.querySelectorAll('[data-dynamic-link="global"]');

            if (elements.length === 0) {
                // It's normal for some pages not to have these links, so this is not an error.
                return;
            }

            elements.forEach(el => {
                const tagName = el.tagName.toLowerCase();
                if (tagName === 'a') {
                    el.href = contactLink;
                } else {
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(contactLink, '_blank');
                    });
                }
            });
        } else {
            console.error("CRITICAL: Global contact link not found in Firestore. Go to the Admin Panel > Global Contact Link and set a URL.");
        }
    }).catch((error) => {
        console.error("Error fetching global settings:", error);
    });
}

// Function to render the merchants list
function renderMerchants(db) {
    const merchantListContainer = document.getElementById('merchant-list');
    if (!merchantListContainer) return;

    const merchantsRef = db.collection('merchants').orderBy('name');
    
    merchantsRef.get().then((querySnapshot) => {
        let merchantHTML = '';
        let merchantCount = 0;

        querySnapshot.forEach((doc) => {
            const merchant = doc.data();
            if (merchant.isEnabled) {
                merchantHTML += `
                    <div class="merchant-item" data-aos="fade-up">
                        <div class="merchant-info">
                            <h4>${merchant.name}</h4>
                            <div class="verified-badge"><i class="fas fa-check-circle"></i> Verified</div>
                        </div>
                        <a href="${merchant.contactLink}" target="_blank" class="btn btn-get-key">Get Key</a>
                    </div>
                `;
                merchantCount++;
            }
        });

        if (merchantCount > 0) {
            merchantListContainer.innerHTML = merchantHTML;
        } else {
            merchantListContainer.innerHTML = '<p class="text-center">No merchants are available at this time. Please check back later.</p>';
        }

        if (window.AOS) setTimeout(() => window.AOS.refresh(), 100);

    }).catch((error) => {
        console.error("Error fetching merchants:", error);
        merchantListContainer.innerHTML = '<p class="text-center text-danger">Could not load merchants. Please check your internet connection and try again.</p>';
    });
}

// Function to render the blog list on the blog page
function renderBlogList(db) {
    const blogListContainer = document.getElementById('blog-list-container');
    if (!blogListContainer) return;

    db.collection('posts')
      .where('status', '==', 'published')
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
            blogListContainer.innerHTML = '<p class="lead text-center">No blog posts found. Check back soon!</p>';
            return;
        }

        const posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        // Sort posts by creation date, descending
        posts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
            return dateB - dateA;
        });

        let postsHTML = '';
        posts.forEach(post => {
            const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            
            // Create a temporary element to strip HTML for the excerpt
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            const excerpt = textContent.substring(0, 120) + '...';

            postsHTML += `
                <div class="col-md-6 col-lg-4" data-aos="fade-up">
                    <a href="post.html?slug=${post.slug}" class="text-decoration-none text-reset">
                        <div class="blog-card">
                            <div class="blog-card-img-wrapper">
                                <img src="${post.imageUrl}" alt="${post.title}" class="blog-card-img">
                            </div>
                            <div class="blog-card-body">
                                <h4 class="blog-card-title">${post.title}</h4>
                                <p class="blog-card-meta">By ${post.author} • ${postDate}</p>
                                <p class="blog-card-excerpt">${excerpt}</p>
                                <span class="blog-card-link">Read More <i class="fas fa-arrow-right"></i></span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        blogListContainer.innerHTML = postsHTML;
        if (window.AOS) setTimeout(() => window.AOS.refresh(), 100);
      })
      .catch(error => {
        console.error("Error fetching blog posts:", error);
        blogListContainer.innerHTML = '<p class="lead text-center text-danger">Could not load posts. Please try again later.</p>';
      });
}

// Function to render the latest blog posts on the homepage
function renderHomeBlogPosts(db) {
    const homeBlogContainer = document.getElementById('home-blog-posts-container');
    if (!homeBlogContainer) return;

    db.collection('posts')
      .where('status', '==', 'published')
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
            homeBlogContainer.innerHTML = '<p class="lead text-center col-12">No blog posts found. Check back soon!</p>';
            return;
        }
        
        const posts = [];
        snapshot.forEach(doc => {
            posts.push(doc.data());
        });

        // Sort and limit on the client side to avoid needing a composite index
        posts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
        const latestPosts = posts.slice(0, 4);

        if (latestPosts.length === 0) {
             homeBlogContainer.innerHTML = '<p class="lead text-center col-12">No blog posts found. Check back soon!</p>';
             return;
        }

        let postsHTML = '';
        latestPosts.forEach(post => {
            const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            const excerpt = textContent.substring(0, 100) + '...';

            postsHTML += `
                <div class="blog-carousel-item" data-aos="fade-up">
                    <a href="post.html?slug=${post.slug}" class="text-decoration-none text-reset">
                        <div class="blog-card">
                            <div class="blog-card-img-wrapper">
                                <img src="${post.imageUrl}" alt="${post.title}" class="blog-card-img">
                            </div>
                            <div class="blog-card-body">
                                <h4 class="blog-card-title">${post.title}</h4>
                                <p class="blog-card-meta">By ${post.author} • ${postDate}</p>
                                <p class="blog-card-excerpt">${excerpt}</p>
                                <span class="blog-card-link">Read More <i class="fas fa-arrow-right"></i></span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        
        homeBlogContainer.innerHTML = postsHTML;
        if (window.AOS) setTimeout(() => window.AOS.refresh(), 100);
      })
      .catch(error => {
        console.error("Error fetching home blog posts:", error);
        homeBlogContainer.innerHTML = '<p class="lead text-center text-danger col-12">Could not load posts. Please try again later.</p>';
      });
}

// Function to render a single post
function renderSinglePost(db) {
    const postContainer = document.getElementById('post-container');
    const postTitleEl = document.getElementById('post-title');
    if (!postContainer || !postTitleEl) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        postContainer.innerHTML = '<p class="lead text-center">Post not found. Please check the URL and try again.</p>';
        return;
    }

    db.collection('posts')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
            postContainer.innerHTML = '<p class="lead text-center">Post not found or is not available.</p>';
            return;
        }
        
        const post = snapshot.docs[0].data();
        const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

        // Update page title
        document.title = `${post.title} - Animo`;

        // Populate content
        postTitleEl.textContent = post.title;

        // The content from Firestore is now HTML, so it can be rendered directly.
        const formattedContent = post.content;

        postContainer.innerHTML = `
            <img src="${post.imageUrl}" alt="${post.title}" class="img-fluid rounded-3 mb-4 shadow" style="width: 100%; max-height: 500px; object-fit: cover;">
            <p class="post-meta">
                <span><i class="fas fa-user"></i> By ${post.author}</span>
                <span><i class="fas fa-calendar-alt"></i> ${postDate}</span>
            </p>
            <div class="post-content">
                ${formattedContent}
            </div>
        `;

      })
      .catch(error => {
        console.error("Error fetching single post:", error);
        postContainer.innerHTML = '<p class="lead text-center text-danger">Could not load post. Please try again later.</p>';
      });
}


// Main execution logic
document.addEventListener('DOMContentLoaded', () => {
    const checkFirebaseInterval = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            clearInterval(checkFirebaseInterval);
            
            const db = firebase.firestore();
            
            applyGlobalLink(db);
            renderMerchants(db);
            renderBlogList(db);
            renderSinglePost(db);
            renderHomeBlogPosts(db); // Fetch posts for homepage
            
        }
    }, 100);
});