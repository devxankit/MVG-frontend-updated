import React, { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, A11y } from 'swiper';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slidesRaw = [
  {
    image: '/images/banner_1.png',
    headline: 'Discover Amazing Products',
    subheadline:
      'Shop from thousands of verified sellers and find the best deals on quality products.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  },
  {
    image: '/images/banner_3.png',
    headline: 'Trendy Collections',
    subheadline: 'Explore the latest trends and exclusive offers from top brands.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  },
  {
    image: '/images/banner_2.png',
    headline: 'Quality Guaranteed',
    subheadline: 'Only the best products from trusted sellers, with easy returns.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  },
];

const contentVariants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, y: -40, transition: { duration: 0.5, ease: 'easeIn' } },
};

const HeroCarousel = () => {
  const slides = useMemo(
    () =>
      slidesRaw.map((s) => ({
        ...s,
        // Ensure public URL resolution for CRA/Vite public folder assets
        image: `${process.env.PUBLIC_URL || ''}${s.image}`,
      })),
    []
  );

  const [loaded, setLoaded] = useState(Array(slides.length).fill(false));
  const [anyLoaded, setAnyLoaded] = useState(false);

  useEffect(() => {
    slides.forEach((slide, index) => {
      const img = new Image();
      img.src = slide.image;
      img.onload = () => {
        setLoaded((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        setAnyLoaded(true);
      };
    });
  }, [slides]);

  return (
    <section className="relative w-full min-h-[30vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-100">
      {/* Swiper is always mounted but images fade in when ready */}
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
        }}
        className="w-full h-full"
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            {/* Base placeholder to avoid white/green flash */}
            <div className="absolute inset-0 w-full h-full bg-gray-100" aria-hidden="true" />
            {/* Actual image with fade-in */}
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: loaded[idx] ? 1 : 0 }}
            />

            <div className="relative z-10 flex flex-col items-center justify-center h-[30vh] md:h-[90vh] px-4">
              <motion.div
                className="text-center"
                initial="initial"
                whileInView="animate"
                exit="exit"
                variants={contentVariants}
                viewport={{ once: true }}
              >
                {/* Hero text/content can be added here if needed */}
              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Overlay for better readability - only after first image is loaded */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-primary-700/40 pointer-events-none transition-opacity duration-500"
        style={{ opacity: anyLoaded ? 1 : 0 }}
      />
    </section>
  );
};

export default HeroCarousel; 