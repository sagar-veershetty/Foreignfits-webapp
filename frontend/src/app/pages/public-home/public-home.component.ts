import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-home.component.html',
  styleUrls: ['./public-home.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class PublicHomeComponent implements OnInit {
  // Hero Section
  currentSlide = 0;
  heroSlides = [
    {
      title: 'Elevate Your Style',
      subtitle: 'Discover Premium Fashion from Around the World',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&q=80',
      cta: 'Shop Now'
    },
    {
      title: 'Winter Collection 2026',
      subtitle: 'Stay Warm, Look Cool - New Arrivals',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&q=80',
      cta: 'Explore Collection'
    },
    {
      title: 'Exclusive Designs',
      subtitle: 'Handpicked International Brands',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&q=80',
      cta: 'View Collections'
    }
  ];

  // Featured Categories
  categories = [
    { name: 'Men\'s Fashion', icon: '👔', count: '500+ Items', image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=400&fit=crop' },
    { name: 'Women\'s Fashion', icon: '👗', count: '750+ Items', image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=400&fit=crop' },
    { name: 'Kids Collection', icon: '🎒', count: '300+ Items', image: 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=400&h=400&fit=crop' },
    { name: 'Accessories', icon: '👜', count: '200+ Items', image: 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=400&h=400&fit=crop' },
    { name: 'Footwear', icon: '👟', count: '400+ Items', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop' },
    { name: 'Winter Wear', icon: '🧥', count: '250+ Items', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop' }
  ];

  // New Arrivals
  newArrivals = [
    {
      id: 1,
      name: 'Premium Denim Jacket',
      price: 2999,
      originalPrice: 4500,
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop',
      rating: 4.8,
      discount: 33,
      badge: 'New'
    },
    {
      id: 2,
      name: 'Designer Polo Shirt',
      price: 1499,
      originalPrice: 2000,
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop',
      rating: 4.6,
      discount: 25,
      badge: 'Hot'
    },
    {
      id: 3,
      name: 'Casual Sneakers',
      price: 3499,
      originalPrice: 5000,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
      rating: 4.9,
      discount: 30,
      badge: 'Sale'
    },
    {
      id: 4,
      name: 'Classic Chinos',
      price: 1999,
      originalPrice: 2800,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop',
      rating: 4.7,
      discount: 28,
      badge: 'New'
    }
  ];

  // Brand Features
  features = [
    {
      icon: '🌍',
      title: 'International Brands',
      description: 'Curated collection from top global fashion houses'
    },
    {
      icon: '✨',
      title: 'Premium Quality',
      description: 'Only the finest materials and craftsmanship'
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping across India'
    },
    {
      icon: '💯',
      title: 'Authentic Products',
      description: '100% genuine products with authenticity guarantee'
    },
    {
      icon: '🔄',
      title: 'Easy Returns',
      description: 'Hassle-free 30-day return policy'
    },
    {
      icon: '💳',
      title: 'Secure Payment',
      description: 'Safe and encrypted payment methods'
    }
  ];

  // Testimonials
  testimonials = [
    {
      name: 'Rajesh Kumar',
      location: 'Mumbai',
      rating: 5,
      comment: 'Amazing quality and authentic international brands. Foreign Fits is my go-to store for premium fashion!',
      avatar: 'RK'
    },
    {
      name: 'Priya Sharma',
      location: 'Bangalore',
      rating: 5,
      comment: 'Love the collection! The products are exactly as shown online. Great customer service too.',
      avatar: 'PS'
    },
    {
      name: 'Amit Patel',
      location: 'Delhi',
      rating: 5,
      comment: 'Best place for genuine international fashion brands. Prices are reasonable and quality is top-notch.',
      avatar: 'AP'
    }
  ];

  // Stats
  stats = [
    { value: '50,000+', label: 'Happy Customers' },
    { value: '2,000+', label: 'Premium Products' },
    { value: '100+', label: 'Global Brands' },
    { value: '30+', label: 'Cities Served' }
  ];

  // Newsletter
  newsletterEmail = '';

  // Scroll
  isScrolled = false;

  ngOnInit(): void {
    this.startHeroSlider();
  }

  startHeroSlider(): void {
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length;
    }, 5000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail) {
      alert(`Thank you for subscribing with ${this.newsletterEmail}`);
      this.newsletterEmail = '';
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
