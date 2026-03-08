// ===== DOM ELEMENTS =====
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const results = document.getElementById('results');
const recentSearches = document.getElementById('recentSearches');

// ===== STATE =====
let recentWords = [];
const MAX_RECENT = 8;

// ===== INITIALIZATION =====
function init() {
    loadRecentSearches();
    displayRecentSearches();
    
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// ===== SEARCH FUNCTION =====
async function handleSearch() {
    const word = searchInput.value.trim().toLowerCase();
    
    if (!word) {
        searchInput.focus();
        return;
    }
    
    searchWord(word);
}

async function searchWord(word) {
    // Update input
    searchInput.value = word;
    
    // Show loading, hide others
    showLoading();
    hideError();
    hideResults();
    
    try {
        // Fetch from Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            throw new Error('Word not found');
        }
        
        const data = await response.json();
        
        // Add to recent searches
        addToRecent(word);
        
        // Display results
        displayResults(data[0]);
        
    } catch (err) {
        showError(word);
    } finally {
        hideLoading();
    }
}

// ===== DISPLAY RESULTS =====
function displayResults(data) {
    // Word and phonetic
    document.getElementById('word').textContent = data.word;
    
    const phoneticText = data.phonetic || 
        (data.phonetics && data.phonetics[0] ? data.phonetics[0].text : '');
    document.getElementById('phonetic').textContent = phoneticText;
    
    // Audio
    const audioBtn = document.getElementById('audioBtn');
    const audioUrl = data.phonetics?.find(p => p.audio)?.audio;
    
    if (audioUrl) {
        audioBtn.classList.remove('hidden');
        audioBtn.onclick = () => playAudio(audioUrl);
    } else {
        audioBtn.classList.add('hidden');
    }
    
    // Meanings
    const meaningsContainer = document.getElementById('meanings');
    meaningsContainer.innerHTML = '';
    
    data.meanings.forEach(meaning => {
        const meaningBlock = createMeaningBlock(meaning);
        meaningsContainer.appendChild(meaningBlock);
    });
    
    // Origin/Etymology
    if (data.origin) {
        document.getElementById('origin').classList.remove('hidden');
        document.getElementById('originText').textContent = data.origin;
    } else {
        document.getElementById('origin').classList.add('hidden');
    }
    
    // Synonyms and Antonyms
    displayRelatedWords(data.meanings);
    
    // Source link
    document.getElementById('sourceLink').href = data.sourceUrls ? data.sourceUrls[0] : '#';
    
    // Show results
    showResults();
}

function createMeaningBlock(meaning) {
    const block = document.createElement('div');
    block.className = 'meaning-block';
    
    // Part of speech
    const pos = document.createElement('span');
    pos.className = 'part-of-speech';
    pos.textContent = meaning.partOfSpeech;
    block.appendChild(pos);
    
    // Definitions
    meaning.definitions.slice(0, 5).forEach(def => {
        const defItem = document.createElement('div');
        defItem.className = 'definition-item';
        
        const definition = document.createElement('div');
        definition.className = 'definition';
        definition.textContent = def.definition;
        defItem.appendChild(definition);
        
        // Example
        if (def.example) {
            const example = document.createElement('div');
            example.className = 'example';
            example.textContent = def.example;
            defItem.appendChild(example);
        }
        
        block.appendChild(defItem);
    });
    
    return block;
}

function displayRelatedWords(meanings) {
    let allSynonyms = [];
    let allAntonyms = [];
    
    meanings.forEach(meaning => {
        if (meaning.synonyms) {
            allSynonyms = allSynonyms.concat(meaning.synonyms);
        }
        if (meaning.antonyms) {
            allAntonyms = allAntonyms.concat(meaning.antonyms);
        }
        
        meaning.definitions.forEach(def => {
            if (def.synonyms) {
                allSynonyms = allSynonyms.concat(def.synonyms);
            }
            if (def.antonyms) {
                allAntonyms = allAntonyms.concat(def.antonyms);
            }
        });
    });
    
    // Remove duplicates
    allSynonyms = [...new Set(allSynonyms)].slice(0, 10);
    allAntonyms = [...new Set(allAntonyms)].slice(0, 10);
    
    const relatedWords = document.getElementById('relatedWords');
    const synonymsSection = document.getElementById('synonymsSection');
    const antonymsSection = document.getElementById('antonymsSection');
    
    // Synonyms
    if (allSynonyms.length > 0) {
        const synonymsList = document.getElementById('synonymsList');
        synonymsList.innerHTML = '';
        allSynonyms.forEach(word => {
            const chip = document.createElement('button');
            chip.className = 'word-chip';
            chip.textContent = word;
            chip.onclick = () => searchWord(word);
            synonymsList.appendChild(chip);
        });
        synonymsSection.classList.remove('hidden');
    } else {
        synonymsSection.classList.add('hidden');
    }
    
    // Antonyms
    if (allAntonyms.length > 0) {
        const antonymsList = document.getElementById('antonymsList');
        antonymsList.innerHTML = '';
        allAntonyms.forEach(word => {
            const chip = document.createElement('button');
            chip.className = 'word-chip';
            chip.textContent = word;
            chip.onclick = () => searchWord(word);
            antonymsList.appendChild(chip);
        });
        antonymsSection.classList.remove('hidden');
    } else {
        antonymsSection.classList.add('hidden');
    }
    
    // Show related words section if either exists
    if (allSynonyms.length > 0 || allAntonyms.length > 0) {
        relatedWords.classList.remove('hidden');
    } else {
        relatedWords.classList.add('hidden');
    }
}

// ===== AUDIO PLAYBACK =====
function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
}

// ===== RECENT SEARCHES =====
function addToRecent(word) {
    // Remove if already exists
    recentWords = recentWords.filter(w => w !== word);
    
    // Add to beginning
    recentWords.unshift(word);
    
    // Keep only MAX_RECENT
    if (recentWords.length > MAX_RECENT) {
        recentWords = recentWords.slice(0, MAX_RECENT);
    }
    
    // Save and display
    saveRecentSearches();
    displayRecentSearches();
}

function displayRecentSearches() {
    if (recentWords.length === 0) {
        recentSearches.classList.add('hidden');
        return;
    }
    
    const recentList = document.getElementById('recentList');
    recentList.innerHTML = '';
    
    recentWords.forEach(word => {
        const item = document.createElement('button');
        item.className = 'recent-item';
        item.textContent = word;
        item.onclick = () => searchWord(word);
        recentList.appendChild(item);
    });
    
    recentSearches.classList.remove('hidden');
}

function saveRecentSearches() {
    localStorage.setItem('recentSearches', JSON.stringify(recentWords));
}

function loadRecentSearches() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        try {
            recentWords = JSON.parse(saved);
        } catch (e) {
            recentWords = [];
        }
    }
}

// ===== UI HELPERS =====
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(word) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = `We couldn't find "${word}". Please check the spelling or try another word.`;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function showResults() {
    results.classList.remove('hidden');
}

function hideResults() {
    results.classList.add('hidden');
}

function clearSearch() {
    searchInput.value = '';
    searchInput.focus();
    hideError();
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.searchWord = searchWord;
window.clearSearch = clearSearch;

// ===== START APP =====
window.addEventListener('DOMContentLoaded', init);
