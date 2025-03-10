        // Variables globales pour les colonnes et les lignes
        let selectedColNames = [];
        let selectedColData = [];
        let profileName = '';

        // Afficher le tableau
        function afficherTableau() {
            let htmlTable = `<h1>The columns you have selected in the profile: ${profileName}</h1><table>
            <thead>
                <tr>
                    ${selectedColNames.map((colName) => `<th>${colName}</th>`).join("")}
                </tr>
            </thead>
            <tbody>`;
            // Trouver le nombre maximum de lignes dans les colonnes sélectionnées
            const maxRows = Math.max(...selectedColData.map((col) => col.length));

            // Ajouter les lignes une par une
            for (let i = 0; i < maxRows; i++) {
                htmlTable += "<tr>";
                selectedColData.forEach((col) => {
                    htmlTable += `<td>${col[i] || ""}</td>`;
                });
                htmlTable += "</tr>";
            }
            htmlTable += "</tbody></table>";
            document.getElementById('table').innerHTML = htmlTable;

        }

            // Écouter les messages de la fenêtre parent
        window.addEventListener('message', (event) => {
            if (event.data && event.data.action === 'updateTable') {
                // Mettre à jour les valeurs depuis localStorage
                const updateselectedColNames = JSON.parse(localStorage.getItem('selectedColNames')) || [];
                const updateselectedColData = JSON.parse(localStorage.getItem('selectedColData')) || [];
                const updateprofileName = localStorage.getItem('profileName') || '';

                // Réinitialiser les données globales
                selectedColNames.length = 0;
                selectedColNames.push(...updateselectedColNames);
                selectedColData.length = 0;
                selectedColData.push(...updateselectedColData);
                profileName = updateprofileName;

                // Mettre à jour le tableau
                afficherTableau();
            }
        });
        // Initier le tableau lors du premier chargement
        selectedColNames = JSON.parse(localStorage.getItem('selectedColNames')) || [];
        selectedColData = JSON.parse(localStorage.getItem('selectedColData')) || [];
        profileName = localStorage.getItem('profileName') || '';
        afficherTableau();

        function export_en_CSV() {
                        let csvContent = "";
                        let table = document.querySelector("table");
                        let rows = table.querySelectorAll("tr");

                        rows.forEach((row, index) => {
                            let rowData = [];
                            row.querySelectorAll("th, td").forEach(cell => rowData.push(cell.innerText));
                            csvContent += rowData.join(",") + (index < rows.length - 1 ? "\n" : ""); // Ajoute une nouvelle ligne sauf pour la dernière ligne
                        });

                        let blob = new Blob([csvContent], { type: "text/csv" });
                        let link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `${profileName}.csv`;
                        link.click();
        }
