import React from "react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Phone } from "lucide-react";
import AOS from 'aos';
import 'aos/dist/aos.css';

import { useEffect } from "react";

export default function DeliveryBanner() {

  useEffect(() => {
    AOS.init({
      duration: 800, // animation duration in ms
      once: true,    // only animate once
    });
  }, []);  


  return (
    <div className="w-full bg-white py-10 px-6 flex justify-center items-center" data-aos="fade-up">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Text Section */}
        <div className="flex flex-col space-y-4" data-aos="fade-up">
          <h2 className="text-3xl font-bold text-green-900" data-aos="fade-up">
            We Guarantee <br /> 30 Minutes <br /> Delivery!
          </h2>
          <p className="text-gray-700 text-sm" data-aos="fade-up">
            30-Minutes Delivery Guarantee! We are the only food company that
            guarantees your order will arrive within 30 minutes or we'll give
            you a free meal.
          </p>
          <div className="flex items-center space-x-2 text-orange-500 font-medium">
            <Phone className="w-5 h-5" />
            <span>Call Us Free: +91 98765 43210</span>
          </div>
        </div>

        {/* Middle Image */}
        <div className="flex justify-center items-center" data-aos="fade-up">
             <img
            src="./images/banner-image-4.png"
            alt="Food Delivery Illustration"
            width={500}
            height={400}
            className="object-contain"  data-aos="fade-up"
          />
        </div>

        {/* Right Text Section */}
        <div className="flex flex-col space-y-4" data-aos="fade-up">
          <h2 className="text-2xl font-bold text-gray-900" data-aos="fade-up">
            Choose what you want, select a pick up time
          </h2>
          <p className="text-gray-600 text-sm" data-aos="fade-up">
            Service benefits and convenience
            Real-time tracking and speed
            Restaurant variety and quality 
            User-friendly ordering process
          </p>
          <Button className="bg-green-600 hover:bg-green-700 w-fit rounded-full px-6 py-2">
            Learn more →
          </Button>
        </div>
      </div>
    </div>
  );
}
