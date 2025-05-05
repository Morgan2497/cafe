import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const SupportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FAQ State
  interface FAQ {
    question: string;
    answer: string;
    isOpen: boolean;
  }

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      question: "What shipping options do you offer?",
      answer: "We offer several shipping options to meet your needs: Standard Shipping (3-5 business days) and Express Shipping (1-2 business days).",
      isOpen: false,
    },
    {
      question: "How much does shipping cost?",
      answer: "Standard Shipping is free for orders over $200. Orders under $50 have a flat rate of $5.99. Express Shipping costs $12.99.",
      isOpen: false,
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day satisfaction guarantee on all unopened products. If you're not completely satisfied with your purchase, you can return it within 30 days of delivery for a full refund or exchange.",
      isOpen: false,
    },
    {
      question: "How do I initiate a return?",
      answer: "To start a return, you can contact our customer service team for assistance.",
      isOpen: false,
    },
    {
      question: "Do you offer refunds on shipping costs?",
      answer: "Shipping costs are non-refundable unless the return is due to our error (such as sending the wrong item or a defective product). In these cases, we'll refund your full purchase price including any shipping charges and will cover the cost of return shipping.",
      isOpen: false,
    },
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(faqs.map((faq, i) => i === index ? { ...faq, isOpen: !faq.isOpen } : faq));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        read: false,
        createdAt: serverTimestamp(),
      });

      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting message:', error);
      setSubmitError('Failed to submit your message. Please try again later.');
    }
  };

  return (
    <div className="container">
      <section className="support-header">
        <h1>Customer Support</h1>
        <p>We're here to answer any questions you may have.</p>
      </section>

      <section className="support-top-content">
        <div className="support-card contact-info-card">
          <h2>Contact Us</h2>
          <div className="contact-info">
            <div className="contact-item">
              <h3>Email</h3>
              <p>support@cpsc449shop.com</p>
            </div>
            <div className="contact-item">
              <h3>Phone</h3>
              <p>(888) 888-8888</p>
            </div>
            <div className="contact-item">
              <h3>Hours</h3>
              <p>Monday - Friday: 9am - 5pm PST</p>
            </div>
            <div className="contact-item">
              <h3>Address</h3>
              <p>CPSC 449 Group Project<br />Cal State Fullerton<br />Fullerton, CA 92831</p>
            </div>
          </div>
        </div>

        <div className="support-card contact-form-card">
          <h2>Send Us a Message</h2>
          <div className="contact-form-container">
            {formSubmitted ? (
              <div className="form-success-message">
                <p>Thank you for your message! We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Your email address" required />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Subject of your message" required />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} placeholder="How can we help you?" rows={5} required />
                </div>
                {submitError && (
                  <div className="error-message" style={{
                    padding: '0.75rem',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}>
                    {submitError}
                  </div>
                )}
                <button type="submit" className="submit-button">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section moved to bottom */}
      <section className="support-bottom-content">
        <div className="support-card faq-card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div className="faq-item" key={index} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                <div
                  onClick={() => toggleFAQ(index)}
                  style={{
                    color: '#2c3e50',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {faq.question}
                  <span>{faq.isOpen ? '−' : '+'}</span>
                </div>
                {faq.isOpen && <p style={{ color: '#555', lineHeight: 1.6, fontSize: '1.1rem', paddingTop: '0.5rem' }}>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SupportPage;
