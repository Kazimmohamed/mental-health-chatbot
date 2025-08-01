/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced purple palette with deeper tones
        'purple-50': '#f9f7ff',
        'purple-100': '#f2eefe',
        'purple-200': '#e6defe',
        'purple-300': '#d3c5fd',
        'purple-400': '#b9a1fa',
        'purple-500': '#9d7ff6', // Primary brand color
        'purple-600': '#8a68e3',
        'purple-700': '#7452c7',
        'purple-800': '#5e41a1',
        'purple-900': '#4b3380',
        
        // Expanded calming palette
        'calm-blue': '#e6f2ff',
        'calm-blue-100': '#d4e8ff',
        'calm-teal': '#e0f7fa',
        'calm-teal-100': '#c7f1f5',
        'calm-lavender': '#f3e5f5',
        'calm-lavender-100': '#ead6f0',
        'calm-mint': '#e0f2eb',
        'calm-mint-100': '#c9e9de',
        
        // Enhanced grayscale with cooler tones
        'soft-gray-50': '#fafbfc',
        'soft-gray-100': '#f4f5f7',
        'soft-gray-200': '#e6e8ec',
        'soft-gray-300': '#d4d7dd',
        'soft-gray-400': '#a1a8b3',
        'soft-gray-500': '#7a8494',
        
        // Message colors with gradients
        'user-message': '#9d7ff6',
        'bot-message': '#f0f4ff',
        'user-message-dark': '#8a68e3',
        'bot-message-dark': '#e6edff',
      },
      animation: {
        fadeIn: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        fadeInUp: "fadeInUp 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards",
        gentlePulse: "gentlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        wave: "wave 1.8s ease-in-out infinite",
        subtlePulse: "subtlePulse 2.5s ease-in-out infinite",
        borderGlow: "borderGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gentlePulse: {
          "0%, 100%": { opacity: "0.95", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        subtlePulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.97" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wave: {
          "0%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(12deg)" },
          "20%": { transform: "rotate(-6deg)" },
          "30%": { transform: "rotate(12deg)" },
          "40%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(8deg)" },
          "60%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        borderGlow: {
          "0%, 100%": { "border-color": "rgba(157, 127, 246, 0.3)" },
          "50%": { "border-color": "rgba(157, 127, 246, 0.7)" },
        }
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(157, 127, 246, 0.15)',
        'soft-lg': '0 10px 30px rgba(157, 127, 246, 0.2)',
        'inner-glow': 'inset 0 0 10px rgba(157, 127, 246, 0.2)',
        'elevated': '0 12px 24px -12px rgba(0, 0, 0, 0.15), 0 0 15px rgba(0, 0, 0, 0.05)',
        'elevated-lg': '0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 15px rgba(157, 127, 246, 0.3)',
        'button-glow': '0 0 10px rgba(157, 127, 246, 0.5)',
      },
      backgroundImage: {
        'gradient-soft-purple': 'linear-gradient(135deg, #f2eefe 0%, #e6f2ff 100%)',
        'gradient-message-user': 'linear-gradient(135deg, #9d7ff6 0%, #8a68e3 100%)',
        'gradient-header': 'linear-gradient(135deg, rgba(157, 127, 246, 0.1) 0%, rgba(157, 127, 246, 0.05) 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.12) 100%)',
        'gradient-button': 'linear-gradient(135deg, #9d7ff6 0%, #8a68e3 100%)',
        'gradient-button-hover': 'linear-gradient(135deg, #8a68e3 0%, #7452c7 100%)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '20px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '105': '1.05',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        // Text utilities
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-gradient': {
          'background': 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        
        // Scrollbar enhancements
        '.scrollbar-modern': {
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(156, 163, 175, 0.4)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(107, 114, 128, 0.6)',
          }
        },
        
        // Chat bubbles
        '.chat-bubble-user': {
          borderBottomRightRadius: '0',
          '@apply bg-gradient-message-user text-white': '',
        },
        '.chat-bubble-bot': {
          borderBottomLeftRadius: '0',
          '@apply bg-bot-message': '',
        },
        
        // Glass effect
        '.glass': {
          background: 'rgba(255, 255, 255, 0.18)',
          'backdrop-filter': 'blur(20px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
          'border-radius': '16px',
        },
        
        // Floating effect
        '.floating': {
          'box-shadow': '0 12px 24px -12px rgba(0, 0, 0, 0.15), 0 0 15px rgba(0, 0, 0, 0.05)',
          'transform': 'translateY(0)',
          'transition': 'transform 0.4s ease, box-shadow 0.4s ease',
        },
        '.floating:hover': {
          'transform': 'translateY(-4px)',
          'box-shadow': '0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.08)',
        },
        
        // Input focus effect
        '.input-focus:focus': {
          'box-shadow': '0 0 0 3px rgba(199, 210, 254, 0.5), 0 4px 12px rgba(99, 102, 241, 0.1)',
        },
        
        // Glow effect
        '.glow-effect': {
          'position': 'relative',
        },
        '.glow-effect::before': {
          content: '""',
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          background: 'inherit',
          'filter': 'blur(8px)',
          opacity: '0.3',
          'z-index': '-1',
          'border-radius': 'inherit',
        },
        
        // Speaker button enhancements
        '.speaker-button': {
          'position': 'relative',
          'opacity': '0.85',
          'transition': 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          'box-shadow': '0 2px 4px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05)',
          'border-radius': '50%',
        },
        '.speaker-button:hover': {
          'opacity': '1',
          'transform': 'scale(1.08)',
          'box-shadow': '0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.08)',
        },
        '.speaker-button:active': {
          'transform': 'scale(0.95)',
        },
        '.speaker-button::after': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          'border-radius': '50%',
          'box-shadow': 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
          'pointer-events': 'none',
        },
      };
      
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
    require('@tailwindcss/line-clamp'),
  ],
};