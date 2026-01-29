import React from 'react';
import './ProductCard.css';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
    return (
        <div className="product-card" onClick={() => onAdd(product)}>
            <div className="product-image-container">
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-overlay">
                    <Plus color="white" size={32} />
                </div>
            </div>
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category">{product.category}</span>
                <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <span className={`product-stock ${product.stock < 10 ? 'low' : ''}`}>
                        {product.stock} disp.
                    </span>
                </div>
            </div>
        </div>
    );
}
