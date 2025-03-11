// Sélectionner l'élément input
const file = document.getElementById('csvfile');

// Attacher un événement de changement
file.addEventListener("change", prend_fichier);
let rows = [];
let savedProfiles = {}; // Object to store saved profiles

// Fonction pour lire le fichier CSV
function prend_fichier(event) {
    const fichier = event.target.files[0]; // Récupérer le fichier sélectionné
    if (fichier) {
        const lire = new FileReader();
        lire.onload = function (e) {
            const content = e.target.result;
            display_list_profiles(content, fichier); // Appeler affichage avec le contenu du fichier
        };
        lire.readAsText(fichier);
    } else {
        console.error("No files selected");
    }
}

function detectDelimiter(content) {
       const delimiters = [",", ";", "\t"]; // Liste des délimiteurs possibles
       let detected = ",";
       let maxCols = 0;

       delimiters.forEach(delim => {
           const numCols = content.split("\n")[0].split(delim).length;
           if (numCols > maxCols) {
               maxCols = numCols;
               detected = delim;
           }
       });
       return detected;
}

function normalizeLineEndings(content) {
    // Remplace d'abord \r\n (Windows) en \n, puis remplace tous les \r en \n
    console.log("Sucess repalce!");
    return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function isCSVFormat(content) {
    const normalizedContent = normalizeLineEndings(content); // Normaliser le contenu
    const delimiter = detectDelimiter(normalizedContent);
    const lines = content.trim()
        .split("\n")
        .filter(line => line.trim() !== ""); // Retirer les lignes vides

    const nbColumns = lines[0].split(delimiter).length; // Compter le nombre de colonnes de la première ligne

    // Vérifier chaque ligne pour s'assurer qu'elles ont le même nombre de colonnes
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].split(delimiter).length !== nbColumns) {
            return false; // Retourner faux si une ligne a un nombre de colonnes différent
        }
    }

    return true; // Si toutes les lignes ont le même nombre de colonnes, c'est un CSV valide
}

// Fonction pour afficher le contenu sous forme de tableau et ajouter le bouton avec le nom du fichier
function display_list_profiles(contenu, fichier) {
    if (!isCSVFormat(contenu)) {
        alert("This is not a valid CSV file!");
        return;
    }

    const normalizedContent = normalizeLineEndings(contenu); // Normaliser le contenu
    const delimiter = detectDelimiter(normalizedContent); // Détecter le délimiteur
    const lines = normalizedContent.split("\n").filter((line) => line.trim() !== ""); // Éviter les lignes vides

    if (lines.length === 0) return;

    // Stocker les lignes pour un accès ultérieur
    rows = [];

    for (let i = 0; i < lines.length; i++) {
        const lignes_i = lines[i].split(delimiter); // Utiliser le délimiteur correct
        rows.push(lignes_i); // Ajouter les lignes dans le tableau
    }
    delete_delimiter();
    retirerLignesVides();
    let totalData = {};

    // Parcourir les index des colonnes sélectionnées et les remplir avec leurs données
    for(let j = 0; j < rows[0].length; j++) {
        totalData[rows[0][j]] = [];
        for (let i = 1; i < rows.length; i++) { // Ignorer la première ligne (en-têtes)
            if (rows[i] && rows[i][j] !== undefined) {
                totalData[rows[0][j]].push(rows[i][j]);
            }
        }
    }
    savedProfiles[fichier.name] = totalData;
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    console.log(savedProfiles);
    let htmlContent = "";

    // Section pour afficher ou modifier le nom du profil
    htmlContent += `
        <div id="profileContainer" style="margin-bottom: 20px; text-align: center;">
            <h2 id="profileTitle" style="font-size: 22px; font-weight: bold; color: #007bff; margin-bottom: 10px;">
                Profile Name : <span id="displayProfileName" style="color: #FF4500;"></span>
            </h2>
            <input type="text" id="profileName" placeholder="Enter a profile name"
                style="padding: 10px; font-size: 16px; border: 1px solid #007bff; border-radius: 10px; width: 50%;"
                oninput="updateProfileDisplay(this)">
        </div>
    `;

    // Ajout d'un bouton pour le nom du fichier
    htmlContent += `
        <fieldset><legend>List profiles</legend>
            <div id ="profileListContainer" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px;">
            </div>
        </fieldset>
    `;

    // Zone pour afficher les colonnes (sera remplie via la fonction `display_colonnes`)
    htmlContent += `
        <fieldset><legend>List colonnes</legend>
            <div id="columnDisplay" style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                Please select a profile to display its columns.
            </div>
        </fieldset>
    `;

    // Ajouter les boutons pour sauvegarder et afficher
    htmlContent += `
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="Save_profile()">
                Add profile
            </button>
            <button onclick="display()">
                Display profile
            </button>
            <button onclick="delete_profil()">
                Delete profile
            </button>
            <button onclick="save_profile_data()">
                Save profile
            </button>
            <button onclick="simlilar_profile()">
                Similar
            </button>
            <button onclick="virtual_profile()">
                Virtual sort
            </button>
        </div>
    `;

    // Afficher le contenu HTML généré dans l'élément table
    document.getElementById("table").innerHTML = htmlContent;
    updateProfileList();
}

