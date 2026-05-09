export const SpeechBubble = ({ text, position = 'right' }) => {
  const isRTL = document.dir === 'rtl';
  return (
    <div key={text} className="speech-bubble" style={{
      borderRadius: isRTL 
        ? (position === 'right' ? '20px 20px 6px 20px' : '20px 20px 20px 6px')
        : (position === 'right' ? '20px 20px 20px 6px' : '20px 20px 6px 20px'),
    }}>
      <p>{text}</p>
    </div>
  )
}
