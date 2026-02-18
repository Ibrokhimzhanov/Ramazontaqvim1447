// Telegram WebApp init
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// State
let selectedGender = null;

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    screen.classList.add('active');

    // Auto-focus inputs
    if (screenId === 'screen-phone') {
        setTimeout(() => document.getElementById('phone-input').focus(), 300);
    }
    if (screenId === 'screen-gender') {
        setTimeout(() => document.getElementById('name-input').focus(), 300);
    }
    if (screenId === 'screen-region') {
        loadRegions();
    }
}

// Phone formatting: 90 123 45 67
function formatPhone(input) {
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 9) digits = digits.slice(0, 9);

    let formatted = '';
    if (digits.length > 0) formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);

    input.value = formatted;
}

// Phone validation
function validatePhone() {
    const input = document.getElementById('phone-input');
    const digits = input.value.replace(/\D/g, '');
    const btn = document.getElementById('btn-phone-next');
    const error = document.getElementById('phone-error');

    if (digits.length === 9) {
        btn.disabled = false;
        error.textContent = '';
    } else {
        btn.disabled = true;
        if (digits.length > 0 && digits.length < 9) {
            error.textContent = 'Raqam to\'liq emas';
        } else {
            error.textContent = '';
        }
    }
}

// Gender selection
function selectGender(gender) {
    selectedGender = gender;
    document.getElementById('gender-male').classList.toggle('selected', gender === 'male');
    document.getElementById('gender-female').classList.toggle('selected', gender === 'female');
    validateGenderForm();
}

// Gender form validation
function validateGenderForm() {
    const name = document.getElementById('name-input').value.trim();
    const btn = document.getElementById('btn-gender-next');
    btn.disabled = !(name.length >= 2 && selectedGender);
}

// Finish onboarding
function finishOnboarding() {
    const phone = '+998' + document.getElementById('phone-input').value.replace(/\D/g, '');
    const name = document.getElementById('name-input').value.trim();
    const gender = selectedGender;

    // Save user data
    const userData = { phone, name, gender };
    localStorage.setItem('ramazon_user', JSON.stringify(userData));

    // Show greeting (then routes based on gender)
    showGreeting(name, gender);
}

// Route after greeting based on gender
function afterGreeting() {
    const saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
    if (saved.gender === 'female') {
        showScreen('screen-main');
        loadRecipes();
    } else {
        showScreen('screen-region');
    }
}

