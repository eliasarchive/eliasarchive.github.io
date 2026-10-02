import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Move, Volume2, VolumeX, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appearanceFeatures, ashley, directionalRelationships, elias, nanase, relationshipTypes, rowan, type ArchiveSection } from "@/lib/elias-data";
import { DriftingNotes, LikeMeter, ViewBadge } from "@/components/archive-social";
import { ManorRainCanvas } from "@/components/manor-rain-canvas";
import { LightningCanvas } from "@/components/lightning-canvas";
import manorEntranceForeground from "@/assets/manor-entrance-foreground.png";
import { WindowRainCanvas } from "@/components/window-rain-canvas";
import { fetchViews, registerView } from "@/lib/archive-social";
import manorEntrance from "@/assets/manor-rain-clear.jpg";
import manorStair from "@/assets/manor-hall-1.jpg";
import manorGallery from "@/assets/manor-hall-2.jpg";
import manorStudy from "@/assets/elias-room-original.png";
import manorRoomInterior from "@/assets/elias-room-original-foreground-v2.png";
import manorRoomGlass from "@/assets/elias-room-original-glass-v2.png";
import manorRoomPaneMask from "@/assets/elias-room-original-pane-mask-v2.png";
import eliasRose from "@/assets/elias-rose-cutout.png";
import eliasBowing from "@/assets/elias-bowing-cutout.png";
import eliasBotanicalFrame from "@/assets/elias-botanical-frame.png";
import welcomeFrameSquare from "@/assets/welcome-frame-square.png";
import welcomeRoseField from "@/assets/welcome-rose-field.jpg";
import archiveRoseField from "@/assets/archive-red-field.png";
import nanasePortrait from "@/assets/nanase-koji.png";
import nanaseClawLogo from "@/assets/nanase-claw-logo.png";
import ashleyPortrait from "@/assets/ashley-archer.png";
import ashleyHatEmblem from "@/assets/ashley-hat-emblem.png";
import ashleyNameEmblem from "@/assets/ashley-name-emblem.png";
import rowanPortrait from "@/assets/rowan-archer.png";
import rowanNameEmblem from "@/assets/rowan-name-emblem.png";
import eliasNameRose from "@/assets/elias-name-rose.png";
import roseEmblem from "@/assets/real-rose-emblem.jpg";
import roofRain from "@/assets/indoor-roof-rain.ogg";

type ExperienceStage = "manor" | "desk" | "welcome" | "archive";
type CharacterId = "elias" | "nanase" | "ashley" | "rowan";

import roomRainAudio from "@/assets/room-rain.mp3";

const manorScenes = [
  { image: manorEntrance, chapter: "I", title: "The entrance", note: "Approach" },
  { image: manorStair, chapter: "II", title: "The Main Hall", note: "Climbing the stairs" },
  { image: manorGallery, chapter: "III", title: "The Top Floor", note: "Approaching the room" },
  { image: manorStudy, chapter: "IV", title: "The room", note: "Enter" },
] as const;

function LaurelWreath() {
  const branchAngles = Array.from({ length: 12 }, (_, index) => 96 + index * 14.2);
  const leaves = branchAngles.map((angle) => {
    const radians = angle * Math.PI / 180;
    return {
      angle,
      x: 180 + 146 * Math.cos(radians),
      y: 180 + 146 * Math.sin(radians),
      tangent: angle + 90,
    };
  });

  return (
    <svg viewBox="0 0 360 360" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="laurel-gold" x1="0" y1="0" x2=".85" y2="1">
          <stop offset="0" stopColor="var(--brass-soft)" />
          <stop offset=".32" stopColor="var(--primary)" />
          <stop offset=".7" stopColor="var(--brass-soft)" />
          <stop offset="1" stopColor="var(--brass)" />
        </linearGradient>
        <g id="laurel-leaf">
          <path d="M0 0C9-11 25-13 37-4C28 8 12 11 0 0Z" />
          <path d="M3 0C14-2 25-3 33-4" fill="none" stroke="var(--brass-soft)" strokeWidth=".55" opacity=".58" />
        </g>
      </defs>
      <g className="laurel-metal" fill="url(#laurel-gold)" stroke="var(--primary)" strokeWidth=".7" strokeLinejoin="round">
        <path d="M180 331C91 301 42 228 54 143 61 91 91 49 137 23" fill="none" strokeWidth="2.2" opacity=".86" />
        <path d="M180 331c89-30 138-103 126-188-7-52-37-94-83-120" fill="none" strokeWidth="2.2" opacity=".86" />
        {leaves.map((leaf, index) => (
          <g key={`left-${index}`} transform={`translate(${leaf.x} ${leaf.y})`}>
            <use href="#laurel-leaf" transform={`rotate(${leaf.tangent - 39}) scale(${index < 2 || index > 9 ? .84 : 1})`} />
            <use href="#laurel-leaf" transform={`rotate(${leaf.tangent + 39}) scale(${index < 2 || index > 9 ? .8 : .94})`} opacity=".92" />
          </g>
        ))}
        {leaves.map((leaf, index) => (
          <g key={`right-${index}`} transform={`translate(${360 - leaf.x} ${leaf.y}) scale(-1 1)`}>
            <use href="#laurel-leaf" transform={`rotate(${leaf.tangent - 39}) scale(${index < 2 || index > 9 ? .84 : 1})`} />
            <use href="#laurel-leaf" transform={`rotate(${leaf.tangent + 39}) scale(${index < 2 || index > 9 ? .8 : .94})`} opacity=".92" />
          </g>
        ))}
        <path d="M180 329c-13-11-23-14-38-14 8 12 20 19 38 20 18-1 30-8 38-20-15 0-25 3-38 14Z" />
      </g>
    </svg>
  );
}

function ProfileVines() {
  return (
    <svg viewBox="0 0 560 660" preserveAspectRatio="none" className="profile-vines absolute inset-[-2.6rem] h-[calc(100%+5.2rem)] w-[calc(100%+5.2rem)] overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="vine-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brass-soft)" />
          <stop offset=".48" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--brass)" />
        </linearGradient>
        <radialGradient id="rose-red" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset=".55" stopColor="var(--burgundy)" />
          <stop offset="1" stopColor="var(--ink)" />
        </radialGradient>
        <g id="profile-leaf">
          <path d="M0 0C7-11 20-14 29-8C24 4 12 10 0 0Z" fill="url(#vine-gold)" stroke="var(--primary)" strokeWidth=".7" />
          <path d="M3 0 25-7" fill="none" stroke="var(--brass-soft)" strokeWidth=".65" opacity=".62" />
        </g>
        <g id="profile-rose">
          <path d="M0-23C13-26 23-15 20-4C30 5 22 20 10 20C2 30-14 24-17 13C-29 7-25-9-15-14C-12-22-6-25 0-23Z" fill="url(#rose-red)" stroke="var(--primary)" strokeWidth=".75" />
          <path d="M-12-7C-3-17 13-14 15-2C11 12-6 17-15 6C-8 8 1 5 3-2C-2-7-7-7-12-7Z" fill="var(--burgundy)" stroke="var(--brass)" strokeWidth=".55" />
          <path d="M-3-6C5-10 11-3 7 4C1 9-7 4-5-2C-1 1 3 0 3-3Z" fill="var(--ink)" opacity=".78" />
        </g>
      </defs>
      <g className="profile-vine-stems" fill="none" stroke="url(#vine-gold)" strokeLinecap="round">
        <path pathLength="1" d="M92 61C35 80 43 154 65 194C82 227 45 249 45 296C44 362 79 390 63 449C49 502 71 546 134 566C213 591 297 586 365 612C425 635 491 596 493 532" strokeWidth="3" />
        <path pathLength="1" d="M91 62C133 34 179 44 205 75M64 194C32 204 25 232 37 255M63 449C31 471 34 510 62 526M365 612C418 620 455 611 483 578" strokeWidth="1.5" />
        <path pathLength="1" d="M488 531C525 489 507 447 485 415C466 388 507 356 514 319C523 271 497 247 512 204C527 164 510 118 472 101" strokeWidth="2.2" />
      </g>
      <g className="profile-vine-leaves">
        <use href="#profile-leaf" transform="translate(72 123) rotate(-72)" /><use href="#profile-leaf" transform="translate(56 171) rotate(122) scale(.8)" />
        <use href="#profile-leaf" transform="translate(61 272) rotate(-88) scale(.9)" /><use href="#profile-leaf" transform="translate(61 376) rotate(112)" />
        <use href="#profile-leaf" transform="translate(82 505) rotate(-32)" /><use href="#profile-leaf" transform="translate(155 575) rotate(22) scale(.9)" />
        <use href="#profile-leaf" transform="translate(274 590) rotate(-158)" /><use href="#profile-leaf" transform="translate(397 615) rotate(-34)" />
        <use href="#profile-leaf" transform="translate(475 564) rotate(-76)" /><use href="#profile-leaf" transform="translate(500 468) rotate(116) scale(.85)" />
        <use href="#profile-leaf" transform="translate(490 391) rotate(-58)" /><use href="#profile-leaf" transform="translate(512 276) rotate(132)" />
        <use href="#profile-leaf" transform="translate(496 180) rotate(-58) scale(.8)" /><use href="#profile-leaf" transform="translate(478 111) rotate(144)" />
        <use href="#profile-leaf" transform="translate(151 48) rotate(18)" /><use href="#profile-leaf" transform="translate(199 65) rotate(-145) scale(.75)" />
      </g>
      <g className="profile-roses">
        <g transform="translate(92 61) scale(1.18)"><use href="#profile-rose" /></g>
        <g transform="translate(51 247) scale(.68)"><use href="#profile-rose" /></g>
        <g transform="translate(72 468) scale(.62)"><use href="#profile-rose" /></g>
        <g transform="translate(436 612) scale(.9)"><use href="#profile-rose" /></g>
        <g transform="translate(492 540) scale(1.05)"><use href="#profile-rose" /></g>
        <g transform="translate(503 219) scale(.64)"><use href="#profile-rose" /></g>
        <g transform="translate(205 75) scale(.5)"><use href="#profile-rose" /></g>
      </g>
      <rect className="profile-vine-glint" x="-180" y="-100" width="110" height="900" fill="url(#vine-gold)" opacity=".18" transform="rotate(15 280 330)" />
    </svg>
  );
}

