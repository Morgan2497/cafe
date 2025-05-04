import './ItemsPage.css';

const items = [
  {
    id: 1,
    name: "Chicken Sandwich",
    price: 5.99,
    image: "/assets/sandwich.jpg",
  },
  {
    id: 2,
    name: "Veggie Wrap",
    price: 4.49,
    image: "/assets/wrap.jpg",
  },
  {
    id: 3,
    name: "Iced Coffee",
    price: 2.49,
    image: "/assets/coffee.jpg",
  },
  {
    id: 4,
    name: "Fruit Salad",
    price: 3.25,
    image: "/assets/salad.jpg",
  },
];

const ItemsPage = () => {
  return (
    <div className="items-page">
      <h1>Menu Items</h1>
      <div className="items-grid">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>${item.price.toFixed(2)}</p>
              <button>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemsPage;
