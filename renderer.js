async function loadFiles() {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "Loading files...";

  const files = await window.electron.getFiles();
  fileList.innerHTML = "";

  Object.entries(files).forEach(([category, items]) => {
    if (items.length === 0) return; // Skip empty categories

    // Create category container
    const categoryContainer = document.createElement("div");
    categoryContainer.classList.add("category");

    // Create category header with toggle button
    const categoryHeader = document.createElement("div");
    categoryHeader.classList.add("category-header");
    categoryHeader.innerHTML = `<button class="toggle-category">▶</button> <span>${category.toUpperCase()}</span>`;

    const toggleButton = categoryHeader.querySelector(".toggle-category");
    const fileContainer = document.createElement("div");
    fileContainer.classList.add("file-container");
    fileContainer.style.display = "none"; // Start closed

    // Toggle visibility when clicking header
    categoryHeader.addEventListener("click", () => {
      const isClosed = fileContainer.style.display === "none";
      fileContainer.style.display = isClosed ? "block" : "none";
      toggleButton.textContent = isClosed ? "▼" : "▶"; // Change arrow direction
    });

    // Add files to category
    items.forEach((file) => {
      const fileItem = document.createElement("div");
      fileItem.classList.add("file-item");
      fileItem.innerHTML = `<span>${file.name}</span> <button class="toggle-btn">Open</button>`;

      const toggleButton = fileItem.querySelector(".toggle-btn");
      toggleButton.addEventListener("click", async () => {
        if (toggleButton.textContent === "Open") {
          const content = await window.electron.readFile(file.path);
          const contentDiv = document.createElement("pre");
          contentDiv.classList.add("file-content");
          contentDiv.textContent = content;
          fileItem.appendChild(contentDiv);
          toggleButton.textContent = "Close";
        } else {
          fileItem.querySelector(".file-content").remove();
          toggleButton.textContent = "Open";
        }
      });

      fileContainer.appendChild(fileItem);
    });

    // Append elements
    categoryContainer.appendChild(categoryHeader);
    categoryContainer.appendChild(fileContainer);
    fileList.appendChild(categoryContainer);
  });
}

document.getElementById("startServer").addEventListener("click", async () => {
  await window.electron.startServer();
  updateServerStatus();
});

document.getElementById("stopServer").addEventListener("click", async () => {
  await window.electron.stopServer();
  updateServerStatus();
});

async function updateServerStatus() {
  const status = await window.electron.getServerStatus();
  const statusElement = document.getElementById("serverStatus");

  if (status.running) {
    statusElement.textContent = "Server is RUNNING";
    statusElement.style.color = "green";
  } else {
    statusElement.textContent = "Server is STOPPED";
    statusElement.style.color = "red";
  }
}

// Call all functions
loadFiles();
updateServerStatus();
