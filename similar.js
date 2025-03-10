        // Variables globales pour les colonnes et les lignes
        let selectedColumns = [];
        let data_transform = [];
        let profileName = '';

        // Afficher le tableau
        function afficherTableau() {
            let table = `<h1><P></P>Profile: ${profileName}</h1><table><thead><tr>`;
            table += "<th>Select lines</th>";

            // Faire des colonnes en tête
            selectedColumns.forEach(colIndex => {
                table += `<th>${data_transform[0][colIndex]}</th>`;
            });
            table += "</tr></thead><tbody>";

            // Des valeurs pour chaque colonne
            for (let i = 1; i < data_transform.length; i++) {
                table += "<tr>";
                table += `<td><input type='checkbox' class='rowSelect' value='${i}'></td>`;
                selectedColumns.forEach(colIndex => {
                    table += `<td>${data_transform[i][colIndex]}</td>`;
                });
                table += "</tr>";
            }
            table += "</tbody></table>";
            document.getElementById('table').innerHTML = table;
        }

            // Écouter les messages de la fenêtre parent
        window.addEventListener('message', (event) => {
            if (event.data && event.data.action === 'updateTable') {
                // Mettre à jour les valeurs depuis localStorage
                const updatedCols = JSON.parse(localStorage.getItem('selectedColumns')) || [];
                const updatedRows = JSON.parse(localStorage.getItem('data_transform')) || [];
                const updatedprofileName = localStorage.getItem('profileName') || '';
                // Réinitialiser les données globales
                selectedColumns.length = 0;
                selectedColumns.push(...updatedCols);
                data_transform.length = 0;
                data_transform.push(...updatedRows);
                profileName = updatedprofileName;
                // Mettre à jour le tableau
                afficherTableau();
            }
        });
        // Initier le tableau lors du premier chargement
        selectedColumns = JSON.parse(localStorage.getItem('selectedColumns')) || [];
        data_transform = JSON.parse(localStorage.getItem('data_transform')) || [];
        profileName = localStorage.getItem('profileName') || '';
        afficherTableau();

        // Fonction pour calculer la distance Euclidienne entre deux vecteurs
        function euclideanDistance(vec1, vec2) {
            let sum = 0;
            for (let i = 0; i < vec1.length; i++) {
                sum += Math.pow(vec1[i] - vec2[i], 2);
            }
            return Math.sqrt(sum);
        }

function trierParDistanceEuclidienne(fullRows, selectedRows, filteredRows) {
    let ligneChoisis = [];
    let autres = [];

    // Diviser les lignes choisi avec des autres lignes
    for (let i = 0; i < filteredRows.length; i++) {
        if (selectedRows.includes(i + 1)) {
            ligneChoisis.push({ original: fullRows[i], filtered: filteredRows[i] });
        } else {
            autres.push({ original: fullRows[i], filtered: filteredRows[i] });
        }
    }
    console.log(ligneChoisis);
    console.log(autres);
    let distanceMin = [];
    // Calculer par le euclidean algorithme
    for (let i = 0; i < autres.length; i++) {
        let distances = [];
        for (let j = 0; j < ligneChoisis.length; j++) {
            let dist = euclideanDistance(autres[i].filtered, ligneChoisis[j].filtered);
            distances.push(dist);
        }
        let minDist = Math.min(...distances);
        distanceMin.push({ row: autres[i].original, distance: minDist });
    }

    // Sort par le distance
    distanceMin.sort((a, b) => a.distance - b.distance);
    console.log(distanceMin);
    // Return un nouveau table après similarité
    return [
        ...ligneChoisis.map(item => item.original),
        ...distanceMin.map(item => item.row)
    ];
}


function calculer_similarity() {
    const selectedRows = Array.from(document.querySelectorAll('input.rowSelect:checked')).map(input => parseInt(input.value));

    if (selectedRows.length === 0) {
        alert("Please select at least one row!");
        return;
    }

    // Des valeurs pour les colonnes on a chosi
    const filteredRows = data_transform.slice(1).map(row => {
        return selectedColumns.map(colIndex => parseFloat(row[colIndex]) || 0);
    });

    // Valeur original dans ce fichier
    const fullRows = data_transform.slice(1);

    // Données après similarité
    const orderedData = trierParDistanceEuclidienne(fullRows, selectedRows, filteredRows);
    console.log(orderedData);
    // Creer un table pour des nouveau fichier .csv après similarité
    let table = "<div class=\"table\" id=\"table\"><table><thead><tr>";
    data_transform[0].forEach(header => {
        table += `<th>${header}</th>`;
    });
    table += "</tr></thead><tbody>";

    orderedData.forEach(row => {
        table += "<tr>";
        row.forEach(cell => {
            table += `<td>${cell}</td>`;
        });
        table += "</tr>";
    });
    table += "</tbody></table></div>";
    // Ouvrir table résultat dans un nouveau onglet
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
        <html lang="en">
            <head>
                <title>Résultats Similarités</title>
                <link rel="stylesheet" href="style_table.css">
            </head>
            <body>
                ${table}
                <br>
                <button onclick="export_en_CSV()">Sauvegarder CSV</button>
                <script>
                    function export_en_CSV() {
                        let csvContent = "";
                        let table = document.querySelector("table");
                        let rows = table.querySelectorAll("tr");
            
                        rows.forEach((row, index) => {
                            let rowData = [];
                            row.querySelectorAll("th, td").forEach(cell => rowData.push(cell.innerText));
                            csvContent += rowData.join(",") + (index < rows.length - 1 ? "\\n" : ""); // Ajoute une nouvelle ligne sauf pour la dernière ligne
                        });
            
                        let blob = new Blob([csvContent], { type: "text/csv" });
                        let link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "Result_similarity.csv";
                        link.click();
                }
                </script>
            </body>
        </html>
    `);
    newWindow.document.close();
}