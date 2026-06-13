// --- BUBBLE / BULUT SUNUCU LİNKLERİ ---
// Vercel Blob linklerini aldığında buradaki tırnak içindeki alanlara yapıştırabilirsin.
const videoURLS = {
    ucak: "https://archive.org/download/ship_20260613/plane.mp4",
    otobus: "https://archive.org/download/ship_20260613/bus.mp4",
    gemi: "https://yzf5f5l1r2ucb6g4.public.blob.vercel-storage.com/gemi.mp4"
};

const rotalar = {
    kara: ["İstanbul - Ankara", "Ankara - İzmir", "Bursa - Antalya", "İstanbul - Sofya", "İzmir - Çanakkale", "Eskişehir - Bolu"],
    deniz: ["İstanbul - Atina", "İzmir - Selanik", "Marmaris - Rodos", "İstanbul - Odessa", "Venedik - Dubrovnik", "Mersin - Girne"],
    hava: ["Paris - Roma", "İstanbul - Londra", "Tokyo - Seul", "New York - Boston", "Berlin - Amsterdam", "Kahire - Dubai"]
};

let seciliArac = 'ucak';
let seciliSure = 3; 
let seciliBilet = null;
let kalanSaniye = 0;
let zamanlayici = null;
let molaModu = false;
let yolculukAktif = false;

window.onload = () => {
    generateTickets();
    setupFullscreenInterceptors();
};

function changeVehicle(type, e) {
    seciliArac = type;
    seciliBilet = null;
    document.getElementById('start-journey-btn').disabled = true;

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const basliklar = { ucak: "Uçak Bileti Rezervasyonu", otobus: "Otobüs Bileti Rezervasyonu", gemi: "Deniz Yolculuğu Rezervasyonu" };
    document.getElementById('form-title').innerText = basliklar[type];

    generateTickets();
}

function updateDuration(val) {
    seciliSure = parseInt(val);
    document.getElementById('duration-val').innerText = val;
    seciliBilet = null;
    document.getElementById('start-journey-btn').disabled = true;
    generateTickets();
}

function generateTickets() {
    const container = document.getElementById('tickets-container');
    container.innerHTML = "";

    let havuz = seciliArac === 'ucak' ? rotalar.hava : (seciliArac === 'otobus' ? rotalar.kara : rotalar.deniz);
    let karisikHavuz = [...havuz].sort(() => 0.5 - Math.random());

    for(let i = 0; i < Math.min(2, karisikHavuz.length); i++) {
        const biletId = i;
        const firmaAdi = seciliArac.toUpperCase() + " Lines - " + Math.floor(Math.random() * 900 + 100);
        const fiyat = (seciliSure * 140) + Math.floor(Math.random() * 80);

        const kart = document.createElement('div');
        kart.className = 'ticket-card';
        kart.onclick = () => selectTicket(kart, biletId, karisikHavuz[i]);
        kart.innerHTML = `
            <h4>${karisikHavuz[i]}</h4>
            <p style="font-size:14px; color:#666;">Firma: ${firmaAdi}</p>
            <p style="margin-top:10px; font-weight:bold; color: #2ecc71;">Süre: ${seciliSure} Saat</p>
            <p style="position:absolute; right:15px; bottom:15px; font-weight:bold; font-size:18px;">${fiyat} TL</p>
        `;
        container.appendChild(kart);
    }
}

function selectTicket(element, id, rota) {
    const kartlar = document.querySelectorAll('.ticket-card');
    kartlar.forEach(k => k.classList.remove('selected'));
    element.classList.add('selected');
    
    seciliBilet = { id, rota };
    document.getElementById('start-journey-btn').disabled = false;
}

function startJourney() {
    yolculukAktif = true;
    molaModu = false;
    
    const overlay = document.getElementById('simulation-overlay');
    const video = document.getElementById('sim-video');
    
    kalanSaniye = seciliSure * 3600; 
    updateTimerDisplay();

    overlay.style.display = 'block';
    
    video.src = videoURLS[seciliArac];
    video.load();

    forceFullscreen(overlay);
    
    setTimeout(() => {
        video.play().catch(err => {
            console.log("Uzak sunucu akışı başlatılıyor...");
            video.muted = true;
            video.play();
        });
    }, 300);

    if(zamanlayici) clearInterval(zamanlayici);
    zamanlayici = setInterval(countdown, 1000);
}

function countdown() {
    if (!molaModu && yolculukAktif) {
        kalanSaniye--;
        updateTimerDisplay();

        if (kalanSaniye <= 0) {
            endJourney();
        }
    }
}

function updateTimerDisplay() {
    const saat = Math.floor(kalanSaniye / 3600);
    const dakika = Math.floor((kalanSaniye % 3600) / 60);
    const saniye = kalanSaniye % 60;

    const fSaat = saat < 10 ? '0' + saat : saat;
    const fDakika = dakika < 10 ? '0' + dakika : dakika;
    const fSaniye = saniye < 10 ? '0' + saniye : saniye;

    document.getElementById('sim-timer').innerText = `Kalan Süre: ${fSaat}:${fDakika}:${fSaniye}`;
}

function handleControlClick() {
    const video = document.getElementById('sim-video');
    const btn = document.getElementById('control-action-btn');
    const breakAlert = document.getElementById('break-alert');
    const overlay = document.getElementById('simulation-overlay');

    if (!molaModu) {
        molaModu = true;
        video.pause();
        breakAlert.style.display = 'block';
        btn.innerText = "Yolculuğa Devam Et";
        btn.style.background = "#2ecc71";
    } else {
        molaModu = false;
        breakAlert.style.display = 'none';
        btn.innerText = "Mola Ver";
        btn.style.background = "var(--accent-color)";
        
        forceFullscreen(overlay);
        setTimeout(() => { video.play(); }, 100);
    }
}

function endJourney() {
    yolculukAktif = false;
    clearInterval(zamanlayici);
    const overlay = document.getElementById('simulation-overlay');
    const video = document.getElementById('sim-video');
    
    video.pause();
    overlay.style.display = 'none';
    document.getElementById('break-alert').style.display = 'none';
    
    if (document.exitFullscreen) document.exitFullscreen();

    alert("Yolculuğunuz başarıyla tamamlandı!");
    location.reload(); 
}

function forceFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
}

function setupFullscreenInterceptors() {
    const checkExit = () => {
        if (yolculukAktif && !document.fullscreenElement && !document.webkitFullscreenElement) {
            if (!molaModu) {
                handleControlClick(); 
            }
        }
    };

    document.addEventListener('fullscreenchange', checkExit);
    document.addEventListener('webkitfullscreenchange', checkExit);

    document.addEventListener('keydown', (e) => {
        if (yolculukAktif && (e.key === "Escape" || e.keyCode === 27)) {
            if (!molaModu) {
                setTimeout(checkExit, 100);
            }
        }
    }, true);
}

window.addEventListener('beforeunload', function (e) {
    if(yolculukAktif) {
        e.preventDefault();
        e.returnValue = 'Yolculuğunuz yarıda kesilecek!';
    }
});