// Fonction pour mettre à jour dynamiquement l'affichage du "Nom du profil"
function updateProfileDisplay(input) {
    const displayProfileName = document.getElementById("displayProfileName");
    displayProfileName.textContent = input.value.trim() || "(Aucun)";
}
// Fonction pour sauvegarder un profil
function Save_profile() {
    const profileName = document.getElementById("profileName").value.trim();
    const profileNameData = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    console.log("profile name: ",profileName);
    let selectedCols = Array.from(document.querySelectorAll('input.colSelect:checked')).map(input => parseInt(input.value));
    if (!profileName) {
        alert("Please enter a valid profile name.");
        return;
    }
    if (selectedCols.length === 0) {
        alert("Please select at least one column for the profile.");
        return;
    }

    if( savedProfiles[profileName] ) {
        alert("Profile exists. Please choose another profile name!");
        return;
    }

    if (!profileNameData || profileNameData === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Récupérer les données du profil
    const profileData = savedProfiles[profileNameData];
    let rows = [];

    if (!profileData) {
        alert(`Profile "${profileName}" does not exist!`);
        return;
    }
    console.log(profileData);
    // Ajouter les noms des colonnes comme première ligne
    const columnNames = Object.keys(profileData); // Obtenir les clés des colonnes
    rows.push(columnNames); // Première ligne avec les noms des colonnes

    // Trouver le nombre maximum de lignes nécessaire
    const maxRows = Math.max(...Object.values(profileData).map(col => col.length));

    // Ajouter les données ligne par ligne
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        let row = columnNames.map(colName => profileData[colName][rowIndex] || ""); // Extraire les données par colonne
        rows.push(row);
    }

    // Créer un objet pour stocker les colonnes sélectionnées et leurs valeurs
    let selectedData = {};

    // Parcourir les index des colonnes sélectionnées et les remplir avec leurs données
    selectedCols.forEach(colIndex => {
        selectedData[rows[0][colIndex]] = [];
        for (let i = 1; i < rows.length; i++) { // Ignorer la première ligne (en-têtes)
            if (rows[i] && rows[i][colIndex] !== undefined) {
                selectedData[rows[0][colIndex]].push(rows[i][colIndex]);
            }
        }
    });

    savedProfiles[profileName] = selectedData;
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    console.log(savedProfiles);
    updateProfileList();

    document.getElementById("profileName").value = "";
    Array.from(document.querySelectorAll('input[name="columns"]')).forEach((checkbox) => (checkbox.checked = false));

    alert(`Profile "${profileName}" has been saved successfully!`);
}

function updateProfileList() {
    const profileListContainer = document.getElementById("profileListContainer");

    if (!profileListContainer) {
        console.error("Container for profile list ('profileListContainer') not found!");
        return;
    }

    // Nettoyer le conteneur pour éviter les doublons
    profileListContainer.innerHTML = "";

    // Ajouter un bouton pour chaque profil dans `savedProfiles`
    Object.keys(savedProfiles).forEach((profileName) => {
        const profileButton = document.createElement("button");
        profileButton.textContent = profileName;
        profileButton.style.cssText = `
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            color: white;
            background-color: #007bff;
            border: none;
            border-radius: 30px;
            font-size: 16px;
            cursor: pointer;
        `;

        // Ajouter un événement 'click'
    profileButton.onclick = () => {
        // Réinitialiser la couleur de tous les boutons
        Array.from(profileListContainer.children).forEach((btn) => {
            btn.style.backgroundColor = "#007bff"; // Couleur par défaut
        });

        // Changer la couleur du bouton cliqué
        profileButton.style.backgroundColor = "#28a745"; // Couleur par exemple 'vert'
        display_profile(profileName);
    };

        // Ajouter le bouton au conteneur
        profileListContainer.appendChild(profileButton);
    });


}

let lastVisitedProfile = ""; //

