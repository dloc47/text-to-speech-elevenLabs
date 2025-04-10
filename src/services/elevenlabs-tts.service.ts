import { Injectable } from "@angular/core";
import { environment } from "../environments/environment.prod";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ElevenlabsTtsService {
  private apiUrl = 'https://api.elevenlabs.io/v1';
  private apiKey = environment.elevenLabsApiKey;
  
  // Updated default model ID based on available voices
  private defaultModelId = 'eleven_multilingual_v2';
  private currentAudio: HTMLAudioElement | null = null;
  private audioState = new Subject<'playing' | 'paused' | 'stopped'>();

  constructor(private http: HttpClient) {}

  // Get available voices
  getVoices(): Observable<any> {
    const headers = new HttpHeaders({
      'xi-api-key': this.apiKey
    });
    return this.http.get(`${this.apiUrl}/voices`, { headers });
  }

  // Convert text to speech with proper model selection
  textToSpeech(text: string, voiceId: string, modelId?: string): Observable<ArrayBuffer> {
    const headers = new HttpHeaders({
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'accept': 'audio/mpeg'
    });

    const requestBody = {
      text: text,
      model_id: modelId || this.defaultModelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    return this.http.post(
      `${this.apiUrl}/text-to-speech/${voiceId}`,
      requestBody,
      { 
        headers: headers,
        responseType: 'arraybuffer' 
      }
    );
  }

  playAudio(audioData: ArrayBuffer): void {
    // Stop any currently playing audio
    this.stopAudio();
    
    const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    this.currentAudio = new Audio(audioUrl);
    
    // Add event listeners
    this.currentAudio.addEventListener('play', () => this.audioState.next('playing'));
    this.currentAudio.addEventListener('pause', () => this.audioState.next('paused'));
    this.currentAudio.addEventListener('ended', () => this.audioState.next('stopped'));
    
    this.currentAudio.play();
  }

  pauseAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resumeAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.play();
    }
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.audioState.next('stopped');
    }
  }

  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  getAudioState(): Observable<'playing' | 'paused' | 'stopped'> {
    return this.audioState.asObservable();
  }
}