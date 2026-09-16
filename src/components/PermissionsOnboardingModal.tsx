import React, { useEffect, useState } from 'react';
import { Mic, Bell, Sparkles, Volume2, CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { speechNarrator } from '../services/speechNarrator';
import { soundEffects } from '../services/soundEffects';

interface PermissionsOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted?: () => void;
}

export const PermissionsOnboardingModal: React.FC<PermissionsOnboardingModalProps> = ({
  isOpen,
  onClose,
  onPermissionsGranted,
}) => {
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [notifStatus, setNotifStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check current permission states on mount/open
  useEffect(() => {
    if (!isOpen) return;

    // Check if user already accepted permissions previously or if already granted
    try {
      const alreadyAccepted = localStorage.getItem('estudahud_permissions_accepted') === 'true';
      const notifAlreadyGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

      if (alreadyAccepted && notifAlreadyGranted) {
        onClose();
        return;
      }
    } catch {}

    // Check Notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') setNotifStatus('granted');
      else if (Notification.permission === 'denied') setNotifStatus('denied');
      else setNotifStatus('prompt');
    }

    // Check microphone permission query if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        // @ts-ignore - microphone name query
        .query({ name: 'microphone' })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setMicStatus('granted');
            // If both are already granted, don't show the modal at all
            if (Notification.permission === 'granted') {
              try {
                localStorage.setItem('estudahud_permissions_accepted', 'true');
              } catch {}
              onClose();
            }
          } else if (permissionStatus.state === 'denied') {
            setMicStatus('denied');
          } else {
            setMicStatus('prompt');
          }
        })
        .catch(() => {
          // fallback
        });
    }

    // Didactic voice explanation by AI
    const speechText =
      'Olá, estudante! Para você ter a melhor experiência de estudo com inteligência artificial, precisamos de duas permissões: ' +
      'o microfone, para você responder às perguntas dos quizzes apenas falando em voz alta, e as notificações, para lembrar dos seus horários de estudo e desafios!';

    const timer = setTimeout(() => {
      speechNarrator.speak(
        speechText,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }, 500);

    return () => {
      clearTimeout(timer);
      speechNarrator.stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestAll = async () => {
    soundEffects.playClick();
    setIsRequesting(true);

    let micGranted = false;
    let notifGranted = false;

    // 1. Request Microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop audio tracks immediately after obtaining permission
        stream.getTracks().forEach((track) => track.stop());
        setMicStatus('granted');
        micGranted = true;
      }
    } catch (_err) {
      setMicStatus('denied');
    }

    // 2. Request Notifications
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          setNotifStatus('granted');
          notifGranted = true;
        } else {
          setNotifStatus('denied');
        }
      }
    } catch (_err) {
      setNotifStatus('denied');
    }

    try {
      localStorage.setItem('estudahud_permissions_accepted', 'true');
    } catch {}

    setIsRequesting(false);
    soundEffects.playCorrect();

    if (onPermissionsGranted) {
      onPermissionsGranted();
    }

    // Close after feedback
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const repeatVoiceExplanation = () => {
    soundEffects.playClick();
    const speechText =
      'O microfone serve para você responder perguntas por voz falando a alternativa ou a resposta. ' +
      'E as notificações avisam seus horários diários de estudo para você nunca perder seus pontos e ofensivas!';
    speechNarrator.speak(
      speechText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        {/* Top Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Permissões de Estudo com IA</h3>
              <p className="text-[11px] text-slate-500">Recursos interativos por voz e lembretes</p>
            </div>
          </div>

          <button
            onClick={() => {
              speechNarrator.stop();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Speaking Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
                {isSpeaking ? 'A IA está explicando por que precisa...' : 'Explicação por Voz da IA'}
              </span>
              <p className="text-xs text-blue-800 font-medium truncate">
                {isSpeaking ? 'Ouvindo narração educativa...' : 'Toque para ouvir a explicação da IA'}
              </p>
            </div>
          </div>

          <button
            onClick={repeatVoiceExplanation}
            className="px-2.5 py-1 rounded-xl bg-white border border-blue-300 text-blue-700 font-bold text-[11px] hover:bg-blue-50 transition shrink-0 shadow-xs"
          >
            {isSpeaking ? 'Ouvindo...' : 'Ouvir IA'}
          </button>
        </div>

        {/* Explanatory Cards */}
        <div className="space-y-2.5 text-xs">
          {/* 1. Microphone Card */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-xs">1. Microfone (Responder por Voz)</span>
              </div>
              {micStatus === 'granted' ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativado
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Necessário
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-9">
              <strong>Por que precisamos?</strong> Para você poder responder os exercícios apenas falando <em>"Letra A"</em>, <em>"Letra B"</em> ou a resposta em voz alta, sem precisar digitar!
            </p>
          </div>

          {/* 2. Notification Card */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-xs">2. Notificações & Lembretes</span>
              </div>
              {notifStatus === 'granted' ? (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativado
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Necessário
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-9">
              <strong>Por que precisamos?</strong> Para lembrar você dos seus horários diários de estudo, proteger sua ofensiva de dias seguidos e avisar sobre batalhas multiplayer!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleRequestAll}
            disabled={isRequesting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRequesting ? 'Solicitando Permissões...' : 'Conceder Permissões de Microfone e Notificações'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              speechNarrator.stop();
              onClose();
            }}
            className="w-full py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition text-center"
          >
            Continuar para o App
          </button>
        </div>
      </div>
    </div>
  );
};
