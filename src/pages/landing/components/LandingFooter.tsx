export function LandingFooter() {
  return (
    <footer className="edu-footer">
      <div className="edu-footer-left">
        <img src="/logo.png" alt="H5P Generator" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontWeight: 800, color: 'var(--green-deep)' }}>H5P Generator</span>
        <span>·</span>
        <span>Standar H5P Course Presentation</span>
      </div>
      <div className="edu-footer-right">
        <span>Nilai otomatis masuk LMS</span>
        <span>·</span>
        <span>Buat LMS internal</span>
      </div>
    </footer>
  );
}
