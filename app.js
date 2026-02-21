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

// Name form validation
function validateNameForm() {
    const name = document.getElementById('name-input').value.trim();
    const btn = document.getElementById('btn-gender-next');
    btn.disabled = !(name.length >= 2);
}

// Finish onboarding
function finishOnboarding() {
    const name = document.getElementById('name-input').value.trim();

    // Save user data
    const userData = { name };
    localStorage.setItem('ramazon_user', JSON.stringify(userData));

    // Show greeting
    showGreeting(name);
}

// Route after greeting
function afterGreeting() {
    // Check if user already paid
    var saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
    if (saved.paid) {
        showScreen('screen-main');
        loadFoodScreen();
        setTimeout(function() { loadFoodGrid(currentTab); updateFeatured(currentTab); }, 100);
    } else {
        showScreen('screen-payment');
    }
}

// Copy card number
function copyCard() {
    var cardNum = '5614682115487631';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(cardNum);
    }
    var btn = document.querySelector('.btn-copy');
    if (btn) {
        btn.textContent = '✅';
        setTimeout(function() { btn.textContent = '📋'; }, 1500);
    }
}

// Check image file stored here
var checkFile = null;

// Preview uploaded check image
function previewCheck(input) {
    if (input.files && input.files[0]) {
        checkFile = input.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            var preview = document.getElementById('check-preview');
            var placeholder = document.getElementById('upload-placeholder');
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            document.getElementById('btn-confirm-payment').disabled = false;
        };
        reader.readAsDataURL(checkFile);
    }
}

// Confirm payment — send check photo + notification to admin
function confirmPayment() {
    if (!checkFile) return;

    var btn = document.getElementById('btn-confirm-payment');
    var status = document.getElementById('payment-status');
    btn.style.display = 'none';
    status.style.display = 'block';

    // Get user info from URL params (passed by bot) or Telegram WebApp
    var urlParams = new URLSearchParams(window.location.search);
    var user = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
    var userId = urlParams.get('uid') || user.id || 0;
    var firstName = user.first_name || '';
    var username = user.username ? '@' + user.username : "yo'q";

    var botToken = '7761508992:AAHXQqbG82100rNRa_M-2OWVmyfIH7B-UOY';
    var adminId = 5676160778;

    var caption = "🔔 Yangi to'lov so'rovi!\n\n" +
        "👤 Ism: " + firstName + "\n" +
        "🆔 ID: " + userId + "\n" +
        "📧 Username: " + username;

    var replyMarkup = JSON.stringify({
        inline_keyboard: [[
            { text: '✅ Tasdiqlash', callback_data: 'approve_' + userId },
            { text: '❌ Rad etish', callback_data: 'reject_' + userId }
        ]]
    });

    // Send check photo to admin with approve/reject buttons
    var formData = new FormData();
    formData.append('chat_id', adminId);
    formData.append('photo', checkFile);
    formData.append('caption', caption);
    formData.append('reply_markup', replyMarkup);

    fetch('https://api.telegram.org/bot' + botToken + '/sendPhoto', {
        method: 'POST',
        body: formData
    }).then(function() {
        // Start polling for admin approval
        startPaymentPolling(userId, botToken);
    }).catch(function(err) {
        console.error('Payment notify error:', err);
    });
}

// Poll every 3s — check if bot pinned "PAID_CONFIRMED" message
function startPaymentPolling(userId, botToken) {
    // First unpin any OLD pinned messages so we only detect NEW approval
    fetch('https://api.telegram.org/bot' + botToken + '/unpinAllChatMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: userId })
    }).then(function() {
        // Now start polling for new pin
        var pollTimer = setInterval(function() {
            fetch('https://api.telegram.org/bot' + botToken + '/getChat?chat_id=' + userId)
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data.ok && data.result && data.result.pinned_message &&
                        data.result.pinned_message.text === 'PAID_CONFIRMED') {
                        // Admin approved!
                        clearInterval(pollTimer);
                        var saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
                        saved.paid = true;
                        localStorage.setItem('ramazon_user', JSON.stringify(saved));

                        // Go to recipes
                        showScreen('screen-main');
                        loadFoodScreen();
                        setTimeout(function() { loadFoodGrid(currentTab); updateFeatured(currentTab); }, 100);
                    }
                }).catch(function() {});
        }, 3000);
    }).catch(function() {});
}


