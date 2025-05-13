document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const book = document.getElementById('book');
    const dynamicPages = document.getElementById('dynamic-pages');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const projectModal = document.getElementById('project-modal');
    const projectFrame = document.getElementById('project-frame');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const modalDarkModeToggle = document.getElementById('modal-dark-mode-toggle');
    const homeNavBtn = document.getElementById('home-nav-btn');
    const modalHomeBtn = document.getElementById('modal-home-btn');
    const backToClassBtn = document.getElementById('back-to-class-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    // Riferimenti ai pulsanti di valutazione rimossi
    const modalRatingBtn = document.getElementById('modal-rating-btn');
    const modalRatingValue = modalRatingBtn ? modalRatingBtn.querySelector('.rating-value') : null;
    const modalRatingContainer = document.getElementById('modal-rating-container');
    const modalRatingStars = modalRatingContainer ? document.querySelectorAll('#modal-rating-container .rating-stars i') : [];
    const breadcrumb = document.getElementById('breadcrumb');
    const modalBreadcrumb = document.getElementById('modal-breadcrumb');
    const userBtn = document.getElementById('user-btn');
    const userContainer = document.getElementById('user-container');
    const userName = document.querySelector('.user-name');
    const userPopupName = document.querySelector('.user-popup-name');
    const logoutBtn = document.getElementById('logout-btn');
    const statsBtn = document.getElementById('stats-btn');
    
    // Stato dell'applicazione
    let currentPage = 0;
    let pages = document.querySelectorAll('.page');
    let currentProject = null;
    let currentClass = null;
    let currentSchool = null;
    let schools = [];
    let projects = {};
    let ratings = {};
    let votes = {};
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    // Variabili per la valutazione
    let ratingTimer = null;
    let currentRating = 0;
    let isRatingActive = false;
    let currentUser = null;
    
    // Lista dei progetti classificati
    const featuredProjects = [
        { id: "lagrange_classe3C_storia", class: "3C - LAGRANGE" },
        { id: "tenca_classe4A_INTRIGHI_NELLA_MILANO_DELLA_CONTRORIFORMA", class: "4A - TENCA" },
        { id: "tenca_classe4E_Tutto___compiuto", class: "4E - TENCA" },
        { id: "tenca_classe4E_ArchCity", class: "4E - TENCA" },
        { id: "tenca_classe3F_l_ultima_sinfonia", class: "3F - TENCA" },
        { id: "tenca_classe3E_La_città_senza_prezzo", class: "3E - TENCA" },
        { id: "tenca_classe3B_3B-Team_4", class: "3B - TENCA" },
        // I seguenti progetti non sono stati trovati con i nomi esatti, quindi sono commentati
         { id: "lagrange_classe3D_Manfagiolo", class: "3D - LAGRANGE" },
         { id: "tenca_classe3A_RITORNO_A_CASA_2096", class: "3A - TENCA" },
         { id: "lagrange_classe3D_Milano_gratis", class: "3D - LAGRANGE" }
    ];
    
    // Inizializza l'utente
    function initializeUser() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            if (currentUser.isLoggedIn) {
                userName.textContent = currentUser.username;
                userPopupName.textContent = currentUser.username;
            } else {
                window.location.href = 'login.html';
            }
        } else {
            window.location.href = 'login.html';
        }
    }
    
    // Imposta la modalità iniziale (dark o light)
    if (isDarkMode) {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
        // Aggiorna le icone
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        modalDarkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        // Imposta i loghi alla versione per la dark mode
        document.querySelectorAll('.jpmc-logo, .theme-logo').forEach(logo => {
            logo.src = logo.getAttribute('data-dark-src');
        });
        document.querySelectorAll('.fg-theme-logo').forEach(logo => {
            logo.src = logo.getAttribute('data-dark-src');
        });
    } else {
        // Imposta i loghi alla versione per la light mode
        document.querySelectorAll('.jpmc-logo, .theme-logo').forEach(logo => {
            logo.src = logo.getAttribute('data-light-src');
        });
        document.querySelectorAll('.fg-theme-logo').forEach(logo => {
            logo.src = logo.getAttribute('data-light-src');
        });
    }
    
    // Carica i dati delle scuole, classi e progetti
    async function loadData() {
        console.log('Inizializzazione del caricamento dati...');
        
        // Inizializza le strutture dati se non esistono
        schools = schools || [];
        projects = projects || {};
        ratings = ratings || {};
        votes = votes || {};
        
        try {
            // Carica le scuole e le classi
            try {
                console.log('Caricamento scuole e classi...');
                const classesResponse = await fetch('/server/classes.json');
                if (classesResponse.ok) {
                    schools = await classesResponse.json();
                    console.log('Scuole e classi caricate con successo:', schools.length, 'scuole');
                } else {
                    console.error('Errore nel caricamento delle scuole:', classesResponse.status);
                }
            } catch (error) {
                console.error('Eccezione nel caricamento delle scuole:', error);
            }
            
            // Carica i progetti
            try {
                console.log('Caricamento progetti...');
                const projectsResponse = await fetch('/server/projects.json');
                if (projectsResponse.ok) {
                    projects = await projectsResponse.json();
                    console.log('Progetti caricati con successo:', Object.keys(projects).length, 'scuole con progetti');
                } else {
                    console.error('Errore nel caricamento dei progetti:', projectsResponse.status);
                }
            } catch (error) {
                console.error('Eccezione nel caricamento dei progetti:', error);
            }
            
            // Carica i like (ora ratings)
            try {
                console.log('Caricamento ratings...');
                const likesResponse = await fetch('/server/likes.json');
                if (likesResponse.ok) {
                    ratings = await likesResponse.json();
                    console.log('Ratings caricati con successo');
                } else {
                    console.error('Errore nel caricamento dei ratings:', likesResponse.status);
                }
            } catch (error) {
                console.error('Eccezione nel caricamento dei ratings:', error);
            }
            
            // Carica i voti dell'utente
            if (currentUser && currentUser.isLoggedIn) {
                try {
                    console.log('Caricamento voti utente...');
                    const votesResponse = await fetch('/server/votes.json');
                    if (votesResponse.ok) {
                        const allVotes = await votesResponse.json();
                        console.log('Voti caricati:', allVotes);
                        
                        // Inizializza i voti dell'utente se non esistono
                        if (currentUser.username in allVotes) {
                            votes = allVotes[currentUser.username] || {};
                            console.log('Voti utente trovati:', votes);
                        } else {
                            // Se l'utente non ha voti, inizializza un oggetto vuoto
                            votes = {};
                            console.log('Nessun voto trovato per l\'utente, inizializzazione...');
                            
                            // Invia una richiesta per inizializzare i voti dell'utente sul server
                            try {
                                await fetch('/api/vote', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        username: currentUser.username,
                                        projectId: 'init',
                                        vote: 0
                                    })
                                });
                                console.log('Voti utente inizializzati con successo');
                            } catch (e) {
                                console.error('Errore nell\'inizializzazione dei voti:', e);
                            }
                        }
                    } else {
                        console.error('Errore nel caricamento dei voti:', votesResponse.status);
                        votes = {};
                    }
                } catch (error) {
                    console.error('Eccezione nel caricamento dei voti:', error);
                    votes = {};
                }
            }
            
            // Popola l'interfaccia utente con i dati caricati
            console.log('Popolamento interfaccia utente...');
            
            // Popola l'indice delle scuole se ci sono scuole caricate
            if (schools && schools.length > 0) {
                try {
                    populateSchoolList();
                    console.log('Indice scuole popolato con successo');
                } catch (error) {
                    console.error('Errore nel popolamento dell\'indice scuole:', error);
                }
            } else {
                console.warn('Nessuna scuola da visualizzare');
            }
            
            // Popola la sezione CLASSIFICATI se ci sono progetti caricati
            if (projects && Object.keys(projects).length > 0) {
                try {
                    populateFeaturedProjects();
                    console.log('Sezione CLASSIFICATI popolata con successo');
                } catch (error) {
                    console.error('Errore nel popolamento della sezione CLASSIFICATI:', error);
                }
            } else {
                console.warn('Nessun progetto da visualizzare nella sezione CLASSIFICATI');
            }
            
            // Aggiorna la navigazione
            try {
                updateNavigation();
                console.log('Navigazione aggiornata con successo');
            } catch (error) {
                console.error('Errore nell\'aggiornamento della navigazione:', error);
            }
            
            console.log('Caricamento dati completato con successo');
        } catch (error) {
            console.error('Errore generale nel caricamento dei dati:', error);
        }
    }
    
    // Popola la lista delle scuole
    function populateSchoolList() {
        const classList = document.getElementById('class-list');
        if (!classList) {
            console.error('Elemento class-list non trovato');
            return;
        }
        
        classList.innerHTML = '';
        
        if (!schools || !Array.isArray(schools) || schools.length === 0) {
            console.warn('Nessuna scuola disponibile da visualizzare');
            const schoolItem = document.createElement('div');
            schoolItem.className = 'school-item no-schools';
            schoolItem.innerHTML = `
                <div class="school-header">
                    <i class="fas fa-school"></i>
                </div>
                <div class="school-body">
                    <div class="school-name">Nessuna scuola disponibile</div>
                </div>
            `;
            classList.appendChild(schoolItem);
            return;
        }
        
        // Icone per le scuole
        const icons = {
            'tenca': 'fa-book', // Icona libro per il liceo
            'lagrange': 'fa-laptop-code' // Icona computer per il tecnico informatico
        };
        
        // Nomi completi delle scuole
        const fullNames = {
            'tenca': 'Liceo Statale "Carlo Tenca"',
            'lagrange': 'IIS "Giuseppe Luigi Lagrange"'
        };
        
        schools.forEach((school, index) => {
            if (!school || typeof school !== 'object') {
                console.warn('Dati scuola non validi:', school);
                return;
            }
            
            try {
                // Usa il nome completo se disponibile, altrimenti usa il nome originale
                const schoolFullName = fullNames[school.id] || school.name || 'Scuola senza nome';
                const iconClass = icons[school.id] || 'fa-school';
                
                const schoolItem = document.createElement('div');
                schoolItem.className = 'school-item';
                // Colori diversi per le diverse scuole
                const headerColor = school.id === 'tenca' ? '#FF8C00' : '#9ACD32'; // Arancione per Tenca, Verde pisello per Lagrange
                
                // Creare la scheda con struttura identica ai featured projects
                schoolItem.className = 'school-card';
                
                // Creare l'HTML della scheda direttamente
                schoolItem.innerHTML = `
                    <div class="school-card-header" style="background-color: ${headerColor};">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="school-card-body">
                        <div class="school-card-title">${schoolFullName}</div>
                    </div>
                `;
                
                schoolItem.addEventListener('click', () => {
                    try {
                        createSchoolPage(school, index);
                        goToPage(2); // Vai alla pagina della scuola (dopo copertina e pagina CLASSIFICATI+scuole)
                        updateBreadcrumb('Scuole', schoolFullName);
                    } catch (error) {
                        console.error('Errore nel click su scuola:', error);
                        alert('Si è verificato un errore nel caricamento della scuola. Riprova.');
                    }
                });
                
                classList.appendChild(schoolItem);
            } catch (error) {
                console.error('Errore nella creazione dell\'elemento scuola:', error);
            }
        });
    }
    
    // Popola la sezione CLASSIFICATI
    function populateFeaturedProjects() {
        const featuredProjectsContainer = document.getElementById('featured-projects');
        if (!featuredProjectsContainer) {
            console.error('Elemento featured-projects non trovato');
            return;
        }
        
        featuredProjectsContainer.innerHTML = '';
        
        // Verifica se ci sono progetti classificati
        if (!featuredProjects || !Array.isArray(featuredProjects) || featuredProjects.length === 0) {
            console.warn('Nessun progetto classificato disponibile');
            featuredProjectsContainer.innerHTML = '<div class="no-featured-projects">Nessun progetto classificato disponibile</div>';
            return;
        }
        
        // Verifica se ci sono progetti caricati
        if (!projects || Object.keys(projects).length === 0) {
            console.warn('Nessun progetto caricato disponibile');
            featuredProjectsContainer.innerHTML = '<div class="no-featured-projects">Caricamento progetti in corso...</div>';
            return;
        }
        
        // Icone per i progetti classificati
        const icons = [
            'fa-trophy', 'fa-medal', 'fa-award', 'fa-star', 'fa-crown', 
            'fa-certificate', 'fa-gem', 'fa-bookmark', 'fa-heart', 'fa-thumbs-up'
        ];
        
        let projectsFound = 0;
        
        // Itera sui progetti classificati
        featuredProjects.forEach((featuredProject, index) => {
            if (!featuredProject || !featuredProject.id) {
                console.warn('Dati progetto classificato non validi:', featuredProject);
                return;
            }
            
            try {
                // Cerca il progetto nei dati caricati
                let projectData = null;
                let schoolId = '';
                let classId = '';
                
                // Estrai school_id e class_id dall'id del progetto
                const idParts = featuredProject.id.split('_');
                if (idParts.length >= 2) {
                    schoolId = idParts[0];
                    classId = idParts[1];
                } else {
                    console.warn('ID progetto non valido:', featuredProject.id);
                    return;
                }
                
                // Cerca il progetto nei dati caricati
                if (projects[schoolId] && projects[schoolId][classId]) {
                    const projectList = projects[schoolId][classId];
                    if (Array.isArray(projectList)) {
                        projectData = projectList.find(p => p && p.id === featuredProject.id);
                    }
                }
                
                // Se il progetto è stato trovato, crea l'elemento
                if (projectData) {
                    projectsFound++;
                    
                    const projectElement = document.createElement('div');
                    projectElement.className = 'featured-project';
                    projectElement.dataset.projectId = projectData.id;
                    
                    // Icona casuale per il progetto (o usa quella del progetto se disponibile)
                    const iconClass = projectData.cover_image || icons[index % icons.length];
                    
                    const projectName = projectData.name || 'Progetto senza nome';
                    const projectClass = featuredProject.class || 'Classe non specificata';
                    const projectDescription = projectData.description || '';
                    
                    projectElement.innerHTML = `
                        <div class="featured-project-header">
                            <i class="fas ${iconClass}"></i>
                            <span>${index + 1}</span>
                        </div>
                        <div class="featured-project-body">
                            <div class="featured-project-title">${projectName}</div>
                            <div class="featured-project-class">${projectClass}</div>
                        </div>
                    `;
                    
                    // Aggiungi event listener per aprire il progetto
                    projectElement.addEventListener('click', () => {
                        try {
                            openProject(projectData);
                        } catch (error) {
                            console.error('Errore nell\'apertura del progetto:', error);
                            alert('Si è verificato un errore nell\'apertura del progetto. Riprova.');
                        }
                    });
                    
                    featuredProjectsContainer.appendChild(projectElement);
                } else {
                    console.warn('Progetto non trovato:', featuredProject.id);
                }
            } catch (error) {
                console.error('Errore nella creazione dell\'elemento progetto classificato:', error);
            }
        });
        
        // Se non sono stati trovati progetti, mostra un messaggio
        if (projectsFound === 0) {
            console.warn('Nessun progetto classificato trovato');
            featuredProjectsContainer.innerHTML = '<div class="no-featured-projects">Nessun progetto classificato trovato</div>';
        } else {
            console.log('Progetti classificati trovati:', projectsFound);
        }
    }
    
    // Crea una pagina per la scuola selezionata
    function createSchoolPage(school, index) {
        // Salva la scuola corrente
        currentSchool = school;
        
        // Rimuovi eventuali pagine dinamiche esistenti
        dynamicPages.innerHTML = '';
        
        // Crea la pagina della scuola
        const schoolPage = document.createElement('div');
        schoolPage.className = 'page school-page';
        schoolPage.innerHTML = `
            <div class="content">
                <h2>${school.name}</h2>
                <h3>Classi</h3>
                <ul class="class-list">
                    ${school.classes && school.classes.length > 0 ? school.classes.map(classItem => `
                        <li data-class-id="${classItem.id}">
                            <span>${classItem.name}</span>
                        </li>
                    `).join('') : '<li>Nessuna classe disponibile</li>'}
                </ul>
                <button id="back-to-index-btn" class="back-to-index big-button">Torna all'indice <i class="fas fa-arrow-left"></i></button>
            </div>
        `;
        
        // Aggiungi la pagina al contenitore
        dynamicPages.appendChild(schoolPage);
        
        // Aggiorna le pagine
        pages = document.querySelectorAll('.page');
        
        // Aggiungi event listener alle classi
        const classItems = schoolPage.querySelectorAll('.class-list li[data-class-id]');
        classItems.forEach(item => {
            item.addEventListener('click', () => {
                const classId = item.getAttribute('data-class-id');
                const classItem = school.classes.find(c => c.id === classId);
                
                if (classItem) {
                    createClassPage(classItem, school);
                    goToPage(3); // Vai alla pagina della classe
                    updateBreadcrumb(school.name, classItem.name);
                }
            });
        });
        
        // Aggiungi event listener al pulsante "Torna all'indice"
        const backButton = document.getElementById('back-to-index-btn');
        backButton.addEventListener('click', function() {
            goToPage(1); // Torna all'indice
            updateBreadcrumb('Home', 'Scuole');
        });
    }
    
    // Crea una pagina per la classe selezionata
    function createClassPage(classItem, school) {
        console.log('Creating class page for:', classItem);
        console.log('School:', school);
        
        // Salva la classe corrente
        currentClass = classItem;
        
        // Estrai i progetti della classe
        const schoolProjects = projects[school.id] || {};
        console.log('School projects:', schoolProjects);
        
        const classProjects = schoolProjects[classItem.id.replace(`${school.id}_`, '')] || [];
        console.log('Class projects:', classProjects);
        
        // Crea la pagina della classe
        const classPage = document.createElement('div');
        classPage.className = 'page class-page';
        classPage.innerHTML = `
            <div class="content">
                <h2>${classItem.name}</h2>
                <p class="class-description">${classItem.description || ''}</p>
                <h3>Progetti</h3>
                <div class="project-grid"></div>
                <button id="back-to-school-btn" class="back-to-index big-button">Torna alla scuola <i class="fas fa-arrow-left"></i></button>
            </div>
        `;
        
        const projectGrid = classPage.querySelector('.project-grid');
        
        // Aggiungi ogni progetto alla griglia
        classProjects.forEach(project => {
            console.log('Processing project:', project);
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.setAttribute('data-project-id', project.id);
            
            // Crea elemento immagine con placeholder iniziale
            projectCard.innerHTML = `
                <div class="project-image">
                    <i class="fas fa-book-open placeholder-icon"></i>
                </div>
                <div class="project-info">
                    <div class="project-title">${project.name}</div>
                </div>
            `;
            
            // Usa l'icona di copertina dai metadati se disponibile
            if (project.cover_image) {
                const imgContainer = projectCard.querySelector('.project-image');
                
                // Verifica se è un'icona Font Awesome o un'immagine
                if (project.cover_image.startsWith('fa-')) {
                    // Crea un'icona con colore casuale basato sul nome del progetto
                    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF5', '#FFBD33'];
                    const colorIndex = project.name.length % colors.length;
                    const bgColor = colors[colorIndex];
                    
                    imgContainer.innerHTML = `<i class="fas ${project.cover_image}" style="color: ${bgColor};"></i>`;
                    imgContainer.style.backgroundColor = `${bgColor}20`; // Versione trasparente del colore
                    imgContainer.classList.add('has-icon');
                } else {
                    // È un'icona di default
                    imgContainer.innerHTML = `<i class="fas fa-book-open" style="color: #4CAF50;"></i>`;
                    imgContainer.style.backgroundColor = '#4CAF5020';
                    imgContainer.classList.add('has-icon');
                }
            } else {
                // Usa l'icona di default
                const imgContainer = projectCard.querySelector('.project-image');
                imgContainer.innerHTML = `<i class="fas fa-book-open" style="color: #4CAF50;"></i>`;
                imgContainer.style.backgroundColor = '#4CAF5020';
                imgContainer.classList.add('has-icon');
            }
            
            projectCard.addEventListener('click', () => {
                console.log('Opening project:', project);
                openProject(project);
            });
            projectGrid.appendChild(projectCard);
        });
        
        dynamicPages.appendChild(classPage);
        
        // Aggiorna le pagine
        pages = document.querySelectorAll('.page');
        
        // Aggiungi event listener al pulsante "Torna alla scuola"
        const backButton = classPage.querySelector('#back-to-school-btn');
        if (backButton) {
            backButton.addEventListener('click', function() {
                // Rimuovi la pagina della classe
                classPage.remove();
                
                // Aggiorna le pagine
                pages = document.querySelectorAll('.page');
                
                // Torna alla pagina della scuola
                goToPage(2);
                updateBreadcrumb('Scuole', school.name);
            });
        }
    }
    
    // Ottieni il valore di valutazione da visualizzare
    function getRatingDisplay(projectId) {
        const rating = ratings[projectId] || 0;
        return rating > 0 ? rating.toFixed(1) : '0';
    }
    
    // Ottieni il voto dell'utente per un progetto
    function getUserVote(projectId) {
        return votes[projectId] || 0;
    }
    
    // Aggiorna il breadcrumb
    function updateBreadcrumb(parent, current) {
        let html = '';
        
        if (parent === 'Home') {
            html = `<span class="breadcrumb-item active">Home</span>`;
        } else if (parent === 'Scuole') {
            html = `
                <span class="breadcrumb-item" onclick="goToPage(0)">Home</span>
                <span class="breadcrumb-item active">${current}</span>
            `;
        } else {
            html = `
                <span class="breadcrumb-item" onclick="goToPage(0)">Home</span>
                <span class="breadcrumb-item" onclick="goToPage(2)">${parent}</span>
                <span class="breadcrumb-item active">${current}</span>
            `;
        }
        
        breadcrumb.innerHTML = html;
    }
    
    // Aggiorna il breadcrumb del modale
    function updateModalBreadcrumb(parent, current) {
        let html = `
            <span class="breadcrumb-item">${parent}</span>
            <span class="breadcrumb-item active">${current}</span>
        `;
        
        modalBreadcrumb.innerHTML = html;
    }
    
    // Apri un progetto
    function openProject(project) {
        console.log('Opening project with data:', project);
        
        // Salva il progetto corrente
        currentProject = project;
        
        // Se currentClass non è impostato, prova a ricavarlo dall'ID del progetto
        if (!currentClass && project.id) {
            const idParts = project.id.split('_');
            if (idParts.length >= 2) {
                const schoolId = idParts[0];
                const classIdPart = idParts[1];
                
                // Cerca la scuola e la classe corrispondenti
                const school = schools.find(s => s.id === schoolId);
                if (school && school.classes) {
                    const classObj = school.classes.find(c => c.id.includes(classIdPart));
                    if (classObj) {
                        console.log('Setting currentClass from project ID:', classObj);
                        currentClass = classObj;
                        currentSchool = school;
                    }
                }
            }
        }
        
        // Aggiorna il breadcrumb della modale
        updateModalBreadcrumb(currentClass ? currentClass.name : '', project.name);
        
        // Mostra la modale
        projectModal.style.display = 'block';
        document.body.style.overflow = 'hidden';  // Previene lo scroll del body
        
        // Carica il progetto nell'iframe
        let projectPath;
        if (project.file) {
            projectPath = project.file.startsWith('/') ? project.file : '/' + project.file;
        } else if (project.path) {
            projectPath = project.path.startsWith('/') ? project.path : '/' + project.path;
        } else {
            console.error('Project has no file or path property:', project);
            projectPath = project.id ? `/progetti/${project.id}/index.html` : null;
        }
        
        if (projectPath) {
            console.log('Loading project from path:', projectPath);
            projectFrame.src = projectPath;
        } else {
            console.error('Could not determine project path');
            alert('Errore nel caricamento del progetto');
            closeProject();
            return;
        }
        
        // Aggiorna il rating se disponibile
        if (modalRatingContainer) {
            modalRatingContainer.style.display = 'block';
            updateRatingDisplay(project.id);
        }
        
        // Aggiorna la visibilità del pulsante "Torna alla classe"
        if (currentClass) {
            backToClassBtn.style.display = 'block';
        } else {
            backToClassBtn.style.display = 'none';
        }
        
        showVoteButton();
    }
    
    // Chiudi il modale del progetto
    function closeProject() {
        // Nascondi la modale
        projectModal.style.display = 'none';
        document.body.style.overflow = '';  // Ripristina lo scroll del body
        
        // Pulisci l'iframe
        projectFrame.src = 'about:blank';
        
        // Resetta il progetto corrente
        currentProject = null;
        
        // Nascondi il container del rating
        if (modalRatingContainer) {
            modalRatingContainer.style.display = 'none';
        }
        
        hideVoteButton();
        voteModal.style.display = 'none';
    }
    
    // Aggiorna la visualizzazione della valutazione
    function updateRatingDisplay(projectId) {
        if (!currentUser || !currentUser.isLoggedIn) return;

        const userVote = getUserVote(projectId);
        console.log('Aggiornamento visualizzazione voto:', {
            projectId,
            userVote,
            currentUser: currentUser.username
        });

        // Aggiorna il valore nel pulsante di valutazione
        const modalRatingBtn = document.getElementById('modal-rating-btn');
        if (modalRatingBtn) {
            const ratingValue = modalRatingBtn.querySelector('.rating-value');
            if (ratingValue) {
                ratingValue.textContent = userVote > 0 ? userVote.toFixed(1) : '0.0';
                console.log('Valore aggiornato:', ratingValue.textContent);
            }

            // Aggiorna l'icona del cuore
            const ratingIcon = modalRatingBtn.querySelector('i');
            if (ratingIcon) {
                ratingIcon.className = userVote > 0 ? 'fas fa-heart' : 'far fa-heart';
                if (userVote > 0) {
                    const ratingClass = `rating-star-${Math.ceil(userVote)}`;
                    ratingIcon.className = `fas fa-heart ${ratingClass}`;
                }
            }
        }

        // Aggiorna le stelle nel popup
        if (modalRatingStars && modalRatingStars.length > 0) {
            modalRatingStars.forEach(star => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                star.className = starRating <= userVote ? 'fas fa-star' : 'far fa-star';
                if (starRating <= userVote) {
                    star.style.color = `var(--star-color-${starRating})`;
                } else {
                    star.style.color = '';
                }
            });
        }

        // Aggiorna il testo nel popup
        const ratingPopup = document.querySelector('.rating-popup');
        if (ratingPopup) {
            const ratingText = ratingPopup.querySelector('.rating-text');
            if (ratingText) {
                ratingText.textContent = userVote > 0 ? 
                    `Il tuo voto: ${userVote.toFixed(1)}` : 
                    'Clicca per votare';
            }
        }
    }
    
    // Gestisci l'apertura del popup di valutazione
    function toggleRatingPopup(container) {
        if (!currentProject || !currentUser.isLoggedIn) return;
        
        console.log('Toggle rating popup', container);
        const popup = container.querySelector('.rating-popup');
        console.log('Popup element:', popup);
        
        if (popup) {
            popup.classList.toggle('active');
            console.log('Popup active:', popup.classList.contains('active'));
            
            // Se il popup è aperto, aggiorna la visualizzazione delle stelle in base al voto dell'utente
            if (popup.classList.contains('active')) {
                const userVote = getUserVote(currentProject.id);
                updateStarsDisplay(userVote);
                
                // Mostra un messaggio informativo se l'utente non ha ancora votato
                const ratingText = popup.querySelector('.rating-text');
                if (ratingText) {
                    if (userVote > 0) {
                        ratingText.textContent = 'Il tuo voto attuale';
                    } else {
                        ratingText.textContent = 'Clicca per votare';
                    }
                }
            }
        } else {
            console.error('Rating popup not found in container:', container);
        }
    }
    
    // Aggiorna la visualizzazione delle stelle
    function updateStarsDisplay(rating) {
        // Aggiorna solo le stelle nel popup del modale se esistono
        if (modalRatingStars && modalRatingStars.length > 0) {
            modalRatingStars.forEach(star => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                if (starRating <= rating) {
                    star.className = 'fas fa-star';
                    star.style.color = `var(--star-color-${starRating})`;
                } else {
                    star.className = 'far fa-star';
                    star.style.color = '';
                }
            });
        }
    }
    
    // Gestisci la valutazione di un progetto
    function handleRating(rating) {
        if (!currentProject || !currentUser || !currentUser.isLoggedIn) {
            console.error('Impossibile votare: utente non loggato o progetto non selezionato');
            return;
        }

        console.log('Gestione voto:', {
            rating,
            projectId: currentProject.id,
            username: currentUser.username
        });

        // Aggiorna immediatamente l'interfaccia
        votes[currentProject.id] = rating;
        updateRatingDisplay(currentProject.id);

        // Invia il voto al server
        sendRatingToServer(currentProject.id, rating);

        // Chiudi il popup
        const activePopup = document.querySelector('.rating-popup.active');
        if (activePopup) {
            setTimeout(() => activePopup.classList.remove('active'), 500);
        }
    }
    
    // Invia la valutazione al server
    async function sendRatingToServer(projectId, rating) {
        if (!currentUser.isLoggedIn) return;
        
        try {
            console.log('Invio voto al server:', { username: currentUser.username, projectId, rating });
            
            const response = await fetch('/api/vote', {
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
            
            if (!response.ok) {
                throw new Error('Errore nell\'invio della valutazione');
            }
            
            const data = await response.json();
            console.log('Risposta dal server:', data);
            
            if (data.success) {
                // Il voto è già stato aggiornato localmente, ma aggiorniamo comunque i ratings globali
                const likesResponse = await fetch('/server/likes.json');
                ratings = await likesResponse.json();
                
                // Mostra un feedback visivo del successo
                const ratingPopup = document.querySelector('.rating-popup.active');
                if (ratingPopup) {
                    const ratingText = ratingPopup.querySelector('.rating-text');
                    if (ratingText) {
                        ratingText.textContent = 'Voto registrato con successo!';
                        setTimeout(() => {
                            ratingText.textContent = `Il tuo voto: ${rating.toFixed(1)}`;
                        }, 2000);
                    }
                }
            } else {
                console.error('Errore nella registrazione del voto:', data.message);
                alert('Errore nella registrazione del voto. Riprova più tardi.');
                // Ripristina il voto precedente
                votes[projectId] = getUserVote(projectId);
                updateRatingDisplay(projectId);
            }
        } catch (error) {
            console.error('Errore nell\'invio della valutazione:', error);
            alert('Errore nell\'invio della valutazione. Riprova più tardi.');
            // Ripristina il voto precedente
            votes[projectId] = getUserVote(projectId);
            updateRatingDisplay(projectId);
        }
    }
    
    // Vai a una pagina specifica
    function goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        
        // Aggiorna la posizione delle pagine
        pages.forEach((page, index) => {
            if (index < pageIndex) {
                // Pagine precedenti
                page.style.transform = 'rotateY(-180deg)';
            } else if (index === pageIndex) {
                // Pagina corrente
                page.style.transform = 'rotateY(0deg)';
            } else {
                // Pagine successive
                page.style.transform = 'rotateY(0deg)';
                page.style.zIndex = pages.length - index;
            }
        });
        
        currentPage = pageIndex;
        updateNavigation();
        
        // Aggiorna il breadcrumb in base alla pagina
        if (pageIndex === 0) {
            updateBreadcrumb('Home', '');
        } else if (pageIndex === 1) {
            updateBreadcrumb('Home', 'Scuole');
        }
    }
    
    // Aggiorna i pulsanti di navigazione
    function updateNavigation() {
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage === pages.length - 1;
    }
    
    // Alterna tra modalità chiara e scura
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            modalDarkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            
            // Cambia i loghi alla versione per la dark mode
            document.querySelectorAll('.jpmc-logo').forEach(logo => {
                logo.src = logo.getAttribute('data-dark-src');
            });
            document.querySelectorAll('.fg-theme-logo').forEach(logo => {
                logo.src = logo.getAttribute('data-dark-src');
            });
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            modalDarkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            
            // Cambia i loghi alla versione per la light mode
            document.querySelectorAll('.jpmc-logo').forEach(logo => {
                logo.src = logo.getAttribute('data-light-src');
            });
            document.querySelectorAll('.fg-theme-logo').forEach(logo => {
                logo.src = logo.getAttribute('data-light-src');
            });
            
        }
        
        // Salva la preferenza nel localStorage
        localStorage.setItem('darkMode', isDarkMode);
    }
    
    // Event listeners
    prevBtn.addEventListener('click', () => {
        goToPage(currentPage - 1);
    });
    
    nextBtn.addEventListener('click', () => {
        goToPage(currentPage + 1);
    });
    
    // Aggiungi event listener al pulsante "Inizia" nella copertina
    document.querySelector('.next-page-btn').addEventListener('click', () => {
        goToPage(1); // Vai all'indice
        updateBreadcrumb('Home', 'Scuole');
    });
    
    // Aggiungi event listener ai pulsanti per la modalità dark
    darkModeToggle.addEventListener('click', toggleDarkMode);
    modalDarkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Event listener per i pulsanti home nella navbar
    homeNavBtn.addEventListener('click', () => {
        if (projectModal.style.display === 'block') {
            closeProject();
        }
        goToPage(0); // Torna alla copertina
        updateBreadcrumb('Home', '');
    });
    
    modalHomeBtn.addEventListener('click', () => {
        closeProject();
        goToPage(0); // Torna alla copertina
        updateBreadcrumb('Home', '');
    });
    
    // Event listener per il pulsante "Torna alla classe" nel modale
    backToClassBtn.addEventListener('click', () => {
        closeProject();
    });
    
    // Event listener per il pulsante "Chiudi" nel modale
    closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeProject();
    });
    
    // Event listeners per la valutazione (solo se gli elementi esistono)
    if (modalRatingBtn) {
        modalRatingBtn.addEventListener('click', () => {
            toggleRatingPopup(modalRatingContainer);
        });
    }
    
    // Gestisci il click sulle stelle per la valutazione diretta
    if (modalRatingStars && modalRatingStars.length > 0) {
        modalRatingStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                handleRating(rating);
            });
        });
    }
    
    // Chiudi il modale quando si clicca fuori dal contenuto
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            closeProject();
        }
    });
    
    // Gestione del popup utente
    userBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('User button clicked');
        const userPopup = userContainer.querySelector('.user-popup');
        console.log('User popup element:', userPopup);
        
        // Forza lo stile di visualizzazione
        if (userPopup.style.display === 'block') {
            userPopup.style.display = 'none';
            userPopup.classList.remove('active');
            console.log('User popup hidden');
        } else {
            userPopup.style.display = 'block';
            userPopup.classList.add('active');
            console.log('User popup shown');
        }
    });
    
    // Gestione del logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    
    // Gestione delle statistiche - controllo se l'elemento esiste prima di aggiungere l'event listener
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            // Verifica se l'utente è admin
            if (currentUser && currentUser.is_admin) {
                window.location.href = 'admin/stats.html';
            } else {
                alert('Accesso riservato all\'amministratore');
            }
        });
    }
    
    // Gestione delle statistiche dei voti
    const voteStatsBtn = document.getElementById('vote-stats-btn');
    if (voteStatsBtn) {
        voteStatsBtn.addEventListener('click', () => {
            // Chiudi il popup utente
            const userPopup = userContainer.querySelector('.user-popup');
            userPopup.classList.remove('active');
            
            // Reindirizza alla pagina delle statistiche dei voti
            window.location.href = 'stats_view.html';
        });
    }
    
    // Gestione delle impostazioni
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const avatarInput = document.getElementById('settings-avatar');
    const avatarPreview = document.getElementById('avatar-preview-img');
    
    // Inizializza il modal delle impostazioni
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
    
    settingsBtn.addEventListener('click', () => {
        // Chiudi il popup utente
        const userPopup = userContainer.querySelector('.user-popup');
        userPopup.classList.remove('active');
        
        // Popola il form con i dati utente attuali
        document.getElementById('settings-nome').value = currentUser.nome || '';
        document.getElementById('settings-cognome').value = currentUser.cognome || '';
        document.getElementById('settings-avatar').value = currentUser.avatar || '';
        
        // Aggiorna l'anteprima dell'avatar
        if (currentUser.avatar) {
            avatarPreview.src = currentUser.avatar;
            avatarPreview.style.display = 'block';
        } else {
            avatarPreview.style.display = 'none';
        }
        
        // Mostra il modale
        settingsModal.style.display = 'block';
    });
    
    closeSettingsModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Chiudi il modale quando si clicca fuori dal contenuto
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Anteprima dell'avatar
    avatarInput.addEventListener('input', () => {
        const url = avatarInput.value.trim();
        if (url) {
            avatarPreview.src = url;
            avatarPreview.style.display = 'block';
        } else {
            avatarPreview.style.display = 'none';
        }
    });
    
    // Gestione del form delle impostazioni
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('settings-nome').value.trim();
        const cognome = document.getElementById('settings-cognome').value.trim();
        const avatar = document.getElementById('settings-avatar').value.trim();
        
        try {
            const response = await fetch('/server/update_user.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: currentUser.username,
                    nome,
                    cognome,
                    avatar
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Aggiorna i dati dell'utente
                currentUser = {
                    ...currentUser,
                    nome,
                    cognome,
                    avatar
                };
                
                // Aggiorna il localStorage
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Aggiorna l'interfaccia utente
                updateUserInterface();
                
                // Chiudi il modale
                settingsModal.style.display = 'none';
                
                // Mostra un messaggio di successo
                alert('Impostazioni aggiornate con successo');
            } else {
                alert('Errore durante l\'aggiornamento delle impostazioni: ' + data.message);
            }
        } catch (error) {
            console.error('Errore durante l\'aggiornamento delle impostazioni:', error);
            alert('Errore durante l\'aggiornamento delle impostazioni');
        }
    });
    
    // Chiudi i popup quando si clicca fuori
    document.addEventListener('click', function(event) {
        // Chiudi il popup di valutazione
        const activeRatingPopup = document.querySelector('.rating-popup.active');
        if (activeRatingPopup && !activeRatingPopup.contains(event.target) && !event.target.closest('.rating-btn')) {
            activeRatingPopup.classList.remove('active');
        }
        
        // Chiudi il popup utente
        const activeUserPopup = document.querySelector('.user-popup.active');
        if (activeUserPopup && !activeUserPopup.contains(event.target) && !event.target.closest('#user-btn')) {
            activeUserPopup.classList.remove('active');
        }
    });
    
    // Gestisci la navigazione con tastiera
    document.addEventListener('keydown', (e) => {
        if (projectModal.style.display === 'block') {
            if (e.key === 'Escape') {
                closeProject();
            }
        } else {
            if (e.key === 'ArrowLeft') {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight') {
                goToPage(currentPage + 1);
            }
        }
    });
    
    // Inizializza l'applicazione
    initializeUser();
    loadData();
    goToPage(0);
    updateBreadcrumb('Home', '');
    
    // Esponi la funzione goToPage globalmente per il breadcrumb
    window.goToPage = goToPage;
    
    // Aggiungi il pulsante di voto fluttuante e il modale al DOM
    const voteButton = document.createElement('button');
    voteButton.id = 'floating-vote-button';
    voteButton.className = 'floating-vote-btn';
    voteButton.innerHTML = `
        <i class="fas fa-heart"></i>
        <span>VOTA</span>
    `;
    
    const voteModal = document.createElement('div');
    voteModal.className = 'vote-modal';
    voteModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Valuta questa Storia</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Quanto ti è piaciuta questa storia?</p>
                <div class="hearts-container">
                    ${Array.from({length: 5}, (_, i) => `
                        <div class="heart" data-rating="${i+1}">
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
    
    // Funzione per mostrare il pulsante di voto
    function showVoteButton() {
        console.log('showVoteButton chiamata', { currentProject, currentUser });
        if (!currentProject) {
            console.log('currentProject non disponibile');
            return;
        }
        if (!currentUser || !currentUser.isLoggedIn) {
            console.log('utente non loggato');
            return;
        }
        
        // Rimuovi prima il pulsante se già presente per evitare duplicati
        hideVoteButton();
        
        // Aggiungi il pulsante al DOM
        document.body.appendChild(voteButton);
        
        // Assicurati che il pulsante sia visibile
        voteButton.style.display = 'flex';
        console.log('Pulsante di voto aggiunto al DOM');
        
        // Aggiungi un timeout per assicurarti che il pulsante sia visibile anche dopo eventuali modifiche al DOM
        setTimeout(() => {
            if (document.body.contains(voteButton)) {
                voteButton.style.display = 'flex';
                console.log('Visibilità del pulsante di voto verificata');
            } else {
                document.body.appendChild(voteButton);
                voteButton.style.display = 'flex';
                console.log('Pulsante di voto riaggiunto al DOM');
            }
        }, 500);
    }
    
    // Funzione per nascondere il pulsante di voto
    function hideVoteButton() {
        if (document.body.contains(voteButton)) {
            document.body.removeChild(voteButton);
        }
    }
    
    // Funzione per mostrare il modale di voto
    function showVoteModal() {
        if (!currentProject || !currentUser.isLoggedIn) return;
        
        if (!document.body.contains(voteModal)) {
            document.body.appendChild(voteModal);
        }
        voteModal.style.display = 'block';
    }
    
    // Gestisci il click sul pulsante di voto
    voteButton.addEventListener('click', showVoteModal);
    
    // Gestisci la chiusura del modale
    voteModal.querySelector('.close').addEventListener('click', () => {
        voteModal.style.display = 'none';
    });
    
    // Inizializza i listener per i cuoricini
    setupHeartListeners();
    
    // Aggiungi event listeners per i cuoricini
    function setupHeartListeners() {
        const hearts = voteModal.querySelectorAll('.heart');
        let currentVote = 0;
        
        hearts.forEach(heart => {
            heart.addEventListener('click', async () => {
                const rating = parseInt(heart.getAttribute('data-rating'));
                currentVote = rating;
                
                // Aggiorna l'aspetto dei cuoricini
                updateHearts(rating);
                
                // Invia il voto
                await submitVote(rating);
            });
            
            heart.addEventListener('mouseover', () => {
                const rating = parseInt(heart.getAttribute('data-rating'));
                highlightHearts(rating);
            });
            
            heart.addEventListener('mouseout', () => {
                resetHeartsHighlight(currentVote);
            });
        });
    }
    
    // Funzione per aggiornare l'aspetto dei cuoricini
    function updateHearts(rating) {
        const hearts = voteModal.querySelectorAll('.heart');
        hearts.forEach(heart => {
            const heartRating = parseInt(heart.getAttribute('data-rating'));
            if (heartRating <= rating) {
                heart.classList.add('selected');
            } else {
                heart.classList.remove('selected');
            }
        });
    }
    
    // Funzione per evidenziare i cuoricini al passaggio del mouse
    function highlightHearts(rating) {
        const hearts = voteModal.querySelectorAll('.heart');
        hearts.forEach(heart => {
            const heartRating = parseInt(heart.getAttribute('data-rating'));
            if (heartRating <= rating) {
                heart.classList.add('hover');
            } else {
                heart.classList.remove('hover');
            }
        });
    }
    
    // Funzione per reimpostare l'evidenziazione dei cuoricini
    function resetHeartsHighlight(currentRating) {
        const hearts = voteModal.querySelectorAll('.heart');
        hearts.forEach(heart => {
            heart.classList.remove('hover');
        });
        
        if (currentRating) {
            updateHearts(currentRating);
        }
    }
    
    // Funzione per inviare il voto
    async function submitVote(vote) {

        if (!currentProject) {
            console.error('Missing project data:', { currentProject });
            alert('Errore: dati del progetto mancanti. Impossibile registrare il voto.');
            return;
        }
        
        // Se currentClass non è disponibile, prova a ricavarlo dall'ID del progetto
        if (!currentClass && currentProject.id) {
            const idParts = currentProject.id.split('_');
            if (idParts.length >= 2) {
                const schoolId = idParts[0];
                const classIdPart = idParts[1];
                
                // Cerca la scuola e la classe corrispondenti
                const school = schools.find(s => s.id === schoolId);
                if (school && school.classes) {
                    const classObj = school.classes.find(c => c.id.includes(classIdPart));
                    if (classObj) {
                        console.log('Setting currentClass from project ID in submitVote:', classObj);
                        currentClass = classObj;
                        currentSchool = school;
                    }
                }
            }
        }
        
        // Se ancora non abbiamo currentClass, crea un oggetto fittizio con le informazioni minime
        if (!currentClass && currentProject.id) {
            const idParts = currentProject.id.split('_');
            if (idParts.length >= 2) {
                const schoolId = idParts[0];
                const classIdPart = idParts[1];
                console.log('Creating temporary class object from project ID parts:', { schoolId, classIdPart });
                currentClass = {
                    id: `${schoolId}_${classIdPart}`,
                    name: `Classe ${classIdPart.replace('classe', '')}`,
                    school: schoolId
                };
            }
        }
        
        // Se ancora non abbiamo currentClass, non possiamo procedere
        if (!currentClass) {
            console.error('Could not determine class data for project:', currentProject);
            alert('Errore: impossibile determinare la classe del progetto. Impossibile registrare il voto.');
            return;
        }

        // Log dei dati correnti
        console.log('Current data:', {
            currentProject,
            currentClass,
            currentUser
        });

        const voteData = {
            scuola: currentClass.school || currentClass.scuola,
            classe: currentClass.name || currentClass.nome,
            nome_progetto: currentProject.name || currentProject.nome,
            voto: vote,
            nome_utente: currentUser.username
        };

        console.log('Sending vote data:', voteData);
        
        try {
            // Formatta i dati per la nuova API
            const apiData = {
                action: 'vote',
                username: currentUser.username,
                projectId: currentProject.id,
                vote: vote
            };
            
            console.log('Sending vote data to new API:', apiData);
            
            // Mostra feedback di caricamento
            const feedback = voteModal.querySelector('.vote-feedback');
            feedback.textContent = 'Invio in corso...';
            
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Vote API response:', result);
            
            if (result.success) {
                // Mostra feedback di successo
                feedback.textContent = 'Voto registrato con successo!';
                
                // Chiudi il modale dopo un breve ritardo
                setTimeout(() => {
                    voteModal.style.display = 'none';
                }, 1500);
            } else {
                feedback.textContent = result.message || 'Si è verificato un errore durante il salvataggio del voto.';
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            const feedback = voteModal.querySelector('.vote-feedback');
            feedback.textContent = 'Si è verificato un errore. Riprova più tardi.';
        }
}
});
