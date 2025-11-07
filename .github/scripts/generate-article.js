/**
 * 🏗️ GENERATE ARTICLE HTML FROM SUPABASE DATA
 *
 * Script này sẽ:
 * 1. Lấy dữ liệu bài viết từ Supabase
 * 2. Render HTML bằng template engine
 * 3. Tạo file HTML mới trong repository
 *
 * Environment Variables:
 * - SUPABASE_URL: Từ GitHub Secrets hoặc .env file
 * - SUPABASE_ANON_KEY: Từ GitHub Secrets hoặc .env file
 */

// Load environment variables từ .env file (chỉ cho local development)
// GitHub Actions sẽ override với GitHub Secrets
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;
const path = require("path");

// Khởi tạo Supabase client
// Priority: GitHub Secrets > .env file > undefined
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log("🔍 Environment check:");
console.log(
  `  - Running in: ${process.env.GITHUB_ACTIONS ? "GitHub Actions" : "Local"}`
);
console.log(`  - SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
console.log(`  - SUPABASE_ANON_KEY: ${supabaseKey ? "✅ Set" : "❌ Missing"}`);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  console.error(
    "💡 For GitHub Actions: Set SUPABASE_URL and SUPABASE_ANON_KEY in repository secrets"
  );
  console.error("💡 For local development: Create .env file with credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Simple template engine để replace placeholders
 */
class SimpleTemplateEngine {
  static async replaceVariables(template, data) {
    let result = template;

    // 🔄 Replace includes {{include "path"}} TRƯỚC KHI xử lý variables
    result = await this.processIncludes(result);

    // 🔧 Replace helper functions
    result = this.processHelpers(result, data);

    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(regex, value || "");
    }

    // Replace conditionals {{#if variable}}content{{/if}}
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs,
      (match, condition, content) => {
        return data[condition] ? content : "";
      }
    );

    // Replace each loops {{#each array}}{{item}}{{/each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs,
      (match, arrayName, itemTemplate) => {
        const array = data[arrayName];
        if (!Array.isArray(array)) return "";

        return array
          .map((item) => {
            let itemHtml = itemTemplate;
            for (const [key, value] of Object.entries(item)) {
              const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
              itemHtml = itemHtml.replace(regex, value || "");
            }
            return itemHtml;
          })
          .join("");
      }
    );

    return result;
  }

  /**
   * 🔧 Process helper functions như {{formatDate}}, {{canonical}}, etc
   */
  static processHelpers(template, data) {
    let result = template;

    // {{formatDate publishDate}}
    result = result.replace(/\{\{formatDate\s+(\w+)\}\}/g, (match, field) => {
      const dateValue = data[field];
      return dateValue ? this.formatDate(dateValue) : "";
    });

    // {{canonical filename}}
    result = result.replace(/\{\{canonical\s+(\w+)\}\}/g, (match, field) => {
      const filename = data[field];
      return filename ? `https://baohiembaovietdanang.vn/${filename}` : "";
    });

    // {{upper text}}
    result = result.replace(/\{\{upper\s+(\w+)\}\}/g, (match, field) => {
      const value = data[field];
      return value ? value.toUpperCase() : "";
    });

    // {{truncate text length}}
    result = result.replace(
      /\{\{truncate\s+(\w+\.\w+)\s+(\d+)\}\}/g,
      (match, fieldPath, length) => {
        const value = this.getNestedValue(data, fieldPath);
        return value ? this.createExcerpt(value, parseInt(length)) : "";
      }
    );

    // {{default value fallback}}
    result = result.replace(
      /\{\{default\s+(\w+\.\w+)\s+"([^"]+)"\}\}/g,
      (match, fieldPath, fallback) => {
        const value = this.getNestedValue(data, fieldPath);
        return value || fallback;
      }
    );

    return result;
  }

  /**
   * 🔍 Get nested object value (e.g., "meta.description")
   */
  static getNestedValue(obj, path) {
    return path
      .split(".")
      .reduce((current, key) => current && current[key], obj);
  }

  /**
   * 🔄 Process {{include "path"}} statements
   */
  static async processIncludes(template) {
    const includeRegex = /\{\{include\s+"([^"]+)"\}\}/g;
    let result = template;
    const matches = [...template.matchAll(includeRegex)];

    for (const match of matches) {
      const [fullMatch, includePath] = match;
      try {
        console.log(`📄 Loading partial: ${includePath}`);
        const partialContent = await loadTemplate(includePath);
        result = result.replace(fullMatch, partialContent);
        console.log(`✅ Included: ${includePath}`);
      } catch (error) {
        console.warn(`⚠️ Could not include ${includePath}:`, error.message);
        result = result.replace(
          fullMatch,
          `<!-- Could not load ${includePath} -->`
        );
      }
    }

    return result;
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static createExcerpt(content, maxLength = 160) {
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }
}

/**
 * Load template từ file
 */