// Fonction pour afficher toutes les colonnes du profil `name_profile`
function display_profile(profileName) {
    const profileData = savedProfiles[profileName];
    const columnHeaders = Object.keys(profileData); // Les colonnes (les clés)

    // Obtenir l'en-tête de colonnes (première ligne du fichier)
    let htmlColonnes = "<div style='display: grid; grid-template-columns: repeat(7, 1fr); row-gap: 2px; column-gap: 2px'>";

    for (let j = 0; j < columnHeaders.length; j++) {
        // Générer chaque colonne
        htmlColonnes += `
        <div>
            <input type="checkbox" class="colSelect" id="${j}" value="${j}">
            <label for="${j}">${columnHeaders[j]}</label>
        </div>`;
    }
    htmlColonnes += "</div>";

    // Afficher les colonnes dans le conteneur de colonnes
    document.getElementById("columnDisplay").innerHTML = htmlColonnes;
    // Mettre à jour le nom du profil activement sélectionné
    document.getElementById("displayProfileName").textContent = profileName;
        // Mémoriser le dernier profil visité dans une variable globale
    lastVisitedProfile = profileName;

    // Optionnel : stocker dans le localStorage si vous voulez le rendre persistant
    localStorage.setItem("lastVisitedProfile", profileName);

}

let displayWindow = null;
function display() {
    const selectedColumns = Array.from(document.querySelectorAll('input.colSelect:checked')).map((input) =>
        parseInt(input.value)
    );

    if (selectedColumns.length === 0) {
        alert("Please select at least one column to display!");
        return;
    }

    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }
    console.log(profileName);
    // Récupérer les données du profil
    const profileData = savedProfiles[profileName];
    if (!profileData) {
        alert(`Profile "${profileName}" does not exist!`);
        return;
    }
    const selectedColNames = Object.keys(profileData).filter((_, index) => selectedColumns.includes(index));
    const selectedColData = selectedColNames.map((column) => profileData[column]);
    console.log(selectedColData);
    console.log(selectedColNames);
    localStorage.setItem('selectedColNames', JSON.stringify(selectedColNames));
    localStorage.setItem('selectedColData', JSON.stringify(selectedColData));
    localStorage.setItem('profileName', JSON.stringify(profileName));

        // Vérifier si la fenêtre `display.html` est déjà ouverte
    if (displayWindow && !displayWindow.closed) {
        // Si déjà ouverte, envoyer une commande à la fenêtre pour qu'elle mette à jour son contenu
        displayWindow.postMessage({ action: 'updateTable' }, '*');
        displayWindow.focus(); // Ramener au premier plan
    } else {
        // Sinon, ouvrir une nouvelle fenêtre et conserver la référence
        displayWindow = window.open('display.html', '_blank');
    }

}

function delete_profil() {
    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Confirmation avant suppression
    if (!confirm(`Do you really want to delete the profile? "${profileName}" ?`)) {
        return;
    }

    // Supprimer le profil de la variable profiles
    delete savedProfiles[profileName];

    // Mettre à jour dans le stockage local
    localStorage.setItem('profiles', JSON.stringify(savedProfiles));
    updateProfileList();
    alert(`Profile "${profileName}" has been deleted successfully!`);
}

function save_profile_data() {
            const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
            if (!profileName || profileName === "(Aucun)") {
                alert("No profile selected. Please select a profile from the list!");
                return;
            }

            // Récupérer les données du profil
            const profileData = savedProfiles[profileName];
            const columnHeaders = Object.keys(profileData); // Les colonnes (les clés)
            const numRows = profileData[columnHeaders[0]].length; // Nombre de lignes basé sur le premier tableau

            if (!profileData || numRows === 0) {
                alert("Données indisponibles pour ce profil !");
                return;
            }

            // Construire le contenu CSV
            let csvContent = "";
            // Ajouter les en-têtes
            csvContent += columnHeaders.map(header => header).join(",") + "\n";
            // Ajouter les données
            for (let i = 0; i < numRows; i++) {
                csvContent += columnHeaders.map(header => profileData[header][i]).join(",") + "\n";
            }

            // Créer un fichier Blob pour le téléchargement
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const filename = `${profileName}.csv`; // Utilise le nom du profil

            // Créer un lien pour télécharger le fichier
            const link = document.createElement("a");
            if (link.download !== undefined) { // Vérification de téléchargement pris en charge
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Your browser does not support CSV export.");
            }

}
let similarityWindow = null;
let virtualWindow = null;