const warmedImages: HTMLImageElement[] = [];

function ProfileBotanicalFrame() {
  return (
    <div className="profile-botanical-frame pointer-events-none absolute z-[7] overflow-visible" aria-hidden="true">
      <img src={eliasBotanicalFrame} alt="" width={1024} height={1408} className="profile-botanical-art h-full w-full" />
    </div>
  );
}

function useSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);
  const droneRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const jazzGainRef = useRef<GainNode | null>(null);
  const jazzRef = useRef<{ oscillators: OscillatorNode[]; timer: number } | null>(null);
  const pianoGainRef = useRef<GainNode | null>(null);
  const pianoRef = useRef<number | null>(null);
  const rainRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode; highpass: BiquadFilterNode; lowpass: BiquadFilterNode } | null>(null);
  const roofRainRef = useRef<HTMLAudioElement | null>(null);
  const windowRainRef = useRef<HTMLAudioElement | null>(null);
  const rainSceneRef = useRef(0);


  const ensure = useCallback(() => {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!contextRef.current) contextRef.current = new AudioCtx();
    const ctx = contextRef.current;
    return ctx;
  }, []);

  const resume = useCallback(async () => {
    const ctx = ensure();
    if (!ctx) return false;
    if (ctx.state !== "running") {
      try { await ctx.resume(); } catch { return false; }
    }
    return ctx.state === "running";
  }, [ensure]);

  const tone = useCallback((frequency = 180, duration = 0.13, volume = 0.025) => {
    const ctx = ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }, [ensure]);

  const roomEnter = useCallback(() => {
    const ctx = ensure();
    if (!ctx || !enabledRef.current) return;
    const t = ctx.currentTime + 0.02;
    const len = 2.2;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let low = 0;
    for (let i = 0; i < data.length; i += 1) { low = low * 0.92 + (Math.random() * 2 - 1) * 0.08; data[i] = low * 2.4 + (Math.random() * 2 - 1) * 0.12; }
    const noise = ctx.createBufferSource(); noise.buffer = buffer;
    const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.Q.value = 1.4;
    band.frequency.setValueAtTime(260, t); band.frequency.exponentialRampToValueAtTime(1900, t + 1.35); band.frequency.exponentialRampToValueAtTime(500, t + 1.9);
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.16, t + 1.2); ng.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
    noise.connect(band).connect(ng).connect(ctx.destination); noise.start(t); noise.stop(t + len);
    const boom = ctx.createOscillator(); boom.type = "sine";
    boom.frequency.setValueAtTime(72, t); boom.frequency.exponentialRampToValueAtTime(38, t + 1.8);
    const bg = ctx.createGain(); bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.09, t + 0.9); bg.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    boom.connect(bg).connect(ctx.destination); boom.start(t); boom.stop(t + 2.1);
    ([[1.38, 1320], [1.45, 1760]] as const).forEach(([at, f]) => {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(f, t + at);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(0.035, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.28);
      o.connect(g).connect(ctx.destination); o.start(t + at); o.stop(t + at + 0.3);
    });
  }, [ensure]);

  const thunder = useCallback(() => {
    const ctx = ensure();
    if (!ctx || ctx.state !== "running" || !enabledRef.current) return;
    const start = ctx.currentTime + 0.06;
    const duration = 4.4;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lowNoise = 0;
    for (let index = 0; index < data.length; index += 1) {
      const time = index / ctx.sampleRate;
      lowNoise = lowNoise * 0.985 + (Math.random() * 2 - 1) * 0.015;
      const crack = time < 0.18 ? (Math.random() * 2 - 1) * Math.exp(-time * 18) : 0;
      data[index] = lowNoise * Math.exp(-time * 0.72) * 3.2 + crack * 0.32;
    }
    const noise = ctx.createBufferSource();
    const lowpass = ctx.createBiquadFilter();
    const body = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.buffer = buffer;
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(310, start);
    lowpass.frequency.exponentialRampToValueAtTime(95, start + duration);
    body.type = "peaking";
    body.frequency.value = 72;
    body.Q.value = 0.75;
    body.gain.value = 11;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.34, start + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    noise.connect(lowpass).connect(body).connect(gain).connect(ctx.destination);

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = "sine";
    rumble.frequency.setValueAtTime(48 + Math.random() * 8, start);
    rumble.frequency.exponentialRampToValueAtTime(31, start + 2.7);
    rumbleGain.gain.setValueAtTime(0.0001, start);
    rumbleGain.gain.exponentialRampToValueAtTime(0.11, start + 0.16);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, start + 3.5);
    rumble.connect(rumbleGain).connect(ctx.destination);
    noise.start(start); noise.stop(start + duration);
    rumble.start(start); rumble.stop(start + 3.6);
  }, [ensure]);

  const beginAmbience = useCallback(() => {
    const ctx = ensure();
    if (!ctx || droneRef.current) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 55;
    gain.gain.value = 0.008;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    droneRef.current = oscillator;
    gainRef.current = gain;
  }, [ensure]);

  const prepareRain = useCallback(() => {
    const ctx = ensure();
    if (!ctx || rainRef.current) return;
    if (!roofRainRef.current) {
      const roofRainAudio = new Audio(roofRain);
      roofRainAudio.loop = true;
      roofRainAudio.preload = "auto";
      roofRainAudio.load();
      roofRainRef.current = roofRainAudio;
    }
    if (!windowRainRef.current) {
      const windowRain = new Audio(roomRainAudio);
      windowRain.loop = true;
      windowRain.preload = "auto";
      windowRain.load();
      windowRainRef.current = windowRain;
    }
    const length = Math.floor(ctx.sampleRate * 5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.035 * white) / 1.035;
      data[index] = last * 3.2 + white * 0.35;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 380;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 5600;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    source.connect(highpass).connect(lowpass).connect(gain).connect(ctx.destination);
    source.start();
    rainRef.current = { source, gain, highpass, lowpass };
  }, [ensure]);

  const setRainScene = useCallback((scene: number) => {
    rainSceneRef.current = scene;
    prepareRain();
    const ctx = contextRef.current;
    const rain = rainRef.current;
    if (!ctx || !rain) return;
    const profiles = [
      { volume: .11, high: 380, low: 5600 },
      { volume: .0001, high: 850, low: 3900 },
      { volume: .0001, high: 950, low: 5000 },
      { volume: .0001, high: 1100, low: 5400 },
    ];
    const profile = profiles[Math.max(0, Math.min(scene, profiles.length - 1))] ?? profiles[0];
    if (!profile) return;
    const volume = enabledRef.current ? profile.volume : .0001;
    rain.gain.gain.setTargetAtTime(volume, ctx.currentTime, .28);
    rain.highpass.frequency.setTargetAtTime(profile.high, ctx.currentTime, .35);
    rain.lowpass.frequency.setTargetAtTime(profile.low, ctx.currentTime, .35);
    const roofRain = roofRainRef.current;
    const windowRain = windowRainRef.current;
    if (roofRain) {
      roofRain.volume = enabledRef.current && scene === 1 ? .34 : enabledRef.current && scene === 2 ? .5 : 0;
      if (scene === 1 || scene === 2) void roofRain.play().catch(() => undefined);
      else roofRain.pause();
    }
    if (windowRain) {
      if (enabledRef.current && scene === 3) {
        windowRain.volume = .44;
        void windowRain.play().catch(() => undefined);
      } else windowRain.pause();
    }
  }, [prepareRain]);

  const beginRain = useCallback(() => setRainScene(0), [setRainScene]);

  const stopRain = useCallback(() => {
    const ctx = contextRef.current;
    const rain = rainRef.current;
    if (!ctx || !rain) return;
    rain.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    roofRainRef.current?.pause();
    windowRainRef.current?.pause();
    window.setTimeout(() => { try { rain.source.stop(); } catch { /* already stopped */ } }, 1600);
    rainRef.current = null;
  }, []);

  const beginPiano = useCallback(() => {
    const ctx = ensure();
    if (!ctx || pianoRef.current !== null) return;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.4);
    master.connect(ctx.destination);
    pianoGainRef.current = master;
    const progression = [[130.81, 164.81, 196], [110, 130.81, 164.81], [146.83, 174.61, 220], [98, 123.47, 146.83]];
    let phrase = 0;
    const note = (frequency: number, start: number, duration: number, volume: number) => {
      const oscillator = ctx.createOscillator();
      const harmonics = ctx.createOscillator();
      const envelope = ctx.createGain();
      oscillator.type = "triangle";
      harmonics.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      harmonics.frequency.setValueAtTime(frequency * 2, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.025);
      envelope.gain.exponentialRampToValueAtTime(volume * 0.22, start + 0.35);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      harmonics.connect(envelope);
      envelope.connect(master);
      oscillator.start(start); harmonics.start(start);
      oscillator.stop(start + duration); harmonics.stop(start + duration);
    };
    const playPhrase = () => {
      const chord = progression[phrase % progression.length] ?? progression[0]!;
      const start = ctx.currentTime + 0.05;
      chord.forEach((frequency, index) => note(frequency * 2, start + index * 0.12, 2.8, 0.08 / (index + 1)));
      note((chord[0] ?? 130.81) * 4, start + 1.25, 1.45, 0.025);
      phrase += 1;
    };
    playPhrase();
    pianoRef.current = window.setInterval(playPhrase, 3200);
  }, [ensure]);

  const stopPiano = useCallback(() => {
    if (pianoRef.current !== null) window.clearInterval(pianoRef.current);
    pianoRef.current = null;
    const ctx = contextRef.current;
    if (ctx && pianoGainRef.current) pianoGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
    pianoGainRef.current = null;
  }, []);

  const beginJazz = useCallback(() => {
    const ctx = ensure();
    if (!ctx || jazzRef.current) return;
    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    jazzGainRef.current = master;
    // ii - V - I - vi in F, voiced as seventh chords
    const chords = [[146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 233.08], [174.61, 220, 261.63, 329.63], [110, 130.81, 164.81, 196]];
    const melodyScale = [349.23, 392, 440, 523.25, 587.33, 698.46];
    let bar = 0;
    const voice = (frequency: number, start: number, duration: number, volume: number, type: OscillatorType) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.06);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope).connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    };
    const playBar = () => {
      const chord = chords[bar % chords.length] ?? chords[0]!;
      const start = ctx.currentTime + 0.05;
      chord.forEach((frequency, index) => voice(frequency * 2, start + index * 0.045, 2.1, 0.06 / (index * 0.5 + 1), "triangle"));
      [0, 0.6, 1.2, 1.8].forEach((beat, index) => voice((chord[index % chord.length] ?? 146.83) / 2, start + beat, 0.5, 0.09, "sine"));
      [0.3, 0.95, 1.5].forEach((beat) => voice(melodyScale[Math.floor(Math.random() * melodyScale.length)] ?? 440, start + beat, 0.45, 0.045, "sine"));
      bar += 1;
    };
    playBar();
    const timer = window.setInterval(playBar, 2400);
    jazzRef.current = { oscillators: [], timer };
  }, [ensure]);

  useEffect(() => {
    enabledRef.current = enabled;
    const ctx = contextRef.current;
    if (!ctx) return;
    if (gainRef.current) gainRef.current.gain.setTargetAtTime(enabled ? 0.008 : 0.0001, ctx.currentTime, 0.1);
    if (jazzGainRef.current) jazzGainRef.current.gain.setTargetAtTime(enabled ? 0.32 : 0.0001, ctx.currentTime, 0.12);
    if (pianoGainRef.current) pianoGainRef.current.gain.setTargetAtTime(enabled ? 0.18 : 0.0001, ctx.currentTime, 0.12);
    if (rainRef.current) rainRef.current.gain.gain.setTargetAtTime(enabled ? 0.11 : 0.0001, ctx.currentTime, 0.2);
    if (roofRainRef.current) roofRainRef.current.volume = enabled && rainSceneRef.current === 1 ? .34 : enabled && rainSceneRef.current === 2 ? .5 : 0;
    if (windowRainRef.current) {
      if (enabled && rainSceneRef.current === 3) { windowRainRef.current.volume = .44; void windowRainRef.current.play().catch(() => undefined); }
      else windowRainRef.current.pause();
    }
  }, [enabled]);

  return { tone, roomEnter, thunder, beginAmbience, beginJazz, beginPiano, stopPiano, beginRain, prepareRain, setRainScene, stopRain, resume };
}

