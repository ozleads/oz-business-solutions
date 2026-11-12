document.querySelector(".menu").addEventListener("click", function () {
  var open = document.body.classList.toggle("nav-open");
  this.setAttribute("aria-expanded", open ? "true" : "false");
});
