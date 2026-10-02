import { useCallback, useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { BsImage } from "react-icons/bs";
import { IoCloseCircle } from "react-icons/io5";
import { FiCornerUpLeft, FiMic, FiPause, FiPlay, FiStopCircle, FiX } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import usePreviewImg from "../hooks/usePreviewImg";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";
import AudioMessagePlayer from "./AudioMessagePlayer";

const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const MessageInput = ({ setMessages, replyingTo, onCancelReply }) => {
  const [messageText, setMessageText] = useState("");
  const showToast = useShowToast();
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const setConversations = useSetRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const imageRef = useRef(null);
  const textAreaRef = useRef(null);
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
  const [isSending, setIsSending] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState([]);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState("");
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceWaveform, setVoiceWaveform] = useState([]);
  const typingTimeoutRef = useRef(null);
  const typingConversationIdRef = useRef("");
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const visualizerTimerRef = useRef(null);
  const gestureCleanupRef = useRef(null);
  const gestureRef = useRef(null);
  const recordingCancelledRef = useRef(false);
  const stopWhenStartedRef = useRef(false);
  const elapsedRef = useRef(0);
  const waveformRef = useRef([]);
  const chunksRef = useRef([]);
  const voicePreviewUrlRef = useRef("");

  const cleanupRecordingResources = useCallback(() => {
    clearInterval(recordingTimerRef.current);
    clearInterval(visualizerTimerRef.current);
    recordingTimerRef.current = null;
    visualizerTimerRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    recorderRef.current = null;
  }, []);

  const stopVoiceRecording = () => {
    if (!recorderRef.current) {
      stopWhenStartedRef.current = true;
      return;
    }
    if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const cancelVoiceRecording = () => {
    const recorder = recorderRef.current;
    recordingCancelledRef.current = true;
    setIsPreparingRecording(false);
    setIsRecording(false);
    setIsRecordingPaused(false);
    setIsRecordingLocked(false);
    gestureCleanupRef.current?.();
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else cleanupRecordingResources();
  };

  const stopVoiceRecordingRef = useRef(stopVoiceRecording);
  const cancelVoiceRecordingRef = useRef(cancelVoiceRecording);
  stopVoiceRecordingRef.current = stopVoiceRecording;
  cancelVoiceRecordingRef.current = cancelVoiceRecording;

  const beginVoiceRecording = async (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (isSending || imgUrl || voiceBlob || isRecording || isPreparingRecording) return;
    event.preventDefault?.();

    recordingCancelledRef.current = false;
    stopWhenStartedRef.current = false;
    elapsedRef.current = 0;
    waveformRef.current = [];
    chunksRef.current = [];
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX || 0,
      startY: event.clientY || 0,
      locked: false,
      cancelled: false,
      active: true,
    };
    setRecordingElapsed(0);
    setRecordingWaveform([]);
    setIsPreparingRecording(true);

    const pointerId = event.pointerId;
    const removeGestureListeners = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      gestureCleanupRef.current = null;
    };
    const handlePointerMove = (pointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== pointerEvent.pointerId || gesture.locked || gesture.cancelled) return;
      const dx = pointerEvent.clientX - gesture.startX;
      const dy = pointerEvent.clientY - gesture.startY;
      if (dx < -85 && Math.abs(dx) > Math.abs(dy)) {
        gesture.cancelled = true;
        cancelVoiceRecordingRef.current();
        removeGestureListeners();
      } else if (dy < -72 && Math.abs(dy) > Math.abs(dx)) {
        gesture.locked = true;
        setIsRecordingLocked(true);
      }
    };
    const handlePointerUp = (pointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || pointerId === undefined || gesture.pointerId !== pointerEvent.pointerId) return;
      gesture.active = false;
      removeGestureListeners();
      if (gesture.cancelled) return;
      if (!gesture.locked) stopVoiceRecordingRef.current();
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    gestureCleanupRef.current = removeGestureListeners;

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("Voice recording is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      if (recordingCancelledRef.current) {
        cleanupRecordingResources();
        return;
      }

      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((candidate) => MediaRecorder.isTypeSupported?.(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (recordingEvent) => {
        if (recordingEvent.data.size > 0) chunksRef.current.push(recordingEvent.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const cancelled = recordingCancelledRef.current;
        cleanupRecordingResources();
        setIsPreparingRecording(false);
        setIsRecording(false);
        setIsRecordingPaused(false);
        setIsRecordingLocked(false);
        if (!cancelled && blob.size > 0) {
          const previewUrl = URL.createObjectURL(blob);
          voicePreviewUrlRef.current = previewUrl;
          setVoiceBlob(blob);
          setVoicePreviewUrl(previewUrl);
          setVoiceDuration(Math.max(1, elapsedRef.current));
          setVoiceWaveform(waveformRef.current.length ? waveformRef.current : [0.4, 0.62, 0.35, 0.8, 0.5, 0.68, 0.3, 0.55]);
        } else if (!cancelled) {
          showToast("Voice message too short", "Hold the microphone for a moment before sending.", "error");
        }
      };
      recorder.start(250);
      setIsPreparingRecording(false);
      setIsRecording(true);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          const audioContext = new AudioContextClass();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          audioContext.createMediaStreamSource(stream).connect(analyser);
          audioContextRef.current = audioContext;
          const samples = new Uint8Array(analyser.fftSize);
          visualizerTimerRef.current = window.setInterval(() => {
            analyser.getByteTimeDomainData(samples);
            const meanSquare = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length;
            const level = Math.max(0.12, Math.min(1, Math.sqrt(meanSquare) * 2.8));
            waveformRef.current = [...waveformRef.current.slice(-39), level];
            setRecordingWaveform(waveformRef.current);
          }, 110);
          audioContext.resume().catch(() => {});
        } catch {
          // Recording still works if waveform visualization is unavailable.
        }
      }

      if (!gestureRef.current?.active || stopWhenStartedRef.current) {
        stopVoiceRecordingRef.current();
      } else {
        recordingTimerRef.current = window.setInterval(() => {
          elapsedRef.current += 1;
          setRecordingElapsed(elapsedRef.current);
          if (elapsedRef.current >= 180) stopVoiceRecordingRef.current();
        }, 1000);
      }
    } catch (error) {
      cleanupRecordingResources();
      setIsPreparingRecording(false);
      setIsRecording(false);
      gestureCleanupRef.current?.();
      showToast("Could not start recording", error.message || "Allow microphone access and try again.", "error");
    }
  };

  const toggleRecordingPause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecordingPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      setIsRecordingPaused(false);
      recordingTimerRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setRecordingElapsed(elapsedRef.current);
        if (elapsedRef.current >= 180) stopVoiceRecordingRef.current();
      }, 1000);
    }
  };

  const handleMicrophoneKeyDown = (event) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) beginVoiceRecording(event);
  };

  const handleMicrophoneKeyUp = (event) => {
    if (event.key === " " || event.key === "Enter") stopVoiceRecordingRef.current();
  };

  const discardVoiceMessage = () => {
    if (voicePreviewUrlRef.current) URL.revokeObjectURL(voicePreviewUrlRef.current);
    voicePreviewUrlRef.current = "";
    setVoicePreviewUrl("");
    setVoiceBlob(null);
    setVoiceDuration(0);
    setVoiceWaveform([]);
  };

  useEffect(() => () => {
    gestureCleanupRef.current?.();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    cleanupRecordingResources();
    if (voicePreviewUrlRef.current) URL.revokeObjectURL(voicePreviewUrlRef.current);
  }, [cleanupRecordingResources]);

  const stopTyping = () => {
    clearTimeout(typingTimeoutRef.current);
    if (typingConversationIdRef.current) {
      socket?.emit("stopTyping", {
        conversationId: typingConversationIdRef.current,
        recipientId: selectedConversation.userId,
      });
      typingConversationIdRef.current = "";
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (typingConversationIdRef.current) {
        socket?.emit("stopTyping", {
          conversationId: typingConversationIdRef.current,
          recipientId: selectedConversation.userId,
        });
        typingConversationIdRef.current = "";
      }
    };
  }, [socket, selectedConversation.userId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imgUrl && !voiceBlob) return;
    if (isSending) return;

    setIsSending(true);

    try {
      let body;
      let headers;
      if (voiceBlob) {
        const formData = new FormData();
        formData.append("message", messageText);
        formData.append("recipientId", selectedConversation.userId);
        formData.append("audioDuration", String(voiceDuration));
        formData.append("audioWaveform", JSON.stringify(voiceWaveform));
        formData.append("replyTo", replyingTo?._id || "");
        const extension = voiceBlob.type.includes("mp4") ? "m4a" : voiceBlob.type.includes("ogg") ? "ogg" : "webm";
        formData.append("audioFile", voiceBlob, `voice-message.${extension}`);
        body = formData;
      } else {
        headers = { "Content-Type": "application/json" };
        body = JSON.stringify({
          message: messageText,
          recipientId: selectedConversation.userId,
          img: imgUrl,
          replyTo: replyingTo?._id || null,
        });
      }
      const res = await fetch("/api/messages", {
        method: "POST",
        headers,
        body,
      });
      const data = await res.json();
      if (data.error) {
        showToast("Error", data.error, "error");
        return;
      }

      setMessages((messages) => [...messages, data]);
      const conversationId = String(data.conversationId || selectedConversation._id);
      const sentPreviewText = messageText.trim() || (voiceBlob ? "Voice message" : imgUrl ? "Photo" : "");
      const nextConversation = {
        _id: conversationId,
        updatedAt: data.createdAt || new Date().toISOString(),
        lastMessage: {
          text: sentPreviewText,
          sender: data.sender,
          type: voiceBlob ? "audio" : imgUrl ? "image" : "text",
          seen: false,
        },
        participants: [{
          _id: selectedConversation.userId,
          username: selectedConversation.username,
          profilePic: selectedConversation.userProfilePic,
        }],
        mock: false,
      };
      setConversations((prevConvs) => {
        const withoutDuplicate = prevConvs.filter((conversation) =>
          String(conversation._id) !== String(selectedConversation._id) &&
          String(conversation._id) !== conversationId &&
          String(conversation?.participants?.[0]?._id) !== String(selectedConversation.userId)
        );
        return [nextConversation, ...withoutDuplicate];
      });
      setSelectedConversation((current) => ({ ...current, _id: conversationId, mock: false }));
      stopTyping();
      setMessageText("");
      onCancelReply?.();
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "36px";
        textAreaRef.current.style.overflowY = "hidden";
      }
      setImgUrl("");
      if (imageRef.current) imageRef.current.value = "";
      discardVoiceMessage();
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (event) => {
    const nextText = event.target.value;
    setMessageText(nextText);
    const conversationId = String(selectedConversation?._id || "");
    if (conversationId && !selectedConversation?.mock && nextText.trim()) {
      if (typingConversationIdRef.current !== conversationId) {
        stopTyping();
        typingConversationIdRef.current = conversationId;
        socket?.emit("typing", { conversationId, recipientId: selectedConversation.userId });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 1600);
    } else {
      stopTyping();
    }
    event.target.style.height = "auto";
    const contentHeight = event.target.scrollHeight;
    event.target.style.height = `${Math.min(contentHeight, 112)}px`;
    event.target.style.overflowY = contentHeight > 112 ? "auto" : "hidden";
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-100 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50 to-white px-3 py-2 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/55 dark:to-zinc-900">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/70 dark:text-indigo-300"><FiCornerUpLeft size={16} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
              Replying to {String(replyingTo.sender) === String(currentUser?._id) ? "your message" : `@${selectedConversation.username}`}
            </p>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{replyingTo.text || (replyingTo.audio ? "Voice message" : replyingTo.img ? "Photo" : "Message")}</p>
          </div>
          {replyingTo.img && <img src={replyingTo.img} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />}
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-indigo-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"><FiX size={15} /></button>
        </div>
      )}

      {/* Preview if attached */}
      {imgUrl && (
        <div className="relative mb-2 w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setImgUrl("");
              if (imageRef.current) imageRef.current.value = "";
            }}
            aria-label="Remove attached image"
            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-black"
          >
            <IoCloseCircle size={18} />
          </button>
        </div>
      )}

      {voiceBlob && voicePreviewUrl && (
        <div className="mb-2">
          <AudioMessagePlayer
            src={voicePreviewUrl}
            duration={voiceDuration}
            waveform={voiceWaveform}
            preview
            onDiscard={discardVoiceMessage}
          />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="mx-1 flex items-center gap-2 p-1.5 pl-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500 transition-all"
      >
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          disabled={isSending || isRecording || isPreparingRecording || Boolean(voiceBlob)}
          aria-label="Attach an image"
          className="w-10 h-10 grid place-items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
          title="Attach image"
        >
          <BsImage size={18} />
        </button>
        <input type="file" hidden ref={imageRef} accept="image/*" disabled={isSending || isRecording || isPreparingRecording || Boolean(voiceBlob)} onChange={handleImageChange} />

        {isRecording || isPreparingRecording ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-rose-50/90 px-2 py-1.5 dark:bg-rose-950/30 sm:gap-2.5">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
              {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/20" />}
              <FiMic className="relative" size={15} />
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-rose-600 dark:text-rose-300">
              {isPreparingRecording ? "…" : formatDuration(recordingElapsed)}
            </span>
            <div className="flex h-8 min-w-0 flex-1 items-center justify-between gap-[2px] overflow-hidden" aria-hidden="true">
              {(recordingWaveform.length ? recordingWaveform.slice(-28) : [0.22, 0.36, 0.18, 0.48, 0.28, 0.55, 0.32, 0.2, 0.42, 0.26, 0.5, 0.3, 0.18, 0.4, 0.24, 0.46]).map((level, index) => (
                <span key={index} className="w-[3px] shrink-0 rounded-full bg-rose-400 transition-all dark:bg-rose-400/80" style={{ height: `${Math.max(4, Math.min(26, level * 28))}px` }} />
              ))}
            </div>
            <span className="shrink-0 text-[9px] font-medium text-rose-500/80 sm:text-[10px] dark:text-rose-300/70">
              {isPreparingRecording ? "Starting" : isRecordingLocked ? "Locked" : <><span className="sm:hidden">Slide ↑</span><span className="hidden sm:inline">↑ lock · ← cancel</span></>}
            </span>
            {isRecordingLocked && (
              <>
                <button type="button" onClick={cancelVoiceRecording} aria-label="Cancel recording" title="Discard recording" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-rose-100 hover:text-rose-600 dark:text-zinc-300 dark:hover:bg-rose-900/50 dark:hover:text-rose-300"><FiX size={16} /></button>
                <button type="button" onClick={toggleRecordingPause} aria-label={isRecordingPaused ? "Resume recording" : "Pause recording"} title={isRecordingPaused ? "Resume" : "Pause"} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-rose-600 transition hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50">{isRecordingPaused ? <FiPlay size={15} /> : <FiPause size={15} />}</button>
                <button type="button" onClick={stopVoiceRecording} aria-label="Finish recording" title="Finish recording" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow-sm shadow-rose-900/20 transition hover:bg-rose-600 active:scale-95"><FiStopCircle size={17} /></button>
              </>
            )}
          </div>
        ) : (
          <textarea
            ref={textAreaRef}
            rows={1}
            disabled={isSending}
            placeholder="Write a message..."
            value={messageText}
            onChange={handleTextChange}
            onKeyDown={handleComposerKeyDown}
            aria-label="Write a message"
            className="flex-1 min-w-0 max-h-28 resize-none overflow-y-hidden bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none py-2 leading-5"
          />
        )}

        {!messageText.trim() && !imgUrl && !voiceBlob && !isRecording && !isPreparingRecording && (
          <button
            type="button"
            onPointerDown={beginVoiceRecording}
            onKeyDown={handleMicrophoneKeyDown}
            onKeyUp={handleMicrophoneKeyUp}
            aria-label="Hold to record a voice message"
            aria-keyshortcuts="Space Enter"
            title="Hold to record a voice message"
            className="grid h-10 w-10 shrink-0 touch-none select-none place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-200 hover:text-indigo-600 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-indigo-300"
          >
            <FiMic size={18} />
          </button>
        )}

        <button
          type="submit"
          disabled={isSending || isRecording || isPreparingRecording || (!messageText.trim() && !imgUrl && !voiceBlob)}
          aria-label="Send message"
          className={`w-10 h-10 grid place-items-center rounded-full flex-shrink-0 transition-all duration-200 ${
            messageText.trim() || imgUrl || voiceBlob
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 shadow-sm"
              : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
          }`}
          title="Send"
        >
          {isSending ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
          ) : (
            <IoSend size={15} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
