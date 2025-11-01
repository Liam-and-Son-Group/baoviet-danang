/**
 * 🧪 TEST TEMPLATE WITHOUT SUPABASE
 */
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Template engine from main script
class SimpleTemplateEngine {
  static async replaceVariables(template, data) {
    let result = template;

    // Process includes
    result = await this.processIncludes(result);
    
    // Process helpers
    result = this.processHelpers(result, data);

    // Replace simple variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\\\{\\\\{\\\\s*${key}\\\\s*\\\\}\\\\}`, "g");
      result = result.replace(regex, value || "");
    }

    return result;
  }

  static async processIncludes(template) {
    const includeRegex = /\\{\\{include\\s+"([^"]+)"\\}\\}/g;
    let result = template;
    const matches = [...template.matchAll(includeRegex)];

    for (const match of matches) {
      const [fullMatch, includePath] = match;
      try {
        console.log(`📄 Loading partial: ${includePath}`);
        const fullPath = path.join(__dirname, includePath);
        const partialContent = await fs.readFile(fullPath, 'utf8');
        result = result.replace(fullMatch, partialContent);
        console.log(`✅ Included: ${includePath}`);
      } catch (error) {
        console.warn(`⚠️ Could not include ${includePath}:`, error.message);
        result = result.replace(fullMatch, `<!-- Could not load ${includePath} -->`);
      }
    }

    return result;
  }

  static processHelpers(template, data) {
    let result = template;

    // {{formatDate field}}
    result = result.replace(/\\{\\{formatDate\\s+(\\w+)\\}\\}/g, (match, field) => {
      const dateValue = data[field];
      if (!dateValue) return "";
      const date = new Date(dateValue);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });

    // {{canonical filename}}
    result = result.replace(/\\{\\{canonical\\s+(\\w+)\\}\\}/g, (match, field) => {
      const filename = data[field];
      return filename ? `https://baoviet-dn.com/${filename}` : "";
    });

    // {{upper text}}
    result = result.replace(/\\{\\{upper\\s+(\\w+)\\}\\}/g, (match, field) => {
      const value = data[field];
      return value ? value.toUpperCase() : "";
    });

    return result;
  }

  static createExcerpt(content, maxLength = 160) {
    const text = content.replace(/<[^>]*>/g, "");
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }
}

// Test data
const testData = {
  title: "Test Article với Header Footer",
  description: "Đây là test article để kiểm tra header và footer có hiển thị đúng không",
  content: "<h2>Nội dung test</h2><p>Đây là nội dung test để xem template có render đúng header và footer không.</p>",
  category: "Tin tức test",
  keywords: "test, header, footer, template",
  publishDate: "2024-11-01T00:00:00Z",
  filename: "test-header-footer.html",
  
  meta: {
    description: "Test description",
    keywords: "test, template",
    author: "Bảo Việt Đà Nẵng",
    robots: "index, follow"
  },
  
  site: {
    name: "Bảo Việt Đà Nẵng"
  }
};

async function testTemplate() {
  try {
    console.log("🎨 Loading template...");
    const template = await fs.readFile('templates/news/article.html', 'utf8');
    
    console.log("⚙️ Processing template...");
    const result = await SimpleTemplateEngine.replaceVariables(template, testData);
    
    console.log("💾 Saving test file...");
    await fs.writeFile('test-template-output.html', result, 'utf8');
    
    console.log("✅ Template test completed!");
    console.log("📄 Output file: test-template-output.html");
    console.log(`📊 File size: ${(result.length / 1024).toFixed(2)} KB`);
    
    // Check if header/footer are included
    if (result.includes('<nav class="head-wrapper">')) {
      console.log("✅ Header included successfully!");
    } else {
      console.log("❌ Header missing!");
    }
    
    if (result.includes('<footer class="footer-infor">')) {
      console.log("✅ Footer included successfully!");
    } else {
      console.log("❌ Footer missing!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testTemplate();
