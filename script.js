let prompt=document.querySelector("#prompt")
let submitbtn=document.querySelector("#submit")
let chatContainer=document.querySelector(".chat-container")
let imagebtn=document.querySelector("#image")
let image=document.querySelector("#image img")
let imageinput=document.querySelector("#image input")

const Api_Url = "YOUR_SECURE_BACKEND_API_URL"; // Secure your API calls

let user = { 
  message: null, 
  file: { mime_type: null, data: null } 
};

// Gen Z Personality Context
const personalityContext = `
Hey! I'm your super chill Gen Z bot who loves to vibe with the coolest slangs. 
I'll keep it light, funny, and trendy while answering your questions! 
Feel free to ask anything, bestie.`;

async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector(".ai-chat-area");
  const queryWithContext = `${personalityContext}\nUser Query: ${user.message}`;

  const requestBody = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: queryWithContext },
            ...(user.file.data ? [{ inline_data: user.file }] : []),
          ],
        },
      ],
    }),
  };

  try {
    const response = await fetch(Api_Url, requestBody);
    const data = await response.json();
    const apiResponse = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove any extra markdown formatting
      .trim();
    text.innerHTML = apiResponse; // Update the AI chat response
  } catch (error) {
    console.error(error);
    text.innerHTML = "Oops, something went wrong! Try again, bestie. 😅";
  } finally {
    resetFileUpload();
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  }
}

function handleChatResponse(userMessage) {
  if (!userMessage.trim() && !user.file.data) return; // Validate input
  user.message = userMessage;
  addUserMessageToChat(userMessage);
  generateAIResponse();
}

function addUserMessageToChat(message) {
  const html = `
    <img src="user.png" alt="User" width="8%">
    <div class="user-chat-area">
      ${message}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="uploaded-img" />` : ""}
    </div>`;
  appendToChat(html, "user-chat-box");
}

function generateAIResponse() {
  const loadingHtml = `
    <img src="ai.png" alt="AI" width="10%">
    <div class="ai-chat-area">
      <img src="loading.webp" alt="Loading" width="50px">
    </div>`;
  const aiChatBox = appendToChat(loadingHtml, "ai-chat-box");
  generateResponse(aiChatBox);
}

function appendToChat(html, className) {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.classList.add(className);
  chatContainer.appendChild(div);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  return div;
}

function resetFileUpload() {
  image.src = "img.svg";
  image.classList.remove("uploaded");
  user.file = {};
}

// Event Listeners
prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleChatResponse(prompt.value);
});

submitbtn.addEventListener("click", () => handleChatResponse(prompt.value));
imageinput.addEventListener("change", handleFileUpload);
imagebtn.addEventListener("click", () => imageinput.click());
