import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function Home() {
  const navigate = useNavigate()
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  
  // Estado para el slideshow del fondo de servicios
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  
  const bgImages = [
    '/lavado-basico.jpg',
    '/lavado-completo.jpg',
    '/encerado.jpg',
    '/tapizado.jpg'
  ]

  // Slideshow automático para el fondo de servicios
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [bgImages.length])

  const fetchTestimonials = async () => {
    try {
      console.log('Cargando testimonios desde Supabase...')
      
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) {
        console.error('Error cargando testimonios:', error)
        setTestimonials([])
      } else if (data && data.length > 0) {
        console.log('Testimonios cargados en Home:', data)
        setTestimonials(data)
      } else {
        console.log('No hay testimonios aprobados en Supabase')
        setTestimonials([])
      }
    } catch (err) {
      console.error('Error inesperado:', err)
      setTestimonials([])
    }
    setLoadingTestimonials(false)
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      console.log('Actualizando testimonios por evento')
      setLoadingTestimonials(true)
      fetchTestimonials()
    }
    
    window.addEventListener('opiniones-actualizadas', handleUpdate)
    return () => window.removeEventListener('opiniones-actualizadas', handleUpdate)
  }, [])

  useEffect(() => {
    const counters = [
      { id: 'counter-clientes', target: 500, suffix: '+' },
      { id: 'counter-anos', target: 3, suffix: '' }
    ]

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          counters.forEach(counter => {
            const el = document.getElementById(counter.id)
            if (el && !el.getAttribute('data-animated')) {
              el.setAttribute('data-animated', 'true')
              let current = 0
              const step = counter.target / 50
              const timer = setInterval(() => {
                current += step
                if (current >= counter.target) {
                  el.textContent = Math.round(counter.target) + counter.suffix
                  clearInterval(timer)
                } else {
                  el.textContent = Math.floor(current) + counter.suffix
                }
              }, 30)
            }
          })
        }
      })
    }, { threshold: 0.5 })

    const statsSection = document.querySelector('.lc-stats')
    if (statsSection) counterObserver.observe(statsSection)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lc-visible')
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.lc-reveal').forEach((el) => observer.observe(el))
    
    return () => {
      observer.disconnect()
      counterObserver.disconnect()
    }
  }, [])

  const services = [
    { 
      name: 'Lavado Básico', 
      value: 'basico', 
      price: '$10', 
      desc: 'Lavado exterior con agua a presión, shampoo especial y secado manual.', 
      time: '30 min',
      bgImage: '/lavado-basico.jpg'
    },
    { 
      name: 'Lavado Completo', 
      value: 'completo', 
      price: '$20', 
      desc: 'Interior y exterior. Aspirado, tablero, vidrios y limpieza de llantas.', 
      time: '45 min',
      bgImage: '/lavado-completo.jpg'
    },
    { 
      name: 'Encerado + Lavado', 
      value: 'encerado', 
      price: '$35', 
      desc: 'Lavado completo más encerado profesional para proteger y dar brillo a la pintura.', 
      time: '60 min',
      bgImage: '/encerado.jpg'
    },
    { 
      name: 'Limpieza de Tapizado', 
      value: 'tapizado', 
      price: '$25', 
      desc: 'Limpieza profunda de asientos y alfombras con extractora profesional.', 
      time: '40 min',
      bgImage: '/tapizado.jpg'
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .lc-root { font-family:'DM Sans',sans-serif; background:#0a0e1a; color:#fff; overflow-x:hidden; }
        .lc-root h1,.lc-root h2,.lc-root h3 { font-family:'Sora',sans-serif; }

        @keyframes lcCarFloat { 
          0%,100%{transform:translateY(0px) rotate(0deg)} 
          50%{transform:translateY(-15px) rotate(2deg)} 
        }
        
        @keyframes lcCarGlow { 
          0%,100%{filter:drop-shadow(0 5px 15px rgba(14,184,208,0.3))} 
          50%{filter:drop-shadow(0 5px 25px rgba(14,184,208,0.6))} 
        }
        
        @keyframes lcLineMove { 
          0%{transform:translateX(-10px);opacity:0} 
          50%{opacity:1} 
          100%{transform:translateX(10px);opacity:0} 
        }

        .lc-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .parallax-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 120%;
          background-image: url('/fondo-hero.jpg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          will-change: transform;
          z-index: 0;
          transform: translateY(0);
          transition: transform 0.1s ease-out;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.55);
          z-index: 1;
        }

        .lc-glow { position:absolute;top:20%;left:50%;transform:translateX(-50%);width:600px;height:600px;animation:lcGlowPulse 4s ease-in-out infinite;z-index:1;pointer-events:none; }
        .lc-car-bg { position:absolute;bottom:0;right:-2%;font-size:300px;line-height:1;opacity:.05;animation:lcFloatCar 6s ease-in-out infinite;pointer-events:none;z-index:1; }
        .lc-hero-content { position:relative;z-index:2;text-align:center;padding:2rem;max-width:850px; }
        .lc-badge { display:inline-block;background:rgba(14,184,208,.12);border:1px solid rgba(14,184,208,.3);color:#0eb8d0;padding:.4rem 1rem;border-radius:999px;font-size:.8rem;margin-bottom:1.5rem;animation:lcFadeUp .8s ease both; }
        .lc-hero h1 { font-size:clamp(2.5rem,6vw,4.5rem);font-weight:600;line-height:1.1;margin-bottom:1.2rem;animation:lcFadeUp .8s .15s ease both; }
        .lc-hero h1 span { color:#0eb8d0; }
        .lc-hero p { font-size:1.05rem;color:rgba(255,255,255,.6);margin-bottom:2rem;line-height:1.75;animation:lcFadeUp .8s .3s ease both; }
        .lc-hero-btns { display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;animation:lcFadeUp .8s .45s ease both; }
        
        .lc-btn-primary { 
          background: rgba(14, 184, 208, 0.1); 
          backdrop-filter: blur(8px); 
          border: 1px solid rgba(14, 184, 208, 0.3); 
          color:#fff; 
          padding:.85rem 2rem; 
          border-radius:40px; 
          font-weight:500; 
          transition:all .3s; 
          cursor:pointer; 
        }
        .lc-btn-primary:hover { 
          background: rgba(14, 184, 208, 0.2); 
          border-color: rgba(14, 184, 208, 0.5); 
          transform:translateY(-2px); 
        }
        
        .lc-btn-outline { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(8px); 
          border: 1px solid rgba(255, 255, 255, 0.15); 
          color:#fff; 
          padding:.85rem 2rem; 
          border-radius:40px; 
          font-weight:400; 
          transition:all .3s; 
          cursor:pointer; 
        }
        .lc-btn-outline:hover { 
          background: rgba(255, 255, 255, 0.08); 
          border-color: rgba(255, 255, 255, 0.3); 
          transform:translateY(-2px); 
        }
        
        .lc-hours-card { background:rgba(255,255,255,0.05); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:0.8rem 1.5rem; display:inline-flex; align-items:center; gap:1.5rem; flex-wrap:wrap; justify-content:center; margin-top:1.5rem; margin-bottom:1rem; animation:lcFadeUp .8s .4s ease both; }
        .lc-hours-item { display:flex; align-items:center; gap:0.5rem; }
        .lc-hours-icon { font-size:1.3rem; }
        .lc-hours-label { font-size:0.65rem; color:rgba(255,255,255,0.5); letter-spacing:1px; }
        .lc-hours-value { font-size:0.85rem; font-weight:600; }
        .lc-hours-divider { width:1px; height:25px; background:rgba(255,255,255,0.2); }

        .lc-stats { 
          background: rgba(10, 14, 26, 0.6);
          backdrop-filter: blur(8px); 
          padding: 1rem 1.5rem; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          gap: 0.5rem; 
          flex-wrap: wrap;
          max-width: 95%;
          margin: 0 auto;
          border-radius: 50px;
          margin-top: -25px;
          position: relative;
          z-index: 10;
          border: 1px solid rgba(14,184,208,.15);
        }

        .lc-stat { 
          text-align: center;
          padding: 0 0.5rem;
          position: relative;
          flex: 1;
        }

        .lc-stat:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 25px;
          background: rgba(255,255,255,.1);
        }

        .lc-stat-num { 
          font-family:'Sora',sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0eb8d0;
          line-height: 1;
        }

        .lc-stat-label { 
          font-size: 0.55rem;
          color: rgba(255,255,255,.5);
          margin-top: 0.25rem;
          letter-spacing: 0.03em;
          font-weight: 500;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .lc-stats {
            padding: 0.6rem 1rem;
            border-radius: 40px;
            margin-top: -20px;
            gap: 0.25rem;
            max-width: 98%;
          }
          
          .lc-stat {
            padding: 0 0.25rem;
          }
          
          .lc-stat:not(:last-child)::after {
            height: 20px;
          }
          
          .lc-stat-num { 
            font-size: 1rem;
          }
          
          .lc-stat-label { 
            font-size: 0.45rem;
            white-space: nowrap;
          }
        }

        @media (max-width: 480px) {
          .lc-stats {
            padding: 0.5rem 0.8rem;
            gap: 0.15rem;
          }
          
          .lc-stat {
            padding: 0 0.15rem;
          }
          
          .lc-stat-num { 
            font-size: 0.85rem;
          }
          
          .lc-stat-label { 
            font-size: 0.4rem;
          }
          
          .lc-stat:not(:last-child)::after {
            height: 15px;
          }
        }

        .lc-section { padding:6rem 2rem; max-width:1100px; margin:0 auto; position:relative; z-index:2; }
        .lc-tag { display:inline-block;background:rgba(14,184,208,.1);color:#0eb8d0;padding:.3rem .9rem;border-radius:6px;font-size:.75rem;margin-bottom:1rem;letter-spacing:.06em; }
        .lc-section-title { font-size:2.2rem;font-weight:600;margin-bottom:.8rem;line-height:1.2; }
        .lc-section-sub { color:rgba(255,255,255,.5);font-size:.95rem;line-height:1.75;max-width:520px; }

        .services-section {
          position: relative;
          overflow: hidden;
        }

        .services-bg-slideshow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .services-bg-slideshow .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 1.5s ease-in-out;
        }

        .services-bg-slideshow .slide.active {
          opacity: 1;
        }

        .services-bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.65);
          z-index: 1;
        }

        .services-section .lc-section {
          position: relative;
          z-index: 2;
          max-width: 420px;
          margin: 0 auto;
        }

        .lc-service-card {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 20px;
          padding: 0.8rem;
          transition: all 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .lc-service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5));
          border-radius: 20px;
          z-index: 0;
          transition: background 0.3s ease;
        }

        .lc-service-card:hover::before {
          background: linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3));
        }

        .lc-service-card > div, 
        .lc-service-card > .lc-svc-name, 
        .lc-service-card > .lc-svc-price, 
        .lc-service-card > .lc-svc-desc,
        .lc-service-card > .lc-svc-time {
          position: relative;
          z-index: 2;
        }

        .lc-service-card:hover {
          transform: translateY(-6px) scale(1.02);
        }

        .lc-services-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
          gap: 0.8rem; 
          margin-top: 2rem;
          padding: 0 2rem;
        }

        .lc-svc-name { 
          font-family: 'Sora', sans-serif; 
          font-size: 0.85rem; 
          font-weight: 600; 
          margin-bottom: 0.2rem; 
          color: #fff; 
          text-shadow: 0 1px 3px rgba(0,0,0,0.5); 
        }

        .lc-svc-price { 
          font-family: 'Sora', sans-serif; 
          font-size: 1rem; 
          font-weight: 700; 
          color: #0eb8d0; 
          margin-bottom: 0.3rem; 
          text-shadow: 0 1px 2px rgba(0,0,0,0.3); 
        }

        .lc-svc-desc { 
          font-size: 0.65rem; 
          color: rgba(255, 255, 255, 0.9); 
          line-height: 1.35; 
          margin-bottom: 0.3rem; 
          text-shadow: 0 1px 2px rgba(0,0,0,0.3); 
        }

        .lc-svc-time { 
          display: inline-flex; 
          align-items: center; 
          gap: 0.2rem; 
          margin-top: 0.3rem; 
          font-size: 0.6rem; 
          color: rgba(255, 255, 255, 0.9); 
          background: rgba(0,0,0,0.5); 
          padding: 0.2rem 0.5rem; 
          border-radius: 99px; 
          width: fit-content; 
        }

        @media (max-width: 768px) {
          .services-section .lc-section {
            max-width: 100%;
            padding: 3rem 1rem;
          }
          
          .lc-services-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); 
            gap: 0.6rem; 
            margin-top: 2rem;
            padding: 0 3rem;
          }
          
          .lc-service-card {
            padding: 0.7rem;
            min-height: 160px;
          }
          
          .lc-svc-name { font-size: 0.9rem; }
          .lc-svc-price { font-size: 1rem; }
          .lc-svc-desc { font-size: 0.7rem; }
          .lc-svc-time { font-size: 0.65rem; }
        }
        
        .opiniones-section {
          position: relative;
          padding: 5rem 2rem;
          overflow: hidden;
        }

        .opiniones-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/fondo-opiniones.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: scroll;
          z-index: 0;
        }

        .opiniones-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1;
        }

        .opiniones-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
          position: relative;
          z-index: 2;
          justify-content: center;
        }

        .opinion-card {
          background: rgba(20, 25, 45, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1rem;
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          cursor: pointer;
        }

        .opinion-card:hover {
          transform: translateY(-8px);
          border-color: rgba(14, 184, 208, 0.5);
          background: rgba(20, 25, 45, 0.6);
        }

        .opinion-stars {
          color: #f59e0b;
          font-size: 1.1rem;
          margin-bottom: 1rem;
          letter-spacing: 2px;
        }

        .opinion-text {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .opinion-author {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }

        .opinion-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1494ea, #010322);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          transition: transform 0.3s ease;
        }

        .opinion-card:hover .opinion-avatar {
          transform: scale(1.05);
        }

        .opinion-author-info {
          flex: 1;
        }

        .opinion-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.2rem;
        }

        .opinion-date {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Estilos para la sección de ubicación con 3 mapas */
        .ubicacion-section {
          text-align: center;
          position: relative;
          z-index: 2;
          background: linear-gradient(135deg, rgba(6, 10, 20, 0.95), rgba(10, 14, 26, 0.98));
          border-top: 1px solid rgba(14, 184, 208, 0.2);
          border-bottom: 1px solid rgba(14, 184, 208, 0.2);
        }

        .ubicacion-desc {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 32px;
          font-size: 1rem;
        }

        .map-container {
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(14, 184, 208, 0.3);
          margin-bottom: 24px;
          max-width: 850px;
          margin-left: auto;
          margin-right: auto;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }

        .map-container iframe {
          display: block;
          width: 100%;
          height: 420px;
        }

        .map-links {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .map-link {
          background: rgba(14, 184, 208, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(14, 184, 208, 0.3);
          padding: 12px 26px;
          border-radius: 60px;
          font-size: 0.88rem;
          font-weight: 600;
          transition: all 0.3s;
          color: #fff;
          text-decoration: none;
          display: inline-block;
          cursor: pointer;
        }

        .map-link:hover {
          background: rgba(14, 184, 208, 0.2);
          border-color: #0eb8d0;
          color: #0eb8d0;
          transform: translateY(-3px);
        }

        @media (max-width: 768px) {
          .map-container iframe {
            height: 300px;
          }
          
          .map-link {
            padding: 10px 20px;
            font-size: 0.8rem;
          }
        }

        .lc-footer { 
          background: rgba(6, 10, 20, 0.95); 
          backdrop-filter: blur(10px); 
          border-top: 1px solid rgba(14, 184, 208, 0.2); 
          padding: 2.5rem 2rem 2rem; 
          text-align: center; 
          margin-top: 2rem;
        }

        .lc-footer-logo { 
          font-family: 'Sora', sans-serif; 
          font-size: 1.2rem; 
          font-weight: 600; 
          margin-bottom: 0.8rem;
          background: linear-gradient(135deg, #fff, #0eb8d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lc-footer-sub { 
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.45); 
          margin-bottom: 1.5rem;
          letter-spacing: 0.3px;
        }

        .lc-footer-links { 
          display: flex; 
          gap: 2rem; 
          justify-content: center; 
          flex-wrap: wrap; 
          margin-bottom: 1.5rem; 
        }

        .lc-footer-links button { 
          background: none; 
          border: none; 
          color: rgba(255, 255, 255, 0.5); 
          font-size: 0.85rem; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          padding: 0.3rem 0;
          position: relative;
        }

        .lc-footer-links button::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #0eb8d0;
          transition: width 0.3s ease;
        }

        .lc-footer-links button:hover { 
          color: #0eb8d0; 
          transform: translateY(-2px);
        }

        .lc-footer-links button:hover::after {
          width: 80%;
        }

        .lc-footer-copy { 
          font-size: 0.7rem; 
          color: rgba(255, 255, 255, 0.2); 
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .lc-footer { padding: 2rem 1rem 1.5rem; }
          .lc-footer-logo { font-size: 1rem; }
          .lc-footer-sub { font-size: 0.7rem; }
          .lc-footer-links { gap: 1.2rem; }
          .lc-footer-links button { font-size: 0.75rem; }
          .lc-footer-copy { font-size: 0.6rem; }
        }

        #contacto { position:relative; z-index:2; }

        .lc-reveal { opacity:0; transform:translateY(28px); transition:opacity .7s ease,transform .7s ease; }
        .lc-reveal.lc-visible { opacity:1; transform:translateY(0); }

        @keyframes lcPulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        @keyframes lcGlowPulse { 0%,100%{opacity:.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.1)} }
        @keyframes lcFloatCar { 0%,100%{transform:translateX(0) translateY(0)} 50%{transform:translateX(-10px) translateY(-15px)} }
        @keyframes lcFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lcFloatIcon { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-10px) rotate(4deg)} }

        @media(max-width:768px) {
          .lc-hero h1{font-size:2.2rem;}
          .lc-stats{gap:2.5rem;padding:2rem 1.5rem;}
          .lc-section{padding:4rem 1.25rem;}
          .lc-hours-card{scale:0.9;}
          .lc-services-grid { grid-template-columns:1fr; }
          .opiniones-grid { grid-template-columns:1fr; gap:1rem; }
          .opinion-card { padding:0.8rem; }
          .opiniones-section { padding:3rem 1.25rem; }
        }

        
      `}</style>

      <div className="lc-root">
        <section className="lc-hero" id="hero-section">
          <div className="parallax-bg" id="hero-parallax-bg"></div>
          <div className="hero-overlay"></div>
          <div className="lc-glow" />
          <span className="lc-car-bg"></span>

          <div className="lc-hero-content" style={{ paddingBottom: '3rem' }}>
            <h1>Autolavado y Servicios<br /><span>Camaro Fraterno</span></h1>
            <p>Lavado profesional, encerado y limpieza de tapizado.<br />Agendá tu cita en segundos.</p>
            
            <div className="lc-hours-card" style={{ marginBottom: '2rem' }}>
              <div className="lc-hours-item">
                <div>
                  <div className="lc-hours-label">LUNES A SÁBADO</div>
                  <div className="lc-hours-value" style={{ color: '#0eb8d0' }}>8:00am - 6:00pm</div>
                </div>
              </div>
              <div className="lc-hours-divider" />
              <div className="lc-hours-item">
                <div>
                  <div className="lc-hours-label">UBICACIÓN</div>
                  <div className="lc-hours-value">Bagaces, Guanacaste</div>
                </div>
              </div>
            </div>

            <div className="lc-hero-btns" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <button className="lc-btn-primary" onClick={() => navigate('/agendar')}>Agendar mi cita ahora</button>
              <button className="lc-btn-outline" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>Ver servicios</button>
            </div>
          </div>
        </section>

        <div className="lc-stats">
          <div className="lc-stat">
            <div className="lc-stat-num" id="counter-clientes">0</div>
            <div className="lc-stat-label">CLIENTES FELICES</div>
          </div>
          <div className="lc-stat">
            <div className="lc-stat-num" id="counter-anos">0</div>
            <div className="lc-stat-label">AÑOS DE EXPERIENCIA</div>
          </div>
          <div className="lc-stat">
            <div className="lc-stat-num" style={{ color: '#f59e0b' }}>★★★★★</div>
            <div className="lc-stat-label">CALIFICACIÓN PROMEDIO</div>
          </div>
        </div>

        <section id="servicios" className="services-section">
          <div className="services-bg-slideshow">
            {bgImages.map((img, index) => (
              <div 
                key={index}
                className={`slide ${currentBgIndex === index ? 'active' : ''}`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            <div className="services-bg-overlay"></div>
          </div>
          
          <div className="lc-section">
            <div className="lc-reveal">
              <span className="lc-tag">NUESTROS SERVICIOS</span>
              <h2 className="lc-section-title">Servicios diseñados<br />para tu vehículo</h2>
              <p className="lc-section-sub">Cada servicio está pensado para devolverle el brillo y la limpieza que tu auto merece.</p>
            </div>
            <div className="lc-services-grid">
              {services.map((s) => (
                <div 
                  key={s.name} 
                  className="lc-service-card lc-reveal" 
                  onClick={() => navigate(`/agendar?servicio=${s.value}`)}
                  style={{ backgroundImage: `url(${s.bgImage})` }}
                >
                  <div className="lc-svc-name">{s.name}</div>
                  <div className="lc-svc-price">{s.price}</div>
                  <div className="lc-svc-desc">{s.desc}</div>
                  <div className="lc-svc-time">{s.time}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="opiniones" className="opiniones-section">
          <div className="opiniones-bg"></div>
          <div className="opiniones-overlay"></div>
          
          <div style={{ maxWidth: 320, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div className="lc-reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span className="lc-tag">OPINIONES</span>
              <h2 className="lc-section-title">Lo que dicen nuestros clientes</h2>
              <p className="lc-section-sub" style={{ margin: '0 auto' }}>Opiniones reales de nuestros clientes</p>
            </div>
            
            <div className="opiniones-grid">
              {loadingTestimonials ? (
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem' }}>Cargando opiniones...</div>
              ) : testimonials.length === 0 ? (
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem', color: 'rgba(255,255,255,.5)' }}>No hay opiniones aún. ¡Sé el primero en opinar!</div>
              ) : (
                testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="opinion-card">
                    <div className="opinion-stars">
                      {"★".repeat(testimonial.rating || 5)}
                    </div>
                    <div className="opinion-text">"{testimonial.comment}"</div>
                    <div className="opinion-author">
                      <div className="opinion-avatar">
                        {testimonial.customer_name?.charAt(0) || 'C'}
                      </div>
                      <div className="opinion-author-info">
                        <div className="opinion-name">{testimonial.customer_name || 'Cliente'}</div>
                        <div className="opinion-date">{new Date(testimonial.created_at).toLocaleDateString('es-CR')}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '3rem' }} className="lc-reveal">
              <button className="lc-btn-outline" onClick={() => navigate('/opiniones')}>Ver todas las opiniones</button>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE CONTACTO */}
        <section id="contacto" style={{ 
  padding: '4rem 1.5rem', 
  backgroundImage: 'url("/fondo-contacto.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'scroll',
  position: 'relative',
  borderTop: '1px solid rgba(255,255,255,.06)'
}}>
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: 0
  }}></div>
  
  <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
    <div className="lc-reveal" style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <span className="lc-tag">CONTACTO</span>
      <h2 className="lc-section-title" style={{ fontSize: '1.8rem' }}>Estamos aquí para ayudarte</h2>
      <p className="lc-section-sub" style={{ margin: '0 auto', color: 'rgba(255,255,255,0.9)' }}>Contáctanos por WhatsApp, correo o visítanos en Bagaces</p>
    </div>
    
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {/* Tarjeta de información de contacto */}
      <div style={{ 
        background: 'rgba(17, 24, 39, 0.5)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255, 255, 255, 0.12)', 
        borderRadius: '24px', 
        overflow: 'hidden',
      }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(14,184,208,0.15), rgba(26,111,212,0.05))', padding: '0.8rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.75rem', color: '#0eb8d0', letterSpacing: '0.08em', fontWeight: 600 }}>INFORMACIÓN DE CONTACTO</p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', padding: '0.4rem', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(14,184,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>📍</span>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>DIRECCIÓN</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>Bagaces, Guanacaste, Costa Rica</div>
            </div>
          </div>
          
          <a 
            href="https://wa.me/50683606680"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', padding: '0.4rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.15)'; e.currentTarget.style.transform = 'translateX(5px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.032 2.00195C6.586 2.00195 2.16895 6.40995 2.16895 11.855C2.16895 13.515 2.64095 15.083 3.47295 16.438L2.04195 21.002L6.69295 19.632C7.99795 20.372 9.48195 20.782 11.009 20.782H11.032C16.466 20.782 20.884 16.374 20.884 10.928C20.884 8.44395 19.871 6.13395 18.034 4.32195C16.198 2.50995 13.891 1.99895 12.032 2.00195ZM12.032 3.60195C13.531 3.60195 15.466 4.21795 16.922 5.64595C18.379 7.07395 19.229 8.92395 19.229 10.926C19.229 15.694 15.479 19.166 11.007 19.166C9.76795 19.166 8.56695 18.859 7.49695 18.288L6.94795 17.969L4.33795 18.694L5.10395 16.167L4.75195 15.594C4.11195 14.464 3.76295 13.183 3.76295 11.855C3.76295 7.08795 7.51495 3.60195 12.032 3.60195Z" fill="#25d366"/>
                <path d="M16.132 13.444C15.883 13.319 14.794 12.784 14.569 12.707C14.344 12.63 14.179 12.591 14.014 12.841C13.849 13.091 13.407 13.574 13.266 13.735C13.125 13.896 12.984 13.918 12.735 13.793C12.486 13.668 11.692 13.384 10.757 12.547C10.032 11.9 9.55195 11.094 9.41095 10.844C9.26995 10.594 9.39495 10.458 9.51795 10.334C9.62795 10.222 9.76095 10.044 9.88295 9.897C10.005 9.75 10.046 9.647 10.128 9.48C10.21 9.313 10.169 9.168 10.107 9.043C10.045 8.918 9.56895 7.829 9.36495 7.379C9.16895 6.947 8.96895 7.012 8.82295 7.007C8.68395 7.002 8.52695 7.002 8.36995 7.002C8.21295 7.002 7.95495 7.065 7.74195 7.293C7.52895 7.521 6.94495 8.068 6.94495 9.179C6.94495 10.29 7.76695 11.367 7.87895 11.515C7.99095 11.663 9.54595 14.137 11.984 15.099C12.702 15.377 13.262 15.547 13.705 15.672C14.424 15.881 15.082 15.842 15.594 15.765C16.161 15.68 17.34 15.205 17.567 14.672C17.794 14.139 17.794 13.682 17.733 13.574C17.672 13.466 17.38 13.369 17.132 13.444Z" fill="#25d366"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>WHATSAPP</div>
              <div style={{ fontSize: '0.9rem', color: '#25d366', fontWeight: 500 }}>+506 8360-6680</div>
            </div>
          </a>

          <a 
            href="https://wa.me/50689594947"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', padding: '0.4rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.15)'; e.currentTarget.style.transform = 'translateX(5px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.032 2.00195C6.586 2.00195 2.16895 6.40995 2.16895 11.855C2.16895 13.515 2.64095 15.083 3.47295 16.438L2.04195 21.002L6.69295 19.632C7.99795 20.372 9.48195 20.782 11.009 20.782H11.032C16.466 20.782 20.884 16.374 20.884 10.928C20.884 8.44395 19.871 6.13395 18.034 4.32195C16.198 2.50995 13.891 1.99895 12.032 2.00195ZM12.032 3.60195C13.531 3.60195 15.466 4.21795 16.922 5.64595C18.379 7.07395 19.229 8.92395 19.229 10.926C19.229 15.694 15.479 19.166 11.007 19.166C9.76795 19.166 8.56695 18.859 7.49695 18.288L6.94795 17.969L4.33795 18.694L5.10395 16.167L4.75195 15.594C4.11195 14.464 3.76295 13.183 3.76295 11.855C3.76295 7.08795 7.51495 3.60195 12.032 3.60195Z" fill="#25d366"/>
                <path d="M16.132 13.444C15.883 13.319 14.794 12.784 14.569 12.707C14.344 12.63 14.179 12.591 14.014 12.841C13.849 13.091 13.407 13.574 13.266 13.735C13.125 13.896 12.984 13.918 12.735 13.793C12.486 13.668 11.692 13.384 10.757 12.547C10.032 11.9 9.55195 11.094 9.41095 10.844C9.26995 10.594 9.39495 10.458 9.51795 10.334C9.62795 10.222 9.76095 10.044 9.88295 9.897C10.005 9.75 10.046 9.647 10.128 9.48C10.21 9.313 10.169 9.168 10.107 9.043C10.045 8.918 9.56895 7.829 9.36495 7.379C9.16895 6.947 8.96895 7.012 8.82295 7.007C8.68395 7.002 8.52695 7.002 8.36995 7.002C8.21295 7.002 7.95495 7.065 7.74195 7.293C7.52895 7.521 6.94495 8.068 6.94495 9.179C6.94495 10.29 7.76695 11.367 7.87895 11.515C7.99095 11.663 9.54595 14.137 11.984 15.099C12.702 15.377 13.262 15.547 13.705 15.672C14.424 15.881 15.082 15.842 15.594 15.765C16.161 15.68 17.34 15.205 17.567 14.672C17.794 14.139 17.794 13.682 17.733 13.574C17.672 13.466 17.38 13.369 17.132 13.444Z" fill="#25d366"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>WHATSAPP</div>
              <div style={{ fontSize: '0.9rem', color: '#25d366', fontWeight: 500 }}>+506 8959-4947</div>
            </div>
          </a>
          
          <a 
            href="mailto:camarofraterno@gmail.com"
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', padding: '0.4rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,0.15)'; e.currentTarget.style.transform = 'translateX(5px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(14,184,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#0eb8d0"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>CORREO</div>
              <div style={{ fontSize: '0.85rem', color: '#0eb8d0', fontWeight: 500 }}>camarofraterno@gmail.com</div>
            </div>
          </a>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.4rem', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(14,184,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>⏰</span>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>HORARIO</div>
              <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>Lunes a Sábado: 8am - 6pm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta del mapa */}
      <div style={{ 
        background: 'rgba(17, 24, 39, 0.5)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255, 255, 255, 0.12)', 
        borderRadius: '24px', 
        overflow: 'hidden',
      }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(14,184,208,0.15), rgba(26,111,212,0.05))', padding: '0.8rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.75rem', color: '#0eb8d0', letterSpacing: '0.08em', fontWeight: 600 }}>UBICACIÓN</p>
        </div>
        
        <div style={{ padding: '1rem' }}>
          <div className="map-container" style={{ marginBottom: '1rem' }}>
            <iframe
              src="https://www.google.com/maps?q=10.5218308,-85.2548387&z=16&output=embed"
              width="100%"
              height="280"
              style={{ border: 0, borderRadius: '16px' }}
              allowFullScreen
              loading="lazy"
              title="Google Maps - Ubicación en Bagaces, Guanacaste"
            />
          </div>
          
          <div className="map-links" style={{ marginTop: '0.5rem' }}>
            <a 
              href="https://maps.google.com/?q=10.5218308,-85.2548387" 
              target="_blank" 
              rel="noopener noreferrer"
              className="map-link"
              style={{ padding: '10px 20px', fontSize: '0.8rem' }}
            >
              Google Maps
            </a>
            <a 
              href="https://waze.com/ul?ll=10.5218308,-85.2548387&navigate=yes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="map-link"
              style={{ padding: '10px 20px', fontSize: '0.8rem' }}
            >
              Waze
            </a>
            <a 
              href="https://maps.apple.com/?q=10.5218308,-85.2548387" 
              target="_blank" 
              rel="noopener noreferrer"
              className="map-link"
              style={{ padding: '10px 20px', fontSize: '0.8rem' }}
            >
              Apple Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        
        
        <footer className="lc-footer">
          <div className="lc-footer-sub">Bagaces, Guanacaste, Costa Rica</div>
          <div className="lc-footer-links">
            <button onClick={() => navigate('/agendar')}>Agendar</button>
            <button onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>Servicios</button>
            <button onClick={() => navigate('/contacto')}>Contacto</button>
            <button onClick={() => navigate('/opiniones')}>Opiniones</button>
          </div>
          <div className="lc-footer-copy">© {new Date().getFullYear()} Autolavado Camaro Fraterno · Todos los derechos reservados</div>
        </footer>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          const heroSection = document.getElementById('hero-section');
          const parallaxBg = document.getElementById('hero-parallax-bg');
          
          if (heroSection && parallaxBg) {
            window.addEventListener('scroll', () => {
              const scrolled = window.scrollY;
              const rate = scrolled * 0.35;
              parallaxBg.style.transform = 'translateY(' + rate + 'px)';
            });
          }
        `
      }} />
    </>
  )
}