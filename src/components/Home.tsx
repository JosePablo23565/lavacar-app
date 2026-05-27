import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Home() {
  const navigate = useNavigate()
  const dropsRef = useRef<HTMLDivElement>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  const fetchTestimonials = async () => {
    try {
      console.log('🔍 Cargando testimonios desde Supabase...')
      
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) {
        console.error('❌ Error cargando testimonios:', error)
        setTestimonials([])
      } else if (data && data.length > 0) {
        console.log('✅ Testimonios cargados en Home:', data)
        setTestimonials(data)
      } else {
        console.log('⚠️ No hay testimonios aprobados en Supabase')
        setTestimonials([])
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      setTestimonials([])
    }
    setLoadingTestimonials(false)
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      console.log('🔄 Actualizando testimonios por evento')
      setLoadingTestimonials(true)
      fetchTestimonials()
    }
    
    window.addEventListener('opiniones-actualizadas', handleUpdate)
    return () => window.removeEventListener('opiniones-actualizadas', handleUpdate)
  }, [])

  useEffect(() => {
    // ESPUMA / BURBUJAS DE JABÓN
    if (dropsRef.current) {
      const pastelColors = [
        'rgba(255,255,255,0.9)', 'rgba(200,230,255,0.7)', 'rgba(200,255,220,0.6)',
        'rgba(255,220,200,0.5)', 'rgba(230,200,255,0.6)', 'rgba(255,200,230,0.5)'
      ]
      
      const highlightColors = [
        'rgba(255,255,255,1)', 'rgba(200,240,255,0.9)',
        'rgba(200,255,210,0.8)', 'rgba(255,235,200,0.7)'
      ]
      
      for (let i = 0; i < 50; i++) {
        const bubble = document.createElement('div')
        const size = Math.random() * 20 + 8
        const duration = Math.random() * 9 + 5
        const delay = Math.random() * 15
        const colorIndex = Math.floor(Math.random() * pastelColors.length)
        const highlightIndex = Math.floor(Math.random() * highlightColors.length)
        const rotateAngle = Math.random() * 360
        
        bubble.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at ${30 + Math.random() * 40}% ${30 + Math.random() * 40}%, ${highlightColors[highlightIndex]}, ${pastelColors[colorIndex]});
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          top: -${size}px;
          animation: bubbleRise ${duration}s linear ${delay}s infinite;
          opacity: ${Math.random() * 0.5 + 0.4};
          box-shadow: 0 0 ${Math.random() * 3 + 2}px rgba(255,255,255,0.6), inset 0 1px 2px rgba(255,255,255,0.5);
          pointer-events: none;
          transform: rotate(${rotateAngle}deg);
        `
        dropsRef.current.appendChild(bubble)
      }
      
      for (let i = 0; i < 25; i++) {
        const bigBubble = document.createElement('div')
        const size = Math.random() * 35 + 18
        const duration = Math.random() * 14 + 9
        const delay = Math.random() * 20
        const colorIndex = Math.floor(Math.random() * pastelColors.length)
        const highlightIndex = Math.floor(Math.random() * highlightColors.length)
        const rotateAngle = Math.random() * 360
        
        bigBubble.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at ${25 + Math.random() * 50}% ${25 + Math.random() * 50}%, ${highlightColors[highlightIndex]}, ${pastelColors[colorIndex]});
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          bottom: -${size}px;
          animation: bubbleRise ${duration}s linear ${delay}s infinite;
          opacity: ${Math.random() * 0.45 + 0.25};
          box-shadow: 0 0 ${Math.random() * 6 + 3}px rgba(255,255,255,0.5), inset 0 1px 3px rgba(255,255,255,0.6);
          pointer-events: none;
          transform: rotate(${rotateAngle}deg);
        `
        dropsRef.current.appendChild(bigBubble)
      }
      
      for (let i = 0; i < 15; i++) {
        const rainbowBubble = document.createElement('div')
        const size = Math.random() * 25 + 12
        const duration = Math.random() * 11 + 6
        const delay = Math.random() * 18
        
        rainbowBubble.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(200,220,255,0.6));
          width: ${size}px;
          height: ${size}px;
          left: ${Math.random() * 100}%;
          top: -${size}px;
          animation: bubbleRise ${duration}s linear ${delay}s infinite;
          opacity: ${Math.random() * 0.6 + 0.3};
          box-shadow: 0 0 5px rgba(255,255,255,0.7), inset 0 1px 3px rgba(255,255,255,0.8);
          pointer-events: none;
          filter: blur(0.3px);
        `
        dropsRef.current.appendChild(rainbowBubble)
      }
    }

    // Contadores
    const counters = [
      { id: 'counter-clientes', target: 500, suffix: '+' },
      { id: 'counter-servicios', target: 4, suffix: '' },
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

    // Scroll reveal
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

        .lc-root { font-family:'DM Sans',sans-serif; background:#0a0e1a; color:#fff; overflow-x:hidden; }
        .lc-root h1,.lc-root h2,.lc-root h3 { font-family:'Sora',sans-serif; }

        @keyframes bubbleRise {
          0% { transform: translateY(0) rotate(0deg) scale(0.9); opacity: 0.7; }
          25% { opacity: 1; transform: translateY(-25vh) rotate(90deg) scale(1.05); }
          50% { opacity: 0.8; transform: translateY(-50vh) rotate(180deg) scale(1); }
          75% { opacity: 0.6; transform: translateY(-75vh) rotate(270deg) scale(0.95); }
          100% { transform: translateY(-100vh) rotate(360deg) scale(0.9); opacity: 0; }
        }

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

        .lc-nav { position:fixed;top:0;left:0;right:0;z-index:100;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;transition:all .3s; }
        .lc-nav.scrolled { background:rgba(10,14,26,.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.07); }
        .lc-logo { font-family:'Sora',sans-serif;font-size:1.25rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:.5rem;cursor:pointer; }
        .lc-dot { width:9px;height:9px;border-radius:50%;background:#0eb8d0;animation:lcPulseDot 2s infinite; }
        .lc-nav-links { display:flex;gap:2rem;list-style:none; }
        .lc-nav-links a { color:rgba(255,255,255,.7);text-decoration:none;font-size:.88rem;letter-spacing:.02em;transition:color .2s; }
        .lc-nav-links a:hover { color:#fff; }
        .lc-nav-cta { background:#1a6fd4;color:#fff;padding:.5rem 1.2rem;border-radius:8px;font-size:.85rem;font-weight:500;cursor:pointer;border:none;transition:background .2s; }
        .lc-nav-cta:hover { background:#1558aa; }

        .lc-hero { min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden; }
        .lc-hero-bg { position:absolute;inset:0;background:linear-gradient(135deg,#0a0e1a 0%,#0f1e3a 50%,#0a1628 100%); }
        .lc-grid { position:absolute;inset:0;background-image:linear-gradient(rgba(26,111,212,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(26,111,212,.12) 1px,transparent 1px);background-size:60px 60px;animation:lcGridMove 20s linear infinite; }
        .lc-glow { position:absolute;top:20%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(14,184,208,.15) 0%,transparent 70%);animation:lcGlowPulse 4s ease-in-out infinite; }
        .lc-car-bg { position:absolute;bottom:0;right:-2%;font-size:300px;line-height:1;opacity:.1;animation:lcFloatCar 6s ease-in-out infinite;pointer-events:none; }
        .lc-hero-content { position:relative;z-index:2;text-align:center;padding:2rem;max-width:850px; }
        .lc-badge { display:inline-flex;align-items:center;gap:.5rem;background:rgba(14,184,208,.12);border:1px solid rgba(14,184,208,.3);color:#0eb8d0;padding:.4rem 1rem;border-radius:999px;font-size:.8rem;margin-bottom:1.5rem;animation:lcFadeUp .8s ease both; }
        .lc-hero h1 { font-size:clamp(2.5rem,6vw,4.5rem);font-weight:600;line-height:1.1;margin-bottom:1.2rem;animation:lcFadeUp .8s .15s ease both; }
        .lc-hero h1 span { color:#0eb8d0; }
        .lc-hero p { font-size:1.05rem;color:rgba(255,255,255,.6);margin-bottom:2rem;line-height:1.75;animation:lcFadeUp .8s .3s ease both; }
        .lc-hero-btns { display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;animation:lcFadeUp .8s .45s ease both; }
        .lc-btn-primary { background:#1a6fd4;color:#fff;padding:.85rem 2rem;border-radius:10px;font-weight:500;transition:all .25s;font-size:.95rem;cursor:pointer;border:none; }
        .lc-btn-primary:hover { background:#1558aa;transform:translateY(-2px); }
        .lc-btn-outline { border:1.5px solid rgba(255,255,255,.25);color:#fff;padding:.85rem 2rem;border-radius:10px;font-weight:500;transition:all .25s;font-size:.95rem;cursor:pointer;background:transparent; }
        .lc-btn-outline:hover { border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.05);transform:translateY(-2px); }
        .lc-scroll-ind { position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.5rem;animation:lcFadeUp 1s .8s ease both; }
        .lc-scroll-ind span { font-size:.7rem;color:rgba(255,255,255,.35);letter-spacing:.12em; }
        .lc-scroll-arrow { width:18px;height:18px;border-right:1.5px solid rgba(255,255,255,.3);border-bottom:1.5px solid rgba(255,255,255,.3);transform:rotate(45deg);animation:lcScrollBounce 2s ease-in-out infinite; }

        .lc-hours-card { background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:0.8rem 1.5rem;display:inline-flex;align-items:center;gap:1.5rem;flex-wrap:wrap;justify-content:center;margin-top:1.5rem;margin-bottom:1rem;animation:lcFadeUp .8s .4s ease both; }
        .lc-hours-item { display:flex;align-items:center;gap:0.5rem; }
        .lc-hours-icon { font-size:1.3rem; }
        .lc-hours-label { font-size:0.65rem;color:rgba(255,255,255,0.5);letter-spacing:1px; }
        .lc-hours-value { font-size:0.85rem;font-weight:600; }
        .lc-hours-divider { width:1px;height:25px;background:rgba(255,255,255,0.2); }

        .lc-stats { background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:2.5rem 4rem;display:flex;justify-content:center;gap:5rem;flex-wrap:wrap; }
        .lc-stat { text-align:center; }
        .lc-stat-num { font-family:'Sora',sans-serif;font-size:2rem;font-weight:600;color:#0eb8d0; }
        .lc-stat-label { font-size:.75rem;color:rgba(255,255,255,.4);margin-top:.25rem;letter-spacing:.06em; }

        .lc-section { padding:6rem 2rem;max-width:1100px;margin:0 auto; }
        .lc-tag { display:inline-block;background:rgba(14,184,208,.1);color:#0eb8d0;padding:.3rem .9rem;border-radius:6px;font-size:.75rem;margin-bottom:1rem;letter-spacing:.06em; }
        .lc-section-title { font-size:2.2rem;font-weight:600;margin-bottom:.8rem;line-height:1.2; }
        .lc-section-sub { color:rgba(255,255,255,.5);font-size:.95rem;line-height:1.75;max-width:520px; }

        /* ========== EFECTO BURBUJA SUAVE PARA TARJETAS DE SERVICIOS ========== */
        .lc-service-card {
          background: linear-gradient(135deg, #111827, #0f172a);
          border: 1px solid rgba(14, 184, 208, 0.15);
          border-radius: 20px;
          padding: 1.75rem;
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .lc-service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 20%, rgba(14, 184, 208, 0.08), transparent);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .lc-service-card:hover {
          border-color: rgba(14, 184, 208, 0.5);
          transform: translateY(-8px);
          box-shadow: 0 20px 35px -10px rgba(14, 184, 208, 0.25);
        }
        .lc-service-card:hover::before {
          opacity: 1;
        }
        .lc-service-card:hover .lc-svc-icon {
          transform: scale(1.1) rotate(3deg);
        }

        /* ========== EFECTO BURBUJA SUAVE PARA TARJETAS EXPLORA ========== */
        .lc-ql-card {
          background: linear-gradient(135deg, #111827, #0f172a);
          border: 1px solid rgba(14, 184, 208, 0.15);
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }
        .lc-ql-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 80%, rgba(14, 184, 208, 0.08), transparent);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .lc-ql-card:hover {
          border-color: rgba(14, 184, 208, 0.5);
          transform: translateY(-8px);
          box-shadow: 0 20px 35px -10px rgba(14, 184, 208, 0.25);
        }
        .lc-ql-card:hover::before {
          opacity: 1;
        }
        .lc-ql-card:hover .lc-ql-icon {
          transform: scale(1.1) rotate(3deg);
        }
        .lc-ql-card:hover .lc-ql-arrow {
          transform: translateX(8px);
          color: #0eb8d0;
        }

        .lc-service-card .lc-svc-icon {
          font-size: 2.2rem;
          margin-bottom: 1rem;
          transition: transform 0.3s ease;
        }
        .lc-svc-name { font-family:'Sora',sans-serif;font-size:1rem;font-weight:500;margin-bottom:.4rem; }
        .lc-svc-price { font-family:'Sora',sans-serif;font-size:1.5rem;font-weight:600;color:#0eb8d0;margin-bottom:.6rem; }
        .lc-svc-desc { font-size:.84rem;color:rgba(255,255,255,.5);line-height:1.6; }
        .lc-svc-time { display:inline-flex;align-items:center;gap:.3rem;margin-top:1rem;font-size:.74rem;color:rgba(255,255,255,.35);background:rgba(255,255,255,.05);padding:.3rem .75rem;border-radius:99px; }

        .lc-review {
          background:#111827;
          border:1px solid rgba(255,255,255,.07);
          border-radius:16px;
          padding:1.75rem;
          transition:all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          cursor:pointer;
        }
        .lc-review:hover {
          transform:translateY(-5px);
          border-color:rgba(14,184,208,.4);
          box-shadow:0 20px 35px -12px rgba(14,184,208,0.2);
        }

        .lc-services-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1.5rem;margin-top:3rem; }

        .lc-booking { background:linear-gradient(135deg,#0f1e3a,#111827);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:4rem;margin:4rem auto;max-width:1100px;position:relative;overflow:hidden; }
        .lc-booking-glow { position:absolute;top:-30%;right:-10%;width:400px;height:400px;background:radial-gradient(circle,rgba(14,184,208,.08) 0%,transparent 70%);pointer-events:none; }
        .lc-booking-grid { position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center; }
        .lc-steps { display:flex;flex-direction:column;gap:1.25rem;margin-top:2rem; }
        .lc-step { display:flex;align-items:flex-start;gap:1rem;transition:transform 0.3s ease; cursor:pointer; }
        .lc-step:hover { transform:translateX(5px); }
        .lc-step-num { width:32px;height:32px;border-radius:50%;background:#1a6fd4;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600;flex-shrink:0;font-family:'Sora',sans-serif;transition:all 0.3s ease; }
        .lc-step:hover .lc-step-num { transform:scale(1.1);background:#0eb8d0; }
        .lc-step-title { font-size:.9rem;font-weight:500;margin-bottom:.2rem; }
        .lc-step-desc { font-size:.8rem;color:rgba(255,255,255,.45);line-height:1.5; }
        .lc-booking-visual { background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem;text-align:center;transition:all 0.3s ease; }
        .lc-booking-visual:hover { transform:translateY(-5px);border-color:rgba(14,184,208,.3);box-shadow:0 15px 30px -10px rgba(0,0,0,0.3); }
        .lc-big-icon { font-size:5rem;display:block;margin-bottom:1rem;animation:lcFloatIcon 3s ease-in-out infinite; }

        .lc-ql-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;margin-top:3rem; }
        .lc-ql-icon { font-size:2rem;transition:transform 0.3s ease; }
        .lc-ql-title { font-family:'Sora',sans-serif;font-size:1rem;font-weight:500; }
        .lc-ql-desc { font-size:.82rem;color:rgba(255,255,255,.45);line-height:1.5; }
        .lc-ql-arrow { margin-top:auto;color:#0eb8d0;font-size:.82rem;transition:transform 0.3s ease; }

        .lc-reviews-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:3rem; }
        .lc-stars { color:#f59e0b;font-size:1rem;margin-bottom:1rem; }
        .lc-review-text { font-size:.88rem;color:rgba(255,255,255,.6);line-height:1.7;margin-bottom:1.25rem;font-style:italic; }
        .lc-reviewer { display:flex;align-items:center;gap:.75rem; }
        .lc-avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a6fd4,#0eb8d0);display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:600;transition:transform 0.3s ease; }
        .lc-review:hover .lc-avatar { transform:scale(1.1); }
        .lc-rev-name { font-size:.88rem;font-weight:500; }
        .lc-rev-date { font-size:.74rem;color:rgba(255,255,255,.35); }

        .lc-footer { background:#060a14;border-top:1px solid rgba(255,255,255,.06);padding:3rem 2rem;text-align:center; }
        .lc-footer-logo { font-family:'Sora',sans-serif;font-size:1.4rem;font-weight:600;margin-bottom:.4rem; }
        .lc-footer-sub { font-size:.82rem;color:rgba(255,255,255,.35);margin-bottom:2rem; }
        .lc-footer-links { display:flex;gap:2rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem; }
        .lc-footer-links button { background:none;border:none;color:rgba(255,255,255,.4);font-size:.84rem;cursor:pointer;transition:all 0.3s ease; }
        .lc-footer-links button:hover { color:#fff;transform:translateY(-2px); }
        .lc-footer-copy { font-size:.75rem;color:rgba(255,255,255,.18); }

        .lc-menu-bg { background:rgba(255,255,255,.02);border-top:1px solid rgba(255,255,255,.06);padding:6rem 2rem; }

        .lc-reveal { opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease; }
        .lc-reveal.lc-visible { opacity:1;transform:translateY(0); }

        @keyframes lcPulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        @keyframes lcGlowPulse { 0%,100%{opacity:.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.1)} }
        @keyframes lcGridMove { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes lcFloatCar { 0%,100%{transform:translateX(0) translateY(0)} 50%{transform:translateX(-10px) translateY(-15px)} }
        @keyframes lcFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lcScrollBounce { 0%,100%{transform:rotate(45deg) translateY(0)} 50%{transform:rotate(45deg) translateY(5px)} }
        @keyframes lcFloatIcon { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-10px) rotate(4deg)} }

        @media(max-width:768px) {
          .lc-nav-links,.lc-nav-cta{display:none;}
          .lc-hero h1{font-size:2.2rem;}
          .lc-stats{gap:2.5rem;padding:2rem 1.5rem;}
          .lc-booking-grid{grid-template-columns:1fr;}
          .lc-booking{padding:2.5rem 1.5rem;}
          .lc-section{padding:4rem 1.25rem;}
          .lc-hours-card{scale:0.9;}
        }
      `}</style>

      <div className="lc-root">
        <nav
          className="lc-nav"
          id="lc-navbar"
          ref={(el) => {
            if (!el) return
            const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 50)
            window.addEventListener('scroll', onScroll)
          }}
        >
          <div className="lc-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="lc-dot" />
            Autolavado Camaro Fraterno
          </div>
          <ul className="lc-nav-links">
            <li><a href="#servicios" onClick={(e) => { e.preventDefault(); document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' }) }}>Servicios</a></li>
            <li><a href="#nosotros" onClick={(e) => { e.preventDefault(); document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' }) }}>Nosotros</a></li>
            <li><a href="#opiniones" onClick={(e) => { e.preventDefault(); document.getElementById('opiniones')?.scrollIntoView({ behavior: 'smooth' }) }}>Opiniones</a></li>
            <li><a href="#contacto" onClick={(e) => { e.preventDefault(); document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }) }}>Contacto</a></li>
          </ul>
          <button 
            className="lc-nav-cta" 
            onClick={() => navigate('/agendar')}
            style={{ fontSize: '1.2rem', padding: '0.3rem 0.8rem', lineHeight: 1 }}
          >
            ☰
          </button>
        </nav>

        <section className="lc-hero">
          <div className="lc-hero-bg" />
          <div className="lc-grid" />
          <div className="lc-glow" />
          <div ref={dropsRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <span className="lc-car-bg">🚗💧</span>

          <div className="lc-hero-content" style={{ paddingBottom: '3rem' }}>
            <div className="lc-badge">
              <div className="lc-dot" style={{ width: 7, height: 7 }} />
              Bagaces, Guanacaste — Costa Rica
            </div>
            <h1>Tu auto <span>merece</span><br />el mejor cuidado</h1>
            <p>Lavado profesional, encerado y limpieza de tapizado.<br />Agendá tu cita en segundos.</p>
            
            <div className="lc-hours-card" style={{ marginBottom: '2rem' }}>
              <div className="lc-hours-item">
                <span className="lc-hours-icon">⏰</span>
                <div>
                  <div className="lc-hours-label">LUNES A SÁBADO</div>
                  <div className="lc-hours-value" style={{ color: '#0eb8d0' }}>8:00am - 6:00pm</div>
                </div>
              </div>
              <div className="lc-hours-divider" />
              <div className="lc-hours-item">
                <span className="lc-hours-icon">📍</span>
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

          <div className="lc-scroll-ind" style={{ bottom: '0.5rem' }}>
            <span>DESLIZAR</span>
            <div className="lc-scroll-arrow" />
          </div>
        </section>

        <div className="lc-stats">
          <div className="lc-stat">
            <div className="lc-stat-num" id="counter-clientes">0</div>
            <div className="lc-stat-label">CLIENTES FELICES</div>
          </div>
          <div className="lc-stat">
            <div className="lc-stat-num" id="counter-servicios">0</div>
            <div className="lc-stat-label">SERVICIOS DISPONIBLES</div>
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

        <section id="servicios">
          <div className="lc-section">
            <div className="lc-reveal">
              <span className="lc-tag">NUESTROS SERVICIOS</span>
              <h2 className="lc-section-title">Servicios diseñados<br />para tu vehículo</h2>
              <p className="lc-section-sub">Cada servicio está pensado para devolverle el brillo y la limpieza que tu auto merece.</p>
            </div>
            <div className="lc-services-grid">
              {[
                { icon: '🚿', name: 'Lavado Básico', value: 'basico', price: '$10', desc: 'Lavado exterior con agua a presión, shampoo especial y secado manual.', time: '30 min' },
                { icon: '✨', name: 'Lavado Completo', value: 'completo', price: '$20', desc: 'Interior y exterior. Aspirado, tablero, vidrios y limpieza de llantas.', time: '45 min' },
                { icon: '🌟', name: 'Encerado + Lavado', value: 'encerado', price: '$35', desc: 'Lavado completo más encerado profesional para proteger y dar brillo a la pintura.', time: '60 min' },
                { icon: '🧼', name: 'Limpieza de Tapizado', value: 'tapizado', price: '$25', desc: 'Limpieza profunda de asientos y alfombras con extractora profesional.', time: '40 min' },
              ].map((s) => (
                <div key={s.name} className="lc-service-card lc-reveal" onClick={() => navigate(`/agendar?servicio=${s.value}`)}>
                  <div className="lc-svc-icon">{s.icon}</div>
                  <div className="lc-svc-name">{s.name}</div>
                  <div className="lc-svc-price">{s.price}</div>
                  <div className="lc-svc-desc">{s.desc}</div>
                  <div className="lc-svc-time">⏱ {s.time}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="lc-booking">
          <div className="lc-booking-glow" />
          <div className="lc-booking-grid">
            <div className="lc-reveal">
              <span className="lc-tag">RESERVA EN LÍNEA</span>
              <h2 className="lc-section-title" style={{ fontSize: '1.9rem' }}>Agendá tu cita en<br />menos de 2 minutos</h2>
              <div className="lc-steps">
                <div className="lc-step">
                  <div className="lc-step-num">1</div>
                  <div><div className="lc-step-title">Seleccioná tu servicio</div><div className="lc-step-desc">Elegí entre nuestros 4 servicios según lo que necesita tu vehículo.</div></div>
                </div>
                <div className="lc-step">
                  <div className="lc-step-num">2</div>
                  <div><div className="lc-step-title">Elegí fecha y hora</div><div className="lc-step-desc">Ve los horarios disponibles en tiempo real y reservá el que más te convenga.</div></div>
                </div>
                <div className="lc-step">
                  <div className="lc-step-num">3</div>
                  <div><div className="lc-step-title">Confirmación instantánea</div><div className="lc-step-desc">Recibís confirmación inmediata y podés ver tus citas con tu número de teléfono.</div></div>
                </div>
              </div>
              <button className="lc-btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/agendar')}>Agendar mi cita ahora</button>
            </div>
            <div className="lc-booking-visual lc-reveal">
              <span className="lc-big-icon">🚗</span>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: '1.1rem', fontWeight: 500, marginBottom: '.5rem' }}>Rápido. Fácil. Confiable.</div>
              <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem' }}>Sin filas, sin esperas. Reservá desde donde estés.</div>
            </div>
          </div>
        </div>

        <section id="opiniones" style={{ padding: '6rem 2rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="lc-reveal">
              <span className="lc-tag">OPINIONES</span>
              <h2 className="lc-section-title">Lo que dicen nuestros clientes</h2>
            </div>
            <div className="lc-reviews-grid">
              {loadingTestimonials ? (
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem' }}>Cargando opiniones...</div>
              ) : testimonials.length === 0 ? (
                <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '2rem', color: 'rgba(255,255,255,.5)' }}>
                  No hay opiniones aún. ¡Sé el primero en opinar!
                </div>
              ) : (
                testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="lc-review">
                    <div className="lc-stars">{"★".repeat(testimonial.rating || 5)}</div>
                    <div className="lc-review-text">"{testimonial.comment}"</div>
                    <div className="lc-reviewer">
                      <div className="lc-avatar">{testimonial.customer_name?.charAt(0) || 'C'}</div>
                      <div>
                        <div className="lc-rev-name">{testimonial.customer_name || 'Cliente'}</div>
                        <div className="lc-rev-date">{new Date(testimonial.created_at).toLocaleDateString('es-CR')}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }} className="lc-reveal">
              <button className="lc-btn-outline" onClick={() => navigate('/opiniones')}>Ver todas las opiniones</button>
            </div>
          </div>
        </section>

        <section className="lc-menu-bg" id="nosotros">
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="lc-reveal">
              <span className="lc-tag">EXPLORA</span>
              <h2 className="lc-section-title">Todo lo que necesitás</h2>
              <p className="lc-section-sub">Accedé rápidamente a todas las secciones del sitio.</p>
            </div>
            <div className="lc-ql-grid">
              {[
                { icon: '📅', title: 'Agendar Cita', desc: 'Reservá tu espacio y elegí el servicio que necesitás.', arrow: 'Reservar ahora', action: '/agendar' },
                { icon: '📋', title: 'Mis Citas', desc: 'Consultá tus citas agendadas con tu número de teléfono.', arrow: 'Consultar citas', action: '/agendar?tab=history' },
                { icon: '📞', title: 'Contacto', desc: 'WhatsApp, teléfono o correo. Respondemos rápido.', arrow: 'Contactar', action: '/contacto' },
                { icon: '⭐', title: 'Opiniones', desc: 'Lo que dicen nuestros clientes sobre su experiencia.', arrow: 'Ver opiniones', action: '/opiniones' },
              ].map((ql) => (
                <div key={ql.title} className="lc-ql-card lc-reveal" onClick={() => navigate(ql.action)}>
                  <div className="lc-ql-icon">{ql.icon}</div>
                  <div className="lc-ql-title">{ql.title}</div>
                  <div className="lc-ql-desc">{ql.desc}</div>
                  <div className="lc-ql-arrow">→ {ql.arrow}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== SECCIÓN DE CONTACTO COMPLETA (CON MAPA Y TODO) ========== */}
        <section id="contacto" style={{ padding: '5rem 2rem', background: '#0a0e1a', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="lc-reveal" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span className="lc-tag">CONTACTO</span>
              <h2 className="lc-section-title" style={{ fontSize: '1.8rem' }}>Hablemos</h2>
              <p className="lc-section-sub" style={{ margin: '0 auto' }}>Estamos aquí para ayudarte</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(135deg,#0f1e3a,#0a0e1a)', padding: '0.8rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#0eb8d0', letterSpacing: '0.06em', fontWeight: 500 }}>INFORMACIÓN DE CONTACTO</p>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    {/* DIRECCIÓN */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,0.1)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                      onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Bagaces+Guanacaste+Costa+Rica', '_blank')}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,184,208,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.1rem' }}>📍</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em' }}>DIRECCIÓN</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>Bagaces, Guanacaste, Costa Rica</div>
                      </div>
                    </div>
                    
                    {/* WHATSAPP 1 */}
                    <a 
                      href="https://wa.me/50683606680"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', background: 'transparent', textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.1)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37,211,102,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.1rem' }}>📱</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em' }}>WHATSAPP</div>
                        <div style={{ fontSize: '0.85rem', color: '#25d366' }}>+506 8360-6680</div>
                      </div>
                    </a>

                    {/* WHATSAPP 2 */}
                    <a 
                      href="https://wa.me/50689594947"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', background: 'transparent', textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,211,102,0.1)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37,211,102,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.1rem' }}>📱</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em' }}>WHATSAPP</div>
                        <div style={{ fontSize: '0.85rem', color: '#25d366' }}>+506 8959-4947</div>
                      </div>
                    </a>
                    
                    {/* CORREO */}
                    <a 
                      href="mailto:lavacar@gmail.com"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', background: 'transparent', textDecoration: 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,0.1)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,184,208,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.1rem' }}>✉️</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em' }}>CORREO</div>
                        <div style={{ fontSize: '0.85rem', color: '#0eb8d0' }}>lavacar@gmail.com</div>
                      </div>
                    </a>
                    
                    {/* HORARIO */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem', borderRadius: '12px', transition: 'all 0.3s ease', background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,0.1)'; e.currentTarget.style.transform = 'translateX(5px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,184,208,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏰</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,.4)', letterSpacing: '0.04em' }}>HORARIO</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>Lunes a Sábado: 8am - 6pm</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAPA */}
                <div 
                  style={{ background: '#111827', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(14,184,208,0.4)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}
                >
                  <div style={{ background: 'linear-gradient(135deg,#0f1e3a,#0a0e1a)', padding: '0.8rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#0eb8d0', letterSpacing: '0.06em', fontWeight: 500 }}>UBICACIÓN</p>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15716.123456789!2d-85.2548091!3d10.5218901!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDMxJzE4LjgiTiA4NcKwMTUnMTcuMyJX!5e0!3m2!1ses!2scr!4v1234567890"
                      width="100%"
                      height="200"
                      style={{ border: 0, borderRadius: '12px' }}
                      allowFullScreen
                      loading="lazy"
                      title="Google Maps"
                    />
                    <button
                      onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Bagaces+Guanacaste+Costa+Rica', '_blank')}
                      style={{ width: '100%', marginTop: '0.75rem', background: 'rgba(14,184,208,.15)', color: '#0eb8d0', border: '1px solid rgba(14,184,208,.3)', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', transition: 'all .2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,.25)'; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(14,184,208,.15)'; e.currentTarget.style.color = '#0eb8d0' }}
                    >
                      🗺️ Abrir en Google Maps
                    </button>
                  </div>
                </div>
              </div>
              
              {/* CTA FINAL - BOTÓN PARA AGENDAR */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div 
                  style={{ 
                    background: 'linear-gradient(135deg, #111827, #0f172a)', 
                    border: '1px solid rgba(14,184,208,.2)', 
                    borderRadius: '20px', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px -10px rgba(14,184,208,.1)',
                    transition: 'transform 0.4s ease, box-shadow 0.4s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 45px -12px rgba(14,184,208,.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(14,184,208,.1)' }}
                >
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(14,184,208,.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                  
                  <div 
                    style={{ 
                      fontSize: '6rem', 
                      marginBottom: '1rem', 
                      display: 'inline-block',
                      animation: 'lcCarFloat 2s ease-in-out infinite, lcCarGlow 3s ease-in-out infinite',
                      filter: 'drop-shadow(0 10px 15px rgba(14,184,208,0.3))',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.animation = 'lcCarFloat 0.3s ease-in-out infinite, lcCarGlow 0.5s ease-in-out infinite'; e.currentTarget.style.transform = 'scale(1.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.animation = 'lcCarFloat 2s ease-in-out infinite, lcCarGlow 3s ease-in-out infinite'; e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    🚗
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} style={{ width: '20px', height: '2px', background: 'linear-gradient(90deg, #0eb8d0, transparent)', animation: `lcLineMove 1.5s ease-in-out infinite`, animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
                    ))}
                  </div>
                  
                  <h3 style={{ 
                    fontFamily: "'Sora',sans-serif", 
                    fontSize: '1.6rem', 
                    marginBottom: '0.75rem', 
                    color: '#fff',
                    background: 'linear-gradient(135deg, #fff, #0eb8d0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    ¿Listo para que tu auto brille?
                  </h3>
                  
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,.6)', marginBottom: '1.5rem', lineHeight: 1.5, maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Agendá tu cita ahora y disfrutá un vehículo impecable.
                  </p>
                  
                  <button 
                    style={{ 
                      background: 'linear-gradient(135deg, #1a6fd4, #0eb8d0)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      width: '100%', 
                      fontSize: '1rem', 
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(14,184,208,0.3)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(14,184,208,0.6)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(14,184,208,0.3)' }}
                    onClick={() => navigate('/agendar')}
                  >
                    📅 Agendar mi cita ahora
                  </button>
                  
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,.3)', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <span>✓ Sin tarjeta</span>
                    <span>✓ Sin registro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <footer className="lc-footer">
          <div className="lc-footer-logo">Autolavado y Servicios Camaro Fraterno</div>
          <div className="lc-footer-sub">Bagaces, Guanacaste, Costa Rica | 📞 8360-6680 | 8959-4947</div>
          <div className="lc-footer-links">
            <button onClick={() => navigate('/agendar')}>Agendar</button>
            <button onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>Servicios</button>
            <button onClick={() => navigate('/contacto')}>Contacto</button>
            <button onClick={() => navigate('/opiniones')}>Opiniones</button>
          </div>
          <div className="lc-footer-copy">© {new Date().getFullYear()} Autolavado Camaro Fraterno · Todos los derechos reservados</div>
        </footer>
      </div>
    </>
  )
}