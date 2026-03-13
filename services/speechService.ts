export class SpeechRecognitionService {
  recognition: any;
  isListening: boolean = false;
  
  constructor(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    lang: 'en' | 'hi' = 'en'
  ) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("Browser does not support Web Speech API");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = lang === 'en' ? 'en-US' : 'hi-IN';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.error("Error starting recognition", e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  updateLang(lang: 'en' | 'hi') {
    if (this.recognition) {
        const wasListening = this.isListening;
        if (wasListening) this.stop();
        this.recognition.lang = lang === 'en' ? 'en-US' : 'hi-IN';
        if (wasListening) setTimeout(() => this.start(), 200);
    }
  }
}