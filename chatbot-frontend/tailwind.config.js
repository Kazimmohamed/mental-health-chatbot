// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft purple palette
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
        
        // Complementary calming colors
        'calm-blue': '#e6f2ff',
        'calm-teal': '#e0f7fa',
        'calm-lavender': '#f3e5f5',
        'calm-mint': '#e0f2eb',
        
        // Soft grays
        'soft-gray-50': '#f9fafb',
        'soft-gray-100': '#f3f4f6',
        'soft-gray-200': '#e5e7eb',
        'soft-gray-300': '#d1d5db',
        'soft-gray-400': '#9ca3af',
        
        // Message colors
        'user-message': '#9d7ff6',
        'bot-message': '#f0f4ff',
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        gentlePulse: "gentlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        wave: "wave 1.8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gentlePulse: {
          "0%, 100%": { opacity: "0.9" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wave: {
          "0%": { transform: "rotate(0deg)" },
          "10%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "30%": { transform: "rotate(14deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10deg)" },
          "60%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(0deg)" },
        }
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(157, 127, 246, 0.15)',
        'soft-lg': '0 10px 30px rgba(157, 127, 246, 0.2)',
        'inner-glow': 'inset 0 0 10px rgba(157, 127, 246, 0.2)',
      },
      backgroundImage: {
        'gradient-soft-purple': 'linear-gradient(135deg, #f2eefe 0%, #e6f2ff 100%)',
        'gradient-message-user': 'linear-gradient(135deg, #9d7ff6 0%, #8a68e3 100%)',
        'gradient-header': 'linear-gradient(135deg, rgba(157, 127, 246, 0.1) 0%, rgba(157, 127, 246, 0.05) 100%)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.scrollbar-soft': {
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f9f7ff',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#d3c5fd',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#b9a1fa',
          }
        },
        '.chat-bubble-user': {
          borderBottomRightRadius: '0',
        },
        '.chat-bubble-bot': {
          borderBottomLeftRadius: '0',
        }
      })
    }
  ],
};