export function EliasExperience() {
  const [stage, setStage] = useState<ExperienceStage>("manor");
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [section, setSection] = useState<ArchiveSection>("relationships");
  const [computerZoom, setComputerZoom] = useState(false);
  const [enteringRoom, setEnteringRoom] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const { tone, roomEnter, thunder, beginAmbience, beginJazz, stopPiano, beginRain, prepareRain, setRainScene, stopRain, resume } = useSound(!muted);

  useEffect(() => {
    const sources = [manorEntranceForeground, manorStair, manorGallery, manorStudy, manorRoomInterior, manorRoomGlass, manorRoomPaneMask, welcomeRoseField, welcomeFrameSquare, eliasBotanicalFrame, eliasRose, eliasBowing, nanasePortrait, nanaseClawLogo, ashleyPortrait, ashleyHatEmblem, ashleyNameEmblem, rowanPortrait, rowanNameEmblem, roseEmblem, archiveRoseField];
    let cancelled = false;
    let sourceIndex = 0;
    const warmNext = () => {
      if (cancelled || sourceIndex >= sources.length) return;
      const source = sources[sourceIndex];
      sourceIndex += 1;
      if (!source) return;
      const image = new Image();
      image.decoding = "async";
      image.src = source;
      warmedImages.push(image);
      void image.decode().catch(() => undefined).finally(() => {
        if (!cancelled) window.setTimeout(warmNext, 40);
      });
    };
    const idleId = "requestIdleCallback" in window
      ? window.requestIdleCallback(warmNext, { timeout: 900 })
      : window.setTimeout(warmNext, 250);
    prepareRain();
    return () => {
      cancelled = true;
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [prepareRain]);


  useEffect(() => {
    if (stage !== "manor" || scene !== 0) return;
    let active = true;
    // Schedule the entrance sound while the context is suspended. GitHub Pages
    // cannot receive autoplay delegation like the Lovable preview, so the first
    // browser-approved gesture only has to resume an already-playing graph.
    beginRain();
    beginAmbience();
    const start = async () => {
      const running = await resume();
      if (!active || !running) return;
      beginRain();
      beginAmbience();
    };
    void start();
    const delayed = window.setTimeout(() => void start(), 400);
    const unlock = () => void start();
    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("click", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    window.addEventListener("touchstart", unlock, { capture: true });
    window.addEventListener("pageshow", unlock);
    document.addEventListener("visibilitychange", unlock);
    return () => {
      active = false;
      window.clearTimeout(delayed);
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("click", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      window.removeEventListener("touchstart", unlock, { capture: true });
      window.removeEventListener("pageshow", unlock);
      document.removeEventListener("visibilitychange", unlock);
    };
  }, [stage, scene, beginRain, beginAmbience, resume]);

  const advanceManor = () => {
    beginAmbience();
    tone(scene === 0 ? 165 : 205, 0.16, 0.025);
    window.setTimeout(() => tone(scene === 0 ? 220 : 275, 0.22, 0.018), 85);
    if (scene < manorScenes.length - 1) {
      const nextScene = scene + 1;
      setRainScene(nextScene);
      setScene(nextScene);
    }
    else {
      setEnteringRoom(true);
      roomEnter();
      window.setTimeout(thunder, 950);
      window.setTimeout(() => setStage("desk"), 1750);
    }
  };

  const enterComputer = () => {
    tone(240, 0.5, 0.04);
    stopRain();
    stopPiano();
    beginJazz();
    setComputerZoom(true);
    void registerView().then(setViews).catch(() => { void fetchViews().then(setViews).catch(() => undefined); });
    window.setTimeout(() => setStage("welcome"), 1250);
  };

  return (
    <main className={`${stage === "manor" || stage === "desk" ? "fixed inset-0 overflow-hidden" : "min-h-dvh"} w-full bg-background text-foreground selection:bg-primary/30`}>
      <SoundControl muted={muted} stage={stage} onToggle={() => setMuted((value) => !value)} />
      <footer className="pointer-events-none fixed inset-x-0 bottom-2 z-0 text-center text-[8px] uppercase tracking-[.2em] text-foreground/55 mix-blend-difference">Made by @safffffffr · All rights reserved</footer>
       {stage === "manor" && <ManorSequence scene={scene} enteringRoom={enteringRoom} onThunder={thunder} onAdvance={advanceManor} onSkip={() => { setRainScene(3); setStage("desk"); }} />}
       {stage === "desk" && <DeskScene onEnter={enterComputer} entering={computerZoom} />}
      {stage === "welcome" && <WelcomeScreen onEnter={() => { tone(360, .45, .035); setStage("archive"); }} />}
      {stage === "archive" && <div className="archive-rose-field" aria-hidden="true"><img src={archiveRoseField} alt="" className="h-full w-full object-cover" /></div>}
      {stage === "archive" && (
        <div className="relative z-[1]"><Archive section={section} onSection={(next) => { tone(220, .12, .018); setSection(next); }} tone={tone} views={views} /></div>
      )}
    </main>
  );
}

function SoundControl({ muted, stage, onToggle }: { muted: boolean; stage: ExperienceStage; onToggle: () => void }) {
  const position = stage === "manor" ? "right-4 top-4" : stage === "desk" ? "left-4 top-4" : "bottom-8 right-4";
  return (
    <Button aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"} onClick={onToggle} variant="ghost" size="icon" className={`fixed z-[70] h-8 w-8 border border-border bg-background/70 text-primary backdrop-blur-md hover:bg-card [&_svg]:h-3.5 [&_svg]:w-3.5 ${position}`}>
      {muted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}


const dustMotes = Array.from({ length: 46 }, (_, index) => ({
  x: (index * 37 + 11) % 100,
  y: (index * 61 + 7) % 100,
  size: 1.2 + ((index * 17) % 7) * 0.46,
  duration: 7 + ((index * 13) % 13),
  delay: -((index * 7) % 18),
  drift: -42 + ((index * 19) % 85),
  depth: 0.58 + ((index * 23) % 43) / 50,
}));

function RoomDust({ entering = false, subtle = false }: { entering?: boolean; subtle?: boolean }) {
  const motes = subtle ? dustMotes.slice(0, 24) : dustMotes;
  return (
    <div className={`room-dust ${subtle ? "manor-dust" : ""} ${entering ? "room-dust-rush" : ""}`} aria-hidden="true">
      {motes.map((mote, index) => (
        <span
          key={index}
          style={{
            "--dust-x": `${mote.x}%`,
            "--dust-y": `${mote.y}%`,
            "--dust-size": `${mote.size}px`,
            "--dust-duration": `${mote.duration}s`,
            "--dust-delay": `${mote.delay}s`,
            "--dust-drift": `${mote.drift}px`,
            "--dust-depth": mote.depth,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function ManorSequence({ scene, enteringRoom, onThunder, onAdvance, onSkip }: { scene: number; enteringRoom: boolean; onThunder: () => void; onAdvance: () => void; onSkip: () => void }) {
  const current = manorScenes[scene];
  if (!current) return null;
  return (
    <section className={`relative h-dvh overflow-hidden bg-ink ${enteringRoom ? "room-transition-out" : ""}`} aria-label="Journey through the manor">
      <div key={current.image} className={`cinematic-frame absolute inset-0 ${enteringRoom ? "room-camera-push" : ""}`}>
        {scene === 0 ? (
          <>
            <img src={manorEntrance} alt="The manor in heavy rain" width={1376} height={768} className="h-full w-full object-cover" />
            <LightningCanvas onStrike={onThunder} />
            <img src={manorEntranceForeground} alt="" width={1376} height={768} className="manor-entrance-foreground pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover" aria-hidden="true" />
            <ManorRainCanvas />
          </>
        ) : (
          <>
            <img src={current.image} alt={scene === manorScenes.length - 1 ? "The manor study with a MacBook centered on the desk" : "An empty manor hall"} width={scene === manorScenes.length - 1 ? 2692 : 1200} height={scene === manorScenes.length - 1 ? 1408 : 675} className={`${scene === manorScenes.length - 1 ? "cinematic-bedroom absolute inset-0 z-0" : "cinematic-image"} h-full w-full object-cover`} />
            {(scene === 1 || scene === 2) && <RoomDust subtle />}
            {scene === manorScenes.length - 1 && (
              <>
                <WindowRainCanvas maskSrc={manorRoomPaneMask} className="cinematic-bedroom" layer="rain" zIndex={1} />
                <img src={manorRoomGlass} alt="" width={1920} height={1004} className="cinematic-bedroom pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover" aria-hidden="true" />
                <WindowRainCanvas maskSrc={manorRoomPaneMask} className="cinematic-bedroom" layer="droplets" zIndex={3} />
                <img src={manorRoomInterior} alt="" width={1920} height={1004} className="cinematic-bedroom pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover" aria-hidden="true" />
                <RoomDust entering={enteringRoom} />
              </>
            )}
          </>
        )}
      </div>
      {scene === manorScenes.length - 1 && <div className={`room-before-entry-dim ${enteringRoom ? "room-before-entry-lighten" : ""}`} aria-hidden="true" />}
      {enteringRoom && (
        <div className="room-threshold-transition" aria-hidden="true">
          <span className="room-light-seam" />
          <span className="room-perspective-guides"><i /><i /><i /><i /></span>
          <span className="room-iris" />
          <span className="room-iris-corners"><i /><i /><i /><i /></span>
          <span className="room-letterbox room-letterbox-top" />
          <span className="room-letterbox room-letterbox-bottom" />
        </div>
      )}
      <div className="vignette absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/25" />
      <div className="room-passage-copy absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-8 px-6 pb-8 md:px-12 md:pb-12">
        <div className="max-w-md border-l border-primary/60 pl-5">
          <p className="mb-2 text-[10px] uppercase tracking-[.35em] text-primary">Passage {current.chapter}</p>
          <h1 className="font-display text-4xl font-medium md:text-6xl">{current.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[.28em] text-muted-foreground">{current.note}</p>
        </div>
        <Button disabled={enteringRoom} onClick={onAdvance} className="h-12 border border-primary/60 bg-background/55 px-6 uppercase tracking-[.22em] text-foreground backdrop-blur-md transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none">
          {scene === manorScenes.length - 1 ? "Enter the room" : "Continue"}
        </Button>
      </div>
      <Button onClick={onSkip} variant="ghost" className="absolute left-4 top-4 z-20 text-[10px] uppercase tracking-[.24em] text-muted-foreground hover:bg-background/50 hover:text-foreground">Skip passage</Button>
      <div className="absolute bottom-0 left-0 z-20 h-px bg-primary transition-all duration-1000" style={{ width: `${((scene + 1) / manorScenes.length) * 100}%` }} />
    </section>
  );
}

function DeskScene({ onEnter, entering }: { onEnter: () => void; entering: boolean }) {
  return (
    <section className="desk-scene-enter relative h-dvh overflow-hidden bg-ink">
      <img src={manorStudy} alt="A real room in Harlaxton Manor with a writing desk" width={2692} height={1408} className={`bedroom-terminal-view absolute inset-0 z-0 h-full w-full object-cover ${entering ? "terminal-zoom" : ""}`} />
      <WindowRainCanvas maskSrc={manorRoomPaneMask} layer="rain" zIndex={1} className={`bedroom-terminal-view ${entering ? "terminal-zoom" : ""}`} />
      <img src={manorRoomGlass} alt="" width={1920} height={1004} className={`bedroom-terminal-view pointer-events-none absolute inset-0 z-[2] h-full w-full object-cover ${entering ? "terminal-zoom" : ""}`} aria-hidden="true" />
      <WindowRainCanvas maskSrc={manorRoomPaneMask} layer="droplets" zIndex={3} className={`bedroom-terminal-view ${entering ? "terminal-zoom" : ""}`} />
      <img src={manorRoomInterior} alt="" width={1920} height={1004} className={`bedroom-terminal-view pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover ${entering ? "terminal-zoom" : ""}`} aria-hidden="true" />
      <RoomDust />
      <div className="desk-arrival-glint pointer-events-none absolute inset-0 z-[7]" aria-hidden="true" />
      <div className="desk-letterbox-exit pointer-events-none absolute inset-0 z-[8]" aria-hidden="true"><span /><span /></div>
      <div className="vignette absolute inset-0 z-[5] bg-background/10" />
      <div className={`terminal-image-frame pointer-events-none absolute left-1/2 top-1/2 z-10 ${entering ? "terminal-zoom" : ""}`}>
      <Button disabled={entering} aria-label="Enter Elias Archer's computer" onClick={onEnter} variant="ghost" className={`terminal-hotspot terminal-target-open terminal-monitor group pointer-events-auto absolute z-10 min-w-0 rounded-none border p-0 transition-colors duration-700 disabled:pointer-events-none ${entering ? "terminal-hotspot-entering" : ""}`}>
        <span className="terminal-corner terminal-corner-tl" /><span className="terminal-corner terminal-corner-tr" /><span className="terminal-corner terminal-corner-bl" /><span className="terminal-corner terminal-corner-br" />
        <span className="absolute inset-1 border border-primary/20 transition-all duration-500 group-hover:inset-0 group-hover:border-primary/60" />
        <span className="absolute left-1/2 top-[calc(100%+0.55rem)] -translate-x-1/2 whitespace-nowrap border border-primary/60 bg-background/90 px-3 py-1.5 text-[7px] uppercase tracking-[.2em] text-primary shadow-lg backdrop-blur-md md:px-4 md:py-2 md:text-[9px] md:tracking-[.28em]">Access terminal</span>
      </Button>
      </div>
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="font-display text-2xl text-foreground/80">Rain traces the window.</p>
        <p className="mt-2 text-[9px] uppercase tracking-[.28em] text-muted-foreground">The computer is waiting</p>
      </div>
    </section>
  );
}

function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const screenRef = useRef<HTMLButtonElement | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    if (pointerFrameRef.current !== null) return;
    pointerFrameRef.current = window.requestAnimationFrame(() => {
      screenRef.current?.style.setProperty("--pointer-x", String(x));
      screenRef.current?.style.setProperty("--pointer-y", String(y));
      pointerFrameRef.current = null;
    });
  };
  useEffect(() => () => {
    if (pointerFrameRef.current !== null) window.cancelAnimationFrame(pointerFrameRef.current);
  }, []);
  const continueToArchive = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onEnter, 650);
  };
  return (
    <button ref={screenRef} onClick={continueToArchive} onPointerMove={handlePointerMove} className={`welcome-screen grain relative flex h-dvh w-full cursor-pointer items-center justify-center overflow-hidden bg-ink text-center animate-in fade-in duration-700 ${leaving ? "welcome-transition-out" : ""}`}>
      <div className="computer-desktop welcome-parallax-back absolute inset-0" />
      <div className="welcome-rose-field welcome-parallax-field" aria-hidden="true"><img src={welcomeRoseField} alt="" width={1920} height={1152} decoding="async" className="h-full w-full object-cover" /></div>
      <div className="absolute inset-3 border border-primary/20 md:inset-8" />
      <div className="absolute inset-x-3 top-3 flex h-9 items-center justify-between border-b border-primary/20 bg-background/60 px-4 text-[7px] uppercase tracking-[.25em] text-muted-foreground backdrop-blur-md md:inset-x-8 md:top-8"><span>Archer OS</span><span>Private computer · Secure session</span></div>
      <div className="welcome-panel relative flex min-h-[28rem] w-[min(90vw,38rem)] flex-col items-center justify-center border border-primary/25 bg-background/65 px-5 py-10 shadow-2xl backdrop-blur-xl">
        <div className="welcome-botanical-frame" aria-hidden="true" style={{ borderImageSource: `url(${welcomeFrameSquare})` }} />
        <div className="welcome-crest relative z-10 mb-8 grid h-28 w-28 place-items-center rounded-full border border-primary/50" aria-hidden="true">
          <div className="crest-rotate absolute inset-[-9px] rounded-full border border-dashed border-primary/35" />
           <img src={roseEmblem} alt="" width={816} height={816} className="welcome-rose-emblem h-16 w-16 rounded-full object-cover" />
        </div>
        <p className="mb-4 text-[9px] uppercase tracking-[.45em] text-primary">Private archive</p>
        <h1 className="font-display text-5xl font-medium md:text-7xl">Welcome Back</h1>
        <p className="mt-3 font-display text-2xl italic text-brass-soft md:text-4xl">Elias Archer</p>
        <div className="mt-12 h-px w-40 bg-primary/30" />
        <p className="mt-6 text-[8px] uppercase tracking-[.32em] text-muted-foreground">Click anywhere to continue</p>
      </div>
      <div className="absolute bottom-5 left-5 flex items-center gap-2 text-[7px] uppercase tracking-[.2em] text-muted-foreground md:bottom-12 md:left-12"><span className="h-1.5 w-1.5 bg-primary shadow-[0_0_12px_var(--primary)]" />System ready</div>
    </button>
  );
}

function Archive({ section, onSection, tone, views }: { section: ArchiveSection; onSection: (section: ArchiveSection) => void; tone: (frequency?: number, duration?: number, volume?: number) => void; views: number | null }) {
  const labels: Array<{ id: ArchiveSection; label: string; numeral: string }> = [
    { id: "relationships", label: "Relationship Chart", numeral: "01" },
    { id: "appearance", label: "Appearance", numeral: "02" },
    { id: "backstory", label: "Backstory", numeral: "03" },
  ];
  return (
    <section className="archive-grid relative min-h-dvh overflow-hidden bg-transparent text-foreground animate-in fade-in duration-700">
      <DriftingNotes />
      <header className="relative z-30 grid border-b border-border bg-background/85 px-5 pt-4 backdrop-blur-xl md:min-h-20 md:grid-cols-[1fr_auto_1fr] md:items-center md:px-10 md:pt-0">
        <div className="pb-3 md:pb-0">
          <p className="font-display text-2xl">Elias Archer</p>
          <p className="text-[8px] uppercase tracking-[.35em] text-muted-foreground">Private record · Kitagawa High</p>
        </div>
        <ViewBadge views={views} />
        <nav className="grid w-full grid-cols-3 gap-1 md:flex md:w-auto md:justify-self-end" aria-label="Archive sections">
          {labels.map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => onSection(item.id)} className={`h-auto min-w-0 whitespace-normal rounded-none border-b px-1 py-3 text-center text-[8px] uppercase tracking-[.12em] md:px-5 md:text-[9px] md:tracking-[.16em] ${section === item.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <span className="hidden md:inline">{item.numeral} · </span>{item.label}
            </Button>
          ))}
        </nav>
      </header>
      <div key={section} className="archive-enter relative z-30">
        {section === "relationships" && <RelationshipChart tone={tone} />}
        {section === "appearance" && <AppearanceDossier tone={tone} />}
        {section === "backstory" && <Backstory />}
      </div>
    </section>
  );
}

function RelationshipChart({ tone }: { tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const [profileOpen, setProfileOpenRaw] = useState<CharacterId | null>(null);
  const [profileLeaving, setProfileLeaving] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState({ x: 0, y: 0 });
  const profileTargetRef = useRef<HTMLElement | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const profileSideRef = useRef<"left" | "right">("right");
  const profileTimer = useRef<number | undefined>(undefined);
  const setProfileOpen = (next: CharacterId | null | ((open: CharacterId | null) => CharacterId | null)) => {
    const value = typeof next === "function" ? next(profileOpen) : next;
    window.clearTimeout(profileTimer.current);
    if (value === null) {
      if (!profileOpen) return;
      setProfileLeaving(true);
      profileTimer.current = window.setTimeout(() => { setProfileOpenRaw(null); setProfileLeaving(false); }, 240);
    } else { setProfileLeaving(false); setProfileOpenRaw(value); }
  };
  const positionProfile = useCallback((target: HTMLElement, side: "left" | "right", updateState = false) => {
    const rect = target.getBoundingClientRect();
    const panelWidth = window.innerWidth < 768 ? 172 : 240;
    const idealX = side === "right" ? rect.right + 12 : rect.left - panelWidth - 12;
    const x = Math.max(8, Math.min(idealX, window.innerWidth - panelWidth - 8));
    const panelHeight = profilePanelRef.current?.getBoundingClientRect().height ?? (window.innerWidth < 768 ? 420 : 475);
    const idealY = rect.top + rect.height / 2;
    const y = Math.max(panelHeight / 2 + 8, Math.min(idealY, window.innerHeight - panelHeight / 2 - 8));
    const panel = profilePanelRef.current;
    if (panel) {
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    }
    if (updateState) setProfileAnchor({ x, y });
  }, []);
  const toggleProfile = (character: CharacterId, target: HTMLElement) => {
    if (profileOpen === character) {
      setProfileOpen(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const panelWidth = window.innerWidth < 768 ? 172 : 240;
    const preferredRight = rect.right + 12;
    const side = character === "ashley" || character === "rowan" ? "left" : preferredRight + panelWidth <= window.innerWidth - 8 ? "right" : "left";
    profileTargetRef.current = target;
    profileSideRef.current = side;
    positionProfile(target, side, true);
    setProfileOpen(character);
  };
  const [viewerOpen, setViewerOpen] = useState<CharacterId | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CharacterId | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef({ offset, zoom });
  const orbitRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const onDragMove = (clientX: number, clientY: number) => {
    const d = drag.current; if (!d) return;
    pendingRef.current = { x: d.ox + clientX - d.x, y: d.oy + clientY - d.y };
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = pendingRef.current; const el = orbitRef.current;
      if (!p || !el) return;
      viewRef.current = { ...viewRef.current, offset: p };
      el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${viewRef.current.zoom})`;
      const profileTarget = profileTargetRef.current;
      if (profileTarget) positionProfile(profileTarget, profileSideRef.current);
    });
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (pendingRef.current) { const p = pendingRef.current; pendingRef.current = null; setOffset(p); }
  };
  useEffect(() => {
    if (window.innerWidth < 768) setZoom(.68);
  }, []);
  useEffect(() => { viewRef.current = { offset, zoom }; }, [offset, zoom]);
  useEffect(() => {
    const profileTarget = profileTargetRef.current;
    if (!profileOpen || !profileTarget) return;
    const frame = requestAnimationFrame(() => positionProfile(profileTarget, profileSideRef.current));
    return () => cancelAnimationFrame(frame);
  }, [offset, positionProfile, profileOpen, zoom]);
  const changeZoom = useCallback((nextZoom: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const current = viewRef.current;
    const next = Math.min(2.5, Math.max(.55, nextZoom));
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
    const ratio = next / current.zoom;
    setOffset({ x: px - (px - current.offset.x) * ratio, y: py - (py - current.offset.y) * ratio });
    setZoom(next);
  }, []);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      changeZoom(viewRef.current.zoom * Math.exp(-delta * .0015), event.clientX, event.clientY);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [changeZoom]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && (viewerOpen ? setViewerOpen(null) : setProfileOpen(null));
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [viewerOpen]);

  return (
    <div className="min-h-[calc(100dvh-5rem)] px-5 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-8">
        <div><p className="text-[9px] uppercase tracking-[.35em] text-primary">Network index</p><h2 className="mt-2 font-display text-4xl md:text-6xl">Relationship Chart</h2></div>
      </div>
       <div ref={viewportRef} className="relative mx-auto h-[50vh] min-h-[420px] max-w-5xl touch-none select-none cursor-grab overflow-hidden border-y border-border active:cursor-grabbing" onPointerDown={(event) => { if ((event.target as HTMLElement).closest("button, [role='dialog']")) return; drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => onDragMove(event.clientX, event.clientY)} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 text-[8px] uppercase tracking-[.22em] text-muted-foreground"><Move className="h-3 w-3" /> Drag · scroll to zoom</div>
        <div className="absolute right-4 top-4 z-40 flex gap-1" onPointerDown={(event) => event.stopPropagation()}>
          <Button variant="outline" size="icon" aria-label="Zoom out relationship chart" onClick={() => { tone(185, .08, .012); changeZoom(viewRef.current.zoom / 1.2); }}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Zoom in relationship chart" onClick={() => { tone(245, .08, .012); changeZoom(viewRef.current.zoom * 1.2); }}><ZoomIn className="h-4 w-4" /></Button>
        </div>
         <div ref={orbitRef} className={`chart-orbit absolute left-1/2 top-1/2 h-[30rem] w-[48rem] will-change-transform md:h-[34rem] md:w-[58rem] ${profileOpen ? `chart-orbit-profile-open chart-orbit-profile-${profileOpen}` : ""}`} style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}>
        <div className="pointer-events-none absolute inset-0 rounded-full border border-primary/15" />
        <div className="pointer-events-none absolute inset-[9%] rounded-full border border-primary/35" />
        <div className="pointer-events-none absolute inset-[14%] rounded-full border border-primary/20" />
          <div className={`relationship-connection relationship-connection-nanase-pair absolute z-40 ${hoveredNode === "elias" || hoveredNode === "nanase" ? `relationship-connection-${hoveredNode}` : ""}`}>
            {directionalRelationships.filter((relationship) => relationship.pair === "nanase").map((relationship, index) => (
               <button key={relationship.id} className={`directional-link absolute inset-x-0 h-5 ${index === 0 ? "-translate-y-3" : "translate-y-1"}`} aria-label={`${relationship.from} to ${relationship.to}: ${relationship.portions.map((portion) => `${portion.value}% ${portion.label}`).join(", ")}`}>
                <span className={`directional-track ${relationship.direction === "left" ? "flex-row-reverse" : ""}`}>
                  {relationship.portions.map((portion) => <span key={portion.label} className="directional-segment" style={{ width: `${portion.value}%`, backgroundColor: portion.color }} />)}
                </span>
                <span className={`direction-tooltip ${relationship.portions.length >= 3 ? "direction-tooltip-expanded" : ""}`}><strong>{relationship.from} → {relationship.to}</strong><span className="direction-breakdown">{relationship.portions.map((portion) => <span key={portion.label}><i style={{ backgroundColor: portion.color }} />{portion.value}% {portion.label}</span>)}</span></span>
             </button>
           ))}
         </div>
          <div className={`relationship-connection relationship-connection-ashley-pair absolute z-40 ${hoveredNode === "elias" || hoveredNode === "ashley" ? `relationship-connection-${hoveredNode}` : ""}`}>
            {directionalRelationships.filter((relationship) => relationship.pair === "ashley").map((relationship, index) => (
              <button key={relationship.id} className={`directional-link absolute inset-x-0 h-5 ${index === 0 ? "-translate-y-3" : "translate-y-1"}`} aria-label={`${relationship.from} to ${relationship.to}: ${relationship.portions.map((portion) => `${portion.value}% ${portion.label}`).join(", ")}`}>
                <span className={`directional-track ${relationship.direction === "left" ? "flex-row-reverse" : ""}`}>
                  {relationship.portions.map((portion) => <span key={portion.label} className="directional-segment" style={{ width: `${portion.value}%`, backgroundColor: portion.color }} />)}
                </span>
                <span className={`direction-tooltip ${relationship.portions.length >= 3 ? "direction-tooltip-expanded" : ""}`}><strong>{relationship.from} → {relationship.to}</strong><span className="direction-breakdown">{relationship.portions.map((portion) => <span key={portion.label}><i style={{ backgroundColor: portion.color }} />{portion.value}% {portion.label}</span>)}</span></span>
              </button>
            ))}
          </div>
          <div className={`relationship-connection relationship-connection-rowan-pair absolute z-40 ${hoveredNode === "elias" || hoveredNode === "rowan" ? `relationship-connection-${hoveredNode}` : ""}`}>
            {directionalRelationships.filter((relationship) => relationship.pair === "rowan").map((relationship, index) => (
              <button key={relationship.id} className={`directional-link absolute inset-x-0 h-5 ${index === 0 ? "-translate-y-3" : "translate-y-1"}`} aria-label={`${relationship.from} to ${relationship.to}: ${relationship.portions.map((portion) => `${portion.value}% ${portion.label}`).join(", ")}`}>
                <span className={`directional-track ${relationship.direction === "left" ? "flex-row-reverse" : ""}`}>
                  {relationship.portions.map((portion) => <span key={portion.label} className="directional-segment" style={{ width: `${portion.value}%`, backgroundColor: portion.color }} />)}
                </span>
                <span className={`direction-tooltip ${relationship.portions.length >= 3 ? "direction-tooltip-expanded" : ""}`}><strong>{relationship.from} → {relationship.to}</strong><span className="direction-breakdown">{relationship.portions.map((portion) => <span key={portion.label}><i style={{ backgroundColor: portion.color }} />{portion.value}% {portion.label}</span>)}</span></span>
              </button>
            ))}
          </div>
           <div onPointerEnter={() => setHoveredNode("elias")} onPointerLeave={() => setHoveredNode(null)} className="elias-node group absolute left-1/2 top-1/2 z-30 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center md:h-52 md:w-52">
        <div className="laurel-hover pointer-events-none absolute inset-[-4%] z-20 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.075]"><LaurelWreath /></div>
        <div className="crest-glint pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
          <Button variant="ghost" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { tone(330, .18, .025); toggleProfile("elias", event.currentTarget); }} className="relationship-emblem group relative z-10 grid h-40 w-40 place-items-center overflow-hidden whitespace-normal rounded-full border border-primary/70 bg-card p-0 text-brass-soft transition duration-500 hover:scale-[1.025] hover:border-primary hover:bg-primary/10 hover:text-brass-soft md:h-52 md:w-52">
          <span className="absolute inset-2 rounded-full border border-primary/30" />
          <span className="absolute inset-[-0.7rem] rounded-full border border-primary/30" />
          <span className="emblem-crosshair" aria-hidden="true" />
          <img src={eliasNameRose} alt="" className="elias-name-rose pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 object-contain" />
          <span className="elias-title-drift flex w-full -translate-y-2 flex-col items-center justify-center px-5 text-center">
            <span className="block text-[7px] uppercase tracking-[.48em] text-primary md:text-[8px]">Central file</span>
            <span className="mx-auto my-2.5 block h-px w-16 bg-primary/60 md:my-3 md:w-20" />
            <span className="elias-signature grid w-full place-items-center font-display font-normal text-brass-soft">
               <span className="block w-full text-center text-[1.05rem] uppercase leading-none md:text-[1.35rem]">Elias</span>
              <span className="relative my-1 block h-3 w-full md:my-2">
                <span className="absolute left-1/2 top-1/2 h-px w-[74%] -translate-x-1/2 -translate-y-1/2 bg-primary/60" />
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-card" />
              </span>
               <span className="block w-full text-center text-[1rem] uppercase leading-none italic md:text-[1.3rem]">Archer</span>
            </span>
            <span className="mx-auto mt-3 block h-px w-14 bg-primary/55 md:mt-4 md:w-16" />
          </span>
        </Button>
        </div>

          <div onPointerEnter={() => setHoveredNode("nanase")} onPointerLeave={() => setHoveredNode(null)} className="nanase-node group absolute left-[77%] top-[22%] z-30 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center md:h-28 md:w-28">
            <div className="nanase-rings pointer-events-none absolute -inset-3 rounded-full" aria-hidden="true" />
             <Button variant="ghost" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { tone(265, .2, .025); toggleProfile("nanase", event.currentTarget); }} className="nanase-emblem relative z-10 grid h-24 w-24 place-items-center overflow-hidden whitespace-normal rounded-full border border-chart-red/70 bg-card p-0 transition duration-500 hover:scale-[1.025] md:h-28 md:w-28">
             <span className="absolute inset-2 rounded-full border border-chart-red/30" />
             <span className="nanase-crosshair" aria-hidden="true" />
               <img src={nanaseClawLogo} alt="" className="nanase-mark pointer-events-none absolute left-1/2 top-1/2 z-0 h-[78%] w-[66%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-55" />
              <span className="nanase-title-drift relative z-10 flex flex-col items-center justify-center">
                 <span className="nanase-profile-name font-display text-xs uppercase leading-none md:text-sm">Nanase</span>
                 <span className="nanase-profile-name mt-1 font-display text-[11px] uppercase leading-none md:text-xs">Koji</span>
             </span>
           </Button>
         </div>

          <div onPointerEnter={() => setHoveredNode("ashley")} onPointerLeave={() => setHoveredNode(null)} className="ashley-node group absolute left-[23%] top-[22%] z-30 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center md:h-32 md:w-32">
            <div className="ashley-rings pointer-events-none absolute -inset-3 rounded-full" aria-hidden="true" />
            <span className="ashley-diamond ashley-diamond-top" aria-hidden="true" />
            <span className="ashley-diamond ashley-diamond-right" aria-hidden="true" />
            <span className="ashley-diamond ashley-diamond-bottom" aria-hidden="true" />
            <span className="ashley-diamond ashley-diamond-left" aria-hidden="true" />
             <Button variant="ghost" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { tone(590, .2, .02); toggleProfile("ashley", event.currentTarget); }} className="ashley-emblem relative z-10 grid h-28 w-28 place-items-center overflow-visible whitespace-normal rounded-full border p-0 transition duration-500 hover:scale-[1.025] md:h-32 md:w-32">
              <span className="ashley-inner-ring absolute inset-2 rounded-full border" />
                <img src={ashleyHatEmblem} alt="" className="ashley-hat pointer-events-none absolute left-[58%] top-[10%] z-20 w-[200%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
                <img src={ashleyNameEmblem} alt="" className="ashley-name-mark pointer-events-none absolute left-1/2 top-1/2 z-0 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 object-contain" />
               <span className="ashley-title relative z-10 flex flex-col items-center justify-center">
                <span className="ashley-name font-display text-[12px] uppercase leading-none md:text-sm">Ashley</span>
                <span className="ashley-name mt-1 font-display text-[11px] uppercase leading-none md:text-xs">Archer</span>
              </span>
            </Button>
          </div>

           <div onPointerEnter={() => setHoveredNode("rowan")} onPointerLeave={() => setHoveredNode(null)} className="rowan-node group absolute left-[23%] top-[78%] z-30 grid h-[6.5rem] w-[6.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center md:h-[7.5rem] md:w-[7.5rem]">
             <div className="rowan-rings pointer-events-none absolute -inset-3 rounded-full" aria-hidden="true" />
             <Button variant="ghost" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { tone(410, .22, .022); toggleProfile("rowan", event.currentTarget); }} className="rowan-emblem relative z-10 grid h-[6.5rem] w-[6.5rem] place-items-center overflow-hidden whitespace-normal rounded-full border p-0 transition duration-500 hover:scale-[1.025] md:h-[7.5rem] md:w-[7.5rem]">
               <span className="rowan-inner-ring absolute inset-2 rounded-full border" />
               <img src={rowanNameEmblem} alt="" className="rowan-name-mark pointer-events-none absolute left-1/2 top-1/2 z-0 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2 object-contain" />
               <span className="rowan-title relative z-10 flex flex-col items-center justify-center">
                 <span className="rowan-text-art rowan-text-art-top" aria-hidden="true">◆ ── ◇ ── ◆</span>
                 <span className="rowan-name text-[11px] uppercase leading-none md:text-[13px]">Rowan</span>
                 <span className="rowan-name mt-1 text-[10px] uppercase leading-none md:text-xs">Archer</span>
                 <span className="rowan-text-art rowan-text-art-bottom" aria-hidden="true">✦ ︵ ✦</span>
               </span>
             </Button>
           </div>


        </div>
         {profileOpen && typeof document !== "undefined" && createPortal(
           <div className="profile-anchor">
             <ProfilePanel key={profileOpen} panelRef={profilePanelRef} anchor={profileAnchor} leaving={profileLeaving} character={profileOpen} onClose={() => setProfileOpen(null)} onExpand={() => { tone(420, .16, .02); setViewerOpen(profileOpen); setProfileOpen(null); }} />
           </div>,
           document.body,
         )}
      </div>
      <RelationshipLegend />
      {!profileOpen && <LikeMeter tone={tone} />}
      {viewerOpen && <ImageViewer character={viewerOpen} onClose={() => setViewerOpen(null)} />}
    </div>
  );
}

function RelationshipLegend() {
  return (
    <section className="mx-auto max-w-7xl border-t border-border pt-5" aria-label="Relationship legend">
      <div className="mb-4 flex items-end justify-between"><h3 className="font-display text-xl">Relationship legend</h3><p className="text-[8px] uppercase tracking-[.25em] text-muted-foreground">Future connection system</p></div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 lg:grid-cols-6">
        {relationshipTypes.map((type) => (
          <div key={type} className="legend-item flex items-center gap-3 text-[9px] text-foreground/75">
             <span className="legend-swatch w-8 shrink-0" />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ character, panelRef, anchor, leaving, onClose, onExpand }: { character: CharacterId; panelRef: React.RefObject<HTMLDivElement | null>; anchor: { x: number; y: number }; leaving: boolean; onClose: () => void; onExpand: () => void }) {
  const isElias = character === "elias";
  const isAshley = character === "ashley";
  const isRowan = character === "rowan";
  const [spoilerOpen, setSpoilerOpen] = useState(false);
  const record = isElias ? elias : isAshley ? ashley : isRowan ? rowan : nanase;
  const portrait = isElias ? eliasRose : isAshley ? ashleyPortrait : isRowan ? rowanPortrait : nanasePortrait;
  const quote = isElias ? "This is me, what the fuck do you want me to add onto that" : isAshley ? ashley.quote : isRowan ? rowan.quote : nanase.quote;
  const accentClass = isElias ? "profile-accent-elias" : isAshley ? "profile-accent-ashley" : isRowan ? "profile-accent-rowan" : "profile-accent-nanase";
  const closeAnimated = () => { if (!leaving) onClose(); };
  return (
    <div
      ref={panelRef}
      onPointerDown={(event) => event.stopPropagation()}
      style={{ left: anchor.x, top: anchor.y }}
      className={`profile-popover profile-popover-${character} fixed z-[60] ${leaving ? "profile-popover-out" : "profile-popover-in"}`}
      role="dialog"
      aria-label={`${record.name} profile`}
    >
      <div className={`profile-card-shell ${accentClass} relative border bg-card/95 px-5 pb-7 pt-5 shadow-2xl backdrop-blur-xl`}>
        {isElias && <ProfileBotanicalFrame />}
        <div className="pointer-events-none absolute inset-0 z-[4] bg-card/95 backdrop-blur-xl" />
        <div className="pointer-events-none absolute inset-2 z-[5] border border-primary/25" />
        <div className="relative z-[6] flex items-start justify-between">
          <div><p className="profile-accent-text text-[7px] uppercase md:text-[8px]">Central profile</p><span className="profile-accent-bg mt-2 block h-px w-14" /></div>
          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); closeAnimated(); }} aria-label="Close profile" className="h-8 w-8 text-primary hover:bg-primary/10"><X className="h-4 w-4" /></Button>
        </div>
        <p className={`relative z-[6] mt-2 font-display text-lg ${isElias ? "elias-profile-name" : isAshley ? "ashley-profile-name" : isRowan ? "rowan-profile-name" : "nanase-profile-name"}`}>{record.name}</p>
        <p className={`status-shimmer relative z-[6] mt-1 text-[8px] uppercase ${isElias ? "status-silver" : isAshley ? "status-ashley" : "status-gold"}`}>Status: {record.status}</p>
        <button onClick={(event) => { event.stopPropagation(); onExpand(); }} className="profile-image-button group relative z-[6] mt-3 flex h-32 w-full items-end justify-center overflow-hidden border bg-background/50 md:h-36">
          <span className="pointer-events-none absolute inset-1 border border-primary/20" />
          <img src={portrait} alt={isElias ? "Elias Archer holding a rose" : isAshley ? "Ashley Archer" : isRowan ? "Rowan Archer" : "Nanase Koji"} loading="eager" fetchPriority="high" decoding="sync" className={`h-full w-full transition duration-700 group-hover:scale-[1.025] ${isElias ? "object-contain" : "object-cover"}`} />
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center border border-primary/60 bg-background/75 text-primary backdrop-blur-md"><Maximize2 className="h-3.5 w-3.5" /></span>
        </button>
        <blockquote className="profile-quote relative z-[6] mb-2 mt-3 border-l pl-3 font-display text-sm italic leading-relaxed text-foreground">
          “{quote}
          {isAshley && <Button variant="ghost" onClick={() => setSpoilerOpen((open) => !open)} aria-expanded={spoilerOpen} aria-label={spoilerOpen ? "Hide Ashley's concealed remark" : "Reveal Ashley's concealed remark"} className={`ashley-spoiler ml-1 inline h-auto min-h-0 rounded-none px-1 py-0 align-baseline font-display text-sm italic ${spoilerOpen ? "ashley-spoiler-open" : ""}`}>{ashley.spoiler}</Button>}”
        </blockquote>
      </div>
    </div>
  );
}

function ImageViewer({ character, onClose }: { character: CharacterId; onClose: () => void }) {
  const isElias = character === "elias";
  const isAshley = character === "ashley";
  const isRowan = character === "rowan";
  const name = isElias ? "Elias Archer" : isAshley ? "Ashley Archer" : isRowan ? "Rowan Archer" : "Nanase Koji";
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-background/90 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={`Enlarged image of ${name}`} onClick={onClose}>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close image" className="absolute right-5 top-5 z-10"><X /></Button>
      <img onClick={(event) => event.stopPropagation()} src={isElias ? eliasRose : isAshley ? ashleyPortrait : isRowan ? rowanPortrait : nanasePortrait} alt={`${name}, enlarged`} className="animate-in zoom-in-95 max-h-[92dvh] max-w-[92vw] object-contain duration-500" />
    </div>
  );
}

function AppearanceDossier({ tone }: { tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = useMemo(() => appearanceFeatures.find((feature) => feature.id === active), [active]);
  return (
    <div className="min-h-[calc(100dvh-5rem)] px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl"><p className="text-[9px] uppercase tracking-[.35em] text-primary">Visual record</p><h2 className="mt-2 font-display text-4xl md:text-6xl">Appearance</h2></div>
      <div className="mx-auto mt-4 grid max-w-7xl gap-6 lg:grid-cols-[minmax(180px,1fr)_minmax(380px,1.4fr)_minmax(220px,1fr)]">
        <aside className="order-2 border-t border-border pt-5 lg:order-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Basic record</p>
          {[['Name', elias.name], ['Pronouns', elias.pronouns], ['Height', elias.height], ['Language', elias.language], ['School', elias.school], ['Background', elias.background], ['Programme', elias.programme]].map(([label, value]) => <div key={label} className="mt-5"><dt className="text-[8px] uppercase tracking-[.22em] text-primary">{label}</dt><dd className="mt-1 text-xs leading-5 text-foreground/80">{value}</dd></div>)}
        </aside>
        <div className="appearance-enter relative order-1 mx-auto h-[65vh] min-h-[520px] w-full max-w-xl overflow-hidden lg:order-2">
          <div className="appearance-glow absolute inset-x-[12%] bottom-0 top-[5%]" />
          <div className="absolute inset-0 flex items-center justify-center transition-[transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ transform: selected ? `translate(${(50 - selected.x) * .38}%, ${(50 - selected.y) * .38}%) scale(1.38)` : "translate(0, 0) scale(1)", filter: selected ? "contrast(1.04) brightness(1.03)" : undefined }}>
            <div className="relative">
              <img src={eliasBowing} alt="Elias Archer bowing in his black school uniform and prefect armband" loading="eager" fetchPriority="high" decoding="sync" className="block max-h-[65vh] max-w-full object-contain drop-shadow-[0_28px_45px_color-mix(in_oklab,var(--ink)_80%,transparent)]" />
              {appearanceFeatures.map((feature) => (
                <button key={feature.id} aria-label={`View ${feature.label} details`} onClick={() => { tone(520, .08, .02); setActive(feature.id); }} className={`group absolute z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${active && active !== feature.id ? "opacity-20" : "opacity-100"}`} style={{ left: `${feature.x}%`, top: `${feature.y}%` }}>
                  <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-background transition group-hover:scale-150" />
                  <span className={`hotspot-line absolute top-1/2 h-px w-12 bg-primary/60 ${feature.side === "left" ? "right-1/2 origin-right" : "left-1/2"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside className="order-3 min-h-40 border-t border-border pt-6 lg:border-r lg:border-t-0 lg:pr-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Selected detail</p>
          {selected ? <div key={selected.id} className="feature-swift mt-8"><p className="font-display text-3xl text-brass-soft">{selected.label}</p><p className="mt-4 max-w-xs text-sm leading-7 text-foreground/75">{selected.detail}</p></div> : <p className="mt-8 max-w-xs text-xs leading-6 text-muted-foreground">Select one of the fine markers around the visual record.</p>}
          <div className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-1">{appearanceFeatures.map((feature) => <Button key={feature.id} variant="ghost" onClick={() => { tone(520, .08, .02); setActive(feature.id); }} className={`h-auto justify-start rounded-none border-l px-3 py-2 text-left text-[9px] uppercase tracking-[.16em] transition-all duration-300 ${active === feature.id ? "translate-x-2 border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{feature.label}</Button>)}</div>
        </aside>
      </div>
    </div>
  );
}

function Backstory() {
  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-x-0 top-[22%] h-px bg-primary/25" /><div className="absolute inset-x-0 bottom-[22%] h-px bg-primary/25" />
      <div className="absolute left-[12%] top-0 h-full w-px bg-border/50" /><div className="absolute right-[12%] top-0 h-full w-px bg-border/50" />
      <div className="absolute left-0 top-12 h-5 w-full bg-[repeating-linear-gradient(135deg,var(--primary)_0_1px,transparent_1px_12px)] opacity-15" />
      <div className="relative"><p className="text-[9px] uppercase tracking-[.5em] text-primary">Archive incomplete</p><h2 className="mt-5 font-display text-8xl md:text-[10rem]">WIP</h2><p className="mt-2 font-display text-2xl italic text-muted-foreground">Work in Progress for now</p></div>
    </div>
  );
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }