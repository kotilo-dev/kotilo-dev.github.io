// Swap a video thumbnail for the YouTube player only on click, so YouTube is not contacted before that.
document.querySelectorAll(".video-play").forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + a.dataset.yt + "?autoplay=1&rel=0";
    f.title = a.dataset.title;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    f.referrerPolicy = "strict-origin-when-cross-origin";
    a.replaceWith(f);
  });
});
