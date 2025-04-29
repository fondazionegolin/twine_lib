// Script per aggiungere direttamente le immagini di copertina alle storie
document.addEventListener('DOMContentLoaded', function() {
    console.log('Direct cover image script loaded');
    
    // Crea un'immagine di default
    function createDefaultImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        
        // Sfondo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Bordo
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Icona libro
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📚', canvas.width/2, canvas.height/2);
        
        return canvas.toDataURL('image/png');
    }
    
    const defaultImage = createDefaultImage();
    
    // Aggiungi stili CSS
    const style = document.createElement('style');
    style.textContent = `
        .project-list li {
            display: flex !important;
            align-items: center !important;
            padding: 8px !important;
        }
        
        .project-cover {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 10px;
            flex-shrink: 0;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .project-cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .selected-project-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .selected-project-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `;
    document.head.appendChild(style);
    
    // Funzione per aggiungere copertine a tutti gli elementi della lista dei progetti
    function addCoverToProjectList() {
        const projectItems = document.querySelectorAll('.project-list li[data-project-id]');
        console.log('Found', projectItems.length, 'project items');
        
        projectItems.forEach(item => {
            // Verifica se l'elemento ha già una copertina
            if (!item.querySelector('.project-cover')) {
                const coverDiv = document.createElement('div');
                coverDiv.className = 'project-cover';
                coverDiv.innerHTML = `<img src="${defaultImage}" alt="Copertina">`;
                
                // Inserisci all'inizio dell'elemento
                if (item.firstChild) {
                    item.insertBefore(coverDiv, item.firstChild);
                } else {
                    item.appendChild(coverDiv);
                }
                
                console.log('Added cover to project item');
            }
        });
    }
    
    // Funzione per aggiungere copertine ai progetti selezionati
    function addCoverToSelectedProjects() {
        const selectedProjects = document.querySelectorAll('.selected-project-card');
        console.log('Found', selectedProjects.length, 'selected projects');
        
        selectedProjects.forEach(card => {
            const imageContainer = card.querySelector('.selected-project-image');
            if (imageContainer) {
                // Sostituisci l'icona con un'immagine
                if (imageContainer.querySelector('i.fas.fa-book-open')) {
                    imageContainer.innerHTML = `<img src="${defaultImage}" alt="Copertina">`;
                    console.log('Replaced icon with image in selected project');
                }
            }
        });
    }
    
    // Funzione per aggiungere copertina al modale del progetto
    function addCoverToProjectModal() {
        const modalHeader = document.querySelector('.modal-header');
        if (modalHeader && !modalHeader.querySelector('.modal-cover')) {
            const coverDiv = document.createElement('div');
            coverDiv.className = 'modal-cover';
            coverDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; width: 40px; height: 40px; border-radius: 8px; overflow: hidden;';
            coverDiv.innerHTML = `<img src="${defaultImage}" alt="Copertina" style="width: 100%; height: 100%; object-fit: cover;">`;
            
            modalHeader.appendChild(coverDiv);
            console.log('Added cover to project modal');
        }
    }
    
    // Osserva i cambiamenti nel DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Controlla se ci sono elementi della lista dei progetti
                if (document.querySelector('.project-list li[data-project-id]')) {
                    addCoverToProjectList();
                }
                
                // Controlla se ci sono progetti selezionati
                if (document.querySelector('.selected-project-card')) {
                    addCoverToSelectedProjects();
                }
                
                // Controlla se il modale del progetto è aperto
                if (document.querySelector('.modal-header')) {
                    addCoverToProjectModal();
                }
            }
        });
    });
    
    // Inizia a osservare il documento
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Esegui l'inizializzazione iniziale dopo un breve ritardo
    setTimeout(function() {
        addCoverToProjectList();
        addCoverToSelectedProjects();
    }, 1000);
    
    // Aggiungi un handler per il click sul pulsante di navigazione
    document.addEventListener('click', function(e) {
        // Controlla se è stato cliccato un elemento della navigazione
        if (e.target.closest('.school-item') || e.target.closest('.class-list li')) {
            // Attendi che il DOM venga aggiornato
            setTimeout(function() {
                addCoverToProjectList();
            }, 500);
        }
    });
});
