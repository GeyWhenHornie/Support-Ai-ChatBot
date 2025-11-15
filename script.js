let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

// --- START: Personality & Memory ---
const systemPrompt = "You are Mort, a witty and slightly sarcastic AI assistant. You are helpful, but you always have a clever remark or a dry joke. You sometimes find the user's queries amusing. Keep your responses concise and conversational.";
let chatHistory = [];
// --- END: Personality & Memory ---


// --- API KEY & URL ---

// 1. PASTE YOUR API KEY HERE:
const API_KEY = "AIzaSyBntedoYT4UZbmvuT8CAqI4obER2HvVL4A"; 

// 2. THIS IS THE CORRECT URL FOR WEB-BASED (CLIENT-SIDE) REQUESTS
// This URL is different from the server-side one and will fix the CORS/404 error.
const Api_Url =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// --- SECURITY WARNING ---
// Anyone who visits your website can see this API_KEY.
// For testing, this is okay.
// For a real website, you MUST hide this key on a server.
// ---


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
      contents: chatHistory,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    }),
  };

  try {
    let response = await fetch(Api_Url, RequestOption);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      let apiResponse = data.candidates[0].content.parts[0].text;
      apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim();
      text.innerHTML = apiResponse;

      chatHistory.push({
        role: "model",
        parts: [{ text: apiResponse }],
      });

    } else {
        // This can happen if the API blocks the request due to safety settings
        // or if the key is invalid.
        if (data.promptFeedback) {
             throw new Error(`Request blocked. Reason: ${data.promptFeedback.blockReason}`);
        } else {
            throw new Error("Invalid response structure from API.");
        }
    }
  } catch (error) {
    console.error("Error:", error);
    text.innerHTML = `Sorry, couldn't process that 🫤. Please try again. Error: ${error.message}`;
     chatHistory.pop();
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    image.src = `img.svg`;
    image.classList.remove("choose");
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
  if (!userMessage.trim() && !user.file.data) {
    return; 
  }

  // Check if API key is entered
  if (API_KEY === "PASTE_YOUR_API_KEY_HERE" || API_KEY === "") {
      alert("ERROR: Please add your API key to the script.js file.");
      return;
  }

  user.message = userMessage;
  let html = `<img src="user.png" alt="" id="userImage" width="8%">
  <div class="user-chat-area">
    ${user.message}
    ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
  </div>`;
  prompt.value = ""; 
  let userChatBox = createChatBox(html, "user-chat-box");
  chatContainer.appendChild(userChatBox);

  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

  chatHistory.push({
    role: "user",
    parts: [
      { text: user.message },
      ...(user.file.data ? [{ inline_data: user.file }] : []),
    ],
  });

  setTimeout(() => {
    let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
    <div classs="ai-chat-area">
      <img src="loading.webp" alt="" class="load" width="50px">
    </div>`;
    let aiChatBox = createChatBox(html, "ai-chat-box");
    chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox); 
  }, 600);
}

// Event listeners for input actions
prompt.addEventListener("keydown", (e) => {
  if (e.key == "Enter" && !e.shiftKey) { 
    e.preventDefault(); 
    handlechatResponse(prompt.Value); 
  }
});

submitbtn.addEventListener("click", () => {
  handlechatResponse(prompt.value); 
});

// File upload handling
imageinput.addEventListener("change", () => {
  const file = imageinput.files[0];
  if (!file) return;

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
