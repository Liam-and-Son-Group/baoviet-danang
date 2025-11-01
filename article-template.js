// Article Template Generator for Bảo Việt Đà Nẵng
// This template generates complete HTML pages for news articles

function generateArticleTemplate(data) {
  const currentDate = new Date(
    data.publishDate || new Date()
  ).toLocaleDateString("vi-VN");
  const canonicalUrl = "https://baohiembaovietdanang.vn/" + data.filename;
  const publishedDate = new Date(data.publishDate || new Date())
    .toISOString()
    .split("T")[0];

  return (
    "<!DOCTYPE html>" +
    '<html lang="vi">' +
    "<head>" +
    '  <meta charset="UTF-8">' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "  <title>" +
    data.title +
    " | Bảo Hiểm Bảo Việt Đà Nẵng</title>" +
    '  <link rel="icon" type="image/png" href="https://baohiembaovietdanang.vn/assets/logo.png" sizes="32x32" />' +
    '  <link rel="shortcut icon" href="https://baovietonline.com.vn/favicon.ico">' +
    '  <link rel="stylesheet" href="/style.css" />' +
    "  " +
    "  <!-- SEO Meta Tags -->" +
    '  <meta name="description" content="' +
    data.description +
    '">' +
    '  <meta name="keywords" content="' +
    data.keywords +
    '">' +
    '  <meta name="author" content="Bảo Hiểm Bảo Việt Đà Nẵng">' +
    '  <meta name="robots" content="index, follow">' +
    '  <link rel="canonical" href="' +
    canonicalUrl +
    '">' +
    "  " +
    "  <!-- Open Graph Tags -->" +
    '  <meta property="og:title" content="' +
    data.title +
    '">' +
    '  <meta property="og:description" content="' +
    data.description +
    '">' +
    '  <meta property="og:image" content="https://baohiembaovietdanang.vn/assets/logo.png">' +
    '  <meta property="og:url" content="' +
    canonicalUrl +
    '">' +
    '  <meta property="og:type" content="article">' +
    '  <meta property="og:site_name" content="Bảo Hiểm Bảo Việt Đà Nẵng">' +
    "  " +
    "  <!-- Twitter Card Tags -->" +
    '  <meta name="twitter:card" content="summary_large_image">' +
    '  <meta name="twitter:title" content="' +
    data.title +
    '">' +
    '  <meta name="twitter:description" content="' +
    data.description +
    '">' +
    '  <meta name="twitter:image" content="https://baohiembaovietdanang.vn/assets/logo.png">' +
    "  " +
    "  <!-- Article Schema -->" +
    '  <script type="application/ld+json">' +
    "  {" +
    '    "@context": "https://schema.org",' +
    '    "@type": "Article",' +
    '    "headline": "' +
    data.title +
    '",' +
    '    "description": "' +
    data.description +
    '",' +
    '    "image": "https://baohiembaovietdanang.vn/assets/logo.png",' +
    '    "author": {' +
    '      "@type": "Organization",' +
    '      "name": "Bảo Hiểm Bảo Việt Đà Nẵng"' +
    "    }," +
    '    "publisher": {' +
    '      "@type": "Organization",' +
    '      "name": "Bảo Hiểm Bảo Việt Đà Nẵng",' +
    '      "logo": {' +
    '        "@type": "ImageObject",' +
    '        "url": "https://baohiembaovietdanang.vn/assets/logo.png"' +
    "      }" +
    "    }," +
    '    "datePublished": "' +
    publishedDate +
    '",' +
    '    "dateModified": "' +
    publishedDate +
    '",' +
    '    "mainEntityOfPage": {' +
    '      "@type": "WebPage",' +
    '      "@id": "' +
    canonicalUrl +
    '"' +
    "    }" +
    "  }" +
    "  </script>" +
    "</head>" +
    "" +
    "<body>" +
    "  <!-- Floating Action Buttons -->" +
    '  <div class="float-container">' +
    '    <button onclick="window.location.href=\'tel:+8490549949\'" id="floatBtn" class="floating-btn">' +
    '      <img src="/assets/phone-icon.png" style="width: 30px; height: 30px;" alt="Gọi điện" srcset="">' +
    "    </button>" +
    '    <button onclick="window.location.href=\'https://zalo.me/84931909697\'" id="floatBtn" class="floating-btn">' +
    '      <img src="https://haiauint.vn/wp-content/uploads/2024/02/zalo-icon.png" style="width: 100%; height: 100%;" alt="Zalo" srcset="">' +
    "    </button>" +
    '    <a href="/dang-ky-tu-van-bao-hiem.html">' +
    '      <button class="registry-button">' +
    "        Đăng ký ngay" +
    "      </button>" +
    "    </a>" +
    "  </div>" +
    "" +
    "  <!-- Navigation Header -->" +
    '  <nav class="head-wrapper">' +
    '    <img onclick="window.location.href=\'/index.html\'" class="logo"' +
    '      src="https://baovietonline.com.vn/templates/images/logo2x.png" alt="Logo Bảo Việt Đà Nẵng">' +
    '    <div class="hamburger" onclick="toggleMenu()">' +
    "      <div></div>" +
    "      <div></div>" +
    "      <div></div>" +
    "    </div>" +
    '    <ul class="navigation-items" id="menu">' +
    "      <li onclick=\"window.location.href='/index.html'\">Trang chủ</li>" +
    '      <li class="has-popover">Bảo hiểm nhân thọ' +
    '        <div class="popover">' +
    '          <ul class="submenu">' +
    "            <li onclick=\"window.location.href='/baohiemantamhoachdinh.html'\">An Tâm Hoạch Định</li>" +
    "            <li onclick=\"window.location.href='/baohiemankhangnhuy.html'\">An Khang Như Ý</li>" +
    "            <li onclick=\"window.location.href='/baohiemanphatcattuong.html'\">An Phát Cát Tường</li>" +
    "            <li onclick=\"window.location.href='/baohiemankhanghanhphuc.html'\">An Khang Hạnh Phúc</li>" +
    "            <li onclick=\"window.location.href='/baohiemanvuisongkhoe.html'\">An vui sống khoẻ</li>" +
    "            <li onclick=\"window.location.href='/baohiemantamhocvan.html'\">An tâm học vấn</li>" +
    "            <li onclick=\"window.location.href='/baohiemanphattrondoi.html'\">An phát trọn đời</li>" +
    "          </ul>" +
    "        </div>" +
    "      </li>" +
    '      <li class="has-popover">Bảo hiểm phi nhân thọ' +
    '        <div class="popover">' +
    '          <ul class="submenu">' +
    "            <li onclick=\"window.location.href='/baohiemoto.html'\">Bảo hiểm vật chất xe ô tô</li>" +
    "            <li onclick=\"window.location.href='/baohiemchayno.html'\">Bảo hiểm cháy, nổ bắt buộc</li>" +
    "            <li onclick=\"window.location.href='/baohiemruirotaisan.html'\">Bảo hiểm mọi rủi ro tài sản</li>" +
    "            <li onclick=\"window.location.href='/baohiemsuckhoe.html'\">Bảo Việt An Gia</li>" +
    "            <li onclick=\"window.location.href='/baohiemintercare.html'\">Bảo hiểm Intercare</li>" +
    "            <li onclick=\"window.location.href='/baohiemxemay.html'\">Bảo hiểm xe máy</li>" +
    "            <li onclick=\"window.location.href='/baohiemtravel.html'\">Bảo hiểm du lịch Flexi</li>" +
    "          </ul>" +
    "        </div>" +
    "      </li>" +
    "      <li onclick=\"window.location.href='/tuyen-dung.html'\">Tuyển dụng</li>" +
    "      <li onclick=\"window.location.href='/tin-tuc.html'\">Tin tức</li>" +
    "    </ul>" +
    '    <div class="contact-wrapper">' +
    '      <img class="phone-logo" src="https://img.icons8.com/ios_filled/512/FAB005/apple-phone.png" alt="Phone icon">' +
    '      <div class="contact-detail">' +
    '        <p class="contact-title">Tư vấn miễn phí</p>' +
    '        <p class="phone-number">0905.499.496 <span style="color: black; font-weight: 600;">/</span> 0931.909.697</p>' +
    "      </div>" +
    "    </div>" +
    "  </nav>" +
    "" +
    "  <!-- Main Content -->" +
    '  <div style="max-width: 1250px; margin: auto; padding: 15px;">' +
    "    <!-- Breadcrumb -->" +
    '    <div class="breadcrumb" style="margin-top: 100px;">' +
    '      <a href="/index.html">TRANG CHỦ</a> • <a href="/tin-tuc.html">TIN TỨC</a> - <a href="#">' +
    data.category +
    "</a>" +
    "    </div>" +
    "" +
    "    <!-- Article Title -->" +
    '    <h1 class="title-new">' +
    data.title +
    "</h1>" +
    "" +
    "    <!-- Article Meta Info -->" +
    '    <div class="meta-info" style="border-bottom: 1px solid rgba(0, 0, 0, 0.219); padding-bottom: 20px;">' +
    '      <span class="category">' +
    data.category +
    "</span>" +
    '      <span class="date">' +
    currentDate +
    "</span>" +
    "    </div>" +
    "" +
    "    <!-- Article Content -->" +
    '    <div style="max-width: 900px; margin: auto;">' +
    '      <div class="item-entry" style="margin-top: 20px;">' +
    "        " +
    data.content +
    "      </div>" +
    "" +
    "      <!-- Contact CTA Section -->" +
    '      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin: 40px 0; text-align: center;">' +
    '        <h3 style="margin-bottom: 15px; color: white;">🎯 Cần tư vấn về sản phẩm bảo hiểm?</h3>' +
    '        <p style="margin-bottom: 20px; opacity: 0.9;">Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn 24/7</p>' +
    '        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">' +
    '          <a href="tel:+8490549949" style="background: rgba(255,255,255,0.2); padding: 12px 25px; border-radius: 25px; text-decoration: none; color: white; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s;">' +
    "            📞 0905.499.496" +
    "          </a>" +
    '          <a href="https://zalo.me/84931909697" style="background: rgba(255,255,255,0.2); padding: 12px 25px; border-radius: 25px; text-decoration: none; color: white; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s;">' +
    "            💬 Chat Zalo" +
    "          </a>" +
    '          <a href="/dang-ky-tu-van-bao-hiem.html" style="background: #ffd700; color: #333; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: bold; transition: all 0.3s;">' +
    "            ✨ Đăng ký tư vấn" +
    "          </a>" +
    "        </div>" +
    "      </div>" +
    "" +
    "      <!-- Related Articles -->" +
    '      <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px;">' +
    '        <h3 style="color: #333; margin-bottom: 20px;">📰 Bài viết liên quan</h3>' +
    '        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">' +
    '          <a href="/bao-hiem-suc-khoe-bao-viet-co-nen-mua-bang-gia-2025.html" style="display: block; padding: 15px; background: white; border-radius: 8px; text-decoration: none; color: #333; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.3s;">' +
    '            <h4 style="font-size: 14px; margin-bottom: 8px; color: #2c5aa0;">Bảo hiểm sức khỏe Bảo Việt có nên mua? Bảng giá 2025</h4>' +
    '            <p style="font-size: 12px; color: #666; margin: 0;">Chi tiết về sản phẩm bảo hiểm sức khỏe mới nhất...</p>' +
    "          </a>" +
    '          <a href="/bao-hiem-bao-viet-danang-giai-phap-toan-dien.html" style="display: block; padding: 15px; background: white; border-radius: 8px; text-decoration: none; color: #333; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.3s;">' +
    '            <h4 style="font-size: 14px; margin-bottom: 8px; color: #2c5aa0;">Bảo hiểm Bảo Việt Đà Nẵng - Giải pháp toàn diện</h4>' +
    '            <p style="font-size: 12px; color: #666; margin: 0;">Tìm hiểu về các gói bảo hiểm tối ưu cho gia đình...</p>' +
    "          </a>" +
    "        </div>" +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    "" +
    "  <!-- Footer -->" +
    '  <footer class="footer-infor" style="margin-top: 60px;">' +
    '    <div class="infor-wrapper">' +
    '      <div class="infor-col">' +
    '        <p class="title">Thông tin liên hệ</p>' +
    "        <ul>" +
    "          <li>Văn phòng: 54 Nguyễn Văn Linh, Thạc Gián, Thanh Khê, Đà Nẵng</li>" +
    '          <li>Hotline: <a href="tel:+8490549949">0905.499.496</a> / <a href="tel:+84931909697">0931.909.697</a></li>' +
    '          <li>Gmail: <a href="mailto:vanthangnguyen1802@gmail.com">vanthangnguyen1802@gmail.com</a></li>' +
    "          <li>Fan Page: facebook.com</li>" +
    "        </ul>" +
    "      </div>" +
    '      <div class="infor-col">' +
    '        <p class="title">Các sản phẩm mới</p>' +
    "        <ul>" +
    "          <li>Bảo lãnh viện phí - Chăm sóc Y tế cao cấp</li>" +
    "          <li>Bảo hiểm Xe cơ giới</li>" +
    "          <li>Bảo hiểm Cháy, nổ bắt buộc</li>" +
    "          <li>Bảo vệ vượt trội</li>" +
    "          <li>Tích lũy ưu việt</li>" +
    "        </ul>" +
    "      </div>" +
    '      <div class="infor-col">' +
    '        <p class="title">Giải thưởng danh giá</p>' +
    '        <p style="margin:0;">Bảo hiểm phi nhân thọ tốt nhất Việt Nam</p>' +
    '        <div style="display: flex; gap: 12px; margin-top: 10px;">' +
    '          <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/e3753335c1f0f2538ee6fc0f07e4b2b0.png" alt="Giải thưởng">' +
    '          <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/fbbf198a4c26dc8b27158d49c7a22984.png" alt="Giải thưởng">' +
    '          <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/9c28c0d2654e022cff9c689ee87f6c7f.png" alt="Giải thưởng">' +
    '          <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/7f3415b56cf02a9f78dba149c0edef97.png" alt="Giải thưởng">' +
    "        </div>" +
    "      </div>" +
    "    </div>" +
    "  </footer>" +
    "" +
    "  <!-- JavaScript -->" +
    "  <script>" +
    "    // Mobile menu toggle" +
    "    function toggleMenu() {" +
    "      const menu = document.getElementById('menu');" +
    "      menu.classList.toggle('active');" +
    "    }" +
    "" +
    "    // Smooth scroll for anchor links" +
    "    document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {" +
    "      anchor.addEventListener('click', function (e) {" +
    "        e.preventDefault();" +
    "        const target = document.querySelector(this.getAttribute('href'));" +
    "        if (target) {" +
    "          target.scrollIntoView({" +
    "            behavior: 'smooth'," +
    "            block: 'start'" +
    "          });" +
    "        }" +
    "      });" +
    "    });" +
    "" +
    "    // Image lazy loading" +
    "    if ('IntersectionObserver' in window) {" +
    "      const imageObserver = new IntersectionObserver((entries, observer) => {" +
    "        entries.forEach(entry => {" +
    "          if (entry.isIntersecting) {" +
    "            const img = entry.target;" +
    "            img.src = img.dataset.src;" +
    "            img.classList.remove('lazy');" +
    "            observer.unobserve(img);" +
    "          }" +
    "        });" +
    "      });" +
    "" +
    "      document.querySelectorAll('img[data-src]').forEach(img => {" +
    "        imageObserver.observe(img);" +
    "      });" +
    "    }" +
    "" +
    "    // Add animation to related articles on hover" +
    "    document.querySelectorAll('[href*=\"html\"]').forEach(link => {" +
    "      link.addEventListener('mouseenter', function() {" +
    "        this.style.transform = 'translateY(-2px)';" +
    "      });" +
    "      link.addEventListener('mouseleave', function() {" +
    "        this.style.transform = 'translateY(0)';" +
    "      });" +
    "    });" +
    "  </script>" +
    "</body>" +
    "" +
    "</html>"
  );
}

// Export function for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateArticleTemplate };
}
