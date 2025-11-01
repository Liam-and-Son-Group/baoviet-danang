/**
 * News Template Engine - Advanced template processing system
 * Supports variables, conditionals, loops, helpers, and template inheritance
 */

class NewsTemplateEngine {
  constructor() {
    this.templateCache = new Map();
    this.maxCacheSize = 50;

    // Regex patterns for different template features
    this.placeholderRegex = /\{\{([^}]+)\}\}/g;
    this.conditionalRegex = /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;
    this.loopRegex = /\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs;
    this.helperRegex = /\{\{(\w+)\s+([^}]+)\}\}/g;
    this.includeRegex = /\{\{include\s+"([^"]+)"\}\}/g;

    // Initialize helpers
    this.initializeHelpers();
  }

  /**
   * Main template processing method
   * @param {string} templatePath - Path to template file
   * @param {object} data - Data to fill into template
   * @returns {Promise<string>} - Processed HTML
   */
  async processTemplate(templatePath, data) {
    try {
      console.log("🔄 Processing template:", templatePath);

      // 1. Load template with caching
      let template = await this.loadTemplate(templatePath);

      // 2. Process includes first
      template = await this.processIncludes(template);

      // 3. Process loops
      template = this.processLoops(template, data);

      // 4. Process conditionals
      template = this.processConditionals(template, data);

      // 5. Process helpers
      template = this.processHelpers(template, data);

      // 6. Simple variable replacement
      template = this.replaceSimpleVariables(template, data);

      // 7. Clean up unused placeholders
      template = this.cleanupTemplate(template);

      console.log("✅ Template processed successfully");
      return template;
    } catch (error) {
      console.error("❌ Template processing failed:", error);
      throw new Error(`Template processing failed: ${error.message}`);
    }
  }

  /**
   * Load template from file with caching
   * @param {string} templatePath - Path to template file
   * @returns {Promise<string>} - Template content
   */
  async loadTemplate(templatePath) {
    // Check cache first
    if (this.templateCache.has(templatePath)) {
      console.log("📋 Loading from cache:", templatePath);
      return this.templateCache.get(templatePath);
    }

    try {
      console.log("📁 Loading template file:", templatePath);
      const response = await fetch(templatePath);

      if (!response.ok) {
        throw new Error(
          `Failed to load template: ${response.status} - ${response.statusText}`
        );
      }

      const template = await response.text();

      // Cache the template
      this.cacheTemplate(templatePath, template);

      return template;
    } catch (error) {
      throw new Error(`Template loading failed: ${error.message}`);
    }
  }

  /**
   * Cache template with LRU eviction
   * @param {string} path - Template path
   * @param {string} content - Template content
   */
  cacheTemplate(path, content) {
    if (this.templateCache.size >= this.maxCacheSize) {
      // Remove oldest entry (LRU)
      const firstKey = this.templateCache.keys().next().value;
      this.templateCache.delete(firstKey);
    }
    this.templateCache.set(path, content);
  }

  /**
   * Process template includes
   * @param {string} template - Template content
   * @returns {Promise<string>} - Template with includes processed
   */
  async processIncludes(template) {
    const includePromises = [];
    const includeMatches = [...template.matchAll(this.includeRegex)];

    for (const match of includeMatches) {
      const [fullMatch, includePath] = match;
      includePromises.push(
        this.loadTemplate(`./templates/${includePath}`)
          .then((includeContent) => ({ fullMatch, includeContent }))
          .catch((error) => {
            console.warn(`⚠️ Include failed: ${includePath}`, error);
            return {
              fullMatch,
              includeContent: `<!-- Include failed: ${includePath} -->`,
            };
          })
      );
    }

    const resolvedIncludes = await Promise.all(includePromises);

    let processedTemplate = template;
    for (const { fullMatch, includeContent } of resolvedIncludes) {
      processedTemplate = processedTemplate.replace(fullMatch, includeContent);
    }

    return processedTemplate;
  }

  /**
   * Process loops in template
   * @param {string} template - Template content
   * @param {object} data - Data object
   * @returns {string} - Template with loops processed
   */
  processLoops(template, data) {
    return template.replace(this.loopRegex, (match, arrayPath, loopContent) => {
      const array = this.getNestedValue(data, arrayPath.trim());

      if (!Array.isArray(array) || array.length === 0) {
        return "";
      }

      return array
        .map((item, index) => {
          const loopData = {
            ...data,
            ...item,
            __index: index,
            __first: index === 0,
            __last: index === array.length - 1,
            __length: array.length,
          };

          return this.replaceSimpleVariables(loopContent, loopData);
        })
        .join("");
    });
  }

  /**
   * Process conditionals in template
   * @param {string} template - Template content
   * @param {object} data - Data object
   * @returns {string} - Template with conditionals processed
   */
  processConditionals(template, data) {
    return template.replace(
      this.conditionalRegex,
      (match, condition, content) => {
        const shouldRender = this.evaluateCondition(condition.trim(), data);

        if (shouldRender) {
          // Recursively process nested conditionals and loops
          let processedContent = this.processConditionals(content, data);
          processedContent = this.processLoops(processedContent, data);
          return processedContent;
        }

        return "";
      }
    );
  }

  /**
   * Evaluate conditional expressions
   * @param {string} condition - Condition to evaluate
   * @param {object} data - Data object
   * @returns {boolean} - Evaluation result
   */
  evaluateCondition(condition, data) {
    // Handle negation: !variable
    if (condition.startsWith("!")) {
      return !this.getNestedValue(data, condition.slice(1).trim());
    }

    // Handle equality: variable === "value"
    if (condition.includes("===")) {
      const [left, right] = condition.split("===").map((s) => s.trim());
      const leftValue = this.getNestedValue(data, left);
      const rightValue = right.replace(/['"]/g, "");
      return leftValue === rightValue;
    }

    // Handle inequality: variable !== "value"
    if (condition.includes("!==")) {
      const [left, right] = condition.split("!==").map((s) => s.trim());
      const leftValue = this.getNestedValue(data, left);
      const rightValue = right.replace(/['"]/g, "");
      return leftValue !== rightValue;
    }

    // Simple existence check
    const value = this.getNestedValue(data, condition);
    return !!value;
  }

  /**
   * Process helper functions
   * @param {string} template - Template content
   * @param {object} data - Data object
   * @returns {string} - Template with helpers processed
   */
  processHelpers(template, data) {
    return template.replace(this.helperRegex, (match, helperName, args) => {
      const helper = this.helpers[helperName];
      if (!helper) {
        console.warn(`⚠️ Unknown helper: ${helperName}`);
        return match;
      }

      try {
        const parsedArgs = this.parseHelperArgs(args, data);
        return helper.apply(this, parsedArgs);
      } catch (error) {
        console.error(`❌ Helper error (${helperName}):`, error);
        return match;
      }
    });
  }

  /**
   * Parse helper function arguments
   * @param {string} argsString - Arguments string
   * @param {object} data - Data object
   * @returns {Array} - Parsed arguments
   */
  parseHelperArgs(argsString, data) {
    const args = [];
    const parts = argsString.split(/\s+/);

    for (const part of parts) {
      if (part.startsWith('"') && part.endsWith('"')) {
        // String literal
        args.push(part.slice(1, -1));
      } else if (part.startsWith("'") && part.endsWith("'")) {
        // String literal
        args.push(part.slice(1, -1));
      } else if (!isNaN(part)) {
        // Number
        args.push(Number(part));
      } else {
        // Variable reference
        args.push(this.getNestedValue(data, part));
      }
    }

    return args;
  }

  /**
   * Simple variable replacement
   * @param {string} template - Template content
   * @param {object} data - Data object
   * @returns {string} - Template with variables replaced
   */
  replaceSimpleVariables(template, data) {
    return template.replace(this.placeholderRegex, (match, key) => {
      const value = this.getNestedValue(data, key.trim());

      if (value === undefined || value === null) {
        return "";
      }

      return String(value);
    });
  }

  /**
   * Get nested object value by path
   * @param {object} obj - Object to search
   * @param {string} path - Dot-notation path
   * @returns {any} - Found value or undefined
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Clean up unused placeholders and whitespace
   * @param {string} template - Template content
   * @returns {string} - Cleaned template
   */
  cleanupTemplate(template) {
    // Remove unused placeholders
    template = template.replace(/\{\{[^}]+\}\}/g, "");

    // Clean up extra whitespace but preserve intentional formatting
    template = template.replace(/\n\s*\n\s*\n/g, "\n\n");

    return template.trim();
  }

  /**
   * Initialize helper functions
   */
  initializeHelpers() {
    this.helpers = {
      // Date formatting
      formatDate: (date, format = "DD/MM/YYYY") => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";

        return d.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },

      // Text truncation
      truncate: (text, length = 100) => {
        if (!text) return "";
        return text.length > length ? text.substring(0, length) + "..." : text;
      },

      // URL slugification
      slugify: (text) => {
        if (!text) return "";
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/đ/g, "d")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .trim("-");
      },

      // Capitalize first letter
      capitalize: (text) => {
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1);
      },

      // Convert to uppercase
      upper: (text) => {
        if (!text) return "";
        return text.toUpperCase();
      },

      // Convert to lowercase
      lower: (text) => {
        if (!text) return "";
        return text.toLowerCase();
      },

      // Default value if empty
      default: (value, defaultValue) => {
        return value || defaultValue;
      },

      // Current date
      now: (format = "DD/MM/YYYY") => {
        return new Date().toLocaleDateString("vi-VN");
      },

      // Generate canonical URL
      canonical: (filename, domain = "https://baohiembaovietdanang.vn") => {
        return `${domain}/${filename}`;
      },
    };
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    console.log("🗑️ Template cache cleared");
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getCacheStats() {
    return {
      size: this.templateCache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.templateCache.keys()),
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = NewsTemplateEngine;
}

// Make available globally in browser
if (typeof window !== "undefined") {
  window.NewsTemplateEngine = NewsTemplateEngine;
}
