document.addEventListener('DOMContentLoaded', () => {
    const books = [
        { title: "Dune", author: "Frank Herbert", genre: "Science Fiction", year: 1965, status: "Completed", rating: 4.7, group: "Dune Series" },
        { title: "Dune Messiah", author: "Frank Herbert", genre: "Science Fiction", year: 1969, status: "In Progress", rating: 4.4, group: "Dune Series" },
        { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", genre: "Science Fiction", year: 1979, status: "In Progress", rating: 4.6, group: "" },
        { title: "1984", author: "George Orwell", genre: "Dystopian", year: 1949, status: "Completed", rating: 4.5, group: "" },
        { title: "Neuromancer", author: "William Gibson", genre: "Cyberpunk", year: 1984, status: "In Progress", rating: 4.8, group: "" }
    ];

    const movies = [
        { title: "Inception", director: "Christopher Nolan", genre: "Sci-Fi", year: 2010, status: "Completed", rating: 4.8 },
        { title: "The Matrix", director: "The Wachowskis", genre: "Sci-Fi", year: 1999, status: "In Progress", rating: 4.7 },
        { title: "Interstellar", director: "Christopher Nolan", genre: "Sci-Fi", year: 2014, status: "Completed", rating: 4.6 },
        { title: "Blade Runner 2049", director: "Denis Villeneuve", genre: "Sci-Fi", year: 2017, status: "In Progress", rating: 4.9 }
    ];

    const bookListContainer = document.getElementById('book-list-container');
    books.forEach(book => addBookToDOM(book, bookListContainer));

    const movieListContainer = document.getElementById('movie-list-container');
    movies.forEach(movie => addMovieToDOM(movie, movieListContainer));

    renderBookGroups();
    setupFormListeners();

    document.getElementById('group-mode').addEventListener('change', renderBookGroups);
});

//Status helpers
function getStatusClass(status) {
    switch (status) {
        case 'Completed': return 'status-completed';
        case 'In Progress': return 'status-progress';
        default: return 'status-notstarted';
    }
}

// Book cover fetch (Open Library)
async function fetchBookCover(title, author) {
    try {
        const query = encodeURIComponent(`${title} ${author}`);
        const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1&fields=cover_i`);
        if (!res.ok) return null;
        const data = await res.json();
        const coverId = data?.docs?.[0]?.cover_i;
        return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
    } catch {
        return null;
    }
}

// Book card creation with async cover loading and status handling
function addBookToDOM(book, container) {
    const card = document.createElement('div');
    card.className = 'item-card book-card';
    if (book.group) card.dataset.group = book.group;
    card.dataset.author = book.author || '';
    card.dataset.rating = book.rating || '';

    card.innerHTML = `
        <div class="book-cover-wrap">
            <div class="book-cover-placeholder">
                <i class="fas fa-book-open"></i>
                <span>${book.title}</span>
            </div>
            <img class="book-cover-img" alt="Cover of ${book.title}" style="display:none">
        </div>
        <div class="item-header">
            <h3>${book.title}</h3>
            <span class="status-badge ${getStatusClass(book.status)}">${book.status}</span>
        </div>
        <div class="item-meta"><i class="fas fa-user"></i> ${book.author}</div>
        <div class="item-meta"><i class="fas fa-tag"></i> ${book.genre}</div>
        <div class="item-meta"><i class="fas fa-calendar"></i> ${book.year || 'N/A'}</div>
        <div class="item-meta"><i class="fas fa-star"></i> ${book.rating ? book.rating + '/5' : 'N/A'}</div>
        ${book.group ? `<div class="item-meta group-tag"><i class="fas fa-layer-group"></i> ${book.group}</div>` : ''}
        <div class="item-actions">
            <select class="form-select form-select-sm status-select">
                <option value="Not Started" ${book.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                <option value="In Progress" ${book.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${book.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(card);

    // Async cover load
    const img = card.querySelector('.book-cover-img');
    const placeholder = card.querySelector('.book-cover-placeholder');
    fetchBookCover(book.title, book.author).then(url => {
        if (url) {
            img.src = url;
            img.style.display = 'block';
            
            // Ensure placeholder hides only on successful load
            img.onload = () => placeholder.style.display = 'none';
            img.onerror = () => { img.style.display = 'none'; }; 
        }
    });

    card.querySelector('.status-select').addEventListener('change', function () {
        const prev = card.querySelector('.status-badge').textContent.trim();
        const next = this.value;
        const badge = card.querySelector('.status-badge');
        badge.className = `status-badge ${getStatusClass(next)}`;
        badge.textContent = next;
        if (next === 'Completed' && prev !== 'Completed') {
            celebrate(card, card.querySelector('h3').textContent, 'book');
        } else {
            showNotification('Status updated to: ' + next);
        }
        renderBookGroups();
    });
}


// Movie poster fetch (TMDB free public demo key)
async function fetchMoviePoster(title, year) {
    try {
        const query = encodeURIComponent(title);
        const yearParam = year ? `&year=${year}` : '';
        const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=2dca580c2a14b55200e784d157207b4d&query=${query}${yearParam}&include_adult=false`
        );
        if (!res.ok) return null;
        const data = await res.json();
        const path = data?.results?.[0]?.poster_path;
        return path ? `https://image.tmdb.org/t/p/w300${path}` : null;
    } catch {
        return null;
    }
}

// Movie Card Creation 
function addMovieToDOM(movie, container) {
    const card = document.createElement('div');
    card.className = 'item-card movie-card';
    card.dataset.rating = movie.rating || '';

    card.innerHTML = `
        <div class="book-cover-wrap">
            <div class="book-cover-placeholder movie-placeholder">
                <i class="fas fa-film"></i>
                <span>${movie.title}</span>
            </div>
            <img class="book-cover-img" alt="Poster of ${movie.title}" style="display:none">
        </div>
        <div class="item-header">
            <h3>${movie.title}</h3>
            <span class="status-badge ${getStatusClass(movie.status)}">${movie.status}</span>
        </div>
        <div class="item-meta"><i class="fas fa-video"></i> ${movie.director}</div>
        <div class="item-meta"><i class="fas fa-tag"></i> ${movie.genre}</div>
        <div class="item-meta"><i class="fas fa-calendar"></i> ${movie.year || 'N/A'}</div>
        <div class="item-meta"><i class="fas fa-star"></i> ${movie.rating ? movie.rating + '/5' : 'N/A'}</div>
        <div class="item-actions">
            <select class="form-select form-select-sm status-select">
                <option value="Not Started" ${movie.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                <option value="In Progress" ${movie.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${movie.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(card);

    // Async poster load
    const img = card.querySelector('.book-cover-img');
    const placeholder = card.querySelector('.book-cover-placeholder');
    fetchMoviePoster(movie.title, movie.year).then(url => {
        if (url) {
            img.src = url;
            img.style.display = 'block';
            img.onload = () => placeholder.style.display = 'none';
            img.onerror = () => { img.style.display = 'none'; };
        }
    });

    card.querySelector('.status-select').addEventListener('change', function () {
        const prev = card.querySelector('.status-badge').textContent.trim();
        const next = this.value;
        const badge = card.querySelector('.status-badge');
        badge.className = `status-badge ${getStatusClass(next)}`;
        badge.textContent = next;
        if (next === 'Completed' && prev !== 'Completed') {
            celebrate(card, card.querySelector('h3').textContent, 'movie');
        } else {
            showNotification('Status updated to: ' + next);
        }
    });
}

// Groups
function renderBookGroups() {
    const container = document.getElementById('book-groups-container');
    container.innerHTML = '';

    const groupMode = document.getElementById('group-mode').value;
    if (groupMode === 'none') return;

    const cards = Array.from(document.querySelectorAll('#book-list-container .book-card'));
    if (cards.length === 0) return;

    // Build groupName → [{title, rating, status}]
    const groupMap = {};
    cards.forEach(card => {
        const key = groupMode === 'series'
            ? (card.dataset.group || '').trim()
            : (card.dataset.author || '').trim();

        if (!key) return;

        const title = card.querySelector('h3').textContent;
        const rating = parseFloat(card.dataset.rating) || null;
        const status = card.querySelector('.status-badge').textContent.trim();

        if (!groupMap[key]) groupMap[key] = [];
        groupMap[key].push({ title, rating, status });
    });

    // Only show groups with 2+ books
    const validGroups = Object.entries(groupMap).filter(([, m]) => m.length >= 2);

    if (validGroups.length === 0) {
        container.innerHTML = `<p class="group-empty">No groups yet — add books with the same ${groupMode === 'series' ? 'series name' : 'author'} to see them here.</p>`;
        return;
    }

    validGroups.forEach(([name, members]) => {
        const ratings = members.map(m => m.rating).filter(r => r !== null);
        const avg = ratings.length
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
            : null;
        const completed = members.filter(m => m.status === 'Completed').length;

        const panel = document.createElement('div');
        panel.className = 'group-panel';
        panel.innerHTML = `
            <div class="group-header" onclick="toggleGroup(this)">
                <div class="group-title-row">
                    <i class="fas fa-layer-group"></i>
                    <span class="group-name">${name}</span>
                    <span class="group-count">${members.length} books</span>
                </div>
                <div class="group-stats">
                    ${avg !== null ? `<span class="group-avg"><i class="fas fa-star"></i> ${avg}/5</span>` : ''}
                    <span class="group-progress">${completed}/${members.length} done</span>
                    <i class="fas fa-chevron-down group-chevron"></i>
                </div>
            </div>
            <div class="group-body">
                <ul class="group-book-list">
                    ${members.map(m => `
                        <li>
                            <span class="group-book-title">${m.title}</span>
                            <span class="group-book-meta">
                                ${m.rating ? `<i class="fas fa-star"></i> ${m.rating}` : '—'}
                                <span class="status-dot status-dot-${
                                    m.status === 'Completed' ? 'completed' :
                                    m.status === 'In Progress' ? 'progress' : 'notstarted'
                                }"></span>
                            </span>
                        </li>`).join('')}
                </ul>
            </div>
        `;
        container.appendChild(panel);
    });
}

function toggleGroup(header) {
    header.closest('.group-panel').classList.toggle('open');
}

// Delete Function
function deleteItem(button) {
    const card = button.closest('.item-card');
    const title = card.querySelector('h3').textContent;
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        setTimeout(() => {
            card.remove();
            showNotification(`"${title}" deleted`, 'danger');
            renderBookGroups();
        }, 300);
    }
}

// Search Function
document.getElementById('search-form').addEventListener('submit', e => { e.preventDefault(); performSearch(); });
document.getElementById('search-input').addEventListener('input', performSearch);

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    document.querySelectorAll('.item-card').forEach(card => {
        card.style.display = (!query || card.innerText.toLowerCase().includes(query)) ? '' : 'none';
    });
}

// Sort Function
document.getElementById('sort-select').addEventListener('change', function () {
    sortCards(document.getElementById('book-list-container'), this.value);
    sortCards(document.getElementById('movie-list-container'), this.value);
    renderBookGroups();
});

function sortCards(container, criteria) {
    const cards = Array.from(container.querySelectorAll('.item-card'));
    cards.sort((a, b) => {
        switch (criteria) {
            case 'title':
                return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
            case 'year':
                return (parseInt(b.querySelector('.item-meta:nth-child(4)').textContent) || 0)
                     - (parseInt(a.querySelector('.item-meta:nth-child(4)').textContent) || 0);
            case 'author':
                return a.querySelector('.item-meta:nth-child(2)').textContent
                        .localeCompare(b.querySelector('.item-meta:nth-child(2)').textContent);
            case 'genre':
                return a.querySelector('.item-meta:nth-child(3)').textContent
                        .localeCompare(b.querySelector('.item-meta:nth-child(3)').textContent);
            case 'status':
                return a.querySelector('.status-badge').textContent
                        .localeCompare(b.querySelector('.status-badge').textContent);
            default: return 0;
        }
    });
    cards.forEach(card => container.appendChild(card));
}

// Notifications
function showNotification(message, type = 'success') {
    document.querySelectorAll('.status-notification').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'status-notification';
    n.textContent = message;
    n.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500;
        font-family: 'Poppins', sans-serif; font-size: 0.9em;
        background: ${type === 'celebrate' ? 'linear-gradient(135deg,#f59e0b,#f5576c)' : type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        opacity: 0; transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '1'; n.style.transform = 'translateY(0)'; }, 50);
    setTimeout(() => {
        n.style.opacity = '0'; n.style.transform = 'translateY(10px)';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// Celebration
const bookMessages = [
    t => `📖 Finished "${t}"! Another one for the shelf.`,
    t => `🎉 "${t}" — done and dusted!`,
    t => `✨ You read "${t}"! Brilliant.`,
    t => `🏆 "${t}" complete. A reader's triumph!`,
];
const movieMessages = [
    t => `🎬 "${t}" watched! Roll credits.`,
    t => `🍿 Finished "${t}"! That's a wrap.`,
    t => `✨ "${t}" — seen it, loved it!`,
    t => `🏆 "${t}" complete. Lights up!`,
];

function celebrate(card, title, type) {
    card.classList.add('card-celebrate');
    setTimeout(() => card.classList.remove('card-celebrate'), 1500);
    const pool = type === 'book' ? bookMessages : movieMessages;
    showNotification(pool[Math.floor(Math.random() * pool.length)](title), 'celebrate');
}

// Forms 
function setupFormListeners() {
    document.getElementById('book-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const book = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            genre: document.getElementById('book-genre').value,
            year: document.getElementById('book-year').value,
            rating: parseFloat(document.getElementById('book-rating').value) || null,
            status: document.getElementById('book-status').value,
            group: document.getElementById('book-group').value.trim(),
        };
        addBookToDOM(book, document.getElementById('book-list-container'));
        this.reset();
        showNotification(`"${book.title}" added!`);
        renderBookGroups();
    });

    document.getElementById('movie-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const movie = {
            title: document.getElementById('movie-title').value,
            director: document.getElementById('movie-director').value,
            genre: document.getElementById('movie-genre').value,
            year: document.getElementById('movie-year').value,
            rating: parseFloat(document.getElementById('movie-rating').value) || null,
            status: document.getElementById('movie-status').value,
        };
        addMovieToDOM(movie, document.getElementById('movie-list-container'));
        this.reset();
        showNotification(`"${movie.title}" added!`);
    });
}
