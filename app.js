// ========================================
// HVAC 缺失追蹤系統
// Supabase 多人／多裝置同步版
// ========================================

// 雲端取得的所有缺失資料
let punchList = [];

// 正在編輯的 Supabase 資料 ID
// null 代表新增模式
let editId = null;

// 照片與影片目前只做本機預覽
// 下一步會改接 Supabase Storage
let selectedPhotos = [];
let selectedVideo = null;

// ========================================
// 取得頁面元件
// ========================================

const addBtn = document.getElementById("addBtn");
const formArea = document.getElementById("formArea");
const saveBtn = document.getElementById("saveBtn");
const list = document.getElementById("list");

const reportDateInput = document.getElementById("reportDate");
const reporterInput = document.getElementById("reporter");
const locationInput = document.getElementById("location");
const equipmentInput = document.getElementById("equipment");
const descriptionInput = document.getElementById("description");
const statusInput = document.getElementById("status");

const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");

const videoInput = document.getElementById("video");
const videoPreview = document.getElementById("videoPreview");

// ========================================
// 啟動系統
// ========================================

initializeApp();

async function initializeApp() {
    setToday();
    await loadPunches();
    subscribeToChanges();
}

// ========================================
// 新增缺失按鈕
// ========================================

addBtn.addEventListener("click", () => {
    clearForm();
    editId = null;

    formArea.style.display = "block";
    setToday();

    saveBtn.textContent = "儲存缺失";

    formArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// ========================================
// 照片選取與預覽
// 尚未上傳 Supabase Storage
// ========================================

photoInput.addEventListener("change", event => {
    selectedPhotos = Array.from(event.target.files || []);
    preview.innerHTML = "";

    selectedPhotos.forEach(file => {
        const imageUrl = URL.createObjectURL(file);
        const img = document.createElement("img");

        img.src = imageUrl;
        img.alt = file.name;

        img.style.width = "110px";
        img.style.height = "110px";
        img.style.objectFit = "cover";
        img.style.margin = "5px";
        img.style.borderRadius = "10px";

        img.addEventListener(
            "load",
            () => URL.revokeObjectURL(imageUrl),
            { once: true }
        );

        preview.appendChild(img);
    });

    if (selectedPhotos.length > 0) {
        appendMediaNotice(
            preview,
            "照片目前僅供預覽，下一步將接上雲端 Storage。"
        );
    }
});

// ========================================
// 影片選取與預覽
// 尚未上傳 Supabase Storage
// ========================================

videoInput.addEventListener("change", event => {
    selectedVideo = event.target.files?.[0] || null;
    videoPreview.innerHTML = "";

    if (!selectedVideo) {
        return;
    }

    const videoUrl = URL.createObjectURL(selectedVideo);
    const video = document.createElement("video");

    video.src = videoUrl;
    video.controls = true;
    video.style.width = "100%";
    video.style.maxWidth = "420px";
    video.style.marginTop = "10px";
    video.style.borderRadius = "10px";

    video.addEventListener(
        "loadedmetadata",
        () => URL.revokeObjectURL(videoUrl),
        { once: true }
    );

    videoPreview.appendChild(video);

    appendMediaNotice(
        videoPreview,
        "影片目前僅供預覽，下一步將接上雲端 Storage。"
    );
});

// ========================================
// 儲存新增或編輯資料
// ========================================

saveBtn.addEventListener("click", async () => {
    const punchData = {
        report_date: reportDateInput.value,
        reporter: reporterInput.value.trim(),
        location: locationInput.value.trim(),
        equipment: equipmentInput.value.trim() || null,
        description: descriptionInput.value.trim(),
        status: statusInput.value
    };

    if (!punchData.report_date) {
        alert("請選擇通報日期");
        reportDateInput.focus();
        return;
    }

    if (!punchData.reporter) {
        alert("請輸入通報人");
        reporterInput.focus();
        return;
    }

    if (!punchData.location) {
        alert("請輸入區域");
        locationInput.focus();
        return;
    }

    if (!punchData.description) {
        alert("請輸入缺失描述");
        descriptionInput.focus();
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = editId === null ? "儲存中…" : "更新中…";

    try {
        if (editId === null) {
            await createPunch(punchData);
        } else {
            await updatePunch(editId, punchData);
        }

        formArea.style.display = "none";
        clearForm();

        await loadPunches();
    } catch (error) {
        console.error("儲存失敗：", error);
        alert(`儲存失敗：${error.message || "請檢查 Supabase 設定"}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "儲存缺失";
    }
});

// ========================================
// 從 Supabase 讀取資料
// ========================================

async function loadPunches() {
    list.innerHTML = "<p>資料載入中……</p>";

    const { data, error } = await supabaseClient
        .from("punch_list")
        .select(
            "id, report_date, reporter, location, equipment, description, status, created_at"
        )
        .order("created_at", { ascending: false });

    if (error) {
        console.error("讀取 Supabase 失敗：", error);

        list.innerHTML = `
            <p style="color:#c62828;">
                無法讀取雲端資料：${escapeHtml(error.message)}
            </p>
        `;

        punchList = [];
        updateCount();
        return;
    }

    punchList = data || [];

    renderList();
    updateCount();
}

// ========================================
// 新增 Supabase 資料
// ========================================

async function createPunch(punchData) {
    const { error } = await supabaseClient
        .from("punch_list")
        .insert(punchData);

    if (error) {
        throw error;
    }
}

// ========================================
// 更新 Supabase 資料
// ========================================

async function updatePunch(id, punchData) {
    const { error } = await supabaseClient
        .from("punch_list")
        .update(punchData)
        .eq("id", id);

    if (error) {
        throw error;
    }
}

// ========================================
// 顯示缺失列表
// ========================================

function renderList() {
    list.innerHTML = "";

    if (punchList.length === 0) {
        list.innerHTML = "<p>目前尚無缺失紀錄</p>";
        return;
    }

    punchList.forEach(item => {
        const div = document.createElement("div");
        div.className = "punchCard";

        const punchNumber =
            `PUNCH-${String(item.id).padStart(3, "0")}`;

        div.innerHTML = `
            <h3>${punchNumber}</h3>

            <p>
                📅 通報日期：
                ${escapeHtml(formatDate(item.report_date))}
            </p>

            <p>
                👤 通報人：
                ${escapeHtml(item.reporter || "—")}
            </p>

            <p>
                📍 區域：
                ${escapeHtml(item.location || "—")}
            </p>

            <p>
                ⚙️ 設備：
                ${escapeHtml(item.equipment || "—")}
            </p>

            <p>
                📝 缺失：
                ${escapeHtml(item.description || "—")}
            </p>

            <p>
                ${getStatusIcon(item.status)}
                ${escapeHtml(item.status || "待改善")}
            </p>

            <button
                type="button"
                onclick="editPunch(${item.id})"
            >
                ✏️ 編輯
            </button>

            <br>

            <small>
                建立時間：
                ${escapeHtml(formatDateTime(item.created_at))}
            </small>
        `;

        list.appendChild(div);
    });
}

// ========================================
// 編輯缺失
// ========================================

function editPunch(id) {
    const item = punchList.find(punch => punch.id === id);

    if (!item) {
        alert("找不到這筆缺失資料");
        return;
    }

    editId = id;

    reportDateInput.value = item.report_date || "";
    reporterInput.value = item.reporter || "";
    locationInput.value = item.location || "";
    equipmentInput.value = item.equipment || "";
    descriptionInput.value = item.description || "";
    statusInput.value = item.status || "待改善";

    selectedPhotos = [];
    selectedVideo = null;

    photoInput.value = "";
    videoInput.value = "";
    preview.innerHTML = "";
    videoPreview.innerHTML = "";

    formArea.style.display = "block";
    saveBtn.textContent = "更新缺失";

    formArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// 讓 HTML onclick 可以使用此函式
window.editPunch = editPunch;

// ========================================
// 即時監聽其他裝置的資料變化
// ========================================

function subscribeToChanges() {
    supabaseClient
        .channel("punch-list-live-sync")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "punch_list"
            },
            async () => {
                await loadPunches();
            }
        )
        .subscribe(status => {
            console.log("Supabase Realtime：", status);
        });
}

// ========================================
// 更新統計數量
// ========================================

function updateCount() {
    document.getElementById("pendingCount").innerText =
        punchList.filter(item => item.status === "待改善").length;

    document.getElementById("progressCount").innerText =
        punchList.filter(item => item.status === "改善中").length;

    document.getElementById("completeCount").innerText =
        punchList.filter(item => item.status === "已完成").length;
}

// ========================================
// 狀態圖示
// ========================================

function getStatusIcon(status) {
    if (status === "待改善") {
        return "🔴";
    }

    if (status === "改善中") {
        return "🟡";
    }

    if (status === "已完成") {
        return "🟢";
    }

    return "⚪";
}

// ========================================
// 清除表單
// ========================================

function clearForm() {
    editId = null;

    reportDateInput.value = "";
    reporterInput.value = "";
    locationInput.value = "";
    equipmentInput.value = "";
    descriptionInput.value = "";
    statusInput.value = "待改善";

    photoInput.value = "";
    videoInput.value = "";

    preview.innerHTML = "";
    videoPreview.innerHTML = "";

    selectedPhotos = [];
    selectedVideo = null;

    saveBtn.textContent = "儲存缺失";
}

// ========================================
// 日期處理
// ========================================

function setToday() {
    const now = new Date();
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    );

    reportDateInput.value =
        localDate.toISOString().split("T")[0];
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const parts = value.split("-");

    if (parts.length !== 3) {
        return value;
    }

    return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ========================================
// 安全顯示使用者輸入
// ========================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function appendMediaNotice(container, message) {
    const notice = document.createElement("p");

    notice.textContent = message;
    notice.style.fontSize = "13px";
    notice.style.color = "#666";
    notice.style.marginTop = "5px";

    container.appendChild(notice);
}