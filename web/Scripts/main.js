

//Global varibles
var Language = "English";
var mode = 0;
var correct_answer;

//initial prompting is done in the innit function, baed on current exhibit
const history = []
let exhibit = "";

//Audio globals
let mediaRecorder; // To manage the recording state
let audioChunks = []; // To store audio data
let isRecording = false; // To track recording state

//API Stuff

document.addEventListener('DOMContentLoaded', function() {
    particlesJS('particles-js', {
      particles: {
        number: {
          value: 40, // Number of particles
        },
        color: {
          value: "#ffffff", // Particle color
        },
        shape: {
          type: "circle", // Shape of particles
        },
        opacity: {
          value: 0.5, // Particle opacity
        },
        size: {
          value: 5, // Particle size
          "random": true,
        },
        move: {
          enable: true,
          speed: 3, // Particle speed
          "random": true,
        },
        "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.4,
      "width": 1
    }   
      }
    });
  });


  async function toggleMicrophoneIcon() {
    const microphoneIcon = document.getElementById('microphoneIcon');
    
    if (!microphoneIcon) {
      console.error('Element with ID "microphoneIcon" not found.');
      return;
    }
    
    microphoneIcon.classList.toggle('on');
  
    if (isRecording) {
      // Stop the recording
      mediaRecorder.stop();
      isRecording = false;
      console.log('Recording stopped');
    } else {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          // Create an audio blob and URL for playback
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

            transcripeFile(audioFile)
           .then((transcript) => { addTranscript(transcript.transcription);
              history[history.length] = {"role": "user", 
                "content" : transcript.transcription}
                generateResponce();
              }
             ) // Handle async function
          .catch((error) => console.error("Error in transcription:", error));
          audioChunks = [];
        };
        
        // Start recording
        mediaRecorder.start();
        isRecording = true;
        console.log('Recording started');
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  }

function toggleLanguageElements() {
    // Define the elements and their classes to toggle
    const elements = [
      { id: 'langaugeIcon', class1: 'active', class2: 'inactive' },
      { id: 'languageList', class1: 'ulactive', class2: 'ULinactive' }
    ];
  
    // Iterate through each element and toggle the classes
    elements.forEach(({ id, class1, class2 }) => {
      const element = document.getElementById(id);
      if (element) {
        if (element.classList.contains(class1)) {
          element.classList.replace(class1, class2);
        } else {
          element.classList.replace(class2, class1);
        }
      } else {
        console.error(`Element with ID "${id}" not found.`);
      }
    });
  }

function updateLanguage(newLanguage){
  document.getElementById("buttonA").style.opacity = 0;
   document.getElementById("buttonB").style.opacity = 0;
  document.getElementById("buttonC").style.opacity = 0;
   document.getElementById("buttonD").style.opacity = 0;
  mode=0;
  setMode();
  console.log("ping");
  Language = newLanguage;
  history[history.length] = {"role": "system", "content": ("The user has switched the current langauge to: " + Language)};
  translate("Hello, I'm now speaking in " + Language + " Click the microphone icon below to talk to me!").then( words => addResponce(words, null, "3vh"));
  translateButtons();
  toggleLanguageElements();
}

function spinOn(){
  const element = document.getElementById("spins");
  element.classList.add("spinOn");
}

function spinOff(){
  const element = document.getElementById("spins");
  element.classList.remove("spinOn");
}

  function setClassesOfElements(
    textBoxClass, Circle1Class, Circle2Class, buttonPrompt, buttonPrompt2,
    buttonPrompt3, buttonTrue, buttonFalse, buttonA, buttonB, buttonC, buttonD,
    backArrowClass
  ) {
    // Get all the necessary elements by ID
    const textBox = document.getElementById("textBox");
    const circle1 = document.getElementById("circleImage");
    const circle2 = document.getElementById("circleImage2");
    const buttonPromptEl = document.getElementById("prompt");
    const buttonPrompt2El = document.getElementById("leftPrompt");
    const buttonPrompt3El = document.getElementById("rightPrompt");
    const buttonTrueEl = document.getElementById("trueButton");
    const buttonFalseEl = document.getElementById("falseButton");
    const buttonAEl = document.getElementById("buttonA");
    const buttonBEl = document.getElementById("buttonB");
    const buttonCEl = document.getElementById("buttonC");
    const buttonDEl = document.getElementById("buttonD");
    const backArrow = document.getElementById("backArrow");
    // Circle 1 - Toggle .circleTransition
    if (Circle1Class) {
      circle1.classList.add("circleTransition");
      circle1.classList.remove("circleImage");
    } else {
      circle1.classList.remove("circleTransition");
      circle1.classList.add("circleImage");

    }
  
    // Circle 2 - Toggle .circleTransition
    if (Circle2Class) {
      circle2.classList.add("circleTransition");
      circle2.classList.remove("circleImage2");
    } else {
      circle2.classList.remove("circleTransition");
      circle2.classList.add("circleImage2");
    }
  
    // Buttons - Toggle .activeButton and .inactiveButton
    function toggleButtonClass(buttonElement, isActive) {
      if (isActive) {
        buttonElement.classList.add("activeButton");
        buttonElement.classList.remove("inactiveButton");
      } else {
        buttonElement.classList.add("inactiveButton");
        buttonElement.classList.remove("activeButton");
      }
    }
  
    toggleButtonClass(buttonPromptEl, buttonPrompt);
    toggleButtonClass(buttonPrompt2El, buttonPrompt2);
    toggleButtonClass(buttonPrompt3El, buttonPrompt3);
    toggleButtonClass(buttonTrueEl, buttonTrue);
    toggleButtonClass(buttonFalseEl, buttonFalse);
    toggleButtonClass(buttonAEl, buttonA);
    toggleButtonClass(buttonBEl, buttonB);
    toggleButtonClass(buttonCEl, buttonC);
    toggleButtonClass(buttonDEl, buttonD);
  
    // Text box - Toggle .lower
    if (textBoxClass) {
      textBox.classList.add("lower");
    } else {
      textBox.classList.remove("lower");
    }

    if (backArrowClass) {
      
      backArrow.classList.add("show");
      backArrow.classList.remove("hidden");
    } else {
      backArrow.classList.remove("show");
      backArrow.classList.add("hidden");
    }
  }

function setMode(){
  console.log(mode);
  //textBoxClass, Circle1Class, Circle2Class, buttonPrompt, buttonPrompt2, buttonPrompt3, buttonTrue, buttonFalse, buttonA, buttonB, buttonC, buttonD
  if(mode == 0){
    //Deafaut
    setClassesOfElements(false, false, false, true, false, false, false, false, false, false, false, false, false);
  }
  if(mode == 1){
    //Circle1Big
    setClassesOfElements(true, true, false, true, false, false, false, false, false, false, false, false, false);
  }
  if(mode == 2){
    //Circle2Big
    setClassesOfElements(true, false, true, true, false, false, false, false, false, false, false, false, false);
  }
  //Quiz promt TF / mC
  if(mode == 3){
    setClassesOfElements(false, false, false, false, true, true, false, false, false, false, false, false, true);
  }
  //TF
  if(mode == 4){
    setClassesOfElements(false, false, false, false, false, false, true, true, false, false, false, false, true);
  }
  //MC
  if(mode == 5){
    setClassesOfElements(false, false, false, false, false, false, false, false, true, true, true, true, true);
  }
}

function modder(){
  mode = (mode + 1) % 6
  setMode(mode);

  addResponce("Do you wnat to know whats up?");
  addTranscript("Yes I would yep");
}

function addTranscript(transcript, size) {
  if(!size){
    size = "1.5vh";
  }

  const textBoxContainer = document.getElementById('textBox');

  if (!textBoxContainer) {
    console.error('Element with ID "textBox" not found.');
    return;
  }

    // Slide down existing text boxes
    Array.from(textBoxContainer.children).forEach((child) => {
      child.style.transition = 'transform 0.3s';
      child.style.transform = 'translateY(20%)'; // Move existing text boxes up (change percentage to new txtbox high?)
    });

  // Create a new text box element
  const textBox = document.createElement('p');
  textBox.innerHTML = transcript;
  textBox.style.cssText = `
    width: 95%;
    color: yellow;
    text-align: right;
    opacity: 0;
    transition: 1s ease;
    font-size:` + size + ` ;
    float: right;
    
  `;

  // Append the text box to the container
// Insert the new text box at the top of the container
if (textBoxContainer.firstChild) {
  textBoxContainer.insertBefore(textBox, textBoxContainer.firstChild);
} else {
  textBoxContainer.appendChild(textBox);
}

  // Trigger fade-in effect
  setTimeout(() => {
    textBox.style.transform = 'translateY(0)'; // Move into place
    textBox.style.opacity = '1';
  }, 0);

  
    // Reset positions of existing text boxes after animation
    setTimeout(() => {
      Array.from(textBoxContainer.children).forEach((child) => {
        child.style.transition = 'transform 1s ease';
        child.style.transform = 'translateY(0)';
      });
    }, 300); // Match the transition duration
}

function addResponce(responce, img, size){
  if(!size){
    size = "1.5vh";
  }

  const textBoxContainer = document.getElementById('textBox');

  if (!textBoxContainer) {
    console.error('Element with ID "textBox" not found.');
    return;
  }

    // Slide down existing text boxes
    Array.from(textBoxContainer.children).forEach((child) => {
      child.style.transition = 'transform 0.3s';
      child.style.transform = 'translateY(20%)'; // Move existing text boxes up (change percentage to new txtbox high?)
    });

    const textBoxDiv = document.createElement('div');

  // Create a new text box element
  const textBox = document.createElement('p');
  textBoxDiv.style.cssText =`
    width: 95%;
    color: white;
    text-align: left;
    opacity: 0;
    transition: 1s ease;
    font-size: ` + size + ` ;
    float: left;
    display: flex;
    flex-direction: row;
    align-items: center;
  `;
  if(img != null){
    console.log(img)
    textBoxDiv.appendChild(img);
  }
  textBoxDiv.appendChild(textBox)


  // Append the text box to the container
// Insert the new text box at the top of the container
if (textBoxContainer.firstChild) {
  textBoxContainer.insertBefore(textBoxDiv, textBoxContainer.firstChild);
} else {
  textBoxContainer.appendChild(textBoxDiv);
}


  // Trigger fade-in effect
  setTimeout(() => {
    textBox.style.transform = 'translateY(0)'; // Move into place
    textBoxDiv.style.opacity = '1';
    typeText(textBox, responce);
  }, 0);

    // Reset positions of existing text boxes after animation
    setTimeout(() => {
      Array.from(textBoxContainer.children).forEach((child) => {
        child.style.transition = 'transform 1s ease';
        child.style.transform = 'translateY(0)';
      });
    }, 300); // Match the transition duration
}

function typeText(element, text, typingSpeed = 25) {
  if (!element) {
    console.error('Element is not defined for typing animation.');
    return;
  }

  let index = 0;

  // Typing animation logic
  function typeCharacter() {
    if (index < text.length) {
      element.textContent += text.charAt(index); // Add the next character
      index++;
      setTimeout(typeCharacter, typingSpeed); // Schedule the next character
    }
  }

  typeCharacter();
}

function quizBegin(){
    mode = 3;
    setMode();
    //Wait
}

async function quizBeginTF(){
  mode = 4;
  setMode();
  //Make Api call
  // Make API call
  if (Language === "English") {
    getQuizTF().then(responce => {
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      addResponce("");
      correct_answer = responce.correct_answer;
      addResponce(responce.question);
    });
  } else {
    try {
      // Wait for getQuizTF() to resolve
      const responce = await getQuizTF();

      // Wait for both translations to resolve
      correct_answer = responce.correct_answer;
      const question = await translate(responce.question);

      // Add translated responses
      addResponce(question);
    } catch (error) {
      console.error("Error in quizBeginTF:", error);
    }
  }
}

function quizAnswerTF(sent){
  if(sent == correct_answer){
    confetti.start()
    addResponce("Great Job!! :P");
    quizBeginTF();
    setTimeout('confetti.stop()',3000);
  }
}

function backToMain(){
   mode = 0;
   setMode();
   document.getElementById("buttonA").style.opacity = 0;
   document.getElementById("buttonB").style.opacity = 0;
  document.getElementById("buttonC").style.opacity = 0;
   document.getElementById("buttonD").style.opacity = 0;
   addResponce("", null, "100vh");

   if(Language == "English"){
   addResponce("Hello! Click the microphone icon below to talk to me!", null,"5vh");
  } else {
    translate("Hello! Click the microphone icon below to talk to me!").then( words => addResponce(words, null, "3vh"));
  }

}

