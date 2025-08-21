// Mobile Navigation Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('nav');
    if (window.scrollY > 100) {
        navbar.classList.remove('bg-white/95');
        navbar.classList.add('bg-white/98', 'shadow-lg');
    } else {
        navbar.classList.remove('bg-white/98', 'shadow-lg');
        navbar.classList.add('bg-white/95');
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
        }
    });
}, observerOptions);

// Observe feature cards for animation
document.querySelectorAll('#features .bg-white, #pricing .bg-white').forEach(el => {
    el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700');
    observer.observe(el);
});

// Counter animation for hero stats
const animateCounters = () => {
    const counters = document.querySelectorAll('.text-3xl.font-bold');
    const speed = 200; // The lower the slower

    counters.forEach(counter => {
        const animate = () => {
            const text = counter.innerText;
            const value = parseInt(text.replace(/[^\d]/g, ''));
            const data = parseInt(counter.getAttribute('data-current') || '0');

            const time = value / speed;

            if (data < value) {
                const newValue = Math.ceil(data + time);
                counter.setAttribute('data-current', newValue);

                if (text.includes('K')) {
                    counter.innerText = newValue + 'K+';
                } else if (text.includes('M')) {
                    counter.innerText = newValue + 'M+';
                } else if (text.includes('%')) {
                    counter.innerText = newValue + '%';
                } else {
                    counter.innerText = newValue;
                }

                setTimeout(animate, 1);
            }
        };

        animate();
    });
};

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(animateCounters, 500);
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.pt-20.pb-16');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Add click events to CTA buttons
document.querySelectorAll('button').forEach(button => {
    if (button.textContent.includes('Get Started') || button.textContent.includes('Start Free Trial') || button.textContent.includes('Watch Demo')) {
        button.addEventListener('click', (e) => {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('absolute', 'rounded-full', 'bg-white/30', 'pointer-events-none', 'animate-ping');

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);

            console.log('CTA button clicked:', button.textContent.trim());
        });
    }
});

// Dashboard preview hover effect
const dashboardPreview = document.querySelector('.bg-white.rounded-2xl.shadow-2xl');
if (dashboardPreview) {
    dashboardPreview.addEventListener('mouseenter', () => {
        dashboardPreview.style.transform = 'perspective(1000px) rotateY(-2deg) rotateX(2deg) scale(1.02)';
    });

    dashboardPreview.addEventListener('mouseleave', () => {
        dashboardPreview.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg) scale(1)';
    });
}

// Simulate task status changes in dashboard preview
const taskStatuses = document.querySelectorAll('.w-3.h-3.rounded-full');
if (taskStatuses.length > 0) {
    setInterval(() => {
        const randomTask = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
        const colors = ['bg-green-500', 'bg-yellow-400', 'bg-indigo-500'];
        const currentColor = colors.find(color => randomTask.classList.contains(color));
        const newColor = colors[Math.floor(Math.random() * colors.length)];

        if (currentColor !== newColor) {
            randomTask.classList.remove(currentColor);
            randomTask.classList.add(newColor);
        }
    }, 3000);
}

// Pricing card interactions
document.querySelectorAll('#pricing .bg-white').forEach(card => {
    card.addEventListener('mouseenter', () => {
        if (!card.classList.contains('border-primary')) {
            card.classList.remove('border-gray-200');
            card.classList.add('border-primary');
        }
    });

    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('scale-105')) {
            card.classList.remove('border-primary');
            card.classList.add('border-gray-200');
        }
    });
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu if open
        mobileMenu.classList.add('hidden');
    }
});

// Add loading states to buttons
const addLoadingState = (button) => {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    button.disabled = true;
    button.classList.add('opacity-75', 'cursor-not-allowed');

    // Simulate API call
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }, 2000);
};

// Add to demo buttons
document.querySelectorAll('button').forEach(button => {
    if (button.textContent.includes('Watch Demo')) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            addLoadingState(button);
        });
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animations to hero content
    const heroContent = document.querySelector('.grid.lg\\:grid-cols-2 > div:first-child');
    const heroImage = document.querySelector('.grid.lg\\:grid-cols-2 > div:last-child');

    if (heroContent) {
        heroContent.classList.add('opacity-0', 'translate-y-8');

        setTimeout(() => {
            heroContent.classList.add('transition-all', 'duration-1000');
            heroContent.classList.remove('opacity-0', 'translate-y-8');
        }, 200);
    }

    if (heroImage) {
        heroImage.classList.add('opacity-0', 'translate-x-8');

        setTimeout(() => {
            heroImage.classList.add('transition-all', 'duration-1000');
            heroImage.classList.remove('opacity-0', 'translate-x-8');
        }, 400);
    }

    // Add stagger animation to feature cards
    const featureCards = document.querySelectorAll('#features .bg-white');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 100}ms`;
    });

    console.log('TaskFlow landing page with Tailwind CSS loaded successfully!');
});
