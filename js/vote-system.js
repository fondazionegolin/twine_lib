/**
 * Sistema di voto per le storie
 * Gestisce il modale di voto e l'interazione con il database
 */

// Variabili globali
let currentUser = null;
let currentProject = null;
let currentRating = 0;

// Inizializza il sistema di voto
function initVoteSystem() {
    // Crea gli elementi del modale e del pulsante di voto
    createVoteButton();
    createVoteModal();
    
    // Carica l'utente corrente
    loadCurrentUser();
}

// Crea il pulsante di voto fluttuante
function createVoteButton() {
    const voteButton = document.createElement('button');
    voteButton.className = 'floating-vote-btn';
    voteButton.innerHTML = '<i class="fas fa-star"></i>';
    voteButton.title = 'Vota questa storia';
    voteButton.addEventListener('click', openVoteModal);
    
    // Aggiungi il pulsante al DOM
    document.body.appendChild(voteButton);
    
    // Nascondi il pulsante inizialmente
    voteButton.style.display = 'none';
    
    // Esponi il pulsante globalmente
    window.voteButton = voteButton;
}

// Crea il modale di voto
function createVoteModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'vote-modal-overlay';
    
    modalOverlay.innerHTML = `
        <div class="vote-modal-container">
            <div class="vote-modal-header">
                <h2>Valuta questa Storia</h2>
                <button class="vote-modal-close">&times;</button>
            </div>
            <div class="vote-modal-body">
                <p>Quanto ti è piaciuta questa storia?</p>
                <div class="vote-hearts">
                    ${Array.from({length: 5}, (_, i) => `
                        <div class="vote-heart" data-rating="${i+1}">
                            <svg viewBox="0 0 24 24">
                                <path class="heart-outline" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                                <path class="heart-fill" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                            </svg>
                        </div>
                    `).join('')}
                </div>
                <div class="vote-feedback"></div>
            </div>
        </div>
    `;
    
    // Aggiungi il modale al DOM
    document.body.appendChild(modalOverlay);
    
    // Aggiungi event listeners
    const closeButton = modalOverlay.querySelector('.vote-modal-close');
    const hearts = modalOverlay.querySelectorAll('.vote-heart');
    
    closeButton.addEventListener('click', closeVoteModal);
    
    // Aggiungi event listeners per i cuoricini
    hearts.forEach(heart => {
        heart.addEventListener('click', () => {
            const rating = parseInt(heart.getAttribute('data-rating'));
            selectRating(rating);
            // Invia il voto immediatamente quando si clicca su un cuore
            submitVote();
        });
        
        heart.addEventListener('mouseover', () => {
            const rating = parseInt(heart.getAttribute('data-rating'));
            highlightHearts(rating);
        });
        
        heart.addEventListener('mouseout', () => {
            resetHeartsHighlight();
        });
    });
    
    // Chiudi il modale se si clicca fuori dal contenuto
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeVoteModal();
        }
    });
    
    // Esponi il modale globalmente
    window.voteModal = modalOverlay;
}

// Carica l'utente corrente
function loadCurrentUser() {
    // Controlla se c'è un utente nel localStorage
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
        } catch (e) {
            console.error('Errore nel parsing dell\'utente:', e);
            currentUser = null;
        }
    }
}

// Mostra il pulsante di voto se c'è un progetto corrente e l'utente è loggato
function showVoteButton(project) {
    if (!project) return;
    
    currentProject = project;
    
    // Mostra il pulsante solo se l'utente è loggato
    if (currentUser && currentUser.isLoggedIn) {
        window.voteButton.style.display = 'flex';
    } else {
        window.voteButton.style.display = 'none';
    }
}

// Nascondi il pulsante di voto
function hideVoteButton() {
    window.voteButton.style.display = 'none';
    currentProject = null;
}

// Apri il modale di voto
function openVoteModal() {
    if (!currentUser || !currentUser.isLoggedIn) {
        alert('Devi effettuare il login per votare');
        return;
    }
    
    if (!currentProject) {
        console.error('Nessun progetto selezionato');
        return;
    }
    
    // Resetta il modale
    resetVoteModal();
    
    // Carica il voto esistente dell'utente
    loadUserVote();
    
    // Mostra il modale
    window.voteModal.classList.add('active');
}

// Chiudi il modale di voto
function closeVoteModal() {
    window.voteModal.classList.remove('active');
}

// Resetta il modale di voto
function resetVoteModal() {
    currentRating = 0;
    resetHeartsHighlight();
    
    // Resetta il feedback
    const feedback = window.voteModal.querySelector('.vote-feedback');
    feedback.textContent = '';
    feedback.classList.remove('show');
    feedback.classList.remove('visible');
    
    // Resetta anche l'elemento di successo se esiste
    const successElement = window.voteModal.querySelector('.vote-success');
    if (successElement) {
        successElement.classList.remove('show');
        successElement.innerHTML = '';
    }
}

