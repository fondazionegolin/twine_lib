/**
 * Script JavaScript per scansionare i progetti Twine ed estrarre automaticamente i metadati
 * Questo script può essere eseguito direttamente nel browser
 */

// Configurazione
const projectsDirectory = 'progetti';
const outputFile = 'server/projects.json';

// Funzione principale per scansionare i progetti
async function scanProjects() {
    try {
        console.log('Avvio scansione progetti...');
        
        // Ottieni l'elenco delle directory delle classi
        const classDirs = await fetchDirectories(projectsDirectory);
        const projects = {};
        
        // Per ogni classe, scansiona i progetti
        for (const classDir of classDirs) {
            const className = classDir.replace(`${projectsDirectory}/`, '');
            
            // Verifica se è una directory di classe valida (formato: classeXY)
            if (/^classe[0-9]+[A-Z]$/.test(className)) {
                console.log(`Scansione progetti per la classe: ${className}`);
                
                // Ottieni l'elenco dei file HTML nella directory della classe
                const htmlFiles = await fetchHtmlFiles(`${projectsDirectory}/${className}`);
                const classProjects = [];
                
                // Per ogni file HTML, estrai i metadati
                for (const htmlFile of htmlFiles) {
                    const fileName = htmlFile.split('/').pop();
                    const projectId = `${className}_${fileName.replace('.html', '')}`;
                    
                    // Estrai metadati dal file HTML
                    const content = await fetchHtmlContent(`${projectsDirectory}/${className}/${fileName}`);
                    const metadata = extractMetadataFromHtml(content);
                    
                    const projectName = metadata.title || formatProjectName(fileName.replace('.html', ''));
                    
                    classProjects.push({
                        id: projectId,
                        name: projectName,
                        description: metadata.description || `Progetto Twine della classe ${className.substring(6)}`,
                        file: `${className}/${fileName}`,
                        authors: metadata.authors || [],
                        tags: metadata.tags || []
                    });
                }
                
                if (classProjects.length > 0) {
                    projects[className] = classProjects;
                }
            }
        }
        
        // Salva i risultati
        console.log('Progetti trovati:', Object.keys(projects).reduce((total, key) => total + projects[key].length, 0));
        console.log('Classi trovate:', Object.keys(projects).length);
        
        // Visualizza i risultati
        displayResults(projects);
        
        // Salva i risultati in un file JSON (questo funzionerà solo se eseguito sul server)
        try {
            await saveProjectsJson(projects);
            console.log('File projects.json salvato con successo');
        } catch (error) {
            console.warn('Impossibile salvare il file JSON automaticamente:', error.message);
            console.log('Copia manualmente il JSON generato:');
            console.log(JSON.stringify(projects, null, 2));
        }
        
        return projects;
    } catch (error) {
        console.error('Errore durante la scansione dei progetti:', error);
        return null;
    }
}

// Funzione per ottenere l'elenco delle directory
async function fetchDirectories(path) {
    try {
        // In un'applicazione reale, questa sarebbe una chiamata API al server
        // Per semplicità, simulo una risposta con le directory note
        return [`${path}/classe1A`];
    } catch (error) {
        console.error('Errore nel recupero delle directory:', error);
        return [];
    }
}

// Funzione per ottenere l'elenco dei file HTML in una directory
async function fetchHtmlFiles(path) {
    try {
        // In un'applicazione reale, questa sarebbe una chiamata API al server
        // Per semplicità, simulo una risposta con i file noti
        return [`${path}/avventura_bosco.html`];
    } catch (error) {
        console.error('Errore nel recupero dei file HTML:', error);
        return [];
    }
}

