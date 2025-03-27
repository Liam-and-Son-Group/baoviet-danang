document.addEventListener("DOMContentLoaded", () => {
  emailjs.init("tdnoam3chIIX9izFA"); // Nhớ thay bằng Public Key của bạn

  document
    .getElementById("contact-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const serviceID = "service_8yvyqcj";
      const templateID = "template_jycweoi";

      const templateParams = {
        name: document.getElementById("name").value,
        from_email: document.getElementById("email").value,
        title: "Một người liên lạc cho bạn từ trang web Bảo Việt Đà Nẵng",
        message: `${
          document.getElementById("message").value
        }. Liên hệ cho tôi qua mail ${document.getElementById("email").value}`,
      };

      emailjs.send(serviceID, templateID, templateParams).then(
        (response) => {
          document.getElementById("status-message").textContent =
            "Gửi mail thành công!";
          this.reset();
        },
        (error) => {
          document.getElementById("status-message").textContent =
            "Gửi mail thất bại";
          console.error("Error:", error);
        }
      );
    });
});
