import './SupportPage.css';

const SupportPage = () => {
  return (
    <div className="support-page">
      <div className="support-card">
        <h2>Need Help?</h2>
        <p className="support-subtitle">We’re here to answer your questions.</p>

        <form className="support-form">
          <label>
            Your Email
            <input type="email" placeholder="student@example.com" />
          </label>

          <label>
            Topic
            <select>
              <option value="">Select a topic</option>
              <option value="orders">Orders</option>
              <option value="payments">Payments</option>
              <option value="account">Account Issues</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Message
            <textarea rows={5} placeholder="Describe your issue here..." />
          </label>

          <button type="submit">Submit Request</button>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;