// Greeting screen
function showGreeting(name) {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('greeting-name').textContent = displayName;

    const greetings = [
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
        { name: 'Toshkent oshi', img: 'images/toshkent-oshi.jpg' },
        { name: 'Andijon oshi', img: 'images/andijon-osh.jpg' },
        { name: 'Dimlama', img: 'images/dimlama.jpg' },
        { name: 'Qazon Kabob', img: 'images/qazonkabob.jpg' },
        { name: 'Qovurdoq', img: 'images/qovurdoq.jpg' },
        { name: 'Norin', img: 'images/norin.jpg' },
        { name: 'Bifshteks', img: 'images/bifshteks.jpg' },
        { name: 'Manti', img: 'images/manti.jpg' },
        { name: 'Honim', img: 'images/Honim.jpg' },
        { name: 'Shovla', img: 'images/shovla.jpg' },
        { name: 'Chuchvara', img: 'images/chuchvara.jpg' },
        { name: 'Manpar', img: 'images/manpar.jpg' },
        { name: 'Befstroganov', img: 'images/befstroganov.jpg' },
        { name: 'Koza-kifta Dimlama', img: 'images/koza-kifta-dimlama.jpg' },
        { name: 'Zharkof', img: 'images/sharkof.jpg' },
        { name: 'Jizz', img: 'images/jizz.jpg' },
        { name: "Uyg'ur Lagmon", img: "images/uyg'ur-lagmon.jpg" },
        { name: 'Tova-Manti', img: 'images/tova-manti.jpg' },
        { name: 'Kotleta po Kiyevski', img: 'images/Kotleta-po-Kiyevski.jpg' },
        { name: 'Chahonbili', img: 'images/Chahonbili.jpg' },
    ],
    iftorlik: [
        { name: 'Mastava', img: 'images/mastava.jpg' },
        { name: 'Chechevitsa turkcha', img: 'images/chechevitsa-turkcha.jpg' },
        { name: "Qaynatma sho'rva", img: "images/qaynatma-sho'rva.jpg" },
        { name: 'Borsh', img: 'images/borsh.jpg' },
        { name: 'Kuk-si', img: 'images/kuksi.jpg' },
        { name: "Lag'mon", img: "images/lag'mon.jpg" },
        { name: 'Bulyonli Dolma', img: 'images/bulyonli-dolma.jpg' },
        { name: 'Somsa', img: 'images/somsa.jpg' },
        { name: 'OLOT Somsa', img: 'images/olot-somsa.jpg' },
        { name: 'Gumma', img: 'images/gumma.jpg' },
        { name: 'Moshkichir', img: 'images/moshkichir.jpg' },
        { name: 'Ukraincha Shi', img: 'images/ukraincha-shi.jpg' },
        { name: 'Tuxum barak', img: 'images/tuxum-barak.jpg' },
        { name: 'Qurtoba', img: 'images/qurtoba.jpg' },
        { name: 'Moshhorda', img: 'images/moshhorda.jpg' },
        { name: 'Turk Menemeni', img: 'images/turk-menemeni.jpg' },
        { name: 'Golubci', img: 'images/golubci.jpg' },
        { name: 'Gan-Pan', img: 'images/gan-pan.jpg' },
        { name: 'Qovurma-Lagmon', img: 'images/qovurga-lagmon.jpg' },
    ],
    gazaklar: [
        { name: 'Achiq-chuchuk', img: 'images/acchiq-chuchuk.jpg' },
        { name: 'Svejiy salat', img: 'images/svejiy-salat.jpg' },
        { name: 'Olivia', img: 'images/olivia.jpg' },
        { name: 'Tovuqli sezar', img: 'images/tovuqli-sezar.jpg' },
        { name: 'Suzma salat', img: 'images/suzma-salat.jpg' },
        { name: 'Toshkent', img: 'images/toshkent-salatlari.jpg' },
        { name: 'Qarsildoq Baqlajon', img: 'images/qarsildoq-baqlajon.jpg' },
        { name: 'Vinegret', img: 'images/vinegret.jpg' },
        { name: 'Horovatz', img: 'images/horovatz.jpg' },
        { name: 'Lazzat', img: 'images/lazzat.jpg' },
        { name: 'Amerikanskiy', img: 'images/amerikanskiy.jpg' },
        { name: 'Fransuzkiy', img: 'images/fransuzkiy.jpg' },
        { name: 'Grekcha salat', img: 'images/grekcha-salat.jpg' },
        { name: 'Kapriz', img: 'images/kapriz.jpg' },
        { name: 'Humus', img: 'images/humus.jpg' },
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
    featuredEl.innerHTML = '<img src="' + items[idx].img + '?v=5" alt="' + items[idx].name + '">';
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
    var all = [].concat(foodData.saharlik, foodData.iftorlik, foodData.gazaklar);
    for (var i = 0; i < all.length; i++) {
        var img = new Image();
        img.src = all[i].img + '?v=5';
    }
    // Pre-build grid caches so tab switching is instant
    gridCache['saharlik'] = buildFoodGrid('saharlik');
    gridCache['iftorlik'] = buildFoodGrid('iftorlik');
    gridCache['gazaklar'] = buildFoodGrid('gazaklar');
}

// Cache built grids so switching tabs is instant
var gridCache = {};

function buildFoodGrid(tab) {
    var items = foodData[tab] || [];
    var html = '';
    for (var i = 0; i < items.length; i++) {
        html += '<div class="food-card" data-name="' + items[i].name.replace(/"/g, '&quot;') + '" data-img="' + items[i].img.replace(/"/g, '&quot;') + '">';
        html += '<img src="' + items[i].img + '?v=5" alt="' + items[i].name + '"' + (i >= 4 ? ' loading="lazy"' : '') + '>';
        html += '<div class="food-card-name">' + items[i].name + '</div>';
        html += '</div>';
    }
    return html;
}

function loadFoodGrid(tab) {
    var grid = document.getElementById('food-grid');
    if (!grid) return;
    if (!gridCache[tab]) {
        gridCache[tab] = buildFoodGrid(tab);
    }
    grid.innerHTML = gridCache[tab];
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
    document.getElementById('recipe-img').src = img + '?v=5';
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

    // Check if opened with ?paid=true (admin approved)
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('paid') === 'true') {
        var saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
        saved.paid = true;
        localStorage.setItem('ramazon_user', JSON.stringify(saved));
    }

    var saved = JSON.parse(localStorage.getItem('ramazon_user') || '{}');
    if (saved.name && saved.paid) {
        // Returning paid user — go straight to recipes
        showScreen('screen-main');
        loadFoodScreen();
    } else if (saved.name && !saved.paid) {
        // Has name but not paid — show payment
        showScreen('screen-payment');
    }
    // else: new user — stays on welcome screen
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