async function loadTemplate(templatePath) {
  try {
    const fullPath = path.join(__dirname, "../../", templatePath);
    return await fs.readFile(fullPath, "utf8");
  } catch (error) {
    console.error(`❌ Could not load template: ${templatePath}`, error);
    throw error;
  }
}

/**
 * Lấy dữ liệu bài viết từ Supabase
 */
async function getArticleFromSupabase(articleId) {
  try {
    console.log(`📥 Fetching article ID: ${articleId}`);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      throw error;
    }

    if (!data) {
      throw new Error(`Article with ID ${articleId} not found`);
    }

    console.log(`✅ Article found: ${data.title}`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching article:", error);
    throw error;
  }
}

/**
 * Prepare template data với đầy đủ nested objects
 */
function prepareTemplateData(article) {
  const baseUrl = "https://baohiembaovietdanang.vn";
  const filename = article.filename || "article.html";

  return {
    title: article.title,
    description: article.description,
    content: article.content,
    category: article.category || "Tin tức",
    keywords: article.keywords || "",
    publishDate: article.published_date || article.created_at,
    publishDateISO: article.published_date || article.created_at?.split("T")[0],
    excerpt: SimpleTemplateEngine.createExcerpt(
      article.description || article.content
    ),
    filename: filename,

    // 🔧 Meta object for template
    meta: {
      description:
        article.description ||
        SimpleTemplateEngine.createExcerpt(article.content),
      keywords: article.keywords || "",
      author: "Bảo Hiểm Bảo Việt Đà Nẵng",
      robots:
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      image: article.featured_image || `${baseUrl}/assets/logo.png`,
      imageAlt: article.title,
      featured: article.is_featured || false,
    },

    // 🌐 Site object for template
    site: {
      name: "Bảo Hiểm Bảo Việt Đà Nẵng",
      url: baseUrl,
    },

    // 📊 Analytics object
    analytics: {
      gtag: "G-XXXXXXXXXX", // Thay bằng Google Analytics ID thật
    },

    // 🏷️ Tags array
    tags: article.tags ? article.tags.split(",").map((tag) => tag.trim()) : [],

    // ✍️ Author object
    author: {
      name: article.author_name || "Bảo Việt Đà Nẵng",
      bio: article.author_bio || "Chuyên gia tư vấn bảo hiểm",
    },

    // 📅 Dates
    modifiedDate: article.updated_at || article.created_at,
    readTime: Math.ceil((article.content?.length || 0) / 1000), // Estimate reading time

    // 📜 Custom scripts array
    customScripts: article.custom_scripts
      ? article.custom_scripts.split(",")
      : [],

    // SEO Meta tags (backward compatibility)
    metaTitle: article.title,
    metaDescription: article.description,
    metaKeywords: article.keywords,

    // Structured data
    structuredData: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.published_date || article.created_at,
      author: {
        "@type": "Organization",
        name: "Bảo Việt Đà Nẵng",
      },
      publisher: {
        "@type": "Organization",
        name: "Bảo Việt Đà Nẵng",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/assets/logo.png`,
        },
      },
    }),

    // Site info
    siteName: "Bảo Việt Đà Nẵng",
    siteUrl: baseUrl,
    logoUrl: "/assets/logo.png",

    // Current year for footer
    currentYear: new Date().getFullYear(),
  };
}

/**
 * Generate và save HTML file
 */
async function generateAndSaveArticle(articleId, filename) {
  try {
    console.log("🚀 Starting article generation...");

    // 1. Lấy dữ liệu từ Supabase
    const article = await getArticleFromSupabase(articleId);

    // 2. Load template
    console.log("📄 Loading template...");
    const template = await loadTemplate("templates/news/article.html");

    // 3. Prepare data
    console.log("⚙️ Preparing template data...");
    const templateData = prepareTemplateData(article);

    // 4. Render template
    console.log("🎨 Rendering template...");
    const renderedHTML = await SimpleTemplateEngine.replaceVariables(
      template,
      templateData
    );

    // 5. Save file
    const outputPath = path.join(__dirname, "../../", filename);
    console.log(`💾 Saving to: ${outputPath}`);

    await fs.writeFile(outputPath, renderedHTML, "utf8");

    console.log(`✅ Successfully generated: ${filename}`);
    console.log(`📊 File size: ${(renderedHTML.length / 1024).toFixed(2)} KB`);

    return {
      success: true,
      filename,
      size: renderedHTML.length,
      title: article.title,
    };
  } catch (error) {
    console.error("❌ Error generating article:", error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const articleId = process.argv[2];
  const filename = process.argv[3];

  if (!articleId || !filename) {
    console.error(
      "❌ Usage: node generate-article.js <article_id> <filename.html>"
    );
    process.exit(1);
  }

  try {
    const result = await generateAndSaveArticle(articleId, filename);
    console.log("🎉 Generation completed successfully!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("💥 Generation failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateAndSaveArticle,
  SimpleTemplateEngine,
  prepareTemplateData,
};
