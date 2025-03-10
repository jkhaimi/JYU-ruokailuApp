import React from "react";

const StarRating = ({ rating }) => {
    const numericRating = Number(rating);
    const validRating = isNaN(numericRating) ? 0 : Math.round(numericRating);
    const fullStars = Math.min(validRating, 5); 
    const emptyStars = 5 - fullStars;

    return (
        <div className="star-rating">
            {[...Array(fullStars)].map((_, index) => (
                <img key={`full-${index}`} src="/star1.png" alt="Tähti" className="star-icon" />
            ))}
            {[...Array(emptyStars)].map((_, index) => (
                <img key={`empty-${index}`} src="/star3.png" alt="Tyhjä tähti" className="star-icon" />
            ))}
        </div>
    );
};

export default StarRating;
