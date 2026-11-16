/**
 * Bilah status jaringan global yang aktif saat koneksi terputus, server gagal
 * dijangkau, atau baru saja pulih kembali.
 */
import { useState } from 'react';
import { CheckIcon, ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';
import { checkServerConnection, useNetworkStatus } from '../../services/network';

export function NetworkBanner() {
  const { isOnline, serverReachable, recoveredAt } = useNetworkStatus();
  const [checking, setChecking] = useState(false);

  if (isOnline && serverReachable && recoveredAt === null) {
    return null;
  }

  const handleRetry = () => {
    if (checking) return;
    setChecking(true);
    void checkServerConnection().finally(() => {
      setChecking(false);
    });
  };

  if (!isOnline) {
    return (
      <div className="network-banner network-banner--offline" role="alert" aria-live="assertive">
        <ExclamationTriangleIcon className="network-banner-icon" aria-hidden="true" />
        <span>Koneksi internet terputus. Periksa jaringan Anda untuk melanjutkan.</span>
      </div>
    );
  }

  if (!serverReachable) {
    return (
      <div className="network-banner network-banner--warn" role="status" aria-live="polite">
        <ExclamationTriangleIcon className="network-banner-icon" aria-hidden="true" />
        <span>Koneksi ke server terputus. Periksa jaringan Anda lalu coba lagi.</span>
        <button type="button" className="network-banner-btn" onClick={handleRetry} disabled={checking}>
          <ReloadIcon aria-hidden="true" />
          {checking ? 'Memeriksa…' : 'Cek Koneksi'}
        </button>
      </div>
    );
  }

  return (
    <div className="network-banner network-banner--online" role="status" aria-live="polite">
      <CheckIcon className="network-banner-icon" aria-hidden="true" />
      <span>Koneksi internet kembali tersambung.</span>
    </div>
  );
}