// Carica il voto esistente dell'utente
async function loadUserVote() {
    if (!currentUser || !currentUser.isLoggedIn || !currentProject) return;
    
    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get_user_votes',
                username: currentUser.username
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento del voto');
        }
        
        const data = await response.json();
        
        if (data.success && data.votes) {
            // Cerca il voto per il progetto corrente
            const vote = data.votes.find(v => v.project_id === currentProject.id);
            
            if (vote) {
                // Seleziona il rating esistente
                selectRating(vote.vote_value);
            }
        }
    } catch (error) {
        console.error('Errore nel caricamento del voto:', error);
    }
}

// Seleziona un rating
function selectRating(rating) {
    currentRating = rating;
    
    // Aggiorna i cuoricini
    const hearts = window.voteModal.querySelectorAll('.vote-heart');
    hearts.forEach(heart => {
        const heartRating = parseInt(heart.getAttribute('data-rating'));
        if (heartRating <= rating) {
            heart.classList.add('selected');
        } else {
            heart.classList.remove('selected');
        }
    });
}

// Evidenzia i cuoricini al passaggio del mouse
function highlightHearts(rating) {
    const hearts = window.voteModal.querySelectorAll('.vote-heart');
    hearts.forEach(heart => {
        const heartRating = parseInt(heart.getAttribute('data-rating'));
        if (heartRating <= rating) {
            heart.classList.add('hover');
        } else {
            heart.classList.remove('hover');
        }
    });
}

// Reimposta l'evidenziazione dei cuoricini
function resetHeartsHighlight() {
    if (!currentRating) {
        const hearts = window.voteModal.querySelectorAll('.vote-heart');
        hearts.forEach(heart => {
            heart.classList.remove('hover');
        });
    } else {
        highlightHearts(currentRating);
    }
}

// Invia il voto
async function submitVote() {
    if (!currentRating) return;
    
    try {
        // Mostra feedback di caricamento
        const feedback = window.voteModal.querySelector('.vote-feedback');
        feedback.textContent = 'Invio in corso...';
        feedback.classList.add('visible');
        
        // Invia il voto al server
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                projectId: currentProject.id,
                vote: currentRating
            })
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'invio del voto');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Nascondi il feedback di caricamento
            feedback.classList.remove('visible');
            
            // Crea o ottieni l'elemento di successo
            let successElement = window.voteModal.querySelector('.vote-success');
            if (!successElement) {
                successElement = document.createElement('div');
                successElement.className = 'vote-success';
                const modalBody = window.voteModal.querySelector('.vote-modal-body');
                modalBody.appendChild(successElement);
            }
            
            // Mostra il messaggio di successo con icona
            successElement.innerHTML = '<i class="fas fa-check-circle"></i> Voto registrato con successo!';
            successElement.classList.add('show');
            
            // Chiudi il modale dopo un breve ritardo
            setTimeout(() => {
                closeVoteModal();
                // Rimuovi la classe show dopo la chiusura
                setTimeout(() => {
                    successElement.classList.remove('show');
                }, 500);
            }, 2000);
            
            // Aggiorna anche il vecchio sistema per retrocompatibilità
            updateLegacyVoteSystem(currentProject.id, currentRating);
        } else {
            // Mostra errore
            feedback.textContent = data.message || 'Errore nell\'invio del voto';
            feedback.classList.add('show');
        }
    } catch (error) {
        console.error('Errore nell\'invio del voto:', error);
        
        // Mostra errore
        const feedback = window.voteModal.querySelector('.vote-feedback');
        feedback.textContent = 'Si è verificato un errore. Riprova più tardi.';
        feedback.classList.add('visible');
    }
}

// Aggiorna il vecchio sistema di voto per retrocompatibilità
async function updateLegacyVoteSystem(projectId, rating) {
    try {
        // Invia il voto anche al vecchio endpoint
        await fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                projectId: projectId,
                vote: rating
            })
        });
        
        // Aggiorna le variabili globali del vecchio sistema
        if (window.votes) {
            window.votes[projectId] = rating;
        }
        
        // Aggiorna la visualizzazione se esiste la funzione
        if (typeof window.updateRatingDisplay === 'function') {
            window.updateRatingDisplay(projectId);
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento del vecchio sistema:', error);
    }
}

// Inizializza il sistema di voto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initVoteSystem);

// Esponi le funzioni globalmente
window.showVoteButton = showVoteButton;
window.hideVoteButton = hideVoteButton;
window.openVoteModal = openVoteModal;
