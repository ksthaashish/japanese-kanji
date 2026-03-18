async function loadKanjiDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const character = urlParams.get('char');
    if (!character) {
        showError('No kanji specified.');
        return;
    }

    const loading = document.getElementById('loading');
    const contentDiv = document.getElementById('detail-content');
    const errorDiv = document.getElementById('error');

    try {
        const response = await fetch('/api/kanji');
        if (!response.ok) throw new Error('Failed to load');
        const allKanji = await response.json();

        const kanji = allKanji.find(k => k.character === character);
        if (!kanji) throw new Error('Kanji not found');

        loading.style.display = 'none';
        contentDiv.style.display = 'block';

        let html = `
            <h2>${kanji.character} <span class="meaning">${kanji.meaning}</span> <span class="category-badge">${kanji.category}</span></h2>
            <div class="readings">
                <div class="onyomi">
                    <h3>On'yomi (音読み)</h3>
                    ${kanji.onyomi.length ? kanji.onyomi.map(r => `<span class="reading">${r}</span>`).join(' ') : '<em>None</em>'}
                </div>
                <div class="kunyomi">
                    <h3>Kun'yomi (訓読み)</h3>
                    ${kanji.kunyomi.length ? kanji.kunyomi.map(r => `<span class="reading">${r}</span>`).join(' ') : '<em>None</em>'}
                </div>
            </div>
            <div class="examples">
                <h3>Examples</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Kanji</th>
                            <th>Hiragana</th>
                            <th>English</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        kanji.examples.forEach(ex => {
            html += `
                <tr>
                    <td>${ex.kanji}</td>
                    <td>${ex.hiragana}</td>
                    <td>${ex.english}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <button onclick="location.href='index.html'" class="restart-btn" style="margin-top:20px;">← Back</button>
        `;

        contentDiv.innerHTML = html;
    } catch (error) {
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: ' + error.message;
    }
}

function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = msg;
}

document.addEventListener('DOMContentLoaded', loadKanjiDetail);
