document.addEventListener("DOMContentLoaded", () => {
  const popoverBtns = document.querySelectorAll(".has-popover");

  popoverBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const currentPopover = btn.querySelector(".popover");
      if (!currentPopover) return;

      const isHidden = getComputedStyle(currentPopover).display === "none";

      document.querySelectorAll(".popover").forEach((popover) => {
        if (popover !== currentPopover) {
          popover.style.display = "none";
        }
      });

      currentPopover.style.display = isHidden ? "flex" : "none";
      currentPopover.style.flexDirection = "column";
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".popover").forEach((popover) => {
      popover.style.display = "none";
    });
  });
});