async function quizBeginMC() {
  mode = 5;
  setMode();

  // Make all buttons visible:
  document.getElementById("buttonA").style.opacity = 1;
  document.getElementById("buttonB").style.opacity = 1;
  document.getElementById("buttonC").style.opacity = 1;
  document.getElementById("buttonD").style.opacity = 1;

  // Make API call to get the quiz (simulated with test data)
  try {
    const responce = await getQuizMC();

    // Reset responses
    

    // Get the correct answer index
    correct_answer = responce.answers.indexOf(responce.correct_answer);

    // Helper function to create unique image elements
    function createImageElement(src, width = "2vh", height = "2vh", float = "left", marginRight = "1vw", transform = "") {
      const img = document.createElement('img');
      img.src = src;
      img.style.width = width;
      img.style.height = height;
      img.style.float = float;
      img.style.marginRight = marginRight;
      img.style.transform = transform; // Optional: Apply transformation
      return img;
    }

    if(Language == "English"){
    const question = responce.question;
    const Answers = await Promise.all(responce.answers.map(answer => (answer)));

    for (let i = 0; i < 18; i++) {
      addResponce("");
    }

    // Add translated responses with unique images
    addResponce(Answers[3], createImageElement("./assets/whiteSquare.png", "2vh", "2vh", "left", "1vw", "rotate(45deg)"));
    addResponce(Answers[2], createImageElement("./assets/whiteCircle.png"));
    addResponce(Answers[1], createImageElement("./assets/whiteSquare.png"));
    addResponce(Answers[0], createImageElement("./assets/whiteTriangle.png"));

    // Add translated question as a response
    addResponce(question);

    } else{
    // Translate question and answers
    const translatedQuestion = await translate(responce.question);
    const translatedAnswers = await Promise.all(responce.answers.map(answer => translate(answer)));

    for (let i = 0; i < 18; i++) {
      addResponce("");
    }

    // Add translated responses with unique images
    addResponce(translatedAnswers[3], createImageElement("./assets/whiteSquare.png", "2vh", "2vh", "left", "1vw", "rotate(45deg)"));
    addResponce(translatedAnswers[2], createImageElement("./assets/whiteCircle.png"));
    addResponce(translatedAnswers[1], createImageElement("./assets/whiteSquare.png"));
    addResponce(translatedAnswers[0], createImageElement("./assets/whiteTriangle.png"));

    // Add translated question as a response
    addResponce(translatedQuestion);
    }
  } catch (error) {
    console.error("Error in quizBeginMC:", error);
  }
}

function quizAnswerMC(sent, me){
  if(sent == correct_answer){
    confetti.start()
    addResponce("Great Job!! :P")
    quizBeginMC();
    setTimeout('confetti.stop()',3000);
  } else {
    me.style.opacity = 0;
  }
}

async function translate(text) {
  const url = "http://localhost:8080/translate";
  console.log("Translating:", text);

  const body = {
    text: text,
    language: Language
  };

  try {
    const response = await axios.post(url, body); // Await the response directly
    console.log("Translated text:", response.data.translated_text);
    return response.data.translated_text; // Return the translated text
  } catch (error) {
    console.error("Error in translate function:", error);
    throw error; // Re-throw to handle errors in the caller
  }
}

async function transcripeFile(audioFile) {
  const url = "http://localhost:8080/audio-to-text";

  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append("file", audioFile, audioFile.name); // Ensure the file is appended with a proper name

  try {
    // Make the POST request
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Explicitly set the Content-Type
      },
    });

    // Log and return the response data
    console.log("Response data:", response.data);
    return response.data;
  } catch (error) {
    // Log detailed error information for debugging
    console.error("Error in transcripeFile:", error);
    throw error;
  }
}

async function generateResponce(){
  const url = "http://localhost:8080/continue-chat";
// Storing the history data in LocalStorage
console.log(history);
localStorage.setItem('history', JSON.stringify(history));

// Retrieving the history data from LocalStorage
const storedHistory = JSON.parse(localStorage.getItem('history'));

  try {
    await axios.post(url, storedHistory).then(response => {
       // Wait for the response
       history[history.length] = {"role": "assistant", 
        "content" : response.data.reply}
      addResponce(response.data.reply);
      textToSpeech(response.data.reply);
    return response.data}); // Return the response data
  } catch (error) {
    console.error("Error in postData:", error);
    throw error; // Re-throw the error so the caller can handle it
  }
}

