// Funzionalità per estrarre e gestire le immagini di copertina dei progetti
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cover image script loaded');
    
    // Crea un'immagine di default se non esiste
    const defaultCoverImage = 'images/default-cover.jpg';
    // Prova a caricare l'immagine di default, se fallisce crea un data URL
    const img = new Image();
    img.onerror = function() {
        // Crea un canvas per generare un'immagine di default
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Disegna uno sfondo
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Disegna un'icona di libro
        ctx.fillStyle = '#666';
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📚', canvas.width/2, canvas.height/2);
        
        // Converti in data URL
        window.defaultCoverImageDataUrl = canvas.toDataURL('image/jpeg');
        console.log('Creata immagine di default:', window.defaultCoverImageDataUrl);
    };
    img.src = defaultCoverImage;
    
    // Funzione per estrarre l'immagine di copertina da un progetto
    window.extractCoverImage = function(project) {
        console.log('Extracting cover image for project:', project.id);
        
        // Se il progetto ha un campo immagine di copertina esplicito, usalo
        if (project.coverImage) {
            console.log('Using explicit cover image:', project.coverImage);
            return project.coverImage;
        }
        
        // Se il progetto ha un array di immagini, usa la prima
        if (project.images && project.images.length > 0) {
            console.log('Using first image from images array:', project.images[0]);
            return project.images[0];
        }
        
        // Se il progetto ha un contenuto HTML, cerca immagini al suo interno
        if (project.content) {
            console.log('Searching for images in content');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = project.content;
            
            const imgElements = tempDiv.querySelectorAll('img');
            if (imgElements.length > 0) {
                console.log('Found image in content:', imgElements[0].src);
                return imgElements[0].src;
            }
        }
        
        // Cerca immagini nel file HTML del progetto
        if (project.file) {
            console.log('Project has HTML file:', project.file);
            
            // Prova a estrarre un'immagine dal nome del file o dalla descrizione
            if (project.name && project.name.toLowerCase().includes('image')) {
                return defaultCoverImage;
            }
            
            if (project.description) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = project.description;
                
                const imgElements = tempDiv.querySelectorAll('img');
                if (imgElements.length > 0) {
                    console.log('Found image in description:', imgElements[0].src);
                    return imgElements[0].src;
                }
            }
        }
        
        // Immagine di default se non ne viene trovata nessuna
        console.log('No cover image found, using default');
        return window.defaultCoverImageDataUrl || 'images/default-cover.jpg';
    };
    
    // Funzione per estrarre immagini da un iframe
    window.extractImagesFromIframe = function(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const images = iframeDoc.querySelectorAll('img');
            
            if (images.length > 0) {
                // Trova l'URL completo dell'immagine
                let imgSrc = images[0].src;
                
                // Se l'URL è relativo, convertilo in assoluto
                if (imgSrc.indexOf('http') !== 0) {
                    const baseUrl = iframe.src.substring(0, iframe.src.lastIndexOf('/') + 1);
                    imgSrc = baseUrl + imgSrc;
                }
                
                console.log('Extracted image from iframe:', imgSrc);
                return imgSrc;
            }
        } catch (e) {
            console.error('Error extracting images from iframe:', e);
        }
        
        return null;
    };
    
    // Funzione per aggiungere l'immagine di copertina a un progetto nella lista
    window.addCoverImageToProjectList = function() {
        console.log('Adding cover images to project list');
        // Trova tutti gli elementi della lista dei progetti
        const projectItems = document.querySelectorAll('.project-list li[data-project-id]');
        console.log('Found', projectItems.length, 'project items');
        
        projectItems.forEach(item => {
            const projectId = item.getAttribute('data-project-id');
            console.log('Processing project:', projectId);
            
            // Trova il progetto corrispondente
            let project = null;
            for (const schoolId in window.projects) {
                const schoolProjects = window.projects[schoolId];
                for (const classId in schoolProjects) {
                    const classProjects = schoolProjects[classId];
                    const foundProject = classProjects.find(p => p.id === projectId);
                    if (foundProject) {
                        project = foundProject;
                        break;
                    }
                }
                if (project) break;
            }
            
            if (project) {
                console.log('Found project data:', project.name);
                // Estrai l'immagine di copertina
                const coverImage = window.extractCoverImage(project);
                console.log('Cover image for', project.name, ':', coverImage);
                
                // Aggiungi l'immagine di copertina all'elemento della lista
                if (!item.querySelector('.project-cover-image')) {
                    const coverImageElement = document.createElement('div');
                    coverImageElement.className = 'project-cover-image';
                    coverImageElement.innerHTML = `<img src="${coverImage}" alt="${project.name}" loading="lazy">`;
                    
                    // Inserisci l'immagine all'inizio dell'elemento
                    item.insertBefore(coverImageElement, item.firstChild);
                    console.log('Added cover image to project', project.name);
                }
            } else {
                console.log('Project data not found for ID:', projectId);
            }
        });
    };
    
    // Funzione per aggiungere l'immagine di copertina ai progetti selezionati
    window.addCoverImageToSelectedProjects = function() {
        // Trova tutti gli elementi dei progetti selezionati
        const selectedProjectCards = document.querySelectorAll('.selected-project-card');
        
        selectedProjectCards.forEach(card => {
            const projectId = card.getAttribute('data-project-id');
            
            // Trova il progetto corrispondente
            let project = null;
            for (const schoolId in window.projects) {
                const schoolProjects = window.projects[schoolId];
                for (const classId in schoolProjects) {
                    const classProjects = schoolProjects[classId];
                    const foundProject = classProjects.find(p => p.id === projectId);
                    if (foundProject) {
                        project = foundProject;
                        break;
                    }
                }
                if (project) break;
            }
            
            if (project) {
                // Estrai l'immagine di copertina
                const coverImage = window.extractCoverImage(project);
                
                // Aggiorna l'immagine del progetto selezionato
                const imageContainer = card.querySelector('.selected-project-image');
                if (imageContainer) {
                    imageContainer.innerHTML = `<img src="${coverImage}" alt="${project.name}" loading="lazy">`;
                }
            }
        });
    };
    
    // Aggiungi stili CSS per le immagini di copertina
    const style = document.createElement('style');
    style.textContent = `
        .project-cover-image {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 10px;
            flex-shrink: 0;
        }
        
        .project-cover-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .project-list li {
            display: flex;
            align-items: center;
        }
        
        .selected-project-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 10px;
        }
        
        .selected-project-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        /* Aggiungi immagine di copertina al modale del progetto */
        .modal-header {
            position: relative;
        }
        
        .modal-cover-image {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .modal-cover-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `;
    document.head.appendChild(style);
    
    // Funzione per attendere che i progetti siano caricati
    function waitForProjects(callback, maxAttempts = 20, interval = 500) {
        let attempts = 0;
        
        function checkProjects() {
            attempts++;
            console.log(`Tentativo ${attempts} di accesso ai progetti`);
            
            if (window.projects && Object.keys(window.projects).length > 0) {
                console.log('Progetti trovati:', Object.keys(window.projects));
                callback();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('Numero massimo di tentativi raggiunto, impossibile trovare i progetti');
                return;
            }
            
            setTimeout(checkProjects, interval);
        }
        
        checkProjects();
    }
    
    // Osserva i cambiamenti nel DOM per aggiungere le immagini di copertina quando vengono creati nuovi elementi
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Controlla se sono stati aggiunti elementi della lista dei progetti
                if (document.querySelector('.project-list li[data-project-id]')) {
                    waitForProjects(window.addCoverImageToProjectList);
                }
                
                // Controlla se sono stati aggiunti progetti selezionati
                if (document.querySelector('.selected-project-card')) {
                    waitForProjects(window.addCoverImageToSelectedProjects);
                }
            }
        });
    });
    
    // Inizia a osservare il documento
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Aggiungi un handler per quando i dati vengono caricati
    const originalLoadData = window.loadData;
    if (typeof originalLoadData === 'function') {
        window.loadData = async function() {
            await originalLoadData.apply(this, arguments);
            console.log('Dati caricati, aggiungo le immagini di copertina');
            window.addCoverImageToProjectList();
            window.addCoverImageToSelectedProjects();
        };
    }
    
    // Aggiungi un event listener per l'apertura del modale del progetto
    const projectFrame = document.getElementById('project-frame');
    if (projectFrame) {
        projectFrame.addEventListener('load', function() {
            if (window.currentProject) {
                // Estrai immagini dall'iframe
                const coverImage = window.extractImagesFromIframe(projectFrame) || window.extractCoverImage(window.currentProject);
                
                // Aggiungi l'immagine di copertina al modale
                let modalCoverImage = document.querySelector('.modal-cover-image');
                if (!modalCoverImage) {
                    modalCoverImage = document.createElement('div');
                    modalCoverImage.className = 'modal-cover-image';
                    
                    const modalHeader = document.querySelector('.modal-header');
                    if (modalHeader) {
                        modalHeader.appendChild(modalCoverImage);
                    }
                }
                
                if (modalCoverImage) {
                    modalCoverImage.innerHTML = `<img src="${coverImage}" alt="${window.currentProject.name}">`;
                }
            }
        });
    }
    
    // Esegui l'inizializzazione iniziale dopo un breve ritardo
    setTimeout(function() {
        console.log('Inizializzazione iniziale delle immagini di copertina');
        waitForProjects(function() {
            if (document.querySelector('.project-list li[data-project-id]')) {
                window.addCoverImageToProjectList();
            }
            
            if (document.querySelector('.selected-project-card')) {
                window.addCoverImageToSelectedProjects();
            }
        });
    }, 1000);
});
