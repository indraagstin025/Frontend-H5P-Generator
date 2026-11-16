type FeatureIllustrationProps = { variant: 'editing' | 'convert' | 'game' | 'customization' };

/** Flat artwork matching the hero, with a different scene for each feature. */
export function FeatureIllustration({ variant }: FeatureIllustrationProps) {
  return (
    <svg className={`feature-illustration feature-illustration-${variant}`} viewBox="0 0 360 210" aria-hidden="true" focusable="false">
      <rect width="360" height="210" rx="16" fill="#e5f3e5" />
      <circle cx="305" cy="35" r="72" fill="#d1eacf" />
      <path d="M0 178Q90 131 183 173T360 155V210H0Z" fill="#b4dcb9" />
      <g className="feature-art-float">
        {variant === 'customization' && <>
          <rect x="83" y="36" width="222" height="133" rx="10" fill="#fff" />
          <path d="M93 36H295Q305 36 305 46V57H83V46Q83 36 93 36" fill="#078580" />
          <circle cx="96" cy="47" r="3" fill="#fff" />
          <rect x="96" y="72" width="92" height="81" rx="6" fill="#e5f3e5" />
          <rect x="107" y="83" width="68" height="29" rx="4" fill="#85bd91" />
          <path d="M109 123H175M109 134H157" stroke="#bbd8bf" strokeWidth="5" strokeLinecap="round" />
          <path d="M204 84H288M204 110H288M204 136H288" stroke="#d9e8db" strokeWidth="5" strokeLinecap="round" />
          <circle cx="229" cy="84" r="7" fill="#077c1a" />
          <circle cx="269" cy="110" r="7" fill="#078580" />
          <circle cx="241" cy="136" r="7" fill="#efc65d" />
        </>}
        {variant === 'editing' && <>
          <rect x="75" y="35" width="228" height="135" rx="9" fill="#fff" />
          <path d="M84 35H294Q303 35 303 44V54H75V44Q75 35 84 35" fill="#078580" />
          <circle cx="87" cy="45" r="2.5" fill="#fff" /><circle cx="96" cy="45" r="2.5" fill="#d1eacf" />
          <rect x="87" y="67" width="40" height="90" rx="4" fill="#eaf4e9" />
          <rect x="94" y="75" width="26" height="16" rx="2" fill="#afd6b5" />
          <rect x="94" y="99" width="26" height="16" rx="2" fill="#d0e6d2" />
          <rect x="139" y="67" width="150" height="90" rx="5" fill="#eff7ed" />
          <text x="214" y="111" textAnchor="middle" fontSize="27" fontWeight="800" fill="#077c1a">H5P</text>
          <path d="M169 131H259" stroke="#bbd8bf" strokeWidth="5" strokeLinecap="round" />
          <g transform="translate(267 114) rotate(35)"><rect width="13" height="57" rx="3" fill="#f4c85e" /><path d="M0 57L6.5 69L13 57" fill="#294c37" /><rect y="8" width="13" height="4" fill="#fff" /></g>
        </>}
        {variant === 'convert' && <>
          <g transform="translate(83 47) rotate(-8 35 50)"><rect width="67" height="88" rx="7" fill="#fff" /><rect x="11" y="14" width="29" height="5" rx="2" fill="#adcdb4" /><path d="M12 31H54M12 42H49M12 53H54" stroke="#d5e7d7" strokeWidth="4" /><text x="33" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill="#26733a">PPTX</text></g>
          <g transform="translate(111 91) rotate(7 30 40)"><rect width="62" height="79" rx="7" fill="#f8fcf7" stroke="#c7dfca" /><path d="M12 19H47M12 30H42M12 41H47" stroke="#c7dfca" strokeWidth="4" /><text x="31" y="65" textAnchor="middle" fontSize="11" fontWeight="700" fill="#26733a">PDF</text></g>
          <path d="M181 110H216M206 100L216 110L206 120" stroke="#078580" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="234" y="62" width="83" height="107" rx="10" fill="#077c1a" />
          <path d="M255 86L275 76L295 86L275 96ZM255 95L275 105L295 95" stroke="#cbe8ce" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <text x="275" y="139" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">H5P</text>
        </>}
        {variant === 'game' && <>
          <rect x="94" y="43" width="205" height="121" rx="10" fill="#fff" />
          <rect x="108" y="56" width="72" height="6" rx="3" fill="#c7dfca" />
          <path d="M176 75H217V91Q217 114 196 117Q176 114 176 91Z" fill="#f2c95f" />
          <path d="M176 80H165V89Q165 103 182 104M217 80H228V89Q228 103 212 104" fill="none" stroke="#d6ae45" strokeWidth="5" />
          <path d="M196 116V130M184 132H209" stroke="#d6ae45" strokeWidth="5" strokeLinecap="round" />
          <rect x="111" y="144" width="168" height="7" rx="3" fill="#e0eddf" /><rect x="111" y="144" width="113" height="7" rx="3" fill="#078580" />
          <circle cx="283" cy="64" r="22" fill="#077c1a" /><path d="M273 64L280 71L293 57" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M143 87L146 94L154 95L148 101L149 109L143 105L136 109L137 101L132 95L140 94Z" fill="#8bc59b" />
        </>}
      </g>
      <g>
        <path d="M34 191L43 146Q50 130 72 138L91 160L98 201H29Z" fill="#07854b" />
        <path d="M54 130V142Q63 151 70 141V127Z" fill="#f1ad86" />
        <ellipse cx="62" cy="116" rx="15" ry="20" fill="#ffbd94" />
        <path d="M48 119Q35 103 51 94Q66 84 77 101L70 108L59 103L57 119Z" fill="#293e36" />
        <circle cx="40" cy="106" r="15" fill="#293e36" />
        <path d="M77 153L98 168L121 142" stroke="#ffbd94" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M120 144L126 132" stroke="#ffbd94" strokeWidth="8" strokeLinecap="round" />
        <path d="M46 150L37 175L52 183" stroke="#ffbd94" strokeWidth="11" strokeLinecap="round" fill="none" />
      </g>
      <path d="M323 115L326 121L333 124L326 127L323 133L320 127L313 124L320 121Z" fill="#fff" />
    </svg>
  );
}
