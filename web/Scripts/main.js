

//Global varibles
var Language = "English";
var mode = 0;
var correct_answer;

//Audio globals
let mediaRecorder; // To manage the recording state
let audioChunks = []; // To store audio data
let isRecording = false; // To track recording state

//API Stuff
// API endpoint
const url = "https://dh-ood.hpc.msoe.edu/node/dh-node1.hpc.msoe.edu/12235/get-experiences";
 
const password = 'password';
 
const headers = {
    'APIToken': 'Bearer ' + password
};
 
// Basic auth credentials
const username = 'norquistd';
const passwordAuth = 'aKBRVBpGmQx';
 
// Make the POST request
axios.get(url, {
    auth: {
        username: username,
        password: passwordAuth
    },
    headers: headers
})
.then(response => {
    console.log("Status Code:", response.status);
    console.log("Content-Type:", response.headers['content-type']);
    console.log("Response Content:", response.data);
 
    // Attempt to parse the response as JSON
    try {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        console.log("JSON Response:", data);
    } catch (error) {
        console.log("Failed to parse JSON. Response might not be in JSON format.");
    }
})
.catch(error => {
    if (error.response) {
        console.log("Status Code:", error.response.status);
        console.log("Content-Type:", error.response.headers['content-type']);
        console.log("Response Content:", error.response.data);
    } else {
        console.log("Error:", error.message);
    }
});



//Test quiz varible
const testQuizData = {
  answers: ['True', 'False'],
  correct_answer: 'True',
  quiz_type: 'true/false',
  question: 'Lithium-ion batteries are ideal for tablets, smartphones, and electric vehicles because they charge quickly.'
};

const testMultiChoiceData = {'answers': ['They are heavy and bulky.', 'They lose charge quickly.', 'They charge quickly and drain slowly.', 'They have a memory effect.'],
   'correct_answer': 'They charge quickly and drain slowly.', 
   'question': 'What is one benefit of lithium-ion batteries?', 
   'quiz_type': 'multiple_choice'};

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
          
          // Optional: Create an audio element to play the recording
          const audio = document.createElement('audio');
          audio.src = audioUrl;
          audio.controls = true;
          document.body.appendChild(audio);
  
          // Reset chunks for the next recording
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

function addTranscript(transcript) {
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
    font-size: 1.5vh;
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

function addResponce(responce, img){
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
  textBoxDiv.style.cssText = `
    width: 95%;
    color: white;
    text-align: left;
    opacity: 0;
    transition: 1s ease;
    font-size: 1.5vh;
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

function quizBeginTF(){
  mode = 4;
  setMode();
  //Make Api call
  var responce = testQuizData;
  correct_answer = responce.correct_answer;
  addResponce(responce.question);
}

function quizAnswerTF(sent){
  if(sent == correct_answer){
    confetti.start()
    addResponce("Great Job!! :P")
    setTimeout('quizBeginTF();',3000);
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
}

function quizBeginMC() {
  mode = 5;
  setMode();
  //Make all buttons vsiable:
  document.getElementById("buttonA").style.opacity = 1;
   document.getElementById("buttonB").style.opacity = 1;
  document.getElementById("buttonC").style.opacity = 1;
   document.getElementById("buttonD").style.opacity = 1;

  // Make API call (simulated here with test data)
  var responce = testMultiChoiceData;
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

  // Add responses with unique images
  addResponce(responce.answers[0], createImageElement("./assets/whiteTriangle.png"));
  addResponce(responce.answers[1], createImageElement("./assets/whiteSquare.png"));
  addResponce(responce.answers[2], createImageElement("./assets/whiteCircle.png"));
  addResponce(responce.answers[3], createImageElement("./assets/whiteSquare.png", "2vh", "2vh", "left", "1vw", "rotate(45deg)"));

  // Add question as a response
  addResponce(responce.question);
}

function quizAnswerMC(sent, me){
  if(sent == correct_answer){
    confetti.start()
    addResponce("Great Job!! :P")
    setTimeout('quizBeginMC()', 3000);
    setTimeout('confetti.stop()',3000);
  } else {
    me.style.opacity = 0;
  }
}

