const title = document.querySelector("title");

if (title) {
  chrome.runtime.sendMessage({
    tag: "title",
    content: title.textContent,
    url: window.location.href,
  });
}
