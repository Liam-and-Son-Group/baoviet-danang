/**
 * 📊 UPDATE SITEMAP WITH NEW ARTICLE
 *
 * Script này sẽ:
 * 1. Đọc sitemap.xml hiện tại
 * 2. Thêm URL mới cho bài viết vừa tạo
 * 3. Cập nhật lastmod date
 * 4. Lưu sitemap mới
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Update sitemap với article mới
 */
async function updateSitemap(newFilename) {
  try {
    console.log(`📊 Updating sitemap with: ${newFilename}`);

    const sitemapPath = path.join(__dirname, "../../sitemap.xml");

    // Đọc sitemap hiện tại
    let sitemapContent;
    try {
      sitemapContent = await fs.readFile(sitemapPath, "utf8");
    } catch (error) {
      console.log("⚠️ Sitemap not found, creating new one...");
      sitemapContent = createBasicSitemap();
    }

    // Tạo URL entry mới
    const baseUrl = "https://baohiembaovietdanang.vn";
    const today = new Date().toISOString().split("T")[0];

    const newUrlEntry = `  <url>
    <loc>${baseUrl}/${newFilename}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Kiểm tra xem URL đã tồn tại chưa
    if (sitemapContent.includes(`<loc>${baseUrl}/${newFilename}</loc>`)) {
      console.log("ℹ️ URL already exists in sitemap, updating lastmod...");

      // Cập nhật lastmod cho URL đã tồn tại
      const urlRegex = new RegExp(
        `(<url>\\s*<loc>${baseUrl.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}/${newFilename.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}</loc>\\s*<lastmod>)[^<]+(</lastmod>[\\s\\S]*?</url>)`,
        "g"
      );

      sitemapContent = sitemapContent.replace(urlRegex, `$1${today}$2`);
    } else {
      console.log("➕ Adding new URL to sitemap...");

      // Thêm URL mới trước tag đóng </urlset>
      sitemapContent = sitemapContent.replace(
        "</urlset>",
        `${newUrlEntry}\n</urlset>`
      );
    }

    // Lưu sitemap
    await fs.writeFile(sitemapPath, sitemapContent, "utf8");

    console.log("✅ Sitemap updated successfully!");

    return {
      success: true,
      filename: newFilename,
      updated: today,
    };
  } catch (error) {
    console.error("❌ Error updating sitemap:", error);
    throw error;
  }
}

/**
 * Tạo sitemap cơ bản nếu chưa có
 */
function createBasicSitemap() {
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://baohiembaovietdanang.vn/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://baohiembaovietdanang.vn/tin-tuc.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
}

/**
 * Main execution
 */
async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.error("❌ Usage: node update-sitemap.js <filename.html>");
    process.exit(1);
  }

  try {
    const result = await updateSitemap(filename);
    console.log("🎉 Sitemap update completed!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("💥 Sitemap update failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  updateSitemap,
  createBasicSitemap,
};
