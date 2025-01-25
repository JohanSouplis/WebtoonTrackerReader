setTimeout(() => {
  const title = document.querySelector("title");

  if (title) {
    chrome.runtime.sendMessage({
      title: title.textContent,
      url: window.location.href,
    });
  } else {
    console.error("Title not found!");
  }
}, 5000);
