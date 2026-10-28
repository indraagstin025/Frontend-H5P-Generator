import { useState } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { FAQ_ENTERPRISE } from '../constants';

export function LandingFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="edu-section" id="faq">
      <div className="edu-section-head">
        <span className="edu-section-kicker">BUTUH BANTUAN?</span>
        <h2 className="edu-section-title">Pertanyaan yang sering ditanya</h2>
        <p className="edu-section-sub">Hal-hal teknis soal masukin file H5P ke LMS:</p>
      </div>

      <div className="edu-faq-list">
        {FAQ_ENTERPRISE.map((item, idx) => (
          <div className={`edu-faq-item ${openFaq === idx ? 'open' : ''}`} key={idx}>
            <button
              type="button"
              className="edu-faq-question"
              aria-expanded={openFaq === idx}
              aria-controls={`landing-faq-${idx}`}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <span>{item.q}</span>
              <ChevronDownIcon />
            </button>
            {openFaq === idx && (
              <div className="edu-faq-answer" id={`landing-faq-${idx}`}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
