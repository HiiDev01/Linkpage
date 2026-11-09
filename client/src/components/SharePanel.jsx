import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FiCopy, FiDownload, FiExternalLink, FiShare2 } from 'react-icons/fi';
import api, { errorMessage } from '../api.js';
import { useAuth } from '../auth.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from './Toast.jsx';

export default function SharePanel() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const url = `${window.location.origin}/${profile.username}`;
  const published = profile.is_published;

  // The QR code is generated in the browser, only for published pages.
  useEffect(() => {
    if (!published) return setQr('');
    QRCode.toDataURL(url, { width: 480, margin: 2, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''));
  }, [published, url]);

  const setPublished = async (next) => {
    setBusy(true);
    try {
      await api.post(next ? '/profile/publish' : '/profile/unpublish');
      await refreshProfile();
      toast(next ? 'Page published' : 'Page unpublished');
      setConfirming(false);
    } catch (err) { toast(errorMessage(err), 'error'); }
    setBusy(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch { toast('Couldn’t copy automatically. Select the address and copy it.', 'error'); }
  };

  const download = async () => {
    const big = await QRCode.toDataURL(url, { width: 1024, margin: 4, errorCorrectionLevel: 'M' });
    const a = document.createElement('a');
    a.href = big;
    a.download = `linkpage-${profile.username}.png`;
    a.click();
  };

  const share = async () => {
    try { await navigator.share({ title: `${profile.full_name || profile.username} on LinkPage`, url }); }
    catch (err) { if (err.name !== 'AbortError') copy(); }
  };

  return (
    <>
      <section className="panel">
        <div className="row between">
          <h2>Your page</h2>
          <span className={`pill ${published ? 'on' : ''}`}>{published ? 'Published' : 'Draft'}</span>
        </div>
        <code className="url">{url}</code>
        <div className="row wrap">
          {published ? (
            <button className="btn ghost" onClick={() => setConfirming(true)} disabled={busy}>Unpublish</button>
          ) : (
            <button className="btn" onClick={() => setPublished(true)} disabled={busy}>{busy ? 'Publishing…' : 'Publish page'}</button>
          )}
          <button className="btn ghost" onClick={copy}><FiCopy /> Copy link</button>
          {published && <a className="btn ghost" href={url} target="_blank" rel="noopener noreferrer"><FiExternalLink /> View page</a>}
        </div>
        {!published && <p className="muted small top-gap">Only published pages can be opened by others. Until then, visitors see “page not found.”</p>}
      </section>

      {published && (
        <section className="panel qr-panel">
          <div>
            <h2>QR code</h2>
            <p className="muted">Scanning it opens your page. Add it to a business card, flyer or slide.</p>
            <div className="row wrap">
              <button className="btn ghost" onClick={download} disabled={!qr}><FiDownload /> Download PNG</button>
              {typeof navigator.share === 'function' && <button className="btn ghost" onClick={share}><FiShare2 /> Share</button>}
            </div>
          </div>
          {qr ? <img className="qr" src={qr} alt={`QR code that opens ${url}`} /> : <div className="qr placeholder"><div className="spinner" aria-label="Generating QR code" /></div>}
        </section>
      )}

      {confirming && (
        <ConfirmDialog title="Unpublish your page?" confirmLabel="Unpublish"
          message="Your link and QR code will stop working until you publish again."
          onConfirm={() => setPublished(false)} onCancel={() => setConfirming(false)} busy={busy} />
      )}
    </>
  );
}
