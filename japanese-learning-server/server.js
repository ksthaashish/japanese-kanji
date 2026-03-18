const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Helper: read all JSON files and add category based on filename
function readAllKanji() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log('Reading files:', files);
    let allKanji = [];
    for (const file of files) {
        try {
            const filePath = path.join(DATA_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const kanjiList = JSON.parse(content);
            if (!Array.isArray(kanjiList)) {
                console.warn(`File ${file} is not an array, skipping`);
                continue;
            }
            const category = path.basename(file, '.json');
            kanjiList.forEach(k => {
                k.category = category;
            });
            allKanji = allKanji.concat(kanjiList);
        } catch (err) {
            console.error(`Error reading ${file}:`, err.message);
        }
    }
    return allKanji;
}

// Helper: find which file contains a character
function findFileForCharacter(character) {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
        try {
            const filePath = path.join(DATA_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const kanjiList = JSON.parse(content);
            if (Array.isArray(kanjiList) && kanjiList.some(k => k.character === character)) {
                return file;
            }
        } catch (err) {
            console.error(`Error checking ${file}:`, err.message);
        }
    }
    return null;
}

// Helper: write to a specific file
function writeToFile(file, data) {
    const filePath = path.join(DATA_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// GET all kanji
app.get('/api/kanji', (req, res) => {
    try {
        const kanji = readAllKanji();
        res.json(kanji);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST new kanji – save to file named after category
app.post('/api/kanji', (req, res) => {
    try {
        const newKanji = req.body;
        const category = newKanji.category || 'user';
        console.log('Received new kanji with category:', category);

        // Check for duplicate (across all files)
        const allKanji = readAllKanji();
        if (allKanji.some(k => k.character === newKanji.character)) {
            return res.status(400).json({ error: 'Kanji already exists' });
        }

        const targetFile = category + '.json';
        const filePath = path.join(DATA_DIR, targetFile);

        // Read existing data or start new array
        let kanjiList = [];
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            kanjiList = JSON.parse(content);
            if (!Array.isArray(kanjiList)) kanjiList = [];
        }

        // Remove category field before saving (we'll add it back when reading)
        const { category: _, ...kanjiWithoutCategory } = newKanji;
        kanjiList.push(kanjiWithoutCategory);

        // Write to the target file
        writeToFile(targetFile, kanjiList);
        console.log(`Saved to ${targetFile}`);

        // Return with category for frontend
        res.status(201).json({ ...kanjiWithoutCategory, category });
    } catch (err) {
        console.error('Error in POST:', err);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// PUT update kanji
app.put('/api/kanji/:character', (req, res) => {
    try {
        const character = req.params.character;
        const updated = req.body;

        const file = findFileForCharacter(character);
        if (!file) return res.status(404).json({ error: 'Kanji not found' });

        const filePath = path.join(DATA_DIR, file);
        let kanjiList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const index = kanjiList.findIndex(k => k.character === character);
        if (index === -1) return res.status(404).json({ error: 'Kanji not found in file' });

        // Preserve character (can't change it) – but allow other fields
        const { category, ...rest } = updated;
        kanjiList[index] = { ...kanjiList[index], ...rest };
        writeToFile(file, kanjiList);

        // Return with category from filename
        res.json({ ...kanjiList[index], category: file.replace('.json', '') });
    } catch (err) {
        console.error('Error in PUT:', err);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE kanji
app.delete('/api/kanji/:character', (req, res) => {
    try {
        const character = req.params.character;

        const file = findFileForCharacter(character);
        if (!file) return res.status(404).json({ error: 'Kanji not found' });

        const filePath = path.join(DATA_DIR, file);
        let kanjiList = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const newList = kanjiList.filter(k => k.character !== character);
        if (newList.length === kanjiList.length) {
            return res.status(404).json({ error: 'Kanji not found in file' });
        }
        writeToFile(file, newList);

        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE:', err);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
