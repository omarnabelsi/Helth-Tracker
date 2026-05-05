export const SpeechBubble = ({ text, position = 'right' }) => (
  <div key={text} className="speech-bubble" style={{
    borderRadius: position === 'right' ? '20px 20px 20px 6px' : '20px 20px 6px 20px',
  }}>
    <p>{text}</p>
  </div>
)
