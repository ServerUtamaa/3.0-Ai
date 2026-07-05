
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceGender } from "../types";

// --- SFX GENERATOR (Telemetri biar keren pas loading) ---
export const playTelemetrySound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.1);
};

// --- NOTIFICATION SOUND (Keren & Mantep pas output keluar) ---
export const playNotificationSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    try {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const t = ctx.currentTime;
        
        // 1. The "Success" Arpeggio (Bright & Fast) - Triangle wave for clarity
        const arpFreqs = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6
        arpFreqs.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + index * 0.1);
            
            gain.gain.setValueAtTime(0, t + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, t + index * 0.1 + 0.02); // Louder
            gain.gain.exponentialRampToValueAtTime(0.001, t + index * 0.1 + 0.6);
            
            osc.start(t + index * 0.1);
            osc.stop(t + index * 0.1 + 0.7);
        });

        // 2. The Sustained "Sci-Fi" Pad (Longer, 2 seconds) - Sawtooth with Lowpass Filter
        const chordFreqs = [261.63, 392.00, 659.25]; // C4, G4, E5
        chordFreqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2500, t);
            filter.frequency.exponentialRampToValueAtTime(200, t + 2.0); // Filter sweep effect

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.1); // Rich background chord
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0); // Fades out over 2 seconds
            
            osc.start(t);
            osc.stop(t + 2.1);
        });

        // 3. Deep Sub-Bass Impact (Louder & Heavy)
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(150, t);
        bassOsc.frequency.exponentialRampToValueAtTime(30, t + 1.5); // Bass drop effect
        
        bassGain.gain.setValueAtTime(0, t);
        bassGain.gain.linearRampToValueAtTime(0.6, t + 0.05); // High impact volume
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        
        bassOsc.start(t);
        bassOsc.stop(t + 1.6);

    } catch (e) {
        console.error("Failed to play notification sound", e);
    }
};

// --- AUDIO DECODER UTILS (RAW PCM HANDLING) ---
// Gemini ngirim audio mentah (PCM), bukan MP3. Jadi harus didecode manual biar bisa bunyi di browser/APK.

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000, // Gemini Default Hz
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- MAIN SERVICE CLASS ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

class GeminiAudioService {
    private audioCtx: AudioContext | null = null;

    private getContext(): AudioContext {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
                sampleRate: 24000 
            });
        }
        return this.audioCtx;
    }

    // 1. Generate Audio dari Google Gemini
    public async generate(text: string, gender: VoiceGender, retries = 2): Promise<string | null> {
        try {
            // Konfigurasi Suara
            // MALE -> Fenrir (Deep, Authority, Bold)
            // FEMALE -> Kore (Soft, Elegant, Soothing)
            const voiceName = gender === 'MALE' ? 'Fenrir' : 'Kore';

            // Bersihkan teks biar bacanya enak (Gak baca simbol aneh)
            const cleanText = text
                .replace(/\*/g, '')
                .replace(/_/g, '')
                .replace(/-/g, ' ')
                .replace(/\//g, ' atau ')
                .replace(/RR:/g, 'Risk Reward ')
                .replace(/SL/g, 'Stop Loss ')
                .replace(/TP/g, 'Target Profit ');

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: { parts: [{ text: cleanText }] },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceName },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return base64Audio || null;

        } catch (error) {
            console.error("Gemini Audio Error:", error);
            if (retries > 0) {
                console.warn(`Retrying audio generation... (${retries} left)`);
                await new Promise(r => setTimeout(r, 1000));
                return this.generate(text, gender, retries - 1);
            }
            return null;
        }
    }

    // 2. Play Audio Raw PCM
    public async play(base64Audio: string, onComplete?: () => void) {
        if (!base64Audio) return;

        try {
            const ctx = this.getContext();
            
            // PENTING BUAT APK: Resume context kalau suspended (karena autoplay policy)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const pcmData = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(pcmData, ctx);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.onended = () => {
                if (onComplete) onComplete();
            };

            source.start();

        } catch (e) {
            console.error("Playback Error:", e);
            if (onComplete) onComplete();
        }
    }

    public stop() {
        if (this.audioCtx) {
            this.audioCtx.close().then(() => {
                this.audioCtx = null;
            });
        }
    }
}

export const audioService = new GeminiAudioService();
