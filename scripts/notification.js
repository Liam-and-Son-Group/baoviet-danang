document.addEventListener("DOMContentLoaded", () => {
  const url = document.URL;

  const isDevNgrok = url.includes(".ngrok-free.app");
  const isDevLocal = url.includes("localhost") || url.includes("127.0.0.1");
  const isNetlify = url.includes(".netlify.app");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const deprecationDate = new Date("2025-04-10T12:00:00");

  let bannerText = "";
  let bgColor = "";
  let textColor = "white";

  // ✅ Môi trường development
  if (isDevNgrok || isDevLocal) {
    bannerText = `🧪 Bạn đang truy cập trong môi trường phát triển (development). Một số tính năng có thể chưa hoàn thiện.`;
    bgColor = "#198754"; // xanh lá
  }

  // 🟡 Thử nghiệm đang diễn ra (Hôm nay)
  else if (isNetlify && today < deprecationDate) {
    bannerText = `🧪 Đây là phiên bản thử nghiệm. Một số tính năng hiệu suất và SEO có thể chưa được tối ưu.`;
    bgColor = "#f0ad4e";
    textColor = "#000";
  }

  // 🔴 Ngày cảnh báo ngừng (từ ngày mai trở đi)
  if (
    isNetlify &&
    today.toDateString() === new Date("2025-04-10").toDateString()
  ) {
    bannerText = `
      ⚠️ <strong>Bản thử nghiệm này sẽ ngừng hoạt động sau ngày 10/04/2025.</strong>
      Vui lòng truy cập phiên bản chính thức tại 
      <a href="https://baohiembaovietdanang.vn" target="_blank" style="color: #fff; text-decoration: underline;">
        baohiembaovietdanang.vn
      </a>.
    `;
    bgColor = "#8B0000";
    textColor = "white";
  }

  if (!bannerText) return;

  const banner = document.createElement("div");
  banner.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap;">
      ${bannerText}
      <button id="close-env-banner" style="
        background: transparent;
        border: 1px solid ${textColor};
        color: ${textColor};
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s ease;
      ">Đóng</button>
    </div>
  `;

  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    backgroundColor: bgColor,
    color: textColor,
    padding: "12px 20px",
    fontSize: "14px",
    fontFamily: "sans-serif",
    textAlign: "center",
    zIndex: "9999",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    boxSizing: "border-box",
  });

  document.body.style.paddingTop = "60px";
  document.body.prepend(banner);

  banner.querySelector("#close-env-banner").addEventListener("click", () => {
    banner.remove();
    document.body.style.paddingTop = "0";
  });
});