// Funzione per ottenere il contenuto di un file HTML
async function fetchHtmlContent(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Errore nel recupero del contenuto di ${path}:`, error);
        return '';
    }
}

// Funzione per estrarre i metadati da un file HTML
function extractMetadataFromHtml(content) {
    const metadata = {
        title: '',
        description: '',
        authors: [],
        tags: []
    };
    
    // Estrai il titolo
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
        metadata.title = titleMatch[1].trim();
    }
    
    // Estrai la descrizione dai meta tag
    const descriptionMatch = content.match(/<meta name="description" content="(.*?)"/i);
    if (descriptionMatch && descriptionMatch[1]) {
        metadata.description = descriptionMatch[1].trim();
    }
    
    // Cerca informazioni sugli autori nei commenti HTML
    const authorsMatch = content.match(/<!-- authors?: (.*?) -->/i);
    if (authorsMatch && authorsMatch[1]) {
        metadata.authors = authorsMatch[1].split(',').map(author => author.trim());
    }
    
    // Cerca tag o parole chiave nei commenti HTML
    const tagsMatch = content.match(/<!-- tags?: (.*?) -->/i);
    if (tagsMatch && tagsMatch[1]) {
        metadata.tags = tagsMatch[1].split(',').map(tag => tag.trim());
    }
    
    // Se non abbiamo trovato una descrizione, proviamo a estrarre il primo paragrafo significativo
    if (!metadata.description) {
        const paragraphMatch = content.match(/<p>(.*?)<\/p>/i);
        if (paragraphMatch && paragraphMatch[1]) {
            const firstParagraph = paragraphMatch[1].replace(/<[^>]*>/g, '');
            if (firstParagraph.length > 10) {  // Assicuriamoci che sia un paragrafo significativo
                metadata.description = firstParagraph.length > 150 
                    ? firstParagraph.substring(0, 150) + '...' 
                    : firstParagraph;
            }
        }
    }
    
    return metadata;
}

// Funzione per formattare il nome del progetto a partire dal nome del file
function formatProjectName(filename) {
    // Sostituisci underscore e trattini con spazi
    let name = filename.replace(/[_-]/g, ' ');
    
    // Capitalizza la prima lettera di ogni parola
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    
    return name;
}

// Funzione per salvare i risultati in un file JSON
async function saveProjectsJson(projects) {
    try {
        const response = await fetch(outputFile, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projects, null, 2)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio del file JSON:', error);
        throw error;
    }
}

// Funzione per visualizzare i risultati nella pagina
function displayResults(projects) {
    const resultsContainer = document.getElementById('scan-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    const totalProjects = Object.keys(projects).reduce((total, key) => total + projects[key].length, 0);
    const totalClasses = Object.keys(projects).length;
    
    const summary = document.createElement('div');
    summary.innerHTML = `
        <h3>Riepilogo della scansione</h3>
        <p>Classi trovate: ${totalClasses}</p>
        <p>Progetti totali: ${totalProjects}</p>
    `;
    resultsContainer.appendChild(summary);
    
    // Visualizza i dettagli dei progetti
    for (const className in projects) {
        const classProjects = projects[className];
        
        const classSection = document.createElement('div');
        classSection.className = 'class-section';
        classSection.innerHTML = `<h4>Classe ${className.substring(6)}</h4>`;
        
        const projectsList = document.createElement('ul');
        for (const project of classProjects) {
            const projectItem = document.createElement('li');
            projectItem.innerHTML = `
                <strong>${project.name}</strong>
                <p>${project.description}</p>
                <p><small>File: ${project.file}</small></p>
                ${project.authors.length > 0 ? `<p><small>Autori: ${project.authors.join(', ')}</small></p>` : ''}
                ${project.tags.length > 0 ? `<p><small>Tag: ${project.tags.join(', ')}</small></p>` : ''}
            `;
            projectsList.appendChild(projectItem);
        }
        
        classSection.appendChild(projectsList);
        resultsContainer.appendChild(classSection);
    }
    
    // Visualizza il JSON generato
    const jsonOutput = document.createElement('pre');
    jsonOutput.className = 'json-output';
    jsonOutput.textContent = JSON.stringify(projects, null, 2);
    
    const jsonContainer = document.createElement('div');
    jsonContainer.className = 'json-container';
    jsonContainer.innerHTML = '<h3>JSON Generato</h3>';
    jsonContainer.appendChild(jsonOutput);
    
    resultsContainer.appendChild(jsonContainer);
}

// Esporta le funzioni per l'uso esterno
window.projectScanner = {
    scanProjects,
    displayResults
};
