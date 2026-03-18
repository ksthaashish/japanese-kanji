async function loadAllExamples() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('examples-container');
    const errorDiv = document.getElementById('error');

    try {
        const response = await fetch('/api/kanji');
        if (!response.ok) throw new Error('Failed to load');
        const allKanji = await response.json();

        loading.style.display = 'none';
        container.style.display = 'block';

        let allExamples = [];
        allKanji.forEach(kanji => {
            kanji.examples.forEach(ex => {
                allExamples.push({
                    character: kanji.character,
                    meaning: kanji.meaning,
                    ...ex
                });
            });
        });

        let html = `
            <input type="text" id="searchInput" placeholder="🔍 Search examples..." class="search-box">
            <div class="table-wrapper">
                <table class="examples-table">
                    <thead>
                        <tr>
                            <th>Kanji</th>
                            <th>Parent Kanji</th>
                            <th>Hiragana</th>
                            <th>English</th>
                        </tr>
                    </thead>
                    <tbody id="examples-tbody">
        `;

        allExamples.forEach(ex => {
            html += `
                <tr>
                    <td><span class="kanji-cell">${ex.kanji}</span></td>
                    <td><a href="detail.html?char=${encodeURIComponent(ex.character)}" class="parent-link">${ex.character}</a></td>
                    <td>${ex.hiragana}</td>
                    <td>${ex.english}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('searchInput').addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#examples-tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });

    } catch (error) {
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: ' + error.message;
    }
}

document.addEventListener('DOMContentLoaded', loadAllExamples);
