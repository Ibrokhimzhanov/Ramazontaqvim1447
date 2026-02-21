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
    if (screenId === 'screen-main') {
        // Ensure food grid is populated
        var grid = document.getElementById('food-grid');
        if (grid && grid.children.length === 0) {
            loadFoodGrid(currentTab);
            updateFeatured(currentTab);
        }
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
        loadFoodScreen();
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
        { name: 'Toshkent oshi', img: 'images/toshkent-oshi.png' },
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
        { name: 'Chechevitsa turkcha', img: 'images/chechevitsa-turkcha.png' },
        { name: "Qaynatma sho'rva", img: "images/qaynatma-sho'rva.png" },
        { name: 'Borsh', img: 'images/borsh.png' },
        { name: 'Kuk-si', img: 'images/kuksi.png' },
        { name: "Lag'mon", img: "images/lag'mon.png" },
        { name: 'Bulyonli Dolma', img: 'images/bulyonli-dolma.png' },
        { name: 'Somsa', img: 'images/somsa.png' },
        { name: 'OLOT Somsa', img: 'images/olot-somsa.png' },
        { name: 'Gumma', img: 'images/gumma.png' },
        { name: 'Moshkichir', img: 'images/moshkichir.png' },
        { name: 'Ukraincha Shi', img: 'images/ukraincha-shi.png' },
        { name: 'Tuxum barak', img: 'images/tuxum-barak.png' },
        { name: 'Qurtoba', img: 'images/qurtoba.png' },
        { name: 'Moshhorda', img: 'images/moshhorda.png' },
        { name: 'Turk Menemeni', img: 'images/turk-menemeni.png' },
        { name: 'Golubci', img: 'images/golubci.png' },
        { name: 'Gan-Pan', img: 'images/gan-pan.png' },
        { name: 'Qovurma-Lagmon', img: 'images/qovurga-lagmon.png' },
    ],
    gazaklar: [
        { name: 'Achiq-chuchuk', img: 'images/acchiq-chuchuk.png' },
        { name: 'Svejiy salat', img: 'images/svejiy-salat.png' },
        { name: 'Olivia', img: 'images/olivia.png' },
        { name: 'Tovuqli sezar', img: 'images/tovuqli-sezar.png' },
        { name: 'Suzma salat', img: 'images/suzma-salat.png' },
        { name: 'Toshkent salatlari', img: 'images/toshkent-salatlari.png' },
        { name: 'Qarsildoq Baqlajon', img: 'images/qarsildoq-baqlajon.png' },
        { name: 'Vinegret', img: 'images/vinegret.png' },
        { name: 'Horovatz', img: 'images/horovatz.png' },
        { name: 'Lazzat', img: 'images/lazzat.png' },
        { name: 'Amerikanskiy', img: 'images/amerikanskiy.png' },
        { name: 'Fransuzkiy', img: 'images/fransuzkiy.png' },
        { name: 'Grekcha salat', img: 'images/grekcha-salat.png' },
        { name: 'Kapriz', img: 'images/kapriz.png' },
        { name: 'Humus', img: 'images/humus.png' },
    ],
};

let currentTab = 'saharlik';

function getDayIndex() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function updateFeatured(tab) {
    var featuredEl = document.getElementById('featured-img');
    if (!featuredEl) return;
    var items = foodData[tab] || [];
    if (items.length === 0) return;
    var day = getDayIndex();
    var idx = day % items.length;
    featuredEl.setAttribute('data-name', items[idx].name);
    featuredEl.setAttribute('data-img', items[idx].img);
    featuredEl.style.cursor = 'pointer';
    featuredEl.innerHTML = '<img src="' + items[idx].img + '?v=4" alt="' + items[idx].name + '">';
}

function loadFoodScreen() {
    // Featured based on current tab and day
    updateFeatured('saharlik');

    // Load default tab with retry
    loadFoodGrid('saharlik');
    setTimeout(function() { loadFoodGrid('saharlik'); }, 300);
    setTimeout(function() { loadFoodGrid('saharlik'); }, 800);

    // Preload other tab images in background
    setTimeout(preloadAllImages, 2000);
}

function preloadAllImages() {
    var all = [].concat(foodData.iftorlik, foodData.gazaklar);
    for (var i = 0; i < all.length; i++) {
        var img = new Image();
        img.src = all[i].img + '?v=4';
    }
}

function loadFoodGrid(tab) {
    var grid = document.getElementById('food-grid');
    if (!grid) return;
    var items = foodData[tab] || [];
    var html = '';
    for (var i = 0; i < items.length; i++) {
        html += '<div class="food-card" data-name="' + items[i].name.replace(/"/g, '&quot;') + '" data-img="' + items[i].img.replace(/"/g, '&quot;') + '">';
        html += '<img src="' + items[i].img + '?v=4" alt="' + items[i].name + '">';
        html += '<div class="food-card-name">' + items[i].name + '</div>';
        html += '</div>';
    }
    grid.innerHTML = html;
}

