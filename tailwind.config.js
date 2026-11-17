/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: { colors: { ink: '#0A0640', royal: '#1A0C9A', gold: '#F4C95D', cream: '#FFF8E8' } } },
  plugins: [],
};
