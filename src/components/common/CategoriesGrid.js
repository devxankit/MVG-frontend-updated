import React from 'react';
import { Link } from 'react-router-dom';

// Helper to normalize category names for mapping
const normalize = name =>
  name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .trim();

const categoryImageMap = {
  electronics: '/images/electronics.jpeg',
  homeandkitchen: '/images/home and kitchen.jpeg',
  beautyandpersonalcare: '/images/beauty and personal care.jpeg',
  clothingshoesandjewelry: '/images/clothing shoose.jpeg',
  sportsandoutdoors: '/images/sport and outdoor.jpeg',
  toysandgames: '/images/toy and game.jpeg',
};

const CategoriesGrid = ({ categories, circular = false }) => (
  <div
    className={
      circular
        ? "categories-grid-2-mobile gap-4 sm:gap-6 md:flex md:flex-wrap md:justify-center md:gap-12"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
    }
  >
    {categories.map((category, index) => (
      category && category.name ? (
        <div key={category._id || index} className="group">
          <Link
            to={`/products?category=${category._id}`}
            className="block"
          >
            <div
              className={[
                "relative bg-gray-100 transition-colors overflow-hidden flex items-center justify-center",
                circular
                  ? "rounded-full aspect-square w-full max-w-[180px] sm:max-w-[200px] mx-auto md:w-44 lg:w-48 md:max-w-none hover:bg-primary-50"
                  : "rounded-lg p-6 text-center hover:bg-primary-50 h-48 flex-col justify-end"
              ].join(" ")}
            >
              <img
                src={
                  category.image ||
                  categoryImageMap[normalize(category.name)] ||
                  '/default-category.png'
                }
                alt={category.name || 'Category'}
                onError={e => {
                  if (!e.target.src.endsWith('/default-category.png')) {
                    e.target.src = '/default-category.png';
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110 z-0 select-none"
                style={{ filter: 'brightness(0.7)' }}
              />
              <div className={circular ? "relative z-10 text-center" : "relative z-10"}>
                <h3 className={[
                  "font-semibold group-hover:text-primary-600 text-white text-lg drop-shadow-lg",
                  circular ? "m-0" : "mb-2"
                ].join(" ")}>
                  {category.name || 'Unnamed Category'}
                </h3>
                {!circular && category.count !== undefined && (
                  <p className="text-sm text-gray-200 drop-shadow-lg">{category.count} products</p>
                )}
              </div>
            </div>
          </Link>
          {/* Subcategories */}
          {Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {category.subcategories.map((subcat) => (
                <Link
                  key={subcat._id}
                  to={`/products?category=${subcat._id}`}
                  className="bg-gray-200 hover:bg-primary-100 text-gray-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  {subcat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div key={index} className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400 font-bold">
          No Data
        </div>
      )
    ))}
  </div>
);

export default CategoriesGrid; 