function switchTab(tab, btn) {
    currentTab = tab;
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
    btn.classList.add('active');
    loadFoodGrid(tab);
    updateFeatured(tab);
}

// Recipes loaded from recipes-data.js

// Open recipe screen
function openRecipe(name, img) {
    var screen = document.getElementById('screen-recipe');
    document.getElementById('recipe-img').src = img + '?v=4';
    document.getElementById('recipe-title').textContent = name + 'ni tayyorlash uslubi';

    var recipe = recipes[name];
    var ingredientHtml = '';
    var stepsHtml = '';

    if (recipe) {
        for (var i = 0; i < recipe.ingredients.length; i++) {
            var ing = recipe.ingredients[i];
            if (ing.section) {
                ingredientHtml += '<div class="ingredient-section-header">' + ing.section + '</div>';
            } else {
                ingredientHtml += '<div class="ingredient-row">';
                ingredientHtml += '<span class="ingredient-name">' + ing.name + '</span>';
                ingredientHtml += '<span class="ingredient-amount">' + (ing.amount || '') + '</span>';
                ingredientHtml += '</div>';
            }
        }
        var stepNum = 1;
        for (var j = 0; j < recipe.steps.length; j++) {
            stepsHtml += '<div class="step-card">';
            stepsHtml += '<div class="step-number">' + stepNum + '</div>';
            stepsHtml += '<div class="step-text">' + recipe.steps[j] + '</div>';
            stepsHtml += '</div>';
            stepNum++;
        }
    } else {
        ingredientHtml = '<div class="ingredient-row"><span class="ingredient-name">Retsept tez orada qo\'shiladi</span><span class="ingredient-amount"></span></div>';
        stepsHtml = '<div class="step-card"><div class="step-number">1</div><div class="step-text">Bu taom uchun retsept tayyorlanmoqda.</div></div>';
    }

    document.getElementById('ingredient-list').innerHTML = ingredientHtml;
    document.getElementById('steps-list').innerHTML = stepsHtml;

    // Show recipe as overlay
    screen.style.display = 'block';
    screen.scrollTop = 0;
}

// Close recipe screen
function closeRecipe() {
    document.getElementById('screen-recipe').style.display = 'none';
}

// Show Yoqimli Ishtaha screen
function showYoqimliIshtaha() {
    document.getElementById('screen-recipe').style.display = 'none';
    document.getElementById('screen-yoqimli').style.display = 'block';
}

// Close Yoqimli Ishtaha and go back to main
function closeYoqimliIshtaha() {
    document.getElementById('screen-yoqimli').style.display = 'none';
}

// Reset app (temp)
function resetApp() {
    localStorage.clear();
    location.reload();
}

// Try loading at multiple points to ensure it works
document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', initApp);

var appInitialized = false;
function initApp() {
    if (appInitialized) return;
    appInitialized = true;

    // Attach click handlers via event delegation (works with cached HTML too)
    setupFoodClickHandlers();

    var saved = localStorage.getItem('ramazon_user');
    if (saved) {
        showScreen('screen-main');
        loadFoodScreen();
    }
}

function setupFoodClickHandlers() {
    // Click on food grid cards
    var grid = document.getElementById('food-grid');
    if (grid) {
        grid.addEventListener('click', function(e) {
            var card = e.target.closest('.food-card');
            if (!card) return;

            // Get name from data attribute or from card text
            var name = card.getAttribute('data-name');
            var img = card.getAttribute('data-img');

            // Fallback: read from card content (for cached HTML without data attributes)
            if (!name) {
                var nameEl = card.querySelector('.food-card-name');
                var imgEl = card.querySelector('img');
                if (nameEl) name = nameEl.textContent.trim();
                if (imgEl) img = imgEl.getAttribute('src');
            }

            if (name && img) {
                openRecipe(name, img);
            }
        });
    }

    // Click on featured card
    var featured = document.getElementById('featured-img');
    if (featured) {
        featured.addEventListener('click', function() {
            var name = featured.getAttribute('data-name');
            var img = featured.getAttribute('data-img');

            // Fallback: find from current tab data
            if (!name) {
                var items = foodData[currentTab] || [];
                if (items.length > 0) {
                    var idx = getDayIndex() % items.length;
                    name = items[idx].name;
                    img = items[idx].img;
                }
            }

            if (name && img) {
                openRecipe(name, img);
            }
        });
    }
}
