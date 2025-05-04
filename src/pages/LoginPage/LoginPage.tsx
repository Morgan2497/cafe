import './LoginPage.css';

const LoginPage = () => {
  return (
    <div className="login-container">
      <div className="login-left">
        <h1>Cafeteria</h1>
        <p>Delicious meals. Simple ordering.</p>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="subtitle">Log in to order your favorite meals</p>
          <form className="login-form">
            <label>
              Email
              <input type="email" placeholder="student@example.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="••••••••" />
            </label>
            <button type="submit">Login</button>
          </form>
          <p className="register-link">
            Don’t have an account? <a href="#">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
