// Fix for user popup and rating popup issues
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup fix script loaded');
    
    // Global variables from the main app
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('user') || '{"isLoggedIn": false}');
    
    // Fix for user popup
    const userBtn = document.getElementById('user-btn');
    const userContainer = document.getElementById('user-container');
    
    if (userBtn && userContainer) {
        const userPopup = userContainer.querySelector('.user-popup');
        
        if (userPopup) {
            console.log('User popup found');
            
            // Remove existing click event listeners
            const userBtnClone = userBtn.cloneNode(true);
            userBtn.parentNode.replaceChild(userBtnClone, userBtn);
            
            // Add new click event listener
            userBtnClone.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('User button clicked (fixed)');
                
                // Toggle display
                if (userPopup.style.display === 'flex' || userPopup.style.display === 'block') {
                    userPopup.style.display = 'none';
                    userPopup.classList.remove('active');
                    console.log('User popup hidden');
                } else {
                    userPopup.style.display = 'flex';
                    userPopup.classList.add('active');
                    console.log('User popup shown');
                }
            });
        }
    }
    
    // Fix for rating popup
    const ratingBtn = document.getElementById('rating-btn');
    const modalRatingBtn = document.getElementById('modal-rating-btn');
    const ratingContainer = document.getElementById('rating-container');
    const modalRatingContainer = document.getElementById('modal-rating-container');
    
    function fixRatingButton(btn, container) {
        if (btn && container) {
            const ratingPopup = container.querySelector('.rating-popup');
            
            if (ratingPopup) {
                console.log('Rating popup found');
                
                // Remove existing click event listeners
                const btnClone = btn.cloneNode(true);
                btn.parentNode.replaceChild(btnClone, btn);
                
                // Add new click event listener
                btnClone.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Rating button clicked (fixed)');
                    
                    // Toggle display
                    if (ratingPopup.style.display === 'flex' || ratingPopup.style.display === 'block') {
                        ratingPopup.style.display = 'none';
                        ratingPopup.classList.remove('active');
                    } else {
                        ratingPopup.style.display = 'flex';
                        ratingPopup.classList.add('active');
                        
                        // Update stars display
                        if (window.currentProject && window.currentUser && window.currentUser.isLoggedIn) {
                            const userVote = window.votes[window.currentProject.id] || 0;
                            const stars = ratingPopup.querySelectorAll('.rating-stars i');
                            
                            stars.forEach((star, index) => {
                                if (index < userVote) {
                                    star.className = 'fas fa-star';
                                } else {
                                    star.className = 'far fa-star';
                                }
                            });
                            
                            // Update text
                            const ratingText = ratingPopup.querySelector('.rating-text');
                            if (ratingText) {
                                if (userVote > 0) {
                                    ratingText.textContent = 'Il tuo voto attuale';
                                } else {
                                    ratingText.textContent = 'Clicca per votare';
                                }
                            }
                        }
                    }
                });
                
                // Fix star rating functionality
                const stars = ratingPopup.querySelectorAll('.rating-stars i');
                stars.forEach(star => {
                    // Remove existing click event listeners
                    const starClone = star.cloneNode(true);
                    star.parentNode.replaceChild(starClone, star);
                    
                    // Add new click event listener
                    starClone.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const rating = parseInt(this.getAttribute('data-rating'));
                        console.log('Star clicked, rating:', rating);
                        
                        if (window.currentProject && window.currentUser && window.currentUser.isLoggedIn) {
                            console.log('Sending vote to server:', {
                                username: window.currentUser.username,
                                projectId: window.currentProject.id,
                                vote: rating
                            });
                            
                            // Send rating to server
                            fetch('/api/vote', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    username: window.currentUser.username,
                                    projectId: window.currentProject.id,
                                    vote: parseInt(rating)
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                console.log('Rating response:', data);
                                
                                if (data.success) {
                                    // Update local vote
                                    window.votes[window.currentProject.id] = rating;
                                    
                                    // Update stars display
                                    stars.forEach((s, index) => {
                                        if (index < rating) {
                                            s.className = 'fas fa-star';
                                            s.style.color = `var(--star-color-${index + 1})`;
                                        } else {
                                            s.className = 'far fa-star';
                                            s.style.color = '';
                                        }
                                    });
                                    
                                    // Update text
                                    const ratingText = ratingPopup.querySelector('.rating-text');
                                    if (ratingText) {
                                        ratingText.textContent = 'Il tuo voto è stato registrato';
                                        
                                        // Reset text after delay
                                        setTimeout(() => {
                                            ratingText.textContent = 'Il tuo voto attuale';
                                        }, 2000);
                                    }
                                    
                                    // Update rating display in modal
                                    if (window.updateRatingDisplay) {
                                        console.log('Aggiornamento display voto dopo il salvataggio');
                                        window.updateRatingDisplay(window.currentProject.id);
                                    } else {
                                        console.error('updateRatingDisplay non trovata nel contesto globale');
                                    }
                                    
                                    // Reload ratings
                                    fetch('/server/likes.json')
                                        .then(response => response.json())
                                        .then(ratings => {
                                            window.ratings = ratings;
                                            // Update display again after ratings are reloaded
                                            if (window.updateRatingDisplay) {
                                                window.updateRatingDisplay(window.currentProject.id);
                                            }
                                        });
                                }
                            })
                            .catch(error => {
                                console.error('Error sending rating:', error);
                            });
                        }
                    });
                });
            }
        }
    }
    
    // Fix both rating buttons
    fixRatingButton(ratingBtn, ratingContainer);
    fixRatingButton(modalRatingBtn, modalRatingContainer);
    
    // Fix for avatar file upload
    const avatarFileInput = document.getElementById('settings-avatar-file');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const avatarHiddenInput = document.getElementById('settings-avatar');
    const settingsForm = document.getElementById('settings-form');
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsModal = document.getElementById('close-settings-modal');
    
    // Initialize settings modal
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
    
    // Handle settings button click
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close user popup
            if (userPopup) {
                userPopup.style.display = 'none';
                userPopup.classList.remove('active');
            }
            
            // Populate form with current user data
            if (settingsForm && currentUser) {
                document.getElementById('settings-nome').value = currentUser.nome || '';
                document.getElementById('settings-cognome').value = currentUser.cognome || '';
                
                // Show avatar preview if available
                if (currentUser.avatar && avatarPreviewImg) {
                    avatarPreviewImg.src = currentUser.avatar;
                    avatarPreviewImg.style.display = 'block';
                } else if (avatarPreviewImg) {
                    avatarPreviewImg.style.display = 'none';
                }
            }
            
            // Show settings modal
            if (settingsModal) {
                settingsModal.style.display = 'block';
            }
        });
    }
    
    // Handle close settings modal button
    if (closeSettingsModal && settingsModal) {
        closeSettingsModal.addEventListener('click', function() {
            settingsModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }
    
    // Handle avatar file input
    if (avatarFileInput && avatarPreviewImg && avatarHiddenInput) {
        console.log('Avatar file input found');
        
        avatarFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('Avatar file selected:', file.name);
                
                // Read the file as data URL
                const reader = new FileReader();
                reader.onload = function(event) {
                    const dataUrl = event.target.result;
                    
                    // Update the preview image
                    avatarPreviewImg.src = dataUrl;
                    avatarPreviewImg.style.display = 'block';
                    
                    // Store the data URL in the hidden input
                    avatarHiddenInput.value = dataUrl;
                    
                    console.log('Avatar preview updated');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle settings form submission
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('settings-nome').value.trim();
            const cognome = document.getElementById('settings-cognome').value.trim();
            const avatar = document.getElementById('settings-avatar').value;
            
            console.log('Settings form submitted:', { nome, cognome, avatar: avatar ? 'data:image...' : null });
            
            fetch('/server/update_user.php', {
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
            })
            .then(response => response.json())
            .then(data => {
                console.log('Settings update response:', data);
                
                if (data.success) {
                    // Update the user info
                    currentUser.nome = nome;
                    currentUser.cognome = cognome;
                    currentUser.avatar = data.user.avatar;
                    
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    // Update user display name
                    updateUserDisplay();
                    
                    // Close the modal
                    if (settingsModal) {
                        settingsModal.style.display = 'none';
                    }
                    
                    // Show success message
                    alert('Impostazioni aggiornate con successo');
                } else {
                    alert('Errore durante l\'aggiornamento delle impostazioni: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error updating settings:', error);
                alert('Errore durante l\'aggiornamento delle impostazioni');
            });
        });
    }
    
    // Function to update user display
    function updateUserDisplay() {
        const userName = document.querySelector('.user-name');
        const userPopupName = document.querySelector('.user-popup-name');
        
        if (userName && userPopupName && currentUser) {
            let displayName = currentUser.username;
            if (currentUser.nome && currentUser.cognome) {
                displayName = `${currentUser.nome} ${currentUser.cognome}`;
            } else if (currentUser.nome) {
                displayName = currentUser.nome;
            }
            
            userName.textContent = displayName;
            userPopupName.textContent = displayName;
        }
    }
    
    // Fix document click handler for closing popups
    document.addEventListener('click', function(event) {
        console.log('Document clicked', event.target);
        
        // Close rating popups when clicking outside
        const ratingPopups = document.querySelectorAll('.rating-popup');
        ratingPopups.forEach(popup => {
            if (popup.style.display === 'flex' || popup.style.display === 'block') {
                const container = popup.closest('.navbar-rating-container');
                const btn = container ? container.querySelector('.rating-btn') : null;
                
                if (!popup.contains(event.target) && (!btn || !btn.contains(event.target))) {
                    popup.style.display = 'none';
                    popup.classList.remove('active');
                }
            }
        });
        
        // Close user popup when clicking outside
        const userPopupElements = document.querySelectorAll('.user-popup');
        userPopupElements.forEach(popup => {
            if (popup.style.display === 'flex' || popup.style.display === 'block') {
                const container = popup.closest('.user-container');
                const btn = container ? container.querySelector('.user-btn') : null;
                
                if (!popup.contains(event.target) && (!btn || !btn.contains(event.target))) {
                    popup.style.display = 'none';
                    popup.classList.remove('active');
                }
            }
        });
    });
    
    // Make sure the navbar is always visible in the modal
    const projectModal = document.getElementById('project-modal');
    const modalNavbar = projectModal ? projectModal.querySelector('.modal-navbar') : null;
    
    if (modalNavbar) {
        // Clone the user container to the modal navbar
        const modalNavbarActions = modalNavbar.querySelector('.navbar-actions');
        
        if (modalNavbarActions && userContainer) {
            // Check if user container already exists in modal
            if (!modalNavbarActions.querySelector('.user-container')) {
                const userContainerClone = userContainer.cloneNode(true);
                modalNavbarActions.appendChild(userContainerClone);
                
                // Fix the user button in the modal
                const modalUserBtn = userContainerClone.querySelector('.user-btn');
                const modalUserPopup = userContainerClone.querySelector('.user-popup');
                
                if (modalUserBtn && modalUserPopup) {
                    modalUserBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (modalUserPopup.style.display === 'flex' || modalUserPopup.style.display === 'block') {
                            modalUserPopup.style.display = 'none';
                            modalUserPopup.classList.remove('active');
                        } else {
                            modalUserPopup.style.display = 'flex';
                            modalUserPopup.classList.add('active');
                        }
                    });
                }
            }
        }
    }
    
    // Update user display on load
    updateUserDisplay();
});
