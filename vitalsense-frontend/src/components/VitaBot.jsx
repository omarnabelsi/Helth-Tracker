export const VitaBot = ({ size = 100 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
    {/* Feet */}
    <rect x="28" y="126" width="18" height="10" rx="5" fill="#1B3A2D"/>
    <rect x="54" y="126" width="18" height="10" rx="5" fill="#1B3A2D"/>
    {/* Legs */}
    <rect x="30" y="100" width="16" height="30" rx="8" fill="#2E7D52"/>
    <rect x="54" y="100" width="16" height="30" rx="8" fill="#2E7D52"/>
    {/* Body */}
    <rect x="22" y="58" width="56" height="46" rx="12" fill="#2E7D52"/>
    {/* Chest screen */}
    <rect x="32" y="66" width="36" height="24" rx="4" fill="#0A1F14"/>
    {/* Chest bars animated */}
    <rect x="36" y="74" width="6" height="12" rx="2" fill="#4CAF7D" opacity="0.9" style={{animation:'chestScan 1.8s infinite ease-in-out'}}/>
    <rect x="45" y="70" width="6" height="16" rx="2" fill="#4CAF7D" opacity="0.7" style={{animation:'chestScan 1.8s 0.3s infinite ease-in-out'}}/>
    <rect x="54" y="72" width="6" height="14" rx="2" fill="#4CAF7D" opacity="0.5" style={{animation:'chestScan 1.8s 0.6s infinite ease-in-out'}}/>
    {/* Left arm with clipboard */}
    <rect x="4" y="60" width="18" height="40" rx="9" fill="#2E7D52"/>
    {/* Clipboard */}
    <rect x="-10" y="56" width="22" height="30" rx="3" fill="#1a1a1a"/>
    <rect x="-8" y="59" width="18" height="24" rx="2" fill="#2a2a2a"/>
    <rect x="-2" y="53" width="10" height="6" rx="3" fill="#888"/>
    {/* Checklist */}
    <rect x="-5" y="64" width="3" height="3" rx="0.5" fill="#4CAF7D"/>
    <rect x="0" y="65" width="10" height="1.5" rx="0.5" fill="#555"/>
    <rect x="-5" y="70" width="3" height="3" rx="0.5" fill="#4CAF7D"/>
    <rect x="0" y="71" width="10" height="1.5" rx="0.5" fill="#555"/>
    <rect x="-5" y="76" width="3" height="3" rx="0.5" fill="#4CAF7D"/>
    <rect x="0" y="77" width="7" height="1.5" rx="0.5" fill="#555"/>
    {/* Right arm */}
    <rect x="78" y="60" width="18" height="40" rx="9" fill="#1B3A2D"/>
    {/* Head */}
    <rect x="18" y="10" width="64" height="52" rx="14" fill="#2E7D52"/>
    {/* Screen face */}
    <rect x="24" y="16" width="52" height="40" rx="8" fill="#0A1F14"/>
    {/* Eye glow rings */}
    <circle cx="38" cy="34" r="10" fill="#4CAF7D" opacity="0.15" style={{animation:'eyeGlow 2s infinite'}}/>
    <circle cx="62" cy="34" r="10" fill="#4CAF7D" opacity="0.15" style={{animation:'eyeGlow 2s 0.3s infinite'}}/>
    {/* Eyes */}
    <circle cx="38" cy="34" r="7" fill="#4CAF7D" style={{animation:'eyeGlow 2s infinite'}}/>
    <circle cx="62" cy="34" r="7" fill="#4CAF7D" style={{animation:'eyeGlow 2s 0.3s infinite'}}/>
    {/* Eye shine */}
    <circle cx="41" cy="31" r="2" fill="white" opacity="0.6"/>
    <circle cx="65" cy="31" r="2" fill="white" opacity="0.6"/>
    {/* Mouth pixels */}
    <rect x="28" y="48" width="4" height="4" rx="1" fill="#4CAF7D"/>
    <rect x="34" y="51" width="4" height="4" rx="1" fill="#4CAF7D"/>
    <rect x="40" y="52" width="4" height="4" rx="1" fill="#4CAF7D"/>
    <rect x="46" y="51" width="4" height="4" rx="1" fill="#4CAF7D"/>
    <rect x="52" y="48" width="4" height="4" rx="1" fill="#4CAF7D"/>
    {/* Antenna */}
    <rect x="48" y="0" width="4" height="12" rx="2" fill="#2E7D52"/>
    <circle cx="50" cy="0" r="6" fill="#4CAF7D" style={{animation:'antennaGlow 1.5s infinite'}}/>
    {/* Side bolts */}
    <circle cx="18" cy="36" r="4" fill="#1B3A2D"/>
    <circle cx="82" cy="36" r="4" fill="#1B3A2D"/>
  </svg>
)
