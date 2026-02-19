let seconds = 0;
let timer = null;
let startClock = null;

// kayıtlar
let records = JSON.parse(localStorage.getItem("kpssRecords")) || [];

// elementler
const timeEl = document.getElementById("time");
const listEl = document.getElementById("lessonList");
const reportListEl = document.getElementById("lessonReport");
const totalTimeEl = document.getElementById("totalTime");
const topLessonEl = document.getElementById("topLesson");

// ----------------- UTIL -----------------
function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function nowClock() {
    return new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ----------------- RENDER -----------------
function render() {
    listEl.innerHTML = "";
    reportListEl.innerHTML = "";

    let total = 0;
    let map = {};

    records.forEach((r, index) => {
        // liste
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div>
                <strong>${r.lesson}</strong><br>
                <small>${r.start} - ${r.end}</small><br>
                <span>${formatTime(r.time)}</span>
            </div>
            <button onclick="deleteRecord(${index})">❌</button>
        `;
        listEl.appendChild(div);

        // rapor
        total += r.time;
        map[r.lesson] = (map[r.lesson] || 0) + r.time;
    });

    totalTimeEl.innerText = formatTime(total);

    let topLesson = "-";
    let topTime = 0;

    for (let lesson in map) {
        const li = document.createElement("li");
        li.innerText = `${lesson} → ${formatTime(map[lesson])}`;
        reportListEl.appendChild(li);

        if (map[lesson] > topTime) {
            topTime = map[lesson];
            topLesson = lesson;
        }
    }

    topLessonEl.innerText =
        topLesson === "-" ? "-" : `${topLesson} (${formatTime(topTime)})`;
}

render();

// ----------------- KRONOMETRE -----------------
function startTimer() {
    if (timer) return;

    startClock = nowClock();

    timer = setInterval(() => {
        seconds++;
        timeEl.innerText = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

function resetTimer() {
    stopTimer();
    seconds = 0;
    timeEl.innerText = "00:00:00";
}

// ----------------- KRONOMETREDEN KAYDET -----------------
function saveLesson() {
    const lesson = document.getElementById("lessonName").value.trim();
    if (!lesson) {
        alert("Dayı ders adı yazmadan kayıt olmaz");
        return;
    }

    const endClock = nowClock();

    records.unshift({
        lesson,
        time: seconds,
        start: startClock || endClock,
        end: endClock
    });

    localStorage.setItem("kpssRecords", JSON.stringify(records));

    document.getElementById("lessonName").value = "";
    resetTimer();
    render();
}

// ----------------- MANUEL EKLE -----------------
function addManual() {
    const lesson = document.getElementById("manualLesson").value.trim();
    const hour = Number(document.getElementById("manualHour").value);
    const minute = Number(document.getElementById("manualMinute").value);

    if (!lesson) {
        alert("Dayı ders adı gir");
        return;
    }

    const totalSeconds = (hour * 3600) + (minute * 60);
    if (totalSeconds <= 0) {
        alert("Süre girmedin lan");
        return;
    }

    const start = prompt("Başlangıç saati (örn 14:30):");
    const end = prompt("Bitiş saati (örn 16:00):");

    records.unshift({
        lesson,
        time: totalSeconds,
        start: start || "-",
        end: end || "-"
    });

    localStorage.setItem("kpssRecords", JSON.stringify(records));

    document.getElementById("manualLesson").value = "";
    document.getElementById("manualHour").value = "";
    document.getElementById("manualMinute").value = "";

    render();
}

// ----------------- TEK TEK SİL -----------------
function deleteRecord(index) {
    const ok = confirm("Bu kaydı siliyorum dayı, emin misin?");
    if (!ok) return;

    records.splice(index, 1);
    localStorage.setItem("kpssRecords", JSON.stringify(records));
    render();
}

// ----------------- TÜMÜNÜ SİL -----------------
function resetReports() {
    const ok = confirm("Hepsi gidiyor, geri dönüş yok. Emin misin?");
    if (!ok) return;

    records = [];
    localStorage.removeItem("kpssRecords");
    resetTimer();
    render();
}

let chart = null;

function toggleChart() {
    const canvas = document.getElementById("reportChart");

    if (canvas.style.display === "none") {
        canvas.style.display = "block";
        drawChart();
    } else {
        canvas.style.display = "none";
    }
}

function drawChart() {
    const ctx = document.getElementById("reportChart").getContext("2d");

    // ders bazlı süreler
    let map = {};
    records.forEach(r => {
        map[r.lesson] = (map[r.lesson] || 0) + r.time;
    });

    const labels = Object.keys(map);
    const data = Object.values(map).map(sec => (sec / 3600).toFixed(2));

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Saat",
                data,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => v + "s"
                    }
                }
            }
        }
    });
}
