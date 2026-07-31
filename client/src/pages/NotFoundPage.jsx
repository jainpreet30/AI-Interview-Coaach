import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="notfound-page">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="button button-secondary" to="/">
        Back to home
      </Link>
    </section>
  );
}
