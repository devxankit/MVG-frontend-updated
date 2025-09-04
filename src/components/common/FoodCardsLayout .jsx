import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

const FoodCardsLayout = () => {
  const navigate = useNavigate();
  const cards = [
    {
      id: 1,
      title: "Super Healthy",
      subtitle: "Flats 25% Discount",
      imageUrl: "./images/card-image-1.jpeg",
      imageAlt: "Fresh meat",
      gradient: "from-black/20 via-transparent to-transparent"
    },
    {
      id: 2,
      title: "Fresh Fruits",
      subtitle: "Flats 25% Discount", 
      imageUrl: "./images/card-image-2.jpeg",
      imageAlt: "Fresh fruits",
      gradient: "from-black/20 via-transparent to-transparent"
    },
    {
      id: 3,
      title: "Fresh Vegetables",
      subtitle: "Get 30% off on Your Order",
      imageUrl: "./images/card-image-3.jpeg",
      imageAlt: "Fresh vegetables",
      gradient: "from-black/20 via-transparent to-transparent"
    },
    {
      id: 4,
      title: "100% Organic",
      subtitle: "Get 30% Off on Your Order",
      imageUrl: "./images/card-image-4.jpeg",
      imageAlt: "Organic products",
      gradient: "from-black/20 via-transparent to-transparent"
    }
  ];

  const CardComponent = ({ card, className }) => (
    <Card 
      className={`rounded-2xl h-64 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border-0 cursor-pointer group ${className}`}
      style={{
        backgroundImage: `url(${card.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Subtle gradient overlay for text readability */}
      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} group-hover:from-black/30 transition-all duration-300`} />
      
      {/* Content positioned in center-left */}
      <div className="relative z-10 h-full flex items-center justify-start p-8">
        <div className="max-w-xs">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
            {card.title}
          </h2>
          <p className="text-white/90 text-sm mb-6 font-medium drop-shadow">
            {card.subtitle}
          </p>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border-0"
            onClick={() => navigate(`/products`)}
          >
            Shop Now
          </Button>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300" />
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* First Row */}
        <div className="col-span-12 lg:col-span-5">
          <CardComponent card={cards[0]} />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <CardComponent card={cards[1]} />
        </div>

        {/* Second Row */}
        <div className="col-span-12 lg:col-span-7">
          <CardComponent card={cards[2]} />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <CardComponent card={cards[3]} />
        </div>
      </div>
    </div>
  );
};

export default FoodCardsLayout;