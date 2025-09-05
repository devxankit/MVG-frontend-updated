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
      gradient: "from-black/20 via-transparent to-transparent",
      animation: "fade-up-right",
      delay: 0
    },
    {
      id: 2,
      title: "Fresh Fruits",
      subtitle: "Flats 25% Discount", 
      imageUrl: "./images/card-image-2.jpeg",
      imageAlt: "Fresh fruits",
      gradient: "from-black/20 via-transparent to-transparent",
      animation: "fade-up-left",
      delay: 200
    },
    {
      id: 3,
      title: "Fresh Vegetables",
      subtitle: "Get 30% off on Your Order",
      imageUrl: "./images/card-image-3.jpeg",
      imageAlt: "Fresh vegetables",
      gradient: "from-black/20 via-transparent to-transparent",
      animation: "fade-up-right",
      delay: 400
    },
    {
      id: 4,
      title: "100% Organic",
      subtitle: "Get 30% Off on Your Order",
      imageUrl: "./images/card-image-4.jpeg",
      imageAlt: "Organic products",
      gradient: "from-black/20 via-transparent to-transparent",
      animation: "fade-up-left",
      delay: 600
    }
  ];

  const CardComponent = ({ card, className }) => (
    <Card 
      className={`rounded-2xl h-64 overflow-hidden relative transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border-0 cursor-pointer group w-full ${className}`}
      style={{
        backgroundImage: `url(${card.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      data-aos={card.animation}
      data-aos-delay={card.delay}
      data-aos-duration="1000"
      data-aos-easing="ease-in-out-cubic"
    >
      {/* Enhanced gradient overlay with smooth transitions */}
      <div className={`absolute inset-0 bg-gradient-to-r ${card.gradient} group-hover:from-black/40 group-hover:via-black/20 transition-all duration-500`} />
      
      {/* Content positioned in center-left with staggered animations */}
      <div className="relative z-10 h-full flex items-center justify-start p-8 overflow-hidden">
        <div className="max-w-xs w-full">
          <h2 
            className="text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-lg transform group-hover:translate-x-2 transition-all duration-500"
            data-aos="fade-up"
            data-aos-delay={card.delay + 200}
            data-aos-duration="800"
          >
            {card.title}
          </h2>
          <p 
            className="text-white/90 text-sm mb-6 font-medium drop-shadow transform group-hover:translate-x-2 transition-all duration-500"
            data-aos="fade-up"
            data-aos-delay={card.delay + 400}
            data-aos-duration="800"
          >
            {card.subtitle}
          </p>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-0 transform group-hover:translate-x-2"
            onClick={() => navigate(`/products`)}
            data-aos="zoom-in"
            data-aos-delay={card.delay + 600}
            data-aos-duration="600"
          >
            Shop Now
          </Button>
        </div>
      </div>

      {/* Enhanced decorative corner accent with rotation */}
      <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-500" />
      
      {/* Additional floating elements for enhanced visual appeal */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
      <div className="absolute bottom-8 right-8 w-1 h-1 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-200 transition-all duration-700" />
    </Card>
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Section title with fade-in animation */}
        <div 
          className="text-center mb-12"
          data-aos="fade-down"
          data-aos-duration="1000"
          data-aos-delay="100"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Discover Fresh & Healthy</h2>
          <p className="text-gray-600 text-lg">Premium quality products at unbeatable prices</p>
        </div>

        <div className="grid grid-cols-12 gap-6 w-full">
          {/* First Row */}
          <div className="col-span-12 lg:col-span-5 w-full">
            <CardComponent card={cards[0]} />
          </div>

          <div className="col-span-12 lg:col-span-7 w-full">
            <CardComponent card={cards[1]} />
          </div>

          {/* Second Row */}
          <div className="col-span-12 lg:col-span-7 w-full">
            <CardComponent card={cards[2]} />
          </div>

          <div className="col-span-12 lg:col-span-5 w-full">
            <CardComponent card={cards[3]} />
          </div>
        </div>

        {/* Call-to-action section with enhanced animation */}
        <div 
          className="text-center mt-16"
          data-aos="fade-up"
          data-aos-duration="1200"
          data-aos-delay="800"
        >
          <Button 
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 border-0"
            onClick={() => navigate(`/products`)}
          >
            Explore All Products
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FoodCardsLayout;