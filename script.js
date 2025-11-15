let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

// --- START: Personality & Memory ---

// 1. Define the Chatbot's Personality
// This system prompt tells the AI how to act.
const systemPrompt = "You are Mort, a witty and slightly sarcastic AI assistant. You are helpful, but you always have a clever remark or a dry joke. You sometimes find the user's queries amusing. Keep your responses concise and conversational.";

// 2. Create a Chat History
// This array will store the entire conversation.
let chatHistory = [];

// --- END: Personality & Memory ---

// NOTE: I've replaced your hardcoded API key with "".
// The Canvas environment will automatically provide the necessary key.
const Api_Url =
  "https://generativanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

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

  // 3. Update the API request payload
  let RequestOption = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory, // Send the entire chat history
      systemInstruction: {
        parts: [{ text: systemPrompt }] // Send the personality prompt
      },
    }),
  };

  try {
    let response = await fetch(Api_Url, RequestOption);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    // Check if the API response is valid
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let apiResponse = data.candidates[0].content.parts[0].text;
      apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim(); // Clean up Markdown-like bold text
      text.innerHTML = apiResponse;

      // 4. Add the AI's response to the history
      chatHistory.push({
        role: "model",
        parts: [{ text: apiResponse }],
      });

    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.error("Error:", error);
    text.innerHTML = `Sorry, couldn't process that 🫤. Please try again. Error: ${error.message}`;
     // If the API fails, remove the last user message from history to allow a retry
     chatHistory.pop();
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    image.src = `img.svg`;
    image.classList.remove("choose");
    // Clear the current turn's file data
    user.file = { mime_type: null, data: null };
    user.message = null;
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
  // Check if there is neither text nor a file
  if (!userMessage.trim() && !user.file.data) {
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

  // 5. Add the user's message to the history *before* calling the API
  chatHistory.push({
    role: "user",
    parts: [
      { text: user.message },
      ...(user.file.data ? [{ inline_data: user.file }] : []),
    ],
  });

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
  if (e.key == "Enter" && !e.shiftKey) { // Added !e.shiftKey to allow new lines
    e.preventDefault(); // Prevent new line on Enter
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