function simlilar_profile() {

    const selectedColumns = Array.from(document.querySelectorAll('input.colSelect:checked')).map((input) =>
        parseInt(input.value)
    );

    if (selectedColumns.length === 0) {
        alert("Please select at least one column to Similarity!");
        return;
    }

    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    console.log("Profilename: ",profileName);
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Récupérer les données du profil
    const profileData = savedProfiles[profileName];
    let data_transform = [];

    if (!profileData) {
        alert(`Profile "${profileName}" does not exist!`);
        return;
    }
    console.log(profileData);
    // Ajouter les noms des colonnes comme première ligne
    const columnNames = Object.keys(profileData); // Obtenir les clés des colonnes
    data_transform.push(columnNames); // Première ligne avec les noms des colonnes

    // Trouver le nombre maximum de lignes nécessaire
    const maxRows = Math.max(...Object.values(profileData).map(col => col.length));

    // Ajouter les données ligne par ligne
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        let row = columnNames.map(colName => profileData[colName][rowIndex] || ""); // Extraire les données par colonne
        data_transform.push(row);
    }

    // Résultat final
    console.log(data_transform);

    localStorage.setItem('selectedColumns', JSON.stringify(selectedColumns));
    localStorage.setItem('data_transform', JSON.stringify(data_transform));
    localStorage.setItem('profileName', JSON.stringify(profileName));

    //Vérification et gestion de la fenêtre `similarity.html`
    if (similarityWindow && !similarityWindow.closed) {
        // Si la fenêtre existe et est ouverte, envoyer une commande pour mettre à jour
        similarityWindow.postMessage({ action: 'updateTable' }, '*');
        similarityWindow.focus(); // Ramener au premier plan
    } else {
        // Sinon, ouvrir une nouvelle fenêtre et conserver la référence
        similarityWindow = window.open('similarity.html', '_blank');

        // Attendre que la fenêtre soit prête (au cas où le script n'est pas chargé immédiatement)
        similarityWindow.onload = () => {
            similarityWindow.postMessage({ action: 'updateTable' }, '*');
        };
    }
}

function virtual_profile() {
    const selectedCols = Array.from(document.querySelectorAll('input.colSelect:checked')).map((input) =>
        parseInt(input.value)
    );

    if (selectedCols.length === 0) {
        alert("Please select at least one column to Similarity!");
        return;
    }

    const profileName = lastVisitedProfile || localStorage.getItem("lastVisitedProfile");
    console.log("Profilename: ",profileName);
    if (!profileName || profileName === "(Aucun)") {
        alert("No profile selected. Please select a profile from the list!");
        return;
    }

    // Récupérer les données du profil
    const profileData = savedProfiles[profileName];
    let rows = [];

    if (!profileData) {
        alert(`Profile "${profileName}" does not exist!`);
        return;
    }
    console.log(profileData);
    // Ajouter les noms des colonnes comme première ligne
    const columnNames = Object.keys(profileData); // Obtenir les clés des colonnes
    rows.push(columnNames); // Première ligne avec les noms des colonnes

    // Trouver le nombre maximum de lignes nécessaire
    const maxRows = Math.max(...Object.values(profileData).map(col => col.length));

    // Ajouter les données ligne par ligne
    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        let row = columnNames.map(colName => profileData[colName][rowIndex] || ""); // Extraire les données par colonne
        rows.push(row);
    }

    // Résultat final
    console.log(rows);

    // Stocker les colonnes et les lignes dans localStorage
    localStorage.setItem('selectedColumns', JSON.stringify(selectedCols));
    localStorage.setItem('rows', JSON.stringify(rows));
    localStorage.setItem('profileName', JSON.stringify(profileName));

    //Vérification et gestion de la fenêtre `virtual.html`
    if (virtualWindow && !virtualWindow.closed) {
        // Si la fenêtre existe et est ouverte, envoyer une commande pour mettre à jour
        virtualWindow.postMessage({ action: 'updateTable' }, '*');
        virtualWindow.focus(); // Ramener au premier plan
    } else {
        // Sinon, ouvrir une nouvelle fenêtre et conserver la référence
        virtualWindow = window.open('virtual.html', '_blank');

        // Attendre que la fenêtre soit prête (au cas où le script n'est pas chargé immédiatement)
        virtualWindow.onload = () => {
            virtualWindow.postMessage({ action: 'updateTable' }, '*');
        };
    }
}
function delete_delimiter() {
    if (rows.length === 0) {
        console.error("No data available for processing.");
        return;
    }

    // Parcourir chaque ligne de données
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
            // Supprimer les guillemets simples ou doubles autour de chaque cellule
            rows[i][j] = rows[i][j].trim().replace(/^['"]|['"]$/g, '');
        }
    }

    console.log("Delimiters successfully removed!");
    console.log(rows); // Affiche les données nettoyées
}
function retirerLignesVides() {
    if (rows.length === 0) {
        console.error("No data available for processing.");
        return;
    }

     rows = rows.filter(row => {
        // Vérifier si au moins une des colonnes dans une ligne n'est pas vide
        return row.some(value => value.trim() !== "");
    });

    console.log("Empty lines removed. Here is the updated data:");
    console.log(rows);
}
