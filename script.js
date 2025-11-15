let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

const Api_Url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBntedoYT4UZbmvuT8CAqI4obER2HvVL4A";

let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

// Function to generate AI response from the API
async function generateResponse(aiChatBox) {
  let text = aiChatBox.querySelector(".ai-chat-area");
  let RequestOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `my query: "${user.message}".`,
            },
            ...(user.file.data ? [{ inline_data: user.file }] : []),
          ],
        },
      ],
    }),
  };

  try {
    let response = await fetch(Api_Url, RequestOption);
    let data = await response.json();

    // Check if the API response is valid
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let apiResponse = data.candidates[0].content.parts[0].text;
      apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim(); // Clean up Markdown-like bold text
      text.innerHTML = apiResponse;
    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.error("Error:", error);
    text.innerHTML = `Sorry, couldn't process that 🫤. Please try again. Error: ${error.message}`;
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    image.src = `img.svg`;
    image.classList.remove("choose");
    user.file = {};
  }
}

// Function to create the chat box element
function createChatBox(html, classes) {
  let div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

// Function to handle the user's message and display it
function handlechatResponse(userMessage) {
  if (!userMessage.trim()) {
    return; // Prevent empty messages
  }

  user.message = userMessage;
  let html = `<img src="user.png" alt="" id="userImage" width="8%">
  <div class="user-chat-area">
    ${user.message}
    ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
  </div>`;
  prompt.value = ""; // Clear the input field
  let userChatBox = createChatBox(html, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
    <div class="ai-chat-area">
      <img src="loading.webp" alt="" class="load" width="50px">
    </div>`;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox); // Trigger AI response generation
  }, 600);
}

// Event listeners for input actions
prompt.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    handlechatResponse(prompt.value); // Handle sending message on Enter
  }
});

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value); // Handle sending message on "Send" button click
});

// File upload handling
imageinput.addEventListener("change", () => {
  const file = imageinput.files[0];
  if (!file) return;

  // Validate the file type
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file.");
    return;
  }

  let reader = new FileReader();
  reader.onload = (e) => {
    let base64string = e.target.result.split(",")[1];
    user.file = {
      mime_type: file.type,
      data: base64string,
    };
    image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
    image.classList.add("choose");
  };

  reader.readAsDataURL(file);
});

// Trigger the file input when the image button is clicked
imagebtn.addEventListener("click", () => {
  imagebtn.querySelector("input").click();
});
