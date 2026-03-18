let allKanji = [];
let currentCategory = 'all';

async function loadKanji() {
    const loading = document.getElementById('loading');
    const kanjiList = document.getElementById('kanji-list');
    const errorDiv = document.getElementById('error');
    const statusDiv = document.getElementById('status');

    try {
        console.log('Fetching /api/kanji...');
        const response = await fetch('/api/kanji');
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error('Failed to load');
        allKanji = await response.json();
        console.log('Loaded kanji:', allKanji);
        console.log('Number of kanji:', allKanji.length);

        loading.style.display = 'none';

        if (allKanji.length === 0) {
            statusDiv.innerHTML = '⚠️ No kanji found in the data folder. Please add some JSON files.';
            statusDiv.style.display = 'block';
        } else {
            statusDiv.style.display = 'none';
        }

        populateCategoryLinks();
        populateCategoryDropdown();
    } catch (error) {
        console.error('Error loading kanji:', error);
        loading.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: ' + error.message + '. Check the console for details.';
    }
}

function populateCategoryLinks() {
    const categories = [...new Set(allKanji.map(k => k.category).filter(cat => cat && typeof cat === 'string'))].sort();
    console.log('Found categories:', categories);

    const linksContainer = document.getElementById('category-links');
    const allLink = linksContainer.querySelector('a[data-category="all"]');
    allLink.classList.add('active');

    const existingLinks = linksContainer.querySelectorAll('a:not([data-category="all"])');
    existingLinks.forEach(link => link.remove());

    categories.forEach(cat => {
        const a = document.createElement('a');
        a.href = '#';
        a.setAttribute('data-category', cat);
        a.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        a.addEventListener('click', (e) => {
            e.preventDefault();
            linksContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            a.classList.add('active');
            currentCategory = cat;
            filterAndRender();
        });
        linksContainer.appendChild(a);
    });

    allLink.addEventListener('click', (e) => {
        e.preventDefault();
        linksContainer.querySelectorAll('a').forEach(link => link.classList.remove('active'));
        allLink.classList.add('active');
        currentCategory = 'all';
        filterAndRender();
    });
}

function populateCategoryDropdown() {
    const categories = [...new Set(allKanji.map(k => k.category).filter(cat => cat && typeof cat === 'string'))].sort();
    const select = document.getElementById('category-select');
    select.innerHTML = '<option value="">-- Select or type custom --</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        select.appendChild(option);
    });
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom...';
    select.appendChild(customOption);

    const customInput = document.getElementById('category-custom');
    select.addEventListener('change', () => {
        if (select.value === 'custom') {
            customInput.style.display = 'block';
            customInput.value = '';
        } else {
            customInput.style.display = 'none';
            customInput.value = select.value;
        }
    });
}

function filterAndRender() {
    const filtered = currentCategory === 'all' 
        ? allKanji 
        : allKanji.filter(k => k.category === currentCategory);
    renderKanjiList(filtered);
}

function renderKanjiList(kanjiArray) {
    const kanjiList = document.getElementById('kanji-list');
    kanjiList.innerHTML = '';

    if (kanjiArray.length === 0) {
        kanjiList.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No kanji in this category.</p>';
        return;
    }

    kanjiArray.forEach(kanji => {
        const button = document.createElement('button');
        button.className = 'kanji-button';
        button.textContent = kanji.character;
        button.setAttribute('data-meaning', kanji.meaning);

        // Edit/delete buttons for all (since all files are editable now)
        const editBtn = document.createElement('span');
        editBtn.className = 'edit-kanji';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(kanji);
        });
        button.appendChild(editBtn);

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-kanji';
        deleteBtn.innerHTML = '✖';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteKanji(kanji.character);
        });
        button.appendChild(deleteBtn);

        button.addEventListener('click', () => {
            window.location.href = `detail.html?char=${encodeURIComponent(kanji.character)}`;
        });
        kanjiList.appendChild(button);
    });
}

