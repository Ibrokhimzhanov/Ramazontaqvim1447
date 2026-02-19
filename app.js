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
        { name: 'Chechevitsa turkcha', img: 'images/chechevitsa-turkcha.png' },
        { name: "Qaynatma sho'rva", img: "images/qaynatma-sho'rva.png" },
        { name: 'Frikadelki', img: 'images/frikadelki.png' },
        { name: 'Kuk-si', img: 'images/kuksi.png' },
        { name: "Lag'mon", img: "images/lag'mon.png" },
        { name: 'Dolma shorva', img: 'images/dolma-shorva.png' },
        { name: 'Somsa', img: 'images/somsa.png' },
        { name: 'OLOT Somsa', img: 'images/olot-somsa.png' },
        { name: 'Gumma', img: 'images/gumma.png' },
        { name: 'Moshkichir', img: 'images/moshkichir.png' },
        { name: 'Karam shorva', img: 'images/karam-shorva.png' },
        { name: 'Tuxum barak', img: 'images/tuxum-barak.png' },
        { name: 'Kavartak', img: 'images/kavartak.png' },
        { name: 'Qurtoba', img: 'images/qurtoba.png' },
        { name: 'Moshhorda', img: 'images/moshhorda.png' },
        { name: 'Turk Menemeni', img: 'images/turk-menemeni.png' },
        { name: 'Golubci', img: 'images/golubci.png' },
        { name: 'Gan-Pan', img: 'images/gan-pan.png' },
        { name: 'Qovurma-Lagmon', img: 'images/qovurga-lagmon.png' },
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
    featuredEl.innerHTML = '<img src="' + items[idx].img + '" alt="' + items[idx].name + '">';
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
        img.src = all[i].img;
    }
}

