import React, { useState, useEffect, useRef, memo } from 'react';

// Placeholder images - replace with your actual images
import img2 from './img/GrowupLogo1.jpeg.jpg';
import img3 from './img/Swamika.jpg';
import img4 from './img/clients1.jpg';
import img5 from './img/aceInfra.jpg';
import img6 from './img/clients2.jpg';
import img7 from './img/mg.jpg';

const categories = [
  {
    id: 1,
    name: 'GrowUp India',
    logo: img2,
  },
  {
    id: 2,
    name: 'SwamiKaLife',
    logo: img3,
  },
  {
    id: 3,
    name: 'Infinity Vision',
    logo: img4,
  },
  {
    id: 4,
    name: 'Ace Infra',
    logo: img5,
  },
  {
    id: 5,
    name: 'MG Solutions',
    logo: img7,
  },
  {
    id: 6,
    name: 'Swami Samarth',
    logo: img6,
  },
];

const CategoryCard = memo(({ category, index }) => {
  const colors = [
    'from-emerald-400 to-teal-600',
    'from-blue-400 to-indigo-600',
    'from-purple-400 to-pink-600',
    'from-green-400 to-emerald-600',
    'from-orange-400 to-red-600',
    'from-teal-400 to-cyan-600',
    'from-pink-400 to-rose-600',
    'from-violet-400 to-purple-600',
  ];

  const bgColors = [
    'from-emerald-50 to-teal-100',
    'from-blue-50 to-indigo-100',
    'from-purple-50 to-pink-100',
    'from-green-50 to-emerald-100',
    'from-orange-50 to-red-100',
    'from-teal-50 to-cyan-100',
    'from-pink-50 to-rose-100',
    'from-violet-50 to-purple-100',
  ];

  const colorIndex = index % colors.length;

  return (
    <div style={{
      flexShrink: 0,
      width: 'clamp(280px, 20vw, 320px)',
      margin: '0 0.75rem',
      position: 'relative'
    }}>
      <div style={{
        position: 'relative',
        height: '320px',
        width: '100%',
        background: 'white',
        borderRadius: '1.5rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer'
      }}
      className="category-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-0.75rem)';
        e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
      }}>
        
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
          opacity: 0.9,
          zIndex: 1
        }} className={`bg-gradient-to-br ${bgColors[colorIndex]}`} />
        
        {/* Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 3,
          boxSizing: 'border-box'
        }}>
          
          {/* Logo Image */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <img 
              src={category.logo} 
              alt={category.name}
              style={{
                width: '180px',
                height: '180px',
                objectFit: 'contain',
                borderRadius: '0.75rem',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '1rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          {/* Category Info */}
          <div style={{
            textAlign: 'center'
          }}>
            <h3 style={{
              fontWeight: 700,
              fontSize: '1.5rem',
              marginBottom: '0.25rem',
              color: '#1f2937',
              lineHeight: 1.3
            }}>{category.name}</h3>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '0.75rem'
            }}>{category.subtitle}</p>
            
            <div style={{
              width: '4rem',
              height: '0.25rem',
              background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
              borderRadius: '9999px',
              margin: '0 auto'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

const EnhancedClientsCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);
  const animationRef = useRef(null);
  const positionRef = useRef(0);
  
  const extendedCategories = [...categories, ...categories, ...categories, ...categories];
  
  
  
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    
    const scrollSpeed = 0.5;
    
    const animate = () => {
      if (!isPaused && track) {
        const cardWidth = 320 + 24;
        const totalWidth = cardWidth * categories.length;
        
        positionRef.current += scrollSpeed;
        
        if (positionRef.current >= totalWidth) {
          positionRef.current -= totalWidth;
        }
        
        track.style.transform = `translateX(-${positionRef.current}px)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused]);
  
  return (
    <section style={{
      padding: '5rem 0',
      background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem',
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #1f2937 0%, #3b82f6 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2
          }}>Explore Creative Work</h2>
        </div>
        
        {/* Carousel Wrapper */}
        <div style={{
          position: 'relative',
          padding: '0 4rem',
          marginBottom: '3rem'
        }}>
          
          {/* Navigation Buttons */}
          
          
          {/* Carousel Track Container */}
          <div style={{
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div
              ref={trackRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{
                display: 'flex',
                willChange: 'transform',
                transition: 'none',
                gap: 0,
                alignItems: 'center'
              }}
            >
              {extendedCategories.map((category, index) => (
                <CategoryCard key={`${category.id}-${index}`} category={category} index={index} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Indicators */}
        <div style={{
          marginTop: '3rem',
          marginBottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          {categories.map((_, index) => (
            <div key={index} style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              background: '#d1d5db'
            }} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnhancedClientsCarousel;