async function deleteKanji(character) {
    if (!confirm(`Delete ${character}?`)) return;
    try {
        const response = await fetch(`/api/kanji/${encodeURIComponent(character)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const err = await response.json();
            alert(err.error || 'Delete failed');
            return;
        }
        await loadKanji();
    } catch (err) {
        alert('Delete failed');
    }
}

const modal = document.getElementById('kanjiModal');
const modalTitle = document.getElementById('modal-title');
const addBtn = document.getElementById('add-kanji-btn');
const cancelBtn = document.getElementById('cancel-modal-btn');
const saveBtn = document.getElementById('save-kanji-btn');
const addExampleBtn = document.getElementById('add-example-btn');
const examplesContainer = document.getElementById('examples-container');

let editingCharacter = null;

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabPanes.forEach(pane => pane.classList.remove('active'));
        document.getElementById(tab + '-tab').classList.add('active');
    });
});

function openEditModal(kanji = null) {
    editingCharacter = kanji ? kanji.character : null;
    modalTitle.textContent = kanji ? 'Edit Kanji' : 'Add New Kanji';
    document.getElementById('edit-character').value = kanji ? kanji.character : '';
    document.getElementById('edit-meaning').value = kanji ? kanji.meaning : '';
    document.getElementById('edit-onyomi').value = kanji ? (kanji.onyomi || []).join(', ') : '';
    document.getElementById('edit-kunyomi').value = kanji ? (kanji.kunyomi || []).join(', ') : '';
    
    const cat = kanji ? kanji.category : '';
    const select = document.getElementById('category-select');
    const customInput = document.getElementById('category-custom');
    if (cat && Array.from(select.options).some(opt => opt.value === cat)) {
        select.value = cat;
        customInput.style.display = 'none';
        customInput.value = cat;
    } else {
        select.value = 'custom';
        customInput.style.display = 'block';
        customInput.value = cat || '';
    }

    document.getElementById('edit-original-character').value = kanji ? kanji.character : '';

    examplesContainer.innerHTML = '';
    if (kanji && kanji.examples) {
        kanji.examples.forEach(ex => addExampleRow(ex.kanji, ex.hiragana, ex.english));
    } else {
        addExampleRow();
    }

    document.getElementById('quick-text').value = '';

    if (kanji) {
        document.querySelector('[data-tab="form"]').click();
    }

    modal.style.display = 'flex';
}

function addExampleRow(kanji = '', hiragana = '', english = '') {
    const row = document.createElement('div');
    row.className = 'example-row';
    row.innerHTML = `
        <input type="text" placeholder="Kanji" class="example-kanji" value="${kanji}">
        <input type="text" placeholder="Hiragana" class="example-hiragana" value="${hiragana}">
        <input type="text" placeholder="English" class="example-english" value="${english}">
        <button type="button" class="remove-example">✖</button>
    `;
    row.querySelector('.remove-example').addEventListener('click', () => row.remove());
    examplesContainer.appendChild(row);
}

addBtn.addEventListener('click', () => openEditModal());
cancelBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});
addExampleBtn.addEventListener('click', () => addExampleRow());

function parseQuickAdd(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const results = [];
    for (const line of lines) {
        const parts = line.split(';').map(p => p.trim());
        if (parts.length < 2) continue;
        const character = parts[0];
        const meaning = parts[1];
        const onyomi = parts[2] ? parts[2].split(',').map(s => s.trim()).filter(s => s) : [];
        const kunyomi = parts[3] ? parts[3].split(',').map(s => s.trim()).filter(s => s) : [];
        
        let category = 'user';
        let examples = [];
        if (parts.length >= 5) {
            if (parts[4].includes('|')) {
                examples = parseExamples(parts[4]);
            } else {
                category = parts[4];
                if (parts.length >= 6) {
                    examples = parseExamples(parts[5]);
                }
            }
        }
        
        results.push({ character, meaning, onyomi, kunyomi, category, examples });
    }
    return results;
}

function parseExamples(examplesStr) {
    const examples = [];
    const exampleParts = examplesStr.split(',').map(s => s.trim());
    for (const ex of exampleParts) {
        const exParts = ex.split('|').map(s => s.trim());
        if (exParts.length === 3) {
            examples.push({ kanji: exParts[0], hiragana: exParts[1], english: exParts[2] });
        }
    }
    return examples;
}

saveBtn.addEventListener('click', async () => {
    const activeTab = document.querySelector('.tab-pane.active').id;

    if (activeTab === 'form-tab') {
        const character = document.getElementById('edit-character').value.trim();
        const meaning = document.getElementById('edit-meaning').value.trim();
        const onyomiStr = document.getElementById('edit-onyomi').value.trim();
        const kunyomiStr = document.getElementById('edit-kunyomi').value.trim();
        
        const select = document.getElementById('category-select');
        const customInput = document.getElementById('category-custom');
        let category;
        if (select.value === 'custom') {
            category = customInput.value.trim();
        } else {
            category = select.value;
        }
        if (!category) category = 'user';
        
        const originalCharacter = document.getElementById('edit-original-character').value;

        if (!character || !meaning) {
            alert('Character and meaning are required.');
            return;
        }

        const onyomi = onyomiStr ? onyomiStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const kunyomi = kunyomiStr ? kunyomiStr.split(',').map(s => s.trim()).filter(s => s) : [];

        const examples = [];
        document.querySelectorAll('.example-row').forEach(row => {
            const k = row.querySelector('.example-kanji').value.trim();
            const h = row.querySelector('.example-hiragana').value.trim();
            const e = row.querySelector('.example-english').value.trim();
            if (k && h && e) examples.push({ kanji: k, hiragana: h, english: e });
        });

        const kanjiData = { character, meaning, onyomi, kunyomi, category, examples };
        console.log('Sending data:', kanjiData);

        try {
            let response;
            if (editingCharacter) {
                response = await fetch(`/api/kanji/${encodeURIComponent(originalCharacter)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kanjiData)
                });
            } else {
                response = await fetch('/api/kanji', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kanjiData)
                });
            }

            if (!response.ok) {
                const err = await response.json();
                alert(err.error || 'Save failed');
                return;
            }

            modal.style.display = 'none';
            await loadKanji();
        } catch (err) {
            alert('Save failed: ' + err.message);
        }
    } else if (activeTab === 'quick-tab') {
        const text = document.getElementById('quick-text').value;
        if (!text.trim()) {
            alert('Please enter some kanji data.');
            return;
        }
        const parsedList = parseQuickAdd(text);
        if (parsedList.length === 0) {
            alert('No valid entries found. Check format.');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        for (const item of parsedList) {
            if (allKanji.some(k => k.character === item.character)) {
                failCount++;
                continue;
            }
            try {
                const response = await fetch('/api/kanji', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }
        alert(`Added: ${successCount}, skipped (duplicates or errors): ${failCount}`);
        modal.style.display = 'none';
        await loadKanji();
    }
});

document.addEventListener('DOMContentLoaded', loadKanji);
