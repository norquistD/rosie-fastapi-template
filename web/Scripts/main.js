// Global variables
let language = "English";
let mode = 0;
let correctAnswer;
let sleepyClock = new Date();

// 3 minutes reset without interaction
const sleepTimer = 180000;
let volume = 1;

// Translation Queue
let requestId = 0;
const pendingRequests = {};

// Initial prompting is done in the init function, based on current exhibit
const history = [];
let exhibit = "";
const baseUrl = "https://dh-ood.hpc.msoe.edu/node/dh-node9.hpc.msoe.edu/30930/discovery-world";

api_password = "password"

headers = {
	APIToken: "Bearer " + api_password
}

auth = {
	username: "norquistd",
	password: "aKBRVBpGmQx"
}

// Audio globals
let mediaRecorder; // To manage the recording state
let audioChunks = []; // To store audio data
let isRecording = false; // To track recording state

/**
 * Initializes a WebSocket connection with the given URL and handlers.
 * @param {string} url - The WebSocket URL.
 * @param {object} handlers - Event handlers for the WebSocket.
 * @returns {WebSocket} The initialized WebSocket instance.
 */
function initializeWebSocket(url, handlers) {
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log(`WebSocket connection to ${url} established.`);
    handlers.onOpen && handlers.onOpen(socket);
  };

  socket.onmessage = (event) => {
	console.log(event.currentTarget)
	if (event.currentTarget.binaryType != "arraybuffer") {
		const data = JSON.parse(event.data);
		console.log(`Message from ${url}:`, data);
		handlers.onMessage && handlers.onMessage(data);
	} else {
		handlers.onMessage && handlers.onMessage(event);
	}
  };

  socket.onclose = () => {
    console.log(`WebSocket connection to ${url} closed.`);
    handlers.onClose && handlers.onClose();
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error on ${url}:`, error);
    handlers.onError && handlers.onError(error);
  };

  return socket;
}

// Initialize WebSocket for Quiz
const quizSocket = initializeWebSocket("ws://localhost:8000/ws/quiz", {
  onMessage: async (data) => {
    mode = data.quiz_type == "true/false" ? 4 : 5;
    setMode();
    if (language == "English") {
		if (mode == 4) {
			correctAnswer = data.correct_answer;
			for (let i = 0; i < 20; i++) {
				addResponse("");
			}
			addResponse(data.question);
		} else {
			const question = data.question;
			const answers = shuffleArray(data.answers);
			
			correctAnswer = answers.indexOf(data.correct_answer);
			console.log(correctAnswer)
			for (let i = 0; i < 20; i++) {
				addResponse("");
			}

			// Add responses with unique images
			addResponse(answers[3], createImageElement("./assets/whiteSquare.png", "2vh", "2vh", "left", "1vw", "rotate(45deg)"));
			addResponse(answers[2], createImageElement("./assets/whiteCircle.png"));
			addResponse(answers[1], createImageElement("./assets/whiteSquare.png"));
			addResponse(answers[0], createImageElement("./assets/whiteTriangle.png"));
		
			// Add question as a response
			addResponse(question);
		}
    } else {
		if (mode == 4) {
			correctAnswer = data.correct_answer;

			for (let i = 0; i < 20; i++) {
				addResponse("");
			}

			const question = await translate(data.question);
			addResponse(question);
		} else if (mode == 5) {
			const question = data.question;
			const answers = shuffleArray(data.answers);
			
			correctAnswer = answers.indexOf(data.correct_answer);

			const translatedQuestion = await translate(question);
			const translatedAnswers = await Promise.all(answers.map(answer => translate(answer)));
		
			for (let i = 0; i < 20; i++) {
				addResponse("");
			}
		
			// Add translated responses with unique images
			addResponse(translatedAnswers[3], createImageElement("./assets/whiteSquare.png", "2vh", "2vh", "left", "1vw", "rotate(45deg)"));
			addResponse(translatedAnswers[2], createImageElement("./assets/whiteCircle.png"));
			addResponse(translatedAnswers[1], createImageElement("./assets/whiteSquare.png"));
			addResponse(translatedAnswers[0], createImageElement("./assets/whiteTriangle.png"));
		
			// Add translated question as a response
			addResponse(translatedQuestion);
		}
    }

    spinOff();
	if (mode == 4) {
	  // Make all buttons visible
	  ['trueButton', 'falseButton'].forEach(id => {
		const button = document.getElementById(id);
		if (button) button.style.opacity = 1;
	  });
	} else if (mode == 5) {
		['buttonA', 'buttonB', 'buttonC', 'buttonD'].forEach(id => {
			const button = document.getElementById(id);
			if (button) button.style.opacity = 1;
		});
	}
  },
});

// Initialize WebSocket for Translate
const translateSocket = initializeWebSocket("ws://localhost:8000/ws/translate", {
  onMessage: (data) => {
		const message = data;
		const { id, translatedText } = message;
		if (pendingRequests[id]) {
			pendingRequests[id].resolve(translatedText);
			delete pendingRequests[id];
		}
	},
});

const transcribeSocket = initializeWebSocket("ws://localhost:8000/ws/audio-to-text", {
	onMessage: (data) => {
			if (data.languageToggle) {
				console.log(data.transcription);
				updateLanguage(data.transcription);
			} else {
				addTranscript(data.transcription);
				history.push({ role: "user", content: data.transcription });
				generateResponse();
			}
		},
});

const continueChatSocket = initializeWebSocket("ws://localhost:8000/ws/continue-chat", {
	onMessage: (data) => {
			console.log(data);
			history.push({ role: "assistant", content: data.reply });
			addResponse(data.reply);
			textToSpeech(data.reply);
			spinOff();
		},
});

const textToSpeechSocket = initializeWebSocket("ws://localhost:8000/ws/text-to-audio", {
	onMessage: (event) => {
			console.log(event)
			const audioBlob = new Blob([event.data], { type: "audio/mpeg" });
			const audioUrl = URL.createObjectURL(audioBlob);
			const audio = new Audio(audioUrl);
			audio.play();
		},
});
textToSpeechSocket.binaryType = "arraybuffer";


// Modified translate function
/**
 * Translates the given text to the current language.
 * @param {string} text - The text to translate.
 * @returns {Promise<string>} The translated text.
 */
function translate(text) {
    return new Promise((resolve, reject) => {
        spinOn();

        const id = ++requestId; // Generate a unique ID for the request

        const payload = {
            id: id, // Include the ID in the payload
            text: text,
            language: language,
        };

        const url = `${baseUrl}/translate`;

        const data = {
            endpoint: url,
            payload: payload,
            headers: headers,
            auth: auth
        };

        // Store the resolve and reject functions to handle later
        pendingRequests[id] = { resolve, reject };

        // Send the request over WebSocket
        translateSocket.send(JSON.stringify(data));

        // Optional: Implement a timeout for the request
        setTimeout(() => {
            if (pendingRequests[id]) {
                pendingRequests[id].reject(new Error('Translation request timed out'));
                delete pendingRequests[id];
                spinOff();
            }
        }, 15000); // 10 seconds timeout
    }).finally(() => {
        spinOff();
    });
}

/**
 * Randomly shuffles an array.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
	  const j = Math.floor(Math.random() * (i + 1));
	  [array[i], array[j]] = [array[j], array[i]];
	}
	return array;
  }

document.addEventListener('DOMContentLoaded', () => {
  particlesJS('particles-js', {
    particles: {
      number: { value: 40 },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 5, random: true },
      move: { enable: true, speed: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.4,
        width: 1,
      },
    },
  });
});

/**
 * Toggles the microphone icon and handles recording state.
 * @param {boolean} languageToggle - Indicates if language is toggled.
 */
async function toggleMicrophoneIcon(languageToggle) {
	const microphoneIcon = document.getElementById('microphoneIcon');
	const otherIcon = document.getElementById('otherLanguageButton');
	if (!microphoneIcon) {
		console.error('Element with ID "microphoneIcon" not found.');
		return;
	}

	microphoneIcon.classList.toggle('on');
	otherIcon.classList.toggle('on');

	if (isRecording) {
		mediaRecorder.stop();
		isRecording = false;
		console.log('Recording stopped');
	} else {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);

			mediaRecorder.ondataavailable = (event) => {
				audioChunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });

				console.log("Language Toggle is " + languageToggle)
				await transcribeFile(audioFile, languageToggle);

				audioChunks = [];
			};

			mediaRecorder.start();
			isRecording = true;
			console.log('Recording started');
		} catch (error) {
			console.error('Error accessing microphone:', error);
		}
	}
}

/**
 * Toggles classes for language elements.
 */
function toggleLanguageElements() {
	const elements = [
		{ id: 'languageIcon', class1: 'active', class2: 'inactive' },
		{ id: 'languageList', class1: 'ulactive', class2: 'ULinactive' },
	];

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

/**
 * Updates the language of the application.
 * @param {string} newLanguage - The new language to set.
 */
async function updateLanguage(newLanguage) {
	['buttonA', 'buttonB', 'buttonC', 'buttonD'].forEach(id => {
		const button = document.getElementById(id);
		if (button) button.style.opacity = 0;
	});

	mode = 0;
	setMode();
	console.log("Language update triggered");
	language = newLanguage;
	history.push({
		role: "system",
		content: `The user has switched the current language to: ${language}`,
	});

	const translatedMessage = await translateWithCache("Hello, I'm now speaking in " + language + ". Click the microphone icon below to talk to me!");
	addResponse(translatedMessage, null, "3vh");
	translateButtons();
	toggleLanguageElements();
}

/**
 * Adds the spin effect to an element.
 */
function spinOn() {
	const element = document.getElementById("spins");
	element.classList.add("spinOn");
	element.style.display = "block";
}
  
  /**
   * Removes the spin effect from an element and hides it.
   */
function spinOff() {
	const element = document.getElementById("spins");
	element.classList.remove("spinOn");
	element.style.display = "none";
}

/**
 * Sets classes for various UI elements based on the current mode.
 * @param {boolean} textBoxClass - Whether to apply the 'lower' class to the text box.
 * @param {boolean} circle1Class - Whether to apply the 'circleTransition' class to circle1.
 * @param {boolean} circle2Class - Whether to apply the 'circleTransition' class to circle2.
 * @param {boolean} buttonPrompt - Whether the prompt button is active.
 * @param {boolean} buttonPrompt2 - Whether the left prompt button is active.
 * @param {boolean} buttonPrompt3 - Whether the right prompt button is active.
 * @param {boolean} buttonTrue - Whether the true button is active.
 * @param {boolean} buttonFalse - Whether the false button is active.
 * @param {boolean} buttonA - Whether button A is active.
 * @param {boolean} buttonB - Whether button B is active.
 * @param {boolean} buttonC - Whether button C is active.
 * @param {boolean} buttonD - Whether button D is active.
 * @param {boolean} backArrowClass - Whether to show the back arrow.
 */
function setClassesOfElements(
  textBoxClass,
  circle1Class,
  circle2Class,
  buttonPrompt,
  buttonPrompt2,
  buttonPrompt3,
  buttonTrue,
  buttonFalse,
  buttonA,
  buttonB,
  buttonC,
  buttonD,
  backArrowClass
) {
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

  // Toggle classes for circles
  toggleClass(circle1, circle1Class, "circleTransition", "circleImage");
  toggleClass(circle2, circle2Class, "circleTransition", "circleImage2");

  // Toggle classes for buttons
  toggleButtonClass(buttonPromptEl, buttonPrompt);
  toggleButtonClass(buttonPrompt2El, buttonPrompt2);
  toggleButtonClass(buttonPrompt3El, buttonPrompt3);
  toggleButtonClass(buttonTrueEl, buttonTrue);
  toggleButtonClass(buttonFalseEl, buttonFalse);
  toggleButtonClass(buttonAEl, buttonA);
  toggleButtonClass(buttonBEl, buttonB);
  toggleButtonClass(buttonCEl, buttonC);
  toggleButtonClass(buttonDEl, buttonD);

  // Toggle class for text box
  if (textBoxClass) {
    textBox.classList.add("lower");
  } else {
    textBox.classList.remove("lower");
  }

  // Toggle class for back arrow
  if (backArrowClass) {
    backArrow.classList.add("show");
    backArrow.classList.remove("hidden");
  } else {
    backArrow.classList.remove("show");
    backArrow.classList.add("hidden");
  }
}

/**
 * Helper function to toggle classes for circles.
 * @param {HTMLElement} element - The element to toggle classes on.
 * @param {boolean} condition - Whether to add or remove the transition class.
 * @param {string} addClass - The class to add.
 * @param {string} removeClass - The class to remove.
 */
function toggleClass(element, condition, addClass, removeClass) {
  if (element) {
    if (condition) {
      element.classList.add(addClass);
      element.classList.remove(removeClass);
    } else {
      element.classList.remove(addClass);
      element.classList.add(removeClass);
    }
  }
}

/**
 * Helper function to toggle button classes.
 * @param {HTMLElement} buttonElement - The button element.
 * @param {boolean} isActive - Whether the button is active.
 */
function toggleButtonClass(buttonElement, isActive) {
  if (buttonElement) {
    if (isActive) {
      buttonElement.classList.add("activeButton");
      buttonElement.classList.remove("inactiveButton");
    } else {
      buttonElement.classList.add("inactiveButton");
      buttonElement.classList.remove("activeButton");
    }
  }
}

/**
 * Sets the UI mode based on the current mode value.
 */
function setMode() {
  // Reset sleep timer
  sleepyClock = new Date();
  console.log(mode);

  switch (mode) {
    case 0:
      // Default
      setClassesOfElements(false, false, false, true, false, false, false, false, false, false, false, false, false);
      break;
    case 1:
      // Circle1Big
      setClassesOfElements(true, true, false, true, false, false, false, false, false, false, false, false, false);
      break;
    case 2:
      // Circle2Big
      setClassesOfElements(true, false, true, true, false, false, false, false, false, false, false, false, false);
      break;
    case 3:
      // Quiz prompt TF / MC
      setClassesOfElements(false, false, false, false, true, true, false, false, false, false, false, false, true);
      break;
    case 4:
      // True/False
      setClassesOfElements(false, false, false, false, false, false, true, true, false, false, false, false, true);
      break;
    case 5:
      // Multiple Choice
      setClassesOfElements(false, false, false, false, false, false, false, false, true, true, true, true, true);
      break;
    default:
      console.warn(`Unknown mode: ${mode}`);
  }
}

/**
 * Cycles through modes and adds responses.
 */
function modder() {
  mode = (mode + 1) % 6;
  setMode();

  addResponse("Do you want to know what's up?");
  addTranscript("Yes, I would");
}

/**
 * Adds a transcript to the text box.
 * @param {string} transcript - The transcript text.
 * @param {string} [size="1.5vh"] - The font size.
 */
function addTranscript(transcript, size = "1.5vh") {
  const textBoxContainer = document.getElementById('textBox');
  if (!textBoxContainer) {
    console.error('Element with ID "textBox" not found.');
    return;
  }

  // Slide down existing text boxes
  Array.from(textBoxContainer.children).forEach((child) => {
    child.style.transition = 'transform 0.3s';
    child.style.transform = 'translateY(20%)';
  });

  // Create a new text box element
  const textBox = document.createElement('p');
  textBox.textContent = transcript;
  textBox.style.cssText = `
    width: 95%;
    color: yellow;
    text-align: right;
    opacity: 0;
    transition: 1s ease;
    font-size: ${size};
    float: right;
  `;

  // Insert the new text box at the top of the container
  if (textBoxContainer.firstChild) {
    textBoxContainer.insertBefore(textBox, textBoxContainer.firstChild);
  } else {
    textBoxContainer.appendChild(textBox);
  }

  // Trigger fade-in effect
  setTimeout(() => {
    textBox.style.transform = 'translateY(0)';
    textBox.style.opacity = '1';
  }, 0);

  // Reset positions of existing text boxes after animation
  setTimeout(() => {
    Array.from(textBoxContainer.children).forEach((child) => {
      child.style.transition = 'transform 1s ease';
      child.style.transform = 'translateY(0)';
    });
  }, 300);
}

/**
 * Adds a response to the text box.
 * @param {string} response - The response text.
 * @param {HTMLElement|null} img - An optional image element.
 * @param {string} [size="1.5vh"] - The font size.
 */
function addResponse(response, img = null, size = "1.5vh") {
  // Reset sleep timer
  sleepyClock = new Date();

  const textBoxContainer = document.getElementById('textBox');
  if (!textBoxContainer) {
    console.error('Element with ID "textBox" not found.');
    return;
  }

  // Slide down existing text boxes
  Array.from(textBoxContainer.children).forEach((child) => {
    child.style.transition = 'transform 0.3s';
    child.style.transform = 'translateY(20%)';
  });

  const textBoxDiv = document.createElement('div');
  textBoxDiv.style.cssText = `
    width: 95%;
    color: white;
    text-align: left;
    opacity: 0;
    transition: 1s ease;
    font-size: ${size};
    float: left;
    display: flex;
    flex-direction: row;
    align-items: center;
  `;

  if (img) {
    console.log(img);
    textBoxDiv.appendChild(img);
  }

  const textBox = document.createElement('p');
  textBoxDiv.appendChild(textBox);

  // Insert the new text box at the top of the container
  if (textBoxContainer.firstChild) {
    textBoxContainer.insertBefore(textBoxDiv, textBoxContainer.firstChild);
  } else {
    textBoxContainer.appendChild(textBoxDiv);
  }

  // Trigger fade-in effect and type text
  setTimeout(() => {
    textBox.style.transform = 'translateY(0)';
    textBoxDiv.style.opacity = '1';
    typeText(textBox, response);
  }, 0);

  // Reset positions of existing text boxes after animation
  setTimeout(() => {
    Array.from(textBoxContainer.children).forEach((child) => {
      child.style.transition = 'transform 1s ease';
      child.style.transform = 'translateY(0)';
    });
  }, 300);
}

/**
 * Animates typing of text into an element.
 * @param {HTMLElement} element - The element to type into.
 * @param {string} text - The text to type.
 * @param {number} [typingSpeed=25] - The speed of typing in ms per character.
 */
function typeText(element, text, typingSpeed = 25) {
	if (!element) {
		console.error('Element is not defined for typing animation.');
		return;
	}

	let index = 0;

	function typeCharacter() {
		if (index < text.length) {
		element.textContent += text.charAt(index);
		index++;
		setTimeout(typeCharacter, typingSpeed);
		}
	}

	typeCharacter();
}

/**
 * Initiates the quiz prompt.
 */
function quizBegin() {
  mode = 3;
  setMode();
}

/**
 * Begins a True/False quiz.
 */
async function quizBeginTF() {
	spinOn();
	const url = `${baseUrl}/generate-quiz`;

	const payload = {
		experience: 'Battery Video',
		quiz_type: "true/false",
	};

	const data = {
		endpoint: url,
		payload: payload,
		headers: headers,
		auth: auth
	}

	quizSocket.send(JSON.stringify(data));
}

/**
 * Handles the answer for a True/False quiz.
 * @param {boolean} sent - The user's answer.
 */
function quizAnswerTF(sent, button) {
  if (sent == correctAnswer) {
    confetti.start();
    addResponse("Great Job!! :P");
    quizBeginTF();
    setTimeout(() => confetti.stop(), 3000);
  } else {
	button.style.opacity = 0;
  }
}

/**
 * Returns to the main mode.
 */
function backToMain() {
  mode = 0;
  setMode();
  ['buttonA', 'buttonB', 'buttonC', 'buttonD', 'trueButton', 'falseButton'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.style.opacity = 0;
  });
  addResponse("", null, "100vh");

  if (language == "English") {
    addResponse("Hello! Click the microphone icon below to talk to me!", null, "5vh");
  } else {
    translate("Hello! Click the microphone icon below to talk to me!")
      .then(words => addResponse(words, null, "3vh"));
  }
}

/**
 * Creates an image element with specified attributes.
 * @param {string} src - Source of the image.
 * @param {string} [width="2vh"] - Width of the image.
 * @param {string} [height="2vh"] - Height of the image.
 * @param {string} [float="left"] - Float property.
 * @param {string} [marginRight="1vw"] - Right margin.
 * @param {string} [transform=""] - CSS transform.
 * @returns {HTMLElement} The created image element.
 */
function createImageElement(src, width = "2vh", height = "2vh", float = "left", marginRight = "1vw", transform = "") {
	const img = document.createElement('img');
	img.src = src;
	img.style.width = width;
	img.style.height = height;
	img.style.float = float;
	img.style.marginRight = marginRight;
	img.style.transform = transform;
	return img;
}

/**
 * Begins a Multiple Choice quiz.
 */
async function quizBeginMC() {
	spinOn();

	const url = `${baseUrl}/generate-quiz`;
  
	const payload = {
	  experience: 'Battery Video',
	  quiz_type: "multiple_choice",
	};
  
	const data = {
	  endpoint: url,
	  payload: payload,
	  headers: headers,
	  auth: auth
	}
  
	quizSocket.send(JSON.stringify(data));
}

/**
 * Handles the answer for a Multiple Choice quiz.
 * @param {number} sent - The index of the user's answer.
 * @param {HTMLElement} button - The button element clicked.
 */
function quizAnswerMC(sent, button) {
	console.log(sent)
	if (sent == correctAnswer) {
		confetti.start();
		addResponse("Great Job!! :P");
		quizBeginMC();
		setTimeout(() => confetti.stop(), 3000);
	} else {
		button.style.opacity = 0;
	}
}

/**
 * Transcribes the given audio file to text.
 * @param {File} audioFile - The audio file to transcribe.
 * @returns {Promise<object>} The transcription result.
 */
async function transcribeFile(audioFile, languageToggle) {
	spinOn();
  
	const reader = new FileReader();

    reader.onload = function() {
        // reader.result is a Data URL (e.g., "data:audio/wav;base64,...")
        // Extract the Base64 part
        const base64File = reader.result.split(',')[1]; // Get the part after 'base64,'

        const url = `${baseUrl}/audio-to-text`;

        const data = {
            endpoint: url,
            payload: {
                formData: {
                    file: {
                        name: audioFile.name,
                        type: audioFile.type,
                        data: base64File
                    }
                },
                languageToggle: languageToggle
            },
            headers: headers,
            auth: auth
        };

		// Send the JSON data through the WebSocket
		transcribeSocket.send(JSON.stringify(data));
	};

	reader.onerror = function(error) {
		console.error("Error reading file:", error);
		spinOff();
	};

	// Read the file as a Data URL (Base64)
	reader.readAsDataURL(audioFile);
}

/**
 * Generates a response based on the chat history.
 */
async function generateResponse() {
	spinOn();

	const url = `${baseUrl}/continue-chat`;
	localStorage.setItem('history', JSON.stringify(history));
	const storedHistory = JSON.parse(localStorage.getItem('history'));
	const payload = {
	  history: storedHistory,
	};

	console.log(payload);

	const data = {
	  endpoint: url,
	  payload: payload,
	  headers: headers,
	  auth: auth
	};
  
	continueChatSocket.send(JSON.stringify(data));
}

/**
 * Converts text to speech and plays the audio.
 * @param {string} text - The text to convert to speech.
 */
async function textToSpeech(text) {
	spinOn();

	const url = `${baseUrl}/text-to-audio`;

	const payload = {
	  text: text,
	};

	const data = {
	  endpoint: url,
	  payload: payload,
	  headers: headers,
	  auth: auth
	};
  
	textToSpeechSocket.send(JSON.stringify(data));

	// try {
	// 	const response = await axios.post(url, data, { responseType: 'arraybuffer' });

	// 	if (response.headers['content-type'] == 'audio/mpeg') {
	// 	const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
	// 	const audio = new Audio(URL.createObjectURL(audioBlob));
	// 	spinOff();
	// 	audio.volume = volume;
	// 	audio.play();
	// 	console.log('Audio is playing', audio);
	// 	} else {
	// 	throw new Error('Invalid response');
	// 	}
	// } catch (error) {
	// 	console.error('Error playing audio:', error);
	// }
}

/**
 * Initializes the application based on the exhibit.
 * @param {string} exhibitInit - The exhibit to initialize.
 */
async function init(exhibitInit) {
  // Implementation needed based on your requirements
}

// frontend.js

const translationCache = new Map();

/**
 * Translates the given text to the current language with caching.
 * @param {string} text - The text to translate.
 * @returns {Promise<string>} The translated text.
 */
function translateWithCache(text) {
    return new Promise((resolve, reject) => {
        const cacheKey = `${language}:${text}`;
        if (translationCache.has(cacheKey)) {
            resolve(translationCache.get(cacheKey));
        } else {
            translate(text)
                .then(translatedText => {
                    translationCache.set(cacheKey, translatedText);
                    resolve(translatedText);
                })
                .catch(error => reject(error));
        }
    });
}

/**
 * Translates button labels to the current language.
 */
async function translateButtons() {
	const buttonPromptEl = document.getElementById("prompt");
	const buttonPrompt2El = document.getElementById("leftPrompt");
	const buttonPrompt3El = document.getElementById("rightPrompt");
	const buttonTrueEl = document.getElementById("trueButton");
	const buttonFalseEl = document.getElementById("falseButton");

	try {
		const translations = await Promise.all([
			translateWithCache(buttonPromptEl.innerHTML),
			translateWithCache(buttonPrompt2El.innerHTML),
			translateWithCache(buttonPrompt3El.innerHTML),
			translateWithCache(buttonTrueEl.innerHTML),
			translateWithCache(buttonFalseEl.innerHTML),
		]);

		buttonPromptEl.innerHTML = translations[0];
		buttonPrompt2El.innerHTML = translations[1];
		buttonPrompt3El.innerHTML = translations[2];
		buttonTrueEl.innerHTML = translations[3];
		buttonFalseEl.innerHTML = translations[4];

		console.log("All buttons translated successfully:", translations);
		return translations;
	} catch (error) {
		console.error("Error translating buttons:", error);
		return undefined;
	}
}

/**
 * Handles the sleep timer to reset the mode after inactivity.
 */
function sleepy() {
  const currentTime = new Date().getTime();

  // When timer is 0
  if (currentTime - sleepTimer > sleepyClock.getTime() - 1) {
    mode = 0;
    setMode();
    init(exhibit);
    ['buttonA', 'buttonB', 'buttonC', 'buttonD'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.style.opacity = 0;
    });
  } else {
    setTimeout(sleepy, 1000);
  }
}

/**
 * Toggles the mute state of the audio.
 */
function muteToggle() {
  const mute = document.getElementById("muteIcon");
  if (!mute) {
    console.error('Element with ID "muteIcon" not found.');
    return;
  }

  switch (volume) {
    case 1:
      volume = 0.5;
      mute.src = "./assets/volumelow.svg";
      break;
    case 0.5:
      volume = 0;
      mute.src = "./assets/mute.svg";
      break;
    case 0:
      volume = 1;
      mute.src = "./assets/volumeHigh.svg";
      break;
    default:
      console.warn(`Unknown volume level: ${volume}`);
  }
}
