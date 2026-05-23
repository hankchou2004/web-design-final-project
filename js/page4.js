window.addEventListener("DOMContentLoaded", () => {
  // 你的全部 JS 內容都放這裡
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    if (location.href.includes(link.getAttribute("href"))) {
      link.classList.add("active");
    }
  });

  const chatForm = document.getElementById("chatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const status = document.getElementById("chatStatus");
      status.textContent = "訊息已成功傳送，感謝您的聯繫！";
      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    });
  }

  const aboutUsContainer = document.getElementById("aboutUsContent");
  if (aboutUsContainer) {
    const savedContent = localStorage.getItem("aboutUs");
    const defaultAboutUs = `在這個科技飛速發展、電競蓬勃興盛的時代，「電競次元商城」誕生於對遊戲文化的熱愛與對專業設備的堅持。我們深信，好的電競體驗來自於精準、高效與個性化的周邊設備。因此，我們致力於提供多樣化的電競產品，包括高規格的電競滑鼠、機械式鍵盤、環繞音效耳機、RGB燈效設備、電競椅、主題周邊與收藏商品等，滿足每一位玩家對裝備的所有想像。

我們的選品團隊由一群電競愛好者、選手與硬體專家組成，秉持著嚴選與測試的精神，從品牌品質、耐用度、性價比到外觀設計進行全方位評估。無論你是剛踏入電競世界的新手，還是追求極致表現的職業玩家，都能在這裡找到最適合你的戰鬥裝備。

「電競次元商城」不只是一間商店，更是一個屬於玩家的社群平台。我們關注市場趨勢，也聆聽使用者聲音，致力於推動本土電競文化，定期舉辦線上活動與新品評測分享，讓每位玩家都能參與其中，成為社群的一份子。

我們承諾提供快速的出貨、貼心的客服與完善的售後服務，讓每一位顧客都能安心選購、滿意回購。選擇我們，就是選擇一種更專業、更講究的電競生活方式。`;

    const content = savedContent || defaultAboutUs;
    aboutUsContainer.innerHTML = content.replace(/\n/g, "<br>");
  }

  const chatToggle = document.querySelector('.chat-toggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', () => {
      const chatFloat = document.querySelector('.chat-float');
      if (chatFloat) {
        chatFloat.classList.toggle('hidden');
      }
    });
  }

  const savedLogo = localStorage.getItem("customLogo");
  if (savedLogo) {
    const logoImg = document.querySelector("img.logo");
    if (logoImg) {
      logoImg.src = savedLogo;
    }
  }
});
