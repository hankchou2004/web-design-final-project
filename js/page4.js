// ── EmailJS 設定 ──────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "r0MyPDDOxNcOb5Ckp";
const EMAILJS_SERVICE_ID  = "service_tfl6c2b";
const EMAILJS_TEMPLATE_ID = "template_cmkwk0y";
// ──────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", async () => {
  // 初始化 EmailJS
  if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // 載入 Logo
  try {
    const res = await fetch('/api/settings/customLogo');
    const data = await res.json();
    if (data.value) {
      const logoImg = document.querySelector("img.logo");
      if (logoImg) logoImg.src = data.value;
    }
  } catch (e) {}

  // 載入關於我們
  const aboutUsContainer = document.getElementById("aboutUsContent");
  if (aboutUsContainer) {
    try {
      const res = await fetch('/api/settings/aboutUs');
      const data = await res.json();
      if (data.value) {
        aboutUsContainer.innerHTML = data.value.replace(/\n/g, "<br>");
      }
    } catch (e) {}
  }

  // 聯絡表單送出
  const chatForm = document.getElementById("chatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const status  = document.getElementById("chatStatus");
      const nameEl  = document.getElementById("chatName");
      const msgEl   = document.getElementById("chatMessage");
      const submitBtn = chatForm.querySelector("button[type='submit']");

      const message = msgEl.value.trim();
      if (!message) {
        status.style.color = "var(--pink)";
        status.textContent = "請輸入訊息內容。";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "傳送中…";
      status.style.color = "var(--text-muted)";
      status.textContent = "";

      const now = new Date().toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      });

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name:    nameEl.value.trim() || "匿名訪客",
        message: message,
        time:    now,
      })
      .then(() => {
        status.style.color = "var(--cyan)";
        status.textContent = "✓ 訊息已成功傳送，感謝您的聯繫！";
        chatForm.reset();
        setTimeout(() => { status.textContent = ""; }, 4000);
      })
      .catch(() => {
        status.style.color = "var(--pink)";
        status.textContent = "✗ 傳送失敗，請稍後再試。";
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "傳送訊息";
      });
    });
  }

  // 開關聊天視窗
  const chatToggle = document.querySelector('.chat-toggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      const chatFloat = document.querySelector('.chat-float');
      if (chatFloat) chatFloat.classList.toggle('hidden');
    });
  }
});
