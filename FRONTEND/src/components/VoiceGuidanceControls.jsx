/**
 * VoiceGuidanceControls — compact UI for voice navigation controls.
 * Shows status, current step, and control buttons.
 */

const STATUS_STYLE = {
  idle:      { color:"#6b7280", bg:"#f9fafb",   label:"Idle" },
  speaking:  { color:"#2563eb", bg:"#eff6ff",   label:"Speaking…" },
  listening: { color:"#16a34a", bg:"#f0fdf4",   label:"Listening…" },
  paused:    { color:"#d97706", bg:"#fffbeb",   label:"Paused" },
  stopped:   { color:"#dc2626", bg:"#fef2f2",   label:"Stopped" },
};

export default function VoiceGuidanceControls({
  status,
  isActive,
  isPaused,
  currentStep,
  totalSteps,
  currentInstruction,
  transcript,
  onStart,
  onStop,
  onNext,
  onRepeat,
  onPause,
  onResume,
}) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.idle;

  return (
    <div style={{ padding:"14px 16px", borderTop:"1px solid #f3f4f6", background:"#fff" }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Mic icon */}
          <div style={{ width:32, height:32, borderRadius:"50%", background: isActive ? "#eff6ff" : "#f5f7f5", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive ? "#2563eb" : "#9ca3af"}>
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
              <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#111" }}>Voice Guidance</p>
            <span style={{ fontSize:11, padding:"1px 7px", borderRadius:99, background:s.bg, color:s.color, fontWeight:600 }}>
              {s.label}
            </span>
          </div>
        </div>

        {/* Step counter */}
        {isActive && totalSteps > 0 && (
          <span style={{ fontSize:11, color:"#6b7280", fontWeight:500 }}>
            Step {currentStep + 1} / {totalSteps}
          </span>
        )}
      </div>

      {/* Current instruction */}
      {isActive && currentInstruction && (
        <div style={{ padding:"10px 12px", background:"#eff6ff", borderRadius:10, marginBottom:10, border:"1px solid #bfdbfe" }}>
          <p style={{ margin:0, fontSize:13, color:"#1e40af", fontWeight:500, lineHeight:1.4 }}>
            🔊 {currentInstruction}
          </p>
        </div>
      )}

      {/* Control buttons */}
      <div style={{ display:"flex", gap:6 }}>
        {!isActive ? (
          <button onClick={onStart}
            style={{ flex:1, padding:"10px 0", borderRadius:10, background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" fill="white"/>
              <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" fill="white"/>
            </svg>
            Start Voice Guidance
          </button>
        ) : (
          <>
            <button onClick={onRepeat}
              style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer" }}>
              🔁 Repeat
            </button>
            <button onClick={onNext}
              style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#f5f7f5", border:"1px solid #e5e7eb", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer" }}>
              ⏭ Next
            </button>
            {!isPaused ? (
              <button onClick={onPause}
                style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#fffbeb", border:"1px solid #fde68a", color:"#d97706", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                ⏸ Pause
              </button>
            ) : (
              <button onClick={onResume}
                style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                ▶ Resume
              </button>
            )}
            <button onClick={onStop}
              style={{ flex:1, padding:"9px 0", borderRadius:10, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", fontWeight:600, fontSize:12, cursor:"pointer" }}>
              ■ Stop
            </button>
          </>
        )}
      </div>

      {/* Voice command hint */}
      {isActive && (
        <>
          {transcript && (
            <p style={{ margin:"6px 0 0", fontSize:11, color:"#6b7280", textAlign:"center", fontStyle:"italic" }}>
              Heard: "{transcript}"
            </p>
          )}
          <p style={{ margin:"4px 0 0", fontSize:10, color:"#9ca3af", textAlign:"center" }}>
            {isPaused
              ? <>Say <strong>"resume"</strong> or <strong>"stop navigation"</strong></>
              : <>Say: <strong>"Hey Bexxa, next step"</strong> · "repeat" · "pause" · "stop navigation"</>
            }
          </p>
        </>
      )}
    </div>
  );
}
