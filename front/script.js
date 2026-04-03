const API_BASE_URL = "http://127.0.0.1:8000/api";
let SEAT_PRICE = 0;
let TAX = 2.50;
let selectedSeats = new Set();
let occupiedSeats = new Set();

// Pega o ID da URL
const urlParams = new URLSearchParams(window.location.search);
const currentSessionId = urlParams.get('sessaoId') || 1;

async function fetchSessionData() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessao/${currentSessionId}`);
        if (!response.ok) throw new Error("Sessão não encontrada");
        const data = await response.json();

        document.getElementById('movieTitle').textContent = data.filme.titulo;
        document.getElementById('movieDuration').textContent = `⏱️ ${data.filme.duracao}`;
        document.getElementById('movieRating').textContent = `⭐ ${data.filme.avaliacao}`;
        document.getElementById('movieGenre').textContent = `🎬 ${data.filme.genero}`;
        document.getElementById('movieSynopsis').textContent = data.filme.sinopse;

        SEAT_PRICE = data.detalhes.preco_ingresso;
        document.getElementById('unitPrice').textContent = `R$ ${SEAT_PRICE.toFixed(2).replace('.', ',')}`;

        const cSel = document.getElementById('cinemaSelect');
        cSel.innerHTML = `<option>${data.detalhes.cinema} - ${data.detalhes.sala}</option>`;
        const sSel = document.getElementById('showtimeSelect');
        sSel.innerHTML = `<option>${data.detalhes.horario}</option>`;

        occupiedSeats = new Set(data.assentos_ocupados);
        renderSeatingChart();
        updateSummary();
    } catch (error) {
        console.error(error);
        showToast("Erro ao conectar com o servidor.", "error");
    }
}

function renderSeatingChart() {
    const area = document.getElementById('seatingArea');
    area.innerHTML = '';
    const rows = 8;
    const seatsPerRow = 12;

    for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        const label = document.createElement('span');
        label.className = 'row-label';
        label.textContent = String.fromCharCode(65 + r);
        rowDiv.appendChild(label);

        for (let s = 1; s <= seatsPerRow; s++) {
            const id = `${label.textContent}${s}`;
            const btn = document.createElement('button');
            btn.className = 'seat';
            btn.textContent = s;
            if (r >= 6) btn.classList.add('vip');
            if (occupiedSeats.has(id)) { btn.disabled = true; }
            if (selectedSeats.has(id)) { btn.classList.add('selected'); }

            btn.onclick = () => {
                if (selectedSeats.has(id)) selectedSeats.delete(id);
                else if (selectedSeats.size < 5) selectedSeats.add(id);
                else showToast("Limite de 5 assentos", "error");
                updateSummary();
                renderSeatingChart();
            };
            rowDiv.appendChild(btn);
        }
        area.appendChild(rowDiv);
    }
}

function updateSummary() {
    const count = selectedSeats.size;
    const total = count > 0 ? (count * SEAT_PRICE) + TAX : 0;
    document.getElementById('ticketCount').textContent = count;
    document.getElementById('totalPrice').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('confirmBtn').disabled = count === 0;
}

async function confirmReservation() {
    try {
        const response = await fetch(`${API_BASE_URL}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessao_id: currentSessionId, assentos: Array.from(selectedSeats) })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(result.mensagem, "success");
            selectedSeats.forEach(s => occupiedSeats.add(s));
            selectedSeats.clear();
            renderSeatingChart(); 
            updateSummary();
            showTicket(result);
        } else {
            showToast(result.detail || "Erro ao salvar", "error");
            // Recarrega os dados caso haja conflito de assentos
            fetchSessionData();
        }
    } catch (e) { showToast("Erro de comunicação com o servidor", "error"); }
}

function showTicket(data) {
    document.getElementById('ticketReservaId').textContent = data.reserva_id;
    document.getElementById('ticketMovieTitle').textContent = document.getElementById('movieTitle').textContent;
    const assentosStrs = data.detalhes.assentos.map(a => `${a.assento} (${a.tipo})`).join(', ');
    document.getElementById('ticketSeats').textContent = assentosStrs;
    document.getElementById('ticketTotal').textContent = `R$ ${data.detalhes.valor_total.toFixed(2).replace('.', ',')}`;
    document.getElementById('ticketModal').style.display = 'flex';
}

function closeTicket() {
    document.getElementById('ticketModal').style.display = 'none';
    window.location.href = 'index.html';
}

function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

function clearSelection() { selectedSeats.clear(); renderSeatingChart(); updateSummary(); }

fetchSessionData();