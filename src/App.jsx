import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function LeafMark({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        d="M26.5 5.5C15.8 5.7 7.2 9.1 6 17c-.8 5.1 3 8.6 7.2 7.8C21 23.5 25 14.7 26.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5 28c4.1-7.1 9.2-12.2 16.1-17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ProductScene() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 50);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const product = new THREE.Group();
    scene.add(product);

    const texture = new THREE.TextureLoader().load(
      "/flaxglow-bottle.png",
      () => invalidate(),
      undefined,
      (error) => console.error("Failed to load the FlaxGlow bottle image.", error),
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    const bottle = new THREE.Mesh(
      new THREE.PlaneGeometry(2.95, 4.7),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.02,
        toneMapped: false,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    product.add(bottle);

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(1.95, 64),
      new THREE.MeshBasicMaterial({
        color: 0xc4a65e,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
      }),
    );
    halo.position.z = -0.1;
    halo.scale.set(1, 1.45, 1);
    product.add(halo);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({
        color: 0x453525,
        transparent: true,
        opacity: 0.15,
        depthWrite: false,
      }),
    );
    shadow.position.set(0.06, -2.42, 0.15);
    shadow.scale.set(0.88, 0.13, 1);
    product.add(shadow);

    const viewport = { width: 0, height: 0, smallScreen: false };
    const motion = { rotationY: 0.02, rotationZ: 0 };
    let frameId = 0;
    const render = () => {
      frameId = 0;
      product.rotation.y = motion.rotationY;
      product.rotation.z = motion.rotationZ;
      renderer.render(scene, camera);
    };
    const invalidate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(render);
    };
    const resize = () => {
      const { innerWidth, innerHeight } = window;
      const aspect = innerWidth / innerHeight;
      viewport.width = 7.1 * aspect;
      viewport.height = 7.1;
      camera.left = -viewport.width / 2;
      camera.right = viewport.width / 2;
      camera.top = viewport.height / 2;
      camera.bottom = -viewport.height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false);

      viewport.smallScreen = innerWidth < 700;
      product.scale.setScalar(viewport.smallScreen ? 0.84 : 1.08);
      product.position.x = viewport.width * (viewport.smallScreen ? 0.1 : 0.22);
      product.position.y = viewport.smallScreen ? -1.45 : -0.12;
      invalidate();
    };
    resize();
    window.addEventListener("resize", resize);

    const scrollAnimations = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? null
      : gsap.context(() => {
          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            onUpdate: invalidate,
            scrollTrigger: {
              trigger: document.querySelector("main"),
              start: "top top",
              end: "bottom bottom",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
          const stages = [
            { id: "origin", desktopX: 0.28, mobileX: -0.12, mobileY: -1.65, rotationY: -0.08, rotationZ: 0.04 },
            { id: "ritual", desktopX: -0.28, mobileX: 0.12, mobileY: -1.75, rotationY: 0.08, rotationZ: -0.06 },
            { id: "details", desktopX: 0.28, mobileX: 0.25, mobileY: -1.65, rotationY: -0.08, rotationZ: 0.04 },
            { id: "shop", desktopX: 0.22, mobileX: 0.08, mobileY: -1.5, rotationY: 0.02, rotationZ: 0 },
          ];

          stages.forEach(({ id, desktopX, mobileX, mobileY, rotationY, rotationZ }) => {
            const section = document.getElementById(id);
            if (!section) return;

            timeline.to(product.position, {
              x: () => viewport.width * (viewport.smallScreen ? mobileX : desktopX),
              y: () => (viewport.smallScreen ? mobileY : -0.12),
              duration: 1,
              onUpdate: invalidate,
            });
            timeline.to(
              motion,
              {
                rotationY,
                rotationZ,
                duration: 1,
                onUpdate: invalidate,
              },
              "<",
            );
            timeline.addLabel(id);
          });
        }, canvas);

    invalidate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      scrollAnimations?.revert();
      bottle.geometry.dispose();
      bottle.material.dispose();
      texture.dispose();
      halo.geometry.dispose();
      halo.material.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas aria-label="3D view of the FlaxGlow prototype bottle" className="product-canvas" ref={canvasRef} />;
}

