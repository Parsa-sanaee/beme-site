// js/chatbot.js
export function initChatbot() {
  const chatBox = document.getElementById("chat-box");
  const input = document.getElementById("user-input");
  const btn = document.getElementById("send-btn");

  if (!chatBox || !input || !btn) {
    console.warn("عناصر چت بات یافت نشد!");
    return;
  }

  btn.onclick = sendMessage;
  input.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  function sendMessage() {
    if (!input.value.trim()) return;

    addMessage("You", input.value.trim(), "user");
    input.value = "";

    setTimeout(() => {
      addMessage("Bot", "من هنوز ساده‌ام ولی خیلی خوش‌اخلاقم 😄", "bot");
    }, 500);
  }

  function addMessage(sender, text, cls) {
    const div = document.createElement("div");
    div.className = `message ${cls}`;
    div.innerHTML = `<b>${sender}:</b> ${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // پیام خوش‌آمد
  setTimeout(() => {
    addMessage("Bot", "سلام! من چت بات شما هستم. چطور می‌تونم کمکتون کنم؟", "bot");
  }, 1000);
}

// اجرای خودکار اگر مستقیماً لود شده
if (document.getElementById("chat-box")) {
  initChatbot();
}