async function textToSpeech(text) {
  const url = "http://localhost:8080/text-to-audio";
  
  // Step 1: Prepare the data object
  const data = { text: text };

  try {
    // Step 2: Send POST request to the server
    const response = await axios.post(url, data, { responseType: 'arraybuffer' });

    // Step 3: Check if the response is valid
    if (response.headers['content-type'] === 'audio/mpeg') {
      // Step 4: Convert the binary response data to a Blob
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });

      // Step 5: Create an audio element and set the Blob as the source
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();  // Play the audio
      console.log('Audio is playing');
      console.log(audio);
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

//Prompt the bot fit the role better
async function innit(exhibitInnit){
  const url = "http://localhost:8080/get-experiences"; // Replace with your actual API URL
  addResponce("Hello! Click the microphone icon below to talk to me!", null,"5vh");
  try {
    // Make the GET request using fetch
    const response = await fetch(url);

    // Check if the response was successful (status code 200)
    if (response.ok) {
      // Parse the JSON response
      const data = await response.json();
      const experience = data.find(exp => exp.ExperienceName === exhibitInnit);
      console.log(data);
      if (experience) {
        exhibit = experience.ExperienceName;
        console.log(experience);
        console.log(exhibit);
        history[history.length] = 
        {"role": "system", "content": ("I would you to make your responses one or two sentences and fewer than 50 words." + 
          "You are a helpful assistant at a children's museum, Discovery World in Milwaukee. You are mostly likley talking wiht a child whos curious about the exhibit they're at. The exhibit you're at right now is" + experience.ExperienceName + 
          "Here is some of the signs at the  exhibit you are currentlty at: " + experience.Copy +
          "A general decription of this exhibit is: " + experience.Description +
          "Provide the users with fun facts, and maybe even tell them to take a quiz by clicking below if they're curious" +
          "Discovery World has other exhibits too. Encourage users to look at other exhibits. Exhibits that are" +
          "close together have simular topics. Here is a json of other Discover World exhibits:" + data
          )}

      } else {
        console.log('Experience not found');
      }
    } else {
      console.error(`Request failed with status code ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error during request:', error);
  }
}

async function getQuizMC(){
  //Replace with the actual URL of your API
const url = "http://localhost:8080/generate-quiz"

console.log(exhibit);

//Define the chat history
const data = {
  experience: exhibit,
  quiz_type: "multiple_choice"
};

localStorage.setItem('MCdata', JSON.stringify(data));
const storedData = JSON.parse(localStorage.getItem('MCdata'));

console.log(storedData);
try {
  // Use await directly to handle the response
  const responseMC = await axios.post(url, json=data);

  // Log the response for debugging
  console.log("Response from server:", responseMC.data);

  // Return the response data
  return responseMC.data; // Make sure the return is outside of any then block
} catch (error) {
  // Log detailed error information
  console.error("Error in postData:", error.response?.data || error.message);
  throw error; // Re-throw the error to propagate it
}
}

async function getQuizTF(){
  //Replace with the actual URL of your API
const url = "http://localhost:8080/generate-quiz"

console.log(exhibit);

//Define the chat history
const data = {
  experience: exhibit,
  quiz_type: "true_false"
};

localStorage.setItem('TFdata', JSON.stringify(data));
const storedData = JSON.parse(localStorage.getItem('TFdata'));

console.log(storedData);
try {
  // Use await directly to handle the response
  const responseTF = await axios.post(url, json=data);

  // Log the response for debugging
  console.log("Response from server:", responseTF.data);

  // Return the response data
  return responseTF.data; // Make sure the return is outside of any then block
} catch (error) {
  // Log detailed error information
  console.error("Error in postData:", error.response?.data || error.message);
  throw error; // Re-throw the error to propagate it
}
}

async function translateButtons() {
  const buttonPromptEl = document.getElementById("prompt");
  const buttonPrompt2El = document.getElementById("leftPrompt");
  const buttonPrompt3El = document.getElementById("rightPrompt");
  const buttonTrueEl = document.getElementById("trueButton");
  const buttonFalseEl = document.getElementById("falseButton");

  try {
    // Translate each button's innerHTML
    const translations = await Promise.all([
      translate(buttonPromptEl.innerHTML),
      translate(buttonPrompt2El.innerHTML),
      translate(buttonPrompt3El.innerHTML),
      translate(buttonTrueEl.innerHTML),
      translate(buttonFalseEl.innerHTML),
    ]);

    // Assign translations back to their respective buttons
    buttonPromptEl.innerHTML = translations[0];
    buttonPrompt2El.innerHTML = translations[1];
    buttonPrompt3El.innerHTML = translations[2];
    buttonTrueEl.innerHTML = translations[3];
    buttonFalseEl.innerHTML = translations[4];

    console.log("All buttons translated successfully:", translations);
    return translations; // Return all translations as an array
  } catch (error) {
    console.error("Error translating buttons:", error);
    return undefined; // Handle errors gracefully
  }
}