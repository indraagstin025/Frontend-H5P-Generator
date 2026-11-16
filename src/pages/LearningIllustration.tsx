/** Decorative vector artwork; animations are disabled for reduced motion. */
export function LearningIllustration() {
  return (
    <svg className="learning-illustration" viewBox="0 0 480 360" role="img" aria-labelledby="learning-art-title">
      <title id="learning-art-title">Dua pengajar berkolaborasi membuat materi dan kuis digital</title>
      <defs>
        <linearGradient id="learning-art-bg" x2="1" y2="1">
          <stop stopColor="#edf8e9" /><stop offset="1" stopColor="#b8dfbc" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="472" height="352" rx="24" fill="url(#learning-art-bg)" />
      <circle cx="409" cy="65" r="80" fill="#ffffff" opacity=".24" />
      <path d="M4 294Q140 227 267 288T476 269V332Q476 356 452 356H28Q4 356 4 332Z" fill="#83c793" />
      <g className="learning-browser">
        <rect x="77" y="62" width="326" height="184" rx="12" fill="#fff" />
        <path d="M89 62H391Q403 62 403 74V86H77V74Q77 62 89 62" fill="#078580" />
        <circle cx="91" cy="74" r="3" fill="#fff" /><circle cx="102" cy="74" r="3" fill="#bce8d6" />
        <rect x="117" y="70" width="164" height="8" rx="4" fill="#ffffff38" />
        <rect x="95" y="102" width="132" height="91" rx="8" fill="#e8f3e9" />
        <path d="M145 124L145 168L179 146Z" fill="#077c1a" />
        <rect x="242" y="106" width="135" height="8" rx="4" fill="#bad4c0" />
        <rect x="242" y="123" width="104" height="6" rx="3" fill="#dce9de" />
        <rect x="242" y="148" width="135" height="30" rx="6" fill="#f0f7ef" />
        <circle cx="257" cy="163" r="6" fill="#077c1a" /><path d="M254 163L256 165L260 160" stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="271" y="160" width="85" height="5" rx="2" fill="#a9c9ae" />
        <rect x="95" y="208" width="174" height="7" rx="3" fill="#dce9de" />
        <rect x="95" y="222" width="127" height="5" rx="2" fill="#e9f0ea" />
      </g>
      <g className="learning-quiz">
        <rect x="256" y="181" width="121" height="104" rx="10" fill="#fff" stroke="#c1dcc5" />
        <path d="M266 181H367Q377 181 377 191V201H256V191Q256 181 266 181" fill="#078580" />
        <circle cx="267" cy="191" r="2.5" fill="#fff" />
        <rect x="269" y="213" width="62" height="5" rx="2" fill="#c8ddcc" />
        <path d="M270 264V242Q280 232 289 241T311 235T337 224Q350 215 361 226V264Z" fill="#07975c" />
        <path d="M269 265H363" stroke="#d2e4d5" strokeWidth="2" />
      </g>
      <g className="learning-badge">
        <circle cx="242" cy="80" r="32" fill="#d9edda" /><circle cx="242" cy="80" r="26" fill="#077c1a" />
        <text x="242" y="86" textAnchor="middle" fill="#fff" fontSize="17" fontWeight="800" fontFamily="system-ui, sans-serif">H5P</text>
      </g>
      <g>
        <path d="M52 310L64 244Q70 223 102 227L129 250L145 320Z" fill="#f1f4ee" />
        <path d="M78 231L91 277L121 234L128 249L105 289L111 327H48L65 282L66 243Z" fill="#07854b" />
        <path d="M88 217L86 234Q99 247 108 232L107 212Z" fill="#f3aa81" />
        <ellipse cx="100" cy="201" rx="20" ry="26" fill="#ffbd94" />
        <path d="M80 204Q61 187 82 170Q104 155 119 178L111 188L98 182L94 203Z" fill="#293e36" />
        <ellipse cx="65" cy="188" rx="23" ry="28" fill="#293e36" />
        <path d="M122 250L148 272L188 223L201 235L163 296Q154 306 140 298L113 278Z" fill="#ffbd94" />
        <path d="M187 225L193 207L199 204L199 218L211 214Q218 217 211 226L201 236Z" fill="#ffbd94" />
        <path d="M64 250L49 284Q44 297 55 302L72 305" stroke="#ffbd94" strokeWidth="17" strokeLinecap="round" fill="none" />
      </g>
      <g>
        <path d="M371 232Q401 219 418 249L445 325H355L348 275Z" fill="#078580" />
        <path d="M374 222L373 237Q386 248 396 234L391 213Z" fill="#f3aa81" />
        <ellipse cx="382" cy="200" rx="19" ry="26" fill="#ffbd94" />
        <path d="M365 184Q358 166 377 164Q386 149 394 167Q414 164 407 182Q421 192 400 208L391 196L393 183L381 187Z" fill="#293e36" />
        <path d="M398 256L405 294Q405 304 390 306L330 294L332 278L383 282L378 260Z" fill="#f6c557" />
        <path d="M333 278L318 269L307 272L314 282L330 294Z" fill="#ffbd94" />
        <path d="M359 252L344 269L333 263" fill="none" stroke="#ffbd94" strokeWidth="14" strokeLinecap="round" />
      </g>
      <g className="learning-sparkles" fill="#fff">
        <path d="M42 108L45 116L53 119L45 122L42 130L39 122L31 119L39 116Z" />
        <path d="M430 153L433 159L439 162L433 165L430 171L427 165L421 162L427 159Z" />
      </g>
    </svg>
  );
}