// Greeting screen
function showGreeting(name, gender) {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('greeting-name').textContent = displayName;

    const greetings = gender === 'female' ? [
        `Hurmatli ${displayName}, Sizni muborak Ramazon oyi bilan chin dildan tabriklaymiz! Alloh taolo ro'zalaringizni qabul qilsin, bu oy Sizga baraka, sabr va oilaviy baxt olib kelsin.`,
        `Aziz ${displayName}, Ramazon muborak bo'lsin! Bu muqaddas oyda har bir duoyingiz ijobat bo'lsin, sufrangiz doimo to'q bo'lsin.`,
    ] : [
        `Hurmatli ${displayName}, Sizni muborak Ramazon oyi bilan chin dildan tabriklaymiz! Alloh taolo ro'zalaringizni qabul qilsin, bu oy Sizga baraka, sabr va salomatlik ato etsin.`,
        `Aziz ${displayName}, Ramazon muborak bo'lsin! Bu muqaddas oyda har bir duoyingiz ijobat bo'lsin, amallaringiz savobga to'lsin.`,
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    document.getElementById('greeting-text').textContent = randomGreeting;

    showScreen('screen-greeting');
}

// ========== Region Selection ==========
const regions = [
    { id: 'toshkent_sh', name: 'Toshkent shahri', emoji: '🏙️' },
    { id: 'toshkent_v', name: 'Toshkent viloyati', emoji: '🌄' },
    { id: 'samarqand', name: 'Samarqand', emoji: '🕌' },
    { id: 'buxoro', name: 'Buxoro', emoji: '🏛️' },
    { id: 'andijon', name: 'Andijon', emoji: '🌾' },
    { id: 'fargona', name: "Farg'ona", emoji: '🍇' },
    { id: 'namangan', name: 'Namangan', emoji: '🌸' },
    { id: 'xorazm', name: 'Xorazm', emoji: '🏰' },
    { id: 'qashqadaryo', name: 'Qashqadaryo', emoji: '⛰️' },
    { id: 'surxondaryo', name: 'Surxondaryo', emoji: '🌞' },
    { id: 'navoiy', name: 'Navoiy', emoji: '🏜️' },
    { id: 'jizzax', name: 'Jizzax', emoji: '🌿' },
    { id: 'sirdaryo', name: 'Sirdaryo', emoji: '🌊' },
    { id: 'qoraqalpogiston', name: "Qoraqalpog'iston", emoji: '🐪' },
];

let selectedRegion = null;

function loadRegions() {
    const list = document.getElementById('region-list');
    list.innerHTML = regions.map(r => `
        <div class="region-card" id="region-${r.id}" onclick="selectRegion('${r.id}')">
            <span class="region-emoji">${r.emoji}</span>
            <span class="region-name">${r.name}</span>
        </div>
    `).join('');
}

function selectRegion(id) {
    selectedRegion = id;
    document.querySelectorAll('.region-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('region-' + id).classList.add('selected');

    // Save region and go to main
    const saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
    saved.region = id;
    localStorage.setItem('ramazon_user', JSON.stringify(saved));

    setTimeout(() => {
        showScreen('screen-main');
        loadFoodScreen();
    }, 300);
}

function goToMain() {
    showScreen('screen-main');
    loadFoodScreen();
}

// ========== Food Screen (Women) ==========
// All dishes use local images from /images/ folder
// File naming: lowercase, spaces → hyphen. Example: "Toshkent oshi" → "toshkent-oshi.jpg"
const foodData = {
    saharlik: [
        { name: 'Toshkent oshi', img: 'images/toshkent-osh.png' },
        { name: 'Andijon oshi', img: 'images/andijon-osh.png' },
        { name: 'Dimlama', img: 'images/dimlama.png' },
        { name: 'Qazon Kabob', img: 'images/qazonkabob.png' },
        { name: 'Qovurdoq', img: 'images/qovurdoq.png' },
        { name: 'Norin', img: 'images/norin.png' },
        { name: 'Bifshteks', img: 'images/bifshteks.png' },
        { name: 'Manti', img: 'images/manti.png' },
        { name: 'Honim', img: 'images/Honim.png' },
        { name: 'Shovla', img: 'images/shovla.png' },
        { name: 'Chuchvara', img: 'images/chuchvara.png' },
        { name: 'Manpar', img: 'images/manpar.png' },
        { name: 'Befstroganov', img: 'images/befstroganov.png' },
        { name: 'Koza-kifta Dimlama', img: 'images/koza-kifta-dimlama.png' },
        { name: 'Zharkof', img: 'images/sharkof.png' },
        { name: 'Jizz', img: 'images/jizz.png' },
        { name: "Uyg'ur Lagmon", img: "images/uyg'ur-lagmon.png" },
        { name: 'Tova-Manti', img: 'images/tova-manti.png' },
        { name: 'Kotleta po Kiyevski', img: 'images/Kotleta-po-Kiyevski.png' },
        { name: 'Chahonbili', img: 'images/Chahonbili.png' },
    ],
    iftorlik: [
        { name: 'Mastava', img: 'images/mastava.png' },
        { name: 'Moshxorda', img: 'images/moshxorda.png' },
        { name: "Qaynatma sho'rva", img: "images/qaynatma-sho'rva.png" },
        { name: 'Frikadelki', img: 'images/frikadelki.png' },
        { name: 'Chuchvara', img: 'images/chuchvara-2.png' },
        { name: 'Chechevitsa turkcha', img: 'images/chechevitsa-turkcha.png' },
        { name: 'Kuk-si', img: 'images/kuksi.png' },
        { name: "Lag'mon", img: "images/lag'mon.png" },
        { name: 'Dolma shorva', img: 'images/dolma-shorva.png' },
        { name: 'Somsa', img: 'images/somsa.png' },
        { name: 'OLOT Somsa', img: 'images/olot-somsa.png' },
        { name: 'Gumma', img: 'images/gumma.png' },
        { name: 'Moshkichir', img: 'images/moshkichir.png' },
        { name: 'Karam shorva', img: 'images/karam-shorva.png' },
        { name: 'Tuxum barak', img: 'images/tuxum-barak.png' },
        { name: 'Gulxonim', img: 'images/gulxonim.png' },
        { name: 'Dapanji', img: 'images/dapanji2.png' },
        { name: 'Qurtoba', img: 'images/qurtoba.png' },
        { name: 'Kavartak', img: 'images/kavartak.png' },
        { name: 'Uygur Lagmon', img: 'images/uygur-lagmon.png' },
        { name: 'Turk Menemeni', img: 'images/turk-menemeni.png' },
        { name: 'Golubci', img: 'images/golubci.png' },
        { name: 'Gan-Pan', img: 'images/gan-pan.png' },
        { name: 'Qovurma-Lagmon', img: 'images/qovurga-lagmon.png' },
        { name: 'Tok osh', img: 'images/tok-osh.png' },
    ],
    gazaklar: [
        { name: 'Achiq-chuchuk', img: 'images/acchiq-chuchuk.png' },
        { name: 'Bahor salat', img: 'images/bahor-salat.png' },
        { name: 'Svejiy salat', img: 'images/svejiy-salat.png' },
        { name: 'Olivia', img: 'images/olivia.png' },
        { name: 'Tovuqli sezar', img: 'images/tovuqli-sezar.png' },
        { name: "Suzma-ko'kat", img: "images/suzma-ko'kat.png" },
        { name: 'Loviya salat', img: 'images/loviya-salat.png' },
        { name: 'Turpli salat', img: 'images/turpli-salat.png' },
        { name: 'Vinegret', img: 'images/vinegret.png' },
        { name: 'Qizilcha', img: 'images/qizilcha.png' },
        { name: "Go'shtli salat", img: "images/go'shtli-salat.png" },
        { name: 'Amerikanskiy', img: 'images/amerikanskiy.png' },
        { name: 'Fransuzkiy', img: 'images/fransuzkiy.png' },
        { name: 'Grekcha salat', img: 'images/grekcha-salat.png' },
        { name: 'Kapriz', img: 'images/kapriz.png' },
    ],
};

const featuredImages = [
    'images/toshkent-osh.png',
    'images/andijon-osh.png',
];

let currentTab = 'saharlik';

function loadFoodScreen() {
    // Featured images
    const featuredEl = document.getElementById('featured-img');
    featuredEl.innerHTML = featuredImages.map(src =>
        `<img src="${src}" alt="Tavsiya" loading="eager">`
    ).join('');

    // Load default tab
    loadFoodGrid('saharlik');

    // Preload ALL images in background
    preloadAllImages();
}

function preloadAllImages() {
    const allImages = [
        ...foodData.saharlik,
        ...foodData.iftorlik,
        ...foodData.gazaklar,
    ];
    allImages.forEach(f => {
        const img = new Image();
        img.src = f.img;
    });
}

function loadFoodGrid(tab) {
    const grid = document.getElementById('food-grid');
    const items = foodData[tab] || [];
    grid.innerHTML = items.map(f => `
        <div class="food-card">
            <img src="${f.img}" alt="${f.name}" loading="eager">
            <div class="food-card-name">${f.name}</div>
        </div>
    `).join('');
}

function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    loadFoodGrid(tab);
}

// Reset app (temp)
function resetApp() {
    localStorage.clear();
    showScreen('screen-welcome');
}

// Check if user already registered
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('ramazon_user');
    if (saved) {
        showScreen('screen-main');
        loadFoodScreen();
    }
});
