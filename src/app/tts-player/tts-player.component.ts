// tts-player.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElevenlabsTtsService } from '../../services/elevenlabs-tts.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface Voice {
  voice_id: string;
  name: string;
  // ... other voice properties
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-tts-player',
  templateUrl: './tts-player.component.html',
  styleUrls: ['./tts-player.component.css']
})
export class TtsPlayerComponent implements OnInit, OnDestroy {
  textToSpeak: string = '';
  isLoading: boolean = false;
  voices: any[] = [];
  selectedVoice: string = '';
  availableModels: string[] = [
    'eleven_multilingual_v2',
    'eleven_turbo_v2',
    'eleven_monolingual_v1'
  ];
  selectedModel: string = 'eleven_multilingual_v2';
  isPlaying: boolean = false;
  hasAudio: boolean = false;
  private audioStateSubscription?: Subscription;

  constructor(private ttsService: ElevenlabsTtsService) {}

  ngOnInit() {
    this.loadVoices();
    this.audioStateSubscription = this.ttsService.getAudioState().subscribe(state => {
      this.isPlaying = state === 'playing';
      this.hasAudio = state !== 'stopped';
    });
  }

  ngOnDestroy() {
    if (this.audioStateSubscription) {
      this.audioStateSubscription.unsubscribe();
    }
  }

  loadVoices() {
    this.ttsService.getVoices().subscribe({
      next: (response: any) => {
        this.voices = response.voices;
        // Set default voice if available
        if (this.voices.length > 0) {
          this.selectedVoice = this.voices[0].voice_id;
        }
      },
      error: (err) => {
        console.error('Error loading voices:', err);
      }
    });
  }

  speak() {
    if (!this.textToSpeak.trim()) return;
    
    this.isLoading = true;
    this.hasAudio = false;
    this.ttsService.textToSpeech(this.textToSpeak, this.selectedVoice, this.selectedModel)
      .subscribe({
        next: (audioData) => {
          this.ttsService.playAudio(audioData);
          this.hasAudio = true;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error generating speech:', err);
          // Try to parse the error response if it's an ArrayBuffer
          if (err.error instanceof ArrayBuffer) {
            const decoder = new TextDecoder('utf-8');
            console.error('Error details:', decoder.decode(err.error));
          }
          this.isLoading = false;
        }
      });
  }

  pauseAudio() {
    this.ttsService.pauseAudio();
  }

  resumeAudio() {
    this.ttsService.resumeAudio();
  }

  stopAudio() {
    this.ttsService.stopAudio();
    this.hasAudio = false;
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.resumeAudio();
    }
  }
}