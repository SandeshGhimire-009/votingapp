import React from 'react';

const ErrorPage = () => {
  return (
    <section className="error-section">
      <div className="container">
        <div className="error-container">
          <div className="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>The page you are looking for does not exist.</p>
          <a href="/" className="btn btn-primary">
            Go Home
          </a>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;