function loadFoodGrid(tab) {
    var grid = document.getElementById('food-grid');
    if (!grid) return;
    var items = foodData[tab] || [];
    var html = '';
    for (var i = 0; i < items.length; i++) {
        html += '<div class="food-card" data-name="' + items[i].name.replace(/"/g, '&quot;') + '" data-img="' + items[i].img.replace(/"/g, '&quot;') + '">';
        html += '<img src="' + items[i].img + '" alt="' + items[i].name + '">';
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

// ========== Recipe Data ==========
const recipes = {
    'Toshkent oshi': {
        ingredients: [
            { name: 'Guruch', amount: '700 g' },
            { name: "Mol go'shti", amount: '500 g' },
            { name: 'Sabzi', amount: '500 g' },
            { name: "Piyoz", amount: '3 dona' },
            { name: "O'simlik yog'i", amount: '200 ml' },
            { name: 'Tuz', amount: "ta'bga" },
            { name: 'Zira', amount: '1 osh qoshiq' },
            { name: 'Sariq sabzi', amount: '100 g' },
            { name: 'Tuxum', amount: '3 dona' },
        ],
        steps: [
            "Qozonga yog' solib qizdiramiz. Piyozni halqasimon to'g'rab qovuramiz.",
            "Go'shtni yirik bo'laklarga bo'lib qo'shamiz va oltin rangga kelguncha qovuramiz.",
            "Sabzini yirik qilib to'g'rab qo'shamiz, 5 daqiqa qovuramiz.",
            "Suv quyamiz (guruchdan 2 barmoq baland), tuz va zira solamiz. 40 daqiqa qaynatamiz.",
            "Guruchni yuvib, zirvakning ustiga tekis qilib solamiz.",
            "O'rtacha olovda guruch suvni shimguncha pishamiz, keyin yig'ib 30 daqiqa dam beramiz.",
            "Tuxumni qaynatib, to'g'rab ustiga bezak qilamiz. Oshni lagan bilan ag'darib suzamiz.",
        ],
    },
    'Andijon oshi': {
        ingredients: [
            { name: 'Guruch (devzira)', amount: '700 g' },
            { name: "Mol go'shti", amount: '500 g' },
            { name: 'Sabzi', amount: '400 g' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: "O'simlik yog'i", amount: '150 ml' },
            { name: 'Tuz', amount: "ta'bga" },
            { name: 'Zira', amount: '1 osh qoshiq' },
        ],
        steps: [
            "Qozonga yog' solib qizdiramiz, piyozni to'g'rab qovuramiz.",
            "Go'shtni solib, oltin rangga kelguncha qovuramiz.",
            "Sabzini ingichka qilib to'g'rab qo'shamiz.",
            "Suv, tuz, zira qo'shib 30 daqiqa qaynatamiz.",
            "Guruchni yuvib ustiga solamiz, past olovda pishamiz.",
            "Guruch tayyor bo'lgach yig'ib 20 daqiqa dam beramiz.",
        ],
    },
    'Dimlama': {
        ingredients: [
            { name: "Mol go'shti", amount: '700 g' },
            { name: 'Kartoshka', amount: '500 g' },
            { name: 'Sabzi', amount: '300 g' },
            { name: 'Karam', amount: '300 g' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: 'Pomidor', amount: '3 dona' },
            { name: 'Bolgar qalampiri', amount: '2 dona' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Qozonning tubiga yog' surkaymiz. Go'shtni yirik bo'lib solamiz.",
            "Ustiga piyoz halqalarini qo'shamiz.",
            "Sabzi, kartoshka, karam, pomidor, qalampirni qatlam-qatlam qilib teramiz.",
            "Tuz va zira sepamiz. Ozgina suv qo'shamiz.",
            "Qopqog'ini mahkam yopib, past olovda 2-2.5 soat dimlaymiz.",
            "Tayyor bo'lgach, aralashtirib suzamiz.",
        ],
    },
    'Qazon Kabob': {
        ingredients: [
            { name: "Mol go'shti", amount: '1 kg' },
            { name: 'Piyoz', amount: '4 dona' },
            { name: 'Kartoshka', amount: '500 g' },
            { name: "O'simlik yog'i", amount: '100 ml' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni yirik bo'laklarga to'g'raymiz.",
            "Qozonga yog' solib, go'shtni qovuramiz.",
            "Piyozni halqa qilib solamiz, birga qovuramiz.",
            "Suv qo'shib, 1 soat past olovda pishamiz.",
            "Kartoshkani yirik to'g'rab ustiga solamiz.",
            "Yana 30 daqiqa dimlab pishamiz.",
        ],
    },
    'Qovurdoq': {
        ingredients: [
            { name: "Go'sht", amount: '500 g' },
            { name: 'Kartoshka', amount: '400 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: "O'simlik yog'i", amount: '100 ml' },
            { name: 'Tuz, qalampir', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni mayda bo'laklarga to'g'raymiz.",
            "Qozonga yog' solib go'shtni qovuramiz.",
            "Piyozni to'g'rab qo'shamiz.",
            "Kartoshkani kubik qilib to'g'rab solamiz.",
            "Tuz, qalampir sepib, aralashtirib 20 daqiqa qovuramiz.",
        ],
    },
    'Norin': {
        ingredients: [
            { name: "Ot go'shti", amount: '500 g' },
            { name: 'Xamir (tagliatelle)', amount: '400 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni butunligicha suvda qaynatamiz (1.5 soat).",
            "Xamirni yupqa yoyib, kesib qaynatamiz.",
            "Go'shtni maydalab, xamir bilan aralashtiramiz.",
            "Piyozni to'g'rab ustiga sepamiz. Qa'ynatmadan oz-oz qo'shib suzamiz.",
        ],
    },
    'Manti': {
        ingredients: [
            { name: 'Un', amount: '500 g' },
            { name: "Mol go'shti", amount: '400 g' },
            { name: 'Piyoz', amount: '4 dona' },
            { name: "Dumba yog'i", amount: '100 g' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Undan xamir tayyorlaymiz, 30 daqiqa dam beramiz.",
            "Go'sht va piyozni maydalab, tuz, zira qo'shib qiyma tayyorlaymiz.",
            "Xamirni yoyib, to'rtburchak qilib kesamiz.",
            "Har biriga qiyma solib, manti shaklida o'raymiz.",
            "Bug'da 45 daqiqa pishamiz.",
        ],
    },
    'Honim': {
        ingredients: [
            { name: 'Un', amount: '400 g' },
            { name: 'Kartoshka', amount: '500 g' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: "Go'sht qiymasi", amount: '300 g' },
            { name: 'Tuz', amount: "ta'bga" },
        ],
        steps: [
            "Xamir tayyorlab, yupqa yoyamiz.",
            "Kartoshka va piyozni to'g'rab, qiyma bilan aralashtiramiz.",
            "Xamir ustiga qiymani yoyib, rulet shaklida o'raymiz.",
            "Bug'da 40 daqiqa pishamiz.",
            "Bo'laklarga kesib suzamiz.",
        ],
    },
    'Shovla': {
        ingredients: [
            { name: 'Guruch', amount: '400 g' },
            { name: "Go'sht", amount: '400 g' },
            { name: 'Sabzi', amount: '200 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni to'g'rab, yog'da qovuramiz.",
            "Piyoz va sabzini qo'shamiz.",
            "Suv quyib qaynatamiz.",
            "Guruchni yuvib solamiz.",
            "Suyuqroq qilib, sho'rva holatida pishamiz.",
        ],
    },
    'Chuchvara': {
        ingredients: [
            { name: 'Un', amount: '400 g' },
            { name: "Go'sht qiymasi", amount: '300 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Undan qattiq xamir tayyorlaymiz.",
            "Go'sht va piyozdan qiyma tayyorlaymiz.",
            "Xamirni yupqa yoyib, kichik doira qilib kesamiz.",
            "Har biriga oz qiyma solib, uchburchak shaklida yopamiz.",
            "Qaynagan suvda 7-10 daqiqa qaynatamiz.",
        ],
    },
    'Bifshteks': {
        ingredients: [
            { name: "Mol go'shti (file)", amount: '400 g' },
            { name: "Sariyog'", amount: '50 g' },
            { name: 'Tuz, qora murch', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni 2 sm qalinlikda kesamiz.",
            "Tuz va murch sepamiz.",
            "Sariyog'ni eritib, kuchli olovda har tomonini 3 daqiqadan qovuramiz.",
            "5 daqiqa dam berib suzamiz.",
        ],
    },
    'Manpar': {
        ingredients: [
            { name: 'Un', amount: '300 g' },
            { name: "Go'sht", amount: '300 g' },
            { name: 'Kartoshka', amount: '200 g' },
            { name: 'Pomidor', amount: '2 dona' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz', amount: "ta'bga" },
        ],
        steps: [
            "Xamir tayyorlab, kichik bo'laklarga uzamiz.",
            "Go'shtni to'g'rab qovuramiz, sabzavotlarni qo'shamiz.",
            "Suv quyib sho'rva qaynatamiz.",
            "Xamir bo'laklarini sho'rvaga solib 10 daqiqa pishamiz.",
        ],
    },
    'Befstroganov': {
        ingredients: [
            { name: "Mol go'shti", amount: '500 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Smetana', amount: '200 g' },
            { name: 'Un', amount: '1 osh qoshiq' },
            { name: "Sariyog'", amount: '50 g' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni ingichka uzun bo'laklarga to'g'raymiz.",
            "Sariyog'da kuchli olovda qovuramiz.",
            "Piyozni to'g'rab qo'shamiz.",
            "Un sepib aralashtiramiz, smetana qo'shamiz.",
            "Past olovda 15 daqiqa pishamiz.",
        ],
    },
    'Koza-kifta Dimlama': {
        ingredients: [
            { name: "Go'sht qiymasi", amount: '500 g' },
            { name: 'Kartoshka', amount: '500 g' },
            { name: 'Pomidor', amount: '3 dona' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Qiymadan koptokcha shaklida kiftalar yasaymiz.",
            "Qozon tubiga piyoz, pomidor teramiz.",
            "Kiftalarni ustiga joylashtiramiz.",
            "Kartoshkani qo'shib, tuz sepamiz.",
            "Past olovda 1.5 soat dimlaymiz.",
        ],
    },
    'Zharkof': {
        ingredients: [
            { name: "Mol go'shti", amount: '500 g' },
            { name: 'Kartoshka', amount: '500 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Pomidor pastasi', amount: '2 osh qoshiq' },
            { name: 'Tuz, dafna bargi', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni bo'laklarga to'g'rab qovuramiz.",
            "Piyozni qo'shib, birga qovuramiz.",
            "Pomidor pastasi va suv qo'shamiz.",
            "Kartoshkani yirik to'g'rab solamiz.",
            "Past olovda 1 soat dimlaymiz.",
        ],
    },
    'Jizz': {
        ingredients: [
            { name: "Qo'y go'shti", amount: '500 g' },
            { name: "Dumba yog'i", amount: '200 g' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: 'Tuz', amount: "ta'bga" },
        ],
        steps: [
            "Dumba yog'ini eritamiz.",
            "Go'shtni mayda to'g'rab, qizigan yog'da qovuramiz.",
            "Piyozni halqa qilib qo'shamiz.",
            "Tuz sepib, qarsillagunicha qovuramiz.",
        ],
    },
    "Uyg'ur Lagmon": {
        ingredients: [
            { name: 'Lagmon xamiri', amount: '400 g' },
            { name: "Go'sht", amount: '300 g' },
            { name: 'Sabzi', amount: '200 g' },
            { name: 'Bolgar qalampiri', amount: '2 dona' },
            { name: 'Pomidor', amount: '2 dona' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Xamirni tayyorlab, cho'zib yoki qo'lda tortib lagmon yasaymiz.",
            "Go'shtni to'g'rab qovuramiz.",
            "Sabzavotlarni qo'shib vayjini tayyorlaymiz.",
            "Lagmonni qaynatib, vayjini ustiga quyamiz.",
        ],
    },
    'Tova-Manti': {
        ingredients: [
            { name: 'Un', amount: '500 g' },
            { name: "Go'sht qiymasi", amount: '400 g' },
            { name: 'Piyoz', amount: '4 dona' },
            { name: "O'simlik yog'i", amount: '100 ml' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Mantilarni odatdagidek tayyorlaymiz.",
            "Tovaga yog' solib qizdiramiz.",
            "Mantilarni tovaga terib, tubini qizartiramiz.",
            "Ozgina suv quyib, qopqog'ini yopib 20 daqiqa pishamiz.",
        ],
    },
    'Kotleta po Kiyevski': {
        ingredients: [
            { name: "Tovuq filesi", amount: '4 dona' },
            { name: "Sariyog'", amount: '100 g' },
            { name: 'Un', amount: '100 g' },
            { name: 'Tuxum', amount: '2 dona' },
            { name: 'Non uvog\'i', amount: '150 g' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Fileni ochib, yupqalab uramiz. Ichiga sariyog' bo'lagini solamiz.",
            "Rulet shaklida o'rab, sovutgichda 30 daqiqa ushlab turamiz.",
            "Un, tuxum, non uvog'iga aylantrib qovuramiz.",
            "Yog'da chuqur qovuramiz yoki 180°C pechda 25 daqiqa pishamiz.",
        ],
    },
    'Chahonbili': {
        ingredients: [
            { name: 'Tovuq', amount: '1 kg' },
            { name: 'Pomidor', amount: '5 dona' },
            { name: 'Piyoz', amount: '3 dona' },
            { name: "Sarimsoq", amount: '4 bo\'lak' },
            { name: "Ko'katlar", amount: 'bir tutam' },
            { name: 'Tuz, murch', amount: "ta'bga" },
        ],
        steps: [
            "Tovuqni bo'laklarga bo'lib qovuramiz.",
            "Piyozni to'g'rab qo'shamiz.",
            "Pomidorni maydalab solamiz.",
            "Tuz, murch, sarimsoq qo'shib 30 daqiqa past olovda pishamiz.",
            "Ko'katlar sepib suzamiz.",
        ],
    },
    // Iftorlik recipes
    'Mastava': {
        ingredients: [
            { name: "Go'sht", amount: '400 g' },
            { name: 'Guruch', amount: '150 g' },
            { name: 'Sabzi', amount: '200 g' },
            { name: 'Kartoshka', amount: '200 g' },
            { name: 'Pomidor', amount: '2 dona' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Go'shtni bo'laklarga to'g'rab qaynatamiz.",
            "Piyoz va sabzini to'g'rab qo'shamiz.",
            "Kartoshka va pomidorni qo'shamiz.",
            "Guruchni yuvib solamiz.",
            "Past olovda 40 daqiqa pishamiz. Suzma bilan suzamiz.",
        ],
    },
    'Somsa': {
        ingredients: [
            { name: 'Un', amount: '500 g' },
            { name: "Go'sht", amount: '400 g' },
            { name: 'Piyoz', amount: '5 dona' },
            { name: "Dumba yog'i", amount: '100 g' },
            { name: 'Tuz, zira', amount: "ta'bga" },
        ],
        steps: [
            "Undan qatlamali xamir tayyorlaymiz.",
            "Go'sht, piyoz va yog'dan qiyma tayyorlaymiz.",
            "Xamirni yoyib, qiyma solib somsalarni yasaymiz.",
            "Tandirda yoki 200°C pechda 25-30 daqiqa pishamiz.",
        ],
    },
    "Lag'mon": {
        ingredients: [
            { name: 'Lagmon xamiri', amount: '400 g' },
            { name: "Go'sht", amount: '300 g' },
            { name: 'Sabzi, turp', amount: '200 g' },
            { name: 'Bolgar qalampiri', amount: '2 dona' },
            { name: 'Pomidor', amount: '2 dona' },
            { name: 'Piyoz', amount: '2 dona' },
        ],
        steps: [
            "Go'shtni to'g'rab qovuramiz.",
            "Sabzavotlarni qo'shib vayjini tayyorlaymiz.",
            "Suv quyib sho'rva qaynatamiz.",
            "Lagmon xamirini cho'zib qaynatamiz.",
            "Lagmon ustiga vayji quyib suzamiz.",
        ],
    },
    'Moshkichir': {
        ingredients: [
            { name: 'Mosh', amount: '300 g' },
            { name: 'Guruch', amount: '200 g' },
            { name: "Go'sht", amount: '300 g' },
            { name: 'Sabzi', amount: '200 g' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: "O'simlik yog'i", amount: '100 ml' },
        ],
        steps: [
            "Go'shtni to'g'rab, yog'da qovuramiz.",
            "Piyoz va sabzini qo'shamiz.",
            "Moshni yuvib solamiz, suv quyamiz.",
            "30 daqiqadan so'ng guruchni qo'shamiz.",
            "Past olovda tayyor bo'lguncha pishamiz.",
        ],
    },
    // Gazaklar
    'Achiq-chuchuk': {
        ingredients: [
            { name: 'Pomidor', amount: '4 dona' },
            { name: 'Piyoz', amount: '2 dona' },
            { name: 'Achchiq qalampir', amount: '1 dona' },
            { name: 'Tuz', amount: "ta'bga" },
        ],
        steps: [
            "Pomidorni yarim halqa qilib to'g'raymiz.",
            "Piyozni ingichka halqalarga to'g'raymiz.",
            "Achchiq qalampirni mayda to'g'raymiz.",
            "Hammasini aralashtirib, tuz sepamiz.",
        ],
    },
    'Olivia': {
        ingredients: [
            { name: 'Kartoshka', amount: '3 dona' },
            { name: "Qaynatilgan go'sht", amount: '200 g' },
            { name: 'Tuxum', amount: '3 dona' },
            { name: "Bodring (tuzlangan)", amount: '3 dona' },
            { name: "Ko'k no'xat", amount: '200 g' },
            { name: 'Mayanez', amount: '150 g' },
            { name: 'Tuz', amount: "ta'bga" },
        ],
        steps: [
            "Kartoshka va tuxumni qaynatib, kubik qilib to'g'raymiz.",
            "Go'sht va bodringni kubik qilib to'g'raymiz.",
            "Hammasini idishga solib, no'xatni qo'shamiz.",
            "Mayanez va tuz bilan aralashtiramiz.",
        ],
    },
};

// Open recipe screen
function openRecipe(name, img) {
    var screen = document.getElementById('screen-recipe');
    document.getElementById('recipe-img').src = img;
    document.getElementById('recipe-title').textContent = name + 'ni tayyorlash uslubi';

    var recipe = recipes[name];
    var ingredientHtml = '';
    var stepsHtml = '';

    if (recipe) {
        for (var i = 0; i < recipe.ingredients.length; i++) {
            var ing = recipe.ingredients[i];
            ingredientHtml += '<div class="ingredient-row">';
            ingredientHtml += '<span class="ingredient-name">' + ing.name + '</span>';
            ingredientHtml += '<span class="ingredient-amount">' + ing.amount + '</span>';
            ingredientHtml += '</div>';
        }
        for (var j = 0; j < recipe.steps.length; j++) {
            stepsHtml += '<div class="step-card">';
            stepsHtml += '<div class="step-number">' + (j + 1) + '</div>';
            stepsHtml += '<div class="step-text">' + recipe.steps[j] + '</div>';
            stepsHtml += '</div>';
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
