import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import productAPI from '../../api/productAPI';
import ProductCard from './ProductCard';

const RelatedProducts = ({ currentProduct, title = 'Related products' }) => {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);

  const keywords = useMemo(() => {
    const tags = Array.isArray(currentProduct?.tags) ? currentProduct.tags.join(' ') : '';
    const nameWords = (currentProduct?.name || '').split(/\s+/).slice(0, 3).join(' ');
    return `${tags} ${nameWords}`.trim();
  }, [currentProduct]);

  useEffect(() => {
    const load = async () => {
      if (!currentProduct) return;
      setLoading(true);
      try {
        const collected = [];

        // 1) Try category-matched seller listings
        if (currentProduct.category) {
          const catRes = await productAPI.getProductsByCategory(currentProduct.category, { limit: 24 });
          const listings = Array.isArray(catRes?.data?.products) ? catRes.data.products : [];
          for (const sp of listings) {
            if (!sp || !sp.product) continue;
            const p = {
              ...sp.product,
              sellerPrice: sp.sellerPrice,
              seller: sp.seller,
              sellerProductId: sp._id,
            };
            collected.push(p);
          }
        }

        // 2) If still not enough, use keyword search on listings
        if (collected.length < 12 && keywords) {
          const searchRes = await productAPI.searchProducts(keywords, { limit: 24 });
          const listings = Array.isArray(searchRes?.data?.products) ? searchRes.data.products : [];
          for (const sp of listings) {
            if (!sp || !sp.product) continue;
            const p = {
              ...sp.product,
              sellerPrice: sp.sellerPrice,
              seller: sp.seller,
              sellerProductId: sp._id,
            };
            collected.push(p);
          }
        }

        // 3) As a final fallback, use plain products list (unique templates)
        if (collected.length < 12) {
          const allRes = await productAPI.getProducts();
          const products = Array.isArray(allRes?.data) ? allRes.data : [];
          collected.push(...products);
        }

        // Deduplicate by _id and exclude current product, then limit to 6
        const seen = new Set();
        const filtered = collected.filter((p) => {
          const id = p && (p._id || p.product?._id);
          if (!id || id === currentProduct._id) return false;
          if (seen.has(id)) return false;
          seen.add(id);
          // Prefer same category
          if (p.category && currentProduct.category && String(p.category) === String(currentProduct.category)) return true;
          // Otherwise allow if tags/name overlap
          const txt = `${p.name || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
          const kw = keywords.toLowerCase();
          return kw && (txt.includes(kw.split(' ')[0] || '') || txt.includes(kw.split(' ')[1] || ''));
        }).slice(0, 6);

        setRelated(filtered);
      } catch (_) {
        setRelated([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentProduct, keywords]);

  if (!currentProduct) return null;

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {currentProduct.category && (
          <Link to={`/products`} className="text-green-600 text-sm hover:underline">View all</Link>
        )}
      </div>
      {loading && (
        <div className="py-8 text-center text-gray-500">Loading suggestions…</div>
      )}
      {!loading && related.length === 0 && (
        <div className="py-6 text-gray-500">No related items found.</div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {related.map((p) => (
          <ProductCard key={p._id} product={p} showWishlist={false} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;


