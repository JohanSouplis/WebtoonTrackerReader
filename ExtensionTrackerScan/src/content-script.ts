const SEND_DELAY_MS = 5000;

setTimeout(() => {
  const title = document.querySelector('title');

  if (title) {
    chrome.runtime.sendMessage({
      pageTitle: title.textContent,
      url: window.location.href,
    });
  } else {
    console.error('Title not found!');
  }
}, SEND_DELAY_MS);
