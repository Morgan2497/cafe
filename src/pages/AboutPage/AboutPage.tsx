import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>Welcome to Our Cafeteria</h1>
        <p>Fresh. Fast. Friendly. Just the way students like it.</p>
      </div>

      <div className="about-content">
        <section>
          <h2>Our Story</h2>
          <p>
            Since opening our doors, the cafeteria has been a hub of great food and good vibes for students. We offer a variety of meals prepared fresh every day with love and care.
          </p>
        </section>

        <section>
          <h2>Why Students Love Us</h2>
          <ul>
            <li>Affordable prices</li>
            <li>Quick service between classes</li>
            <li>Nutritious and delicious meals</li>
            <li>Vegan and allergy-friendly options</li>
          </ul>
        </section>

        <section className="about-hours">
          <h2>Opening Hours</h2>
          <p>Monday – Friday: 7:30 AM – 6:00 PM</p>
          <p>Saturday: 9:00 AM – 3:00 PM</p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
