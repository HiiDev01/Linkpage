import { Link } from 'react-router-dom';

export default function NotFound({ code = '404', message = 'There’s no page at this address.' }) {
  return (
    <div className="center-screen stack">
      <h1 className="big">{code}</h1>
      <p className="muted">{message}</p>
      <Link className="btn" to="/">Go to LinkPage</Link>
    </div>
  );
}
