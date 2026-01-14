/**
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  
  const div = document.createElement("div");
  div.textContent = input;
  return div.textContent || div.innerText || "";
}

/**
 * Validate and sanitize phone number
 */
function sanitizePhone(phone) {
  const sanitized = sanitizeInput(phone);
  // Remove all non-digit characters except + for international format
  return sanitized.replace(/[^\d+]/g, "").substring(0, 20);
}

/**
 * EmailJS Integration
 * 
 * ⚠️ SECURITY NOTE: For static sites, EmailJS public keys are exposed in client-side code.
 * This is acceptable for EmailJS public keys (they're designed to be public), but:
 * 
 * Best practices:
 * 1. Set up EmailJS domain restrictions in EmailJS dashboard
 * 2. Monitor usage and set up rate limiting in EmailJS
 * 3. For production, consider moving to Supabase Edge Function for better control
 * 4. Use environment variables at build time if using a build process
 * 
 * Current implementation: Client-side only (static site limitation)
 */
document.addEventListener("DOMContentLoaded", () => {
  // EmailJS credentials - Public keys are safe to expose, but monitor usage
  // TODO: Consider moving to Supabase Edge Function for production
  const EMAILJS_PUBLIC_KEY = "tdnoam3chIIX9izFA";
  const SERVICE_ID = "service_8yvyqcj";
  const TEMPLATE_ID = "template_jycweoi";

  emailjs.init(EMAILJS_PUBLIC_KEY);

  const form = document.getElementById("contact-form");
  if (!form) {
    console.error("Contact form not found");
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get and sanitize inputs
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const messageInput = document.getElementById("message");
    const statusMessage = document.getElementById("status-message");

    if (!nameInput || !phoneInput || !messageInput || !statusMessage) {
      console.error("Form elements not found");
      return;
    }

    // Sanitize all inputs
    const sanitizedName = sanitizeInput(nameInput.value).substring(0, 100);
    const sanitizedPhone = sanitizePhone(phoneInput.value);
    const sanitizedMessage = sanitizeInput(messageInput.value).substring(0, 2000);

    // Validate required fields
    if (!sanitizedName.trim()) {
      statusMessage.textContent = "Vui lòng nhập tên của bạn";
      statusMessage.style.color = "red";
      return;
    }

    if (!sanitizedPhone.trim()) {
      statusMessage.textContent = "Vui lòng nhập số điện thoại";
      statusMessage.style.color = "red";
      return;
    }

    if (!sanitizedMessage.trim()) {
      statusMessage.textContent = "Vui lòng nhập lời nhắn";
      statusMessage.style.color = "red";
      return;
    }

    // Build message safely using sanitized values
    const safeMessage = `${sanitizedMessage}. Liên hệ cho tôi qua số điện thoại ${sanitizedPhone}`;

    const templateParams = {
      name: sanitizedName,
      from_email: sanitizedPhone,
      title: "Một người liên lạc cho bạn từ trang web Bảo Việt Đà Nẵng",
      message: safeMessage,
    };

    // Disable form during submission
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Đang gửi...";
    }

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams).then(
      (response) => {
        statusMessage.textContent = "Gửi mail thành công!";
        statusMessage.style.color = "green";
        form.reset();
        
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Đăng ký tư vấn";
        }
      },
      (error) => {
        statusMessage.textContent = "Gửi mail thất bại. Vui lòng thử lại sau.";
        statusMessage.style.color = "red";
        console.error("EmailJS Error:", error);
        
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Đăng ký tư vấn";
        }
      }
    );
  });
});
