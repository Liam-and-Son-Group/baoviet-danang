import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  keywords: string;
  filename: string;
  published_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  feature_image_url?: string; // Add feature image URL
}

interface RequestBody {
  articles: Article[];
  total_count: number;
  unique_count: number;
  trigger_source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting update-news-page Edge Function...");

    // Parse request body
    const { articles, total_count, unique_count, trigger_source }: RequestBody =
      await req.json();

    console.log(
      `📊 Received ${unique_count} unique articles from ${total_count} total articles`
    );
    console.log(`📍 Triggered from: ${trigger_source}`);

    if (!articles || articles.length === 0) {
      throw new Error("No articles provided");
    }

    // Generate the news page HTML
    const newsPageHTML = generateNewsPageHTML(articles);

    // Update the tin-tuc.html file in GitHub repository
    const updateResult = await updateGitHubFile(newsPageHTML);

    console.log("✅ News page updated successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        articles_count: articles.length,
        total_count,
        unique_count,
        github_update: updateResult,
        trigger_source,
        updated_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in update-news-page:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateNewsPageHTML(articles: Article[]): string {
  console.log("🎨 Generating news page HTML...");

  // Generate news items HTML
  const newsItemsHTML = articles
    .map((article, index) => {
      const categoryMap: { [key: string]: string } = {
        "TIN TỨC": "TIN TỨC",
        "SẢN PHẨM - DỊCH VỤ": "SẢN PHẨM - DỊCH VỤ",
        "SỨC KHỎE": "SỨC KHỎE",
        "PHÁP LUẬT": "PHÁP LUẬT",
        "HƯỚNG DẪN": "HƯỚNG DẪN",
        "Ô TÔ - XE MÁY": "Ô TÔ - XE MÁY",
        "GIÁO DỤC": "GIÁO DỤC",
        "HOẠT ĐỘNG TẬP ĐOÀN": "HOẠT ĐỘNG TẬP ĐOÀN",
      };

      const displayCategory = categoryMap[article.category] || article.category;
      const publishDate = formatDate(
        article.published_date || article.created_at
      );
      // Use feature image if available, otherwise fallback to old logic
      const imagePath =
        article.feature_image_url || getImagePath(article.filename, index);

      return `        <!-- News Card: ${article.title} -->
        <div class="news-item"
          style="border: 1px solid #e0e6ed; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); background: #f7fbff; transition: transform 0.3s ease, box-shadow 0.3s ease;">
          <img style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;"
            src="${imagePath}" alt="${article.title}" />
          <h3 style="color: #064278; font-weight: bold; margin: 0 0 12px 0; font-size: 18px; line-height: 1.4;">${
            article.title
          }</h3>
          <p style="color: #666; line-height: 1.6; margin: 0 0 15px 0;">${truncateDescription(
            article.description
          )}</p>
          <div style="display: flex; align-items: center; gap: 10px; margin: 15px 0;">
            <span
              style="background: #e6f7ff; color: #064278; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${displayCategory}</span>
            <span style="color: #999; font-size: 14px;">${publishDate}</span>
          </div>
          <a href="./${article.filename}"
            style="color: #064278; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; font-size: 15px;">
            Xem chi tiết
            <span style="font-size: 16px;">→</span>
          </a>
        </div>`;
    })
    .join("\n");

  // Complete HTML template
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bảo Việt Đà Nẵng</title>
  <link rel="icon" type="image/png" href="https://baohiembaovietdanang.vn/assets/logo.png" sizes="32x32" />
  <link rel="shortcut icon" href="https://baovietonline.com.vn/favicon.ico">
  <link rel="stylesheet" href="/style.css" />

  <!-- Custom CSS for News Cards -->
  <style>
    .news-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    }

    .news-item a:hover {
      color: #0056b3 !important;
    }

    .news-item img {
      transition: transform 0.3s ease;
    }

    .news-item:hover img {
      transform: scale(1.02);
    }

    @media (max-width: 768px) {
      .news-item {
        padding: 15px !important;
      }

      .news-item img {
        height: 200px !important;
      }

      .news-item h3 {
        font-size: 16px !important;
      }
    }
  </style>
  <meta property="og:title" content="Tin tức - Bảo Việt Đà Nẵng">
  <meta property="og:description"
    content="Cập nhật tin tức mới nhất về bảo hiểm, sản phẩm dịch vụ và hoạt động của Bảo Việt Đà Nẵng. Thông tin hữu ích cho khách hàng.">
  <meta property="og:image"
    content="https://baohiembaovietdanang.vn/assets/logo.png">
  <meta property="og:url"
    content="https://baohiembaovietdanang.vn/tin-tuc.html">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
</head>

<body>

  <div class="float-container">
    <button onclick="window.location.href='tel:+8490549949'" id="floatBtn" class="floating-btn">
      <img src="assets/phone-icon.png" style="width: 30px; height: 30px;" alt="" srcset="">
    </button>
    <button onclick="window.location.href='https://zalo.me/84931909697'" id="floatBtn" class="floating-btn">
      <img src="https://haiauint.vn/wp-content/uploads/2024/02/zalo-icon.png" style="width: 100%; height: 100%;" alt=""
        srcset="">
    </button>
    <a href="/dang-ky-tu-van-bao-hiem.html">
      <button class="registry-button">
        Đăng ký ngay
      </button>
    </a>
  </div>
  <nav class="head-wrapper">
    <img onclick="window.location.href='/index.html'" class="logo"
      src="https://baovietonline.com.vn/templates/images/logo2x.png" alt="Logo Bảo Việt Đà Nẵng">
    <div class="hamburger" onclick="toggleMenu()">
      <div></div>
      <div></div>
      <div></div>
    </div>
    <ul class="navigation-items" id="menu">
      <li onclick="window.location.href='/index.html'">Trang chủ</li>
      <li class="has-popover">Bảo hiểm nhân thọ
        <div class="popover">
          <ul class="submenu">
            <li onclick="window.location.href='/baohiemantamhoachdinh.html'">An Tâm Hoạch Định</li>
            <li onclick="window.location.href='/baohiemankhangnhuy.html'">An Khang Như Ý</li>
            <li onclick="window.location.href='/baohiemanphatcattuong.html'">An Phát Cát Tường</li>
            <li onclick="window.location.href='/baohiemankhanghanhphuc.html'">An Khang Hạnh Phúc</li>
            <li onclick="window.location.href='/baohiemanvuisongkhoe.html'">An vui sống khoẻ</li>
            <li onclick="window.location.href='/baohiemantamhocvan.html'">An tâm học vấn</li>
            <li onclick="window.location.href='/baohiemanphattrondoi.html'">An phát trọn đời</li>
          </ul>
        </div>
      </li>
      <li class="has-popover">Bảo hiểm phi nhân thọ
        <div class="popover">
          <ul class="submenu">
            <li onclick="window.location.href='/baohiemoto.html'">Bảo hiểm vật chất xe ô tô</li>
            <li onclick="window.location.href='/baohiemchayno.html'">Bảo hiểm cháy, nổ bắt buộc</li>
            <li onclick="window.location.href='/baohiemruirotaisan.html'">Bảo hiểm mọi rủi ro tài sản </li>
            <li onclick="window.location.href='/baohiemsuckhoe.html'">Bảo Việt An Gia </li>
            <li onclick="window.location.href='/baohiemintercare.html'">Bảo hiểm Intercare </li>
            <li onclick="window.location.href='/baohiemxemay.html'">Bảo hiểm xe máy</li>
            <li onclick="window.location.href='/baohiemtravel.html'">Bảo hiểm du lịch Flexi</li>
          </ul>
        </div>
      </li>
      <li onclick="window.location.href='/tuyen-dung.html'">Tuyển dụng</li>
      <li onclick="window.location.href='/tin-tuc.html'">Tin tức</li>
    </ul>
    <div class="contact-wrapper">
      <img class="phone-logo" src="https://img.icons8.com/ios_filled/512/FAB005/apple-phone.png" alt="Phone icon">
      <div class="contact-detail">
        <p class="contact-title">Tư vấn miễn phí</p>
        <p class="phone-number">0905.499.496 <span style="color: black; font-weight: 600;">/</span>
          0931.909.697
        </p>
      </div>
    </div>
  </nav>

  <div style="max-width: 1250px; margin: auto; padding: 15px;">
    <div class="breadcrumb" style="margin-top: 100px;">
      <a href="#">TRANG CHỦ</a> • <a href="#">TIN TỨC</a> - <a href="#">SỰ KIỆN</a>
    </div>
    <h1 class="title-new">Tin tức liên quan đến Bảo Việt</h1>
    <div class="meta-info" style=" border-bottom: 1px solid rgba(0, 0, 0, 0.219); padding-bottom: 20px;">
      <span class="category">TIN TỨC MỚI NHẤT</span>
      <span class="date">Cập nhật: ${formatDate(
        new Date().toISOString()
      )}</span>
    </div>

    <div style="max-width: 900px; margin: auto; margin-top: 20px;">
      <div class="news-list" style="display: flex; flex-direction: column; gap: 20px;">
${newsItemsHTML}
      </div>
    </div>
  </div>
</body>
<footer style="margin-top: 50px; width: 100%;">
  <div
    style="display: flex; justify-content: space-between; padding: 20px 5%;     background: linear-gradient(274deg, rgba(6, 66, 120, 0.8) 5.2%, rgba(5, 120, 185, 0.8) 97.96%);">
    <img style="width: 160px; height: 30px;" src="https://www.baoviet.com.vn/themes/md_baoviet/img/logo.png" alt="">

  </div>
  <div class="footer-container">
    <div class="infor-col">
      <p class="title">Thông tin liên hệ</p>
      <ul>
        <li>Số điện thoại: 0905.499.496 / 0931.909.697</li>
        <li>Gmail: <a href="mailto:vanthangnguyen1802@gmail.com">
            vanthangnguyen1802@gmail.com
          </a></li>
        <li>Fan Page: facebook.com </li>
      </ul>
    </div>
    <div class="infor-col">
      <p class="title">Các sản phẩm mới</p>
      <ul>
        <li>Bảo lãnh viện phí - Chăm sóc Y tế cao cấp</li>
        <li>Bảo hiểm Xe cơ giới</li>
        <li>Bảo hiểm Cháy, nổ bắt buộc</li>
        <li>Bảo vệ vượt trội</li>
        <li>Tích lũy ưu việt</li>
      </ul>
    </div>
    <div class="infor-col">
      <p class="title">Giải thưởng danh giá</p>
      <p style="margin:0;">Bảo hiểm phi nhân thọ tốt nhất Việt Nam</p>
      <div style="display: flex; gap: 12px">
        <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/e3753335c1f0f2538ee6fc0f07e4b2b0.png"
          alt="">
        <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/fbbf198a4c26dc8b27158d49c7a22984.png"
          alt="">
        <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/9c28c0d2654e022cff9c689ee87f6c7f.png"
          alt="">
        <img class="icon_gt" src="https://baovietonline.com.vn/uploads/content/7f3415b56cf02a9f78dba149c0edef97.png"
          alt="">
      </div>
    </div>
  </div>
</footer>

<script>
  let currentIndex = 0;
  const slides = document.querySelector(".slides");
  const totalSlides = document.querySelectorAll(".slide").length;

  function updateSlide() {
    slides.style.transform = \`translateX(-\${currentIndex * 100}%)\`;
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlide();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlide();
  }

  // Auto slide every 3 seconds
  setInterval(nextSlide, 3000);
</script>

<script>
  function toggleMenu() {
    document.getElementById("menu").classList.toggle("active");
  }
</script>
<script src="scripts/onshow-tap.js"></script>
<script src="scripts/notification.js"></script>

</html>`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function truncateDescription(
  description: string,
  maxLength: number = 200
): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim() + "...";
}

function getImagePath(filename: string, index: number): string {
  // Extract article slug from filename (remove .html extension)
  const slug = filename.replace(".html", "");

  // Map specific articles to their image folders
  const imageMap: { [key: string]: string } = {
    "bao-viet-an-gia-giai-phap-bao-ve-gia-dinh-hieu-qua":
      "assets/bao-viet-an-gia/image1.jpg",
    "huong-dan-khai-bao-bao-hiem-bao-viet-an-gia-khi-nhap-vien":
      "assets/huong-dan-khai-bao/image2.jpg",
    visaonenmuabaohiemoto: "assets/tin-tuc/baohiemoto/image2.jpg",
    "44-co-so-thuoc-dien-bat-buoc":
      "assets/tin-tuc/bao-hiem-chay-no/images/image6.jpg",
    "so-sanh-goi-bao-viet-an-gia":
      "assets/tin-tuc/sosanhgoibaovietangia/image6.jpg",
    quytrinhboithuongbaohiem:
      "assets/tin-tuc/quytrinhboithuongbaohiem/image4.jpg",
    tonghopdanhsachbenhvienkhonghuongbaohiem:
      "assets/tin-tuc/tonghopbaohiem/image1.jpg",
    "5-ly-do-chon-bao-hiem-an-gia":
      "assets/tin-tuc/5-ly-do-nen-chon-bao-hiem/image3.jpg",
    "bao-viet-trach-nhiem-cong-dong":
      "assets/tin-tuc/trachnhiemcongdong/image2.jpg",
    "bao-hiem-bao-viet-danang-giai-phap-toan-dien":
      "assets/tin-tuc/giai-phap-toan-dien/baovietdanang5.jpg",
    "bao-hiem-suc-khoe-bao-viet-co-nen-mua-bang-gia-2025":
      "assets/tin-tuc/co-nen-mua-bang-gia-2025/image4.jpg",
    "bao-hiem-an-tam-hoach-dinh": "assets/tin-tuc/an-tam-hoach-dinh/image3.jpg",
    "nghi-dinh-chinh-phu-chay-no":
      "assets/tin-tuc/bao-hiem-chay-no/images/image6.jpg",
  };

  // Return specific image if mapped, otherwise use fallback pattern
  return imageMap[slug] || `assets/tin-tuc/${slug}/image${(index % 6) + 1}.jpg`;
}

async function updateGitHubFile(htmlContent: string): Promise<any> {
  const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
  const REPO_OWNER = "Liam-and-Son-Group";
  const REPO_NAME = "baoviet-danang";
  const FILE_PATH = "tin-tuc.html";
  const BRANCH = "master";

  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  console.log("🔄 Updating GitHub file:", FILE_PATH);

  // Get current file to get SHA (required for update)
  const getFileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;

  const getResponse = await fetch(getFileUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Supabase-Edge-Function",
    },
  });

  let sha = "";
  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
    console.log("📄 Found existing file with SHA:", sha);
  } else if (getResponse.status === 404) {
    console.log("📄 File not found, will create new file");
  } else {
    throw new Error(
      `Failed to get file info: ${getResponse.status} ${getResponse.statusText}`
    );
  }

  // Update/create file
  const updateUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  const updateData = {
    message: `🤖 Auto-update tin-tuc.html with latest articles - ${new Date().toISOString()}`,
    content: btoa(unescape(encodeURIComponent(htmlContent))), // Base64 encode with UTF-8 support
    branch: BRANCH,
    ...(sha && { sha }), // Include SHA only if file exists
  };

  const updateResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "Supabase-Edge-Function",
    },
    body: JSON.stringify(updateData),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.text();
    throw new Error(
      `Failed to update GitHub file: ${updateResponse.status} ${updateResponse.statusText} - ${errorData}`
    );
  }

  const result = await updateResponse.json();
  console.log("✅ GitHub file updated successfully:", result.commit.sha);

  return {
    commit_sha: result.commit.sha,
    commit_url: result.commit.html_url,
    file_url: result.content.html_url,
  };
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-news-page' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"articles":[...]}'

*/
