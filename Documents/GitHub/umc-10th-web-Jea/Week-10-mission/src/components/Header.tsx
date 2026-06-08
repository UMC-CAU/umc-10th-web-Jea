export default function Header() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center px-8 py-6 border-b border-white/[0.07] backdrop-blur-md"
      style={{ background: 'linear-gradient(180deg, #0a0c12 0%, transparent 100%)' }}
    >
      <div
        className="text-3xl tracking-[3px]"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          color: '#e8c94a',
          textShadow: '0 0 20px rgba(232,201,74,0.4)',
        }}
      >
        CINE<span style={{ color: '#3d7ef5' }}>X</span>
      </div>
    </header>
  )
}