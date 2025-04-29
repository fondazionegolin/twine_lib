document.addEventListener('DOMContentLoaded', function() {
    // Elementi DOM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Controlla se è già impostata la modalità scura
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Tema chiaro</span>';
    }
    
    // Gestione delle tab
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Rimuovi la classe active da tutti i pulsanti e contenuti
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Aggiungi la classe active al pulsante cliccato
            button.classList.add('active');
            
            // Mostra il contenuto corrispondente
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Pulisci gli errori
            loginError.textContent = '';
            registerError.textContent = '';
        });
    });
    
    // Gestione del login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            loginError.textContent = 'Inserisci nome utente e password';
            return;
        }
        
        try {
            const response = await fetch('/server/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Salva le informazioni dell'utente con la nuova struttura
                const userData = {
                    username: data.user.username,
                    nome: data.user.nome || '',
                    cognome: data.user.cognome || '',
                    avatar: data.user.avatar || '',
                    is_admin: data.user.is_admin || false,
                    isLoggedIn: true
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Redirect alla home page
                window.location.href = 'index.html';
            } else {
                loginError.textContent = data.message || 'Credenziali non valide';
            }
        } catch (error) {
            console.error('Errore durante il login:', error);
            loginError.textContent = 'Si è verificato un errore. Riprova più tardi.';
        }
    });
    
    // Gestione della registrazione
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (!username || !password || !confirmPassword) {
            registerError.textContent = 'Compila tutti i campi';
            return;
        }
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Le password non coincidono';
            return;
        }
        
        try {
            const response = await fetch('/server/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register',
                    username,
                    password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mostra messaggio di successo e passa al tab di login
                registerError.textContent = '';
                document.getElementById('register-username').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm-password').value = '';
                
                // Passa al tab di login
                tabButtons[0].click();
                
                // Mostra messaggio di successo nel tab di login
                loginError.style.color = '#2ecc71';
                loginError.textContent = 'Registrazione completata! Ora puoi accedere.';
            } else {
                registerError.textContent = data.message || 'Errore durante la registrazione';
            }
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            registerError.textContent = 'Si è verificato un errore. Riprova più tardi.';
        }
    });
    
    // Gestione del toggle della modalità scura
    darkModeToggle.addEventListener('click', function() {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Tema chiaro</span>';
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Tema scuro</span>';
        }
        
        localStorage.setItem('darkMode', isDarkMode);
    });
    
    // Controlla se l'utente è già loggato
    const user = JSON.parse(localStorage.getItem('user') || '{"isLoggedIn": false}');
    if (user.isLoggedIn) {
        // Redirect alla home page
        window.location.href = 'index.html';
    }
});