const featureItems = [
  { number: "01", title: "A simple starting point", body: "A student exploration built around flaxseed extract and water." },
  { number: "02", title: "Made to dispense", body: "A practical pump bottle makes the prototype easy to present and handle." },
  { number: "03", title: "A work in progress", body: "A concept to learn from—not a tested or validated hair-care product." },
];

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const addToCart = () => {
    setCartCount((count) => count + 1);
    setCartOpen(true);
    setNotice("Added one FlaxGlow bottle to your cart.");
  };

  const updateCartCount = (change) => {
    setCartCount((count) => Math.max(0, count + change));
  };

  const handleBuy = () => {
    setCartCount((count) => count + 1);
    setCartOpen(true);
    setNotice("Demo checkout only — payment and delivery are not connected.");
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!cartOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [cartOpen]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const intro = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 24,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        delay: 0.15,
      });
      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.from(element, {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
            once: true,
          },
        });
      });
    });

    return () => intro.revert();
  }, []);

  return (
    <>
      <ProductScene />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="FlaxGlow home">
          <LeafMark className="brand-mark" />
          <span>flax<span className="brand-light">glow</span></span>
        </a>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#origin">Our idea</a>
          <a href="#ritual">The formula</a>
          <a href="#details">Prototype notes</a>
        </nav>
        <a className="header-cta" href="#shop">Shop · ₹69 <span aria-hidden="true">↗</span></a>
        <button
          aria-label={`Open cart, ${cartCount} items`}
          className="cart-toggle"
          onClick={() => setCartOpen(true)}
          type="button"
        >
          Cart <span className="cart-count">{cartCount}</span>
        </button>
        <button
          aria-label={`Open cart, ${cartCount} items`}
          className="mobile-shop-link"
          onClick={() => setCartOpen(true)}
          type="button"
        >
          Cart <span className="cart-count">{cartCount}</span>
        </button>
      </header>

      <main>
        <section className="hero section-shell" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A botanical hair-care study</p>
            <h1>A little nature,<br />a lot of <em>intention.</em></h1>
            <p className="hero-description">
              Meet FlaxGlow: a student-made hair-care prototype exploring the humble potential of flaxseed.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#origin">Explore the story <span aria-hidden="true">↓</span></a>
              <span className="prototype-tag"><span className="tag-dot" /> Experimental prototype</span>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            <span>01 / 04</span>
            <span className="index-line" />
            <span>Scroll to explore</span>
          </div>
          <div className="hero-caption">Flaxseed extract + water<br />A student project</div>
          <span className="hero-orbit orbit-one" aria-hidden="true" />
          <span className="hero-orbit orbit-two" aria-hidden="true" />
        </section>

        <div className="ticker" aria-label="Experimental formulation, flaxseed extract and water, student prototype">
          <div className="ticker-track">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index}>A SMALL-BATCH IDEA <i>✳</i> FLAXSEED + WATER <i>✳</i> STUDENT PROTOTYPE <i>✳</i></span>
            ))}
          </div>
        </div>

        <section className="origin section-shell" id="origin">
          <div className="section-label reveal"><span>01</span> THE SEED OF AN IDEA</div>
          <div className="origin-content reveal">
            <p className="eyebrow">Rooted in curiosity</p>
            <h2>Inspired by one<br />very <em>small seed.</em></h2>
            <p className="body-copy">
              Flaxseed has a long history in kitchens and gardens. FlaxGlow takes that familiar botanical and turns it into a simple student project—an invitation to explore, observe, and ask better questions.
            </p>
            <a className="text-link" href="#ritual">Get to know the formula <span aria-hidden="true">↗</span></a>
          </div>
          <div className="origin-stamp" aria-hidden="true">
            <LeafMark />
            <span>Curiosity<br />in every drop</span>
          </div>
          <div className="section-footnote">A concept developed for demonstration</div>
        </section>

        <section className="ritual section-shell" id="ritual">
          <div className="section-label reveal"><span>02</span> SIMPLE BY DESIGN</div>
          <div className="ritual-content reveal">
            <p className="eyebrow">Nothing extra, for now</p>
            <h2>Two ingredients.<br /><em>One experiment.</em></h2>
            <p className="body-copy">
              This batch keeps the idea intentionally straightforward. No added aloe vera, no fragrance, and no claims beyond what this prototype is.
            </p>
            <div className="ingredient-pair">
              <div className="ingredient">
                <span className="ingredient-number">01</span>
                <span className="ingredient-icon seed-icon" aria-hidden="true">✳</span>
                <strong>Flaxseed extract</strong>
                <span>The botanical focus</span>
              </div>
              <span className="ingredient-plus" aria-hidden="true">+</span>
              <div className="ingredient">
                <span className="ingredient-number">02</span>
                <span className="ingredient-icon water-icon" aria-hidden="true">◌</span>
                <strong>Water</strong>
                <span>The simple base</span>
              </div>
            </div>
          </div>
          <div className="ritual-side-note">A formulation in progress<br /><span>Not a finished cosmetic</span></div>
        </section>

        <section className="details section-shell" id="details">
          <div className="section-label reveal"><span>03</span> THE PROTOTYPE, UP CLOSE</div>
          <div className="details-heading reveal">
            <p className="eyebrow">A thoughtful first draft</p>
            <h2>Made to explore.<br /><em>Not to overpromise.</em></h2>
          </div>
          <div className="feature-list">
            {featureItems.map((item) => (
              <article className="feature-row reveal" key={item.number}>
                <span className="feature-number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="feature-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
          <aside className="safety-note reveal">
            <span className="note-icon" aria-hidden="true">i</span>
            <p><strong>A note on testing</strong><br />Effectiveness, scalp safety, and shelf life have not been validated. This page demonstrates a listed price only; it is not a live sale or recommendation for personal use.</p>
          </aside>
        </section>

        <section className="shop section-shell" id="shop">
          <div className="shop-card reveal">
            <div className="shop-card-top">
              <span className="shop-kicker"><span className="tag-dot" /> STUDENT PROJECT · PROTOTYPE</span>
              <span className="shop-leaf"><LeafMark /></span>
            </div>
            <p className="eyebrow">A student-made prototype</p>
              <h2>FlaxGlow,<br /><em>₹69 per bottle.</em></h2>
              <p className="shop-description">A flaxseed hair-care prototype, listed at ₹69 per bottle. This demo cart does not place a real order or arrange delivery.</p>
            <div className="shop-price">
                <span>Prototype price</span>
                <strong>₹69 <small>/ bottle</small></strong>
            </div>
              <div className="shop-actions">
                <button className="button button-outline" onClick={addToCart} type="button">
                  Add to Cart <span aria-hidden="true">+</span>
                </button>
                <button className="button button-gold buy-button" onClick={handleBuy} type="button">
                  Buy Now <span aria-hidden="true">↗</span>
                </button>
              </div>
              <p className="shop-disclaimer">Demo only · Checkout, payment, and delivery are not connected</p>
          </div>
          <div className="shop-caption">
            <span>FLAXGLOW / STUDY Nº 01</span>
            <span>Made with curiosity, not claims.</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home"><LeafMark className="brand-mark" /><span>flax<span className="brand-light">glow</span></span></a>
        <span>A student prototype, shared with care.</span>
        <a href="#home">Back to top ↑</a>
      </footer>

      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            aria-label="Shopping cart"
            aria-modal="true"
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="cart-panel-header">
              <div>
                <p className="eyebrow">Your selection</p>
                <h2>Your cart <span>({cartCount})</span></h2>
              </div>
              <button aria-label="Close cart" className="cart-close" onClick={() => setCartOpen(false)} type="button">×</button>
            </div>
            {cartCount > 0 ? (
              <>
                <div className="cart-item">
                  <img alt="" src="/flaxglow-bottle.png" />
                  <div className="cart-item-info">
                    <strong>FlaxGlow prototype</strong>
                    <span>₹69 · per bottle</span>
                    <div aria-label="Quantity" className="quantity-control">
                      <button aria-label="Remove one bottle" onClick={() => updateCartCount(-1)} type="button">−</button>
                      <span>{cartCount}</span>
                      <button aria-label="Add one bottle" onClick={() => updateCartCount(1)} type="button">+</button>
                    </div>
                  </div>
                  <strong className="cart-item-total">₹{cartCount * 69}</strong>
                </div>
                <div className="cart-total"><span>Subtotal</span><strong>₹{cartCount * 69}</strong></div>
                <button className="button button-dark cart-checkout" onClick={() => setNotice("Demo checkout only — payment and delivery are not connected.")} type="button">
                  Continue to Buy <span aria-hidden="true">↗</span>
                </button>
                <p className="cart-disclaimer">Demo cart only. No payment, order, or delivery will be processed.</p>
              </>
            ) : (
              <div className="cart-empty">
                <LeafMark />
                <p>Your cart is waiting for a little curiosity.</p>
                <button className="button button-dark" onClick={() => setCartOpen(false)} type="button">Continue exploring</button>
              </div>
            )}
          </aside>
        </div>
      )}
      <div aria-live="polite" className={`toast ${notice ? "toast-visible" : ""}`} role="status">
        {notice}
      </div>
    </>
  );
}

export default App;
