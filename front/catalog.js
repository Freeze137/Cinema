const API_BASE = "http://127.0.0.1:8000/api";

async function loadMovies() {
    try {
        const response = await fetch(`${API_BASE}/filmes`);
        const movies = await response.json();
        const grid = document.getElementById('movieGrid');
        
        grid.innerHTML = movies.map(movie => `
            <div class="summary-card" style="text-align: center;">
                <div class="movie-poster" style="height: 250px; background: linear-gradient(45deg, #1a1a1a, #e63946); margin-bottom: 15px;">🎬</div>
                <h3 style="color: var(--color-primary);">${movie.titulo}</h3>
                <p style="color: var(--color-text-secondary); margin: 10px 0; font-size: 0.9rem;">${movie.genero} • ${movie.duracao}</p>
                <button onclick="bookTicket(${movie.id})" style="width: 100%;">Comprar Ingresso</button>
            </div>
        `).join('');
    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
    }
}

function bookTicket(movieId) {
    // Para simplificar, mapeamos filme 1 para sessao 1 e filme 2 para sessao 2
    window.location.href = `Cinema Ticket Booking.html?sessaoId=${movieId}`;
}

loadMovies();