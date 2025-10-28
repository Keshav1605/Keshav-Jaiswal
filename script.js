// 3D Avatar Setup
function init3DAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true 
  });

  // Set renderer size
  const size = 250;
  renderer.setSize(size, size);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0x00f5ff, 0.5);
  fillLight.position.set(-1, 0, -1);
  scene.add(fillLight);

  // Camera position
  camera.position.set(0, 0.5, 1.5);
  camera.lookAt(0, 0.3, 0);

  // Load GLB model
  const loader = new THREE.GLTFLoader();
  let model;
  let mixer;

  loader.load(
    'https://models.readyplayer.me/68ea0e8ff58581014aaa1600.glb',
    function (gltf) {
      model = gltf.scene;
      
      // Scale and position the model (upper body only)
      model.scale.set(1.2, 1.2, 1.2);
      model.position.set(0, -0.8, 0);
      
      scene.add(model);

      // Setup animation mixer if animations exist
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error('Error loading avatar:', error);
    }
  );

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationY = 0;
  let targetRotationX = 0;

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    targetRotationY = mouseX * 0.3;
    targetRotationX = mouseY * 0.1;
  });

  // Animation loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (model) {
      // Smooth rotation following mouse
      model.rotation.y += (targetRotationY - model.rotation.y) * 0.05;
      model.rotation.x += (targetRotationX - model.rotation.x) * 0.05;
      
      // Idle animation - subtle breathing
      model.position.y = -0.8 + Math.sin(Date.now() * 0.001) * 0.02;
    }

    if (mixer) {
      mixer.update(delta);
    }

    renderer.render(scene, camera);
  }

  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    const newSize = Math.min(250, window.innerWidth * 0.4);
    renderer.setSize(newSize, newSize);
  });
}

// Loading screen animation
function initLoadingScreen() {
  const loadingScreen = document.querySelector('.loading-screen');
  const progressFill = document.querySelector('.progress-fill');
  const progressPercentage = document.querySelector('.progress-percentage');
  const navbar = document.querySelector('.navbar');
  
  // Hide navbar during loading
  navbar.classList.add('hidden');
  
  let progress = 0;
  const duration = 2000; // 2 seconds total
  const interval = 30; // update every 30ms
  const steps = duration / interval;
  const increment = 100 / steps;
  
  const loadingInterval = setInterval(() => {
    progress += increment;
    const currentProgress = Math.min(progress, 100);
    
    progressFill.style.width = `${currentProgress}%`;
    progressPercentage.textContent = `${Math.round(currentProgress)}%`;
    
    if (currentProgress >= 100) {
      clearInterval(loadingInterval);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        // Show navbar after loading is complete
        navbar.classList.remove('hidden');
        // Enable scrolling after loading is complete
        document.body.style.overflow = 'auto';
      }, 300);
    }
  }, interval);
  
  // Prevent scrolling during loading
  document.body.style.overflow = 'hidden';
}


// WebGL Shader System
function initWebGLShaders() {
  const canvas = document.getElementById('shader-canvas');
  if (!canvas) return;
  
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;
  
  // Vertex shader source
  const vertexShaderSource = `
    attribute vec2 position;
    varying vec2 vUv;
    
    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
  
  // Fragment shader source - Techy animated pattern
  const fragmentShaderSource = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    
    void main() {
      vec2 uv = vUv;
      vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
      
      // Animated grid pattern
      vec2 grid = abs(fract(p * 10.0) - 0.5) / fwidth(p * 10.0);
      float line = min(grid.x, grid.y);
      line = 1.0 - min(line, 1.0);
      
      // Animated wave effect
      float wave = sin(p.x * 3.0 + uTime * 2.0) * 0.1 + sin(p.y * 2.0 + uTime * 1.5) * 0.1;
      
      // Color mixing
      vec3 color1 = vec3(0.0, 0.96, 1.0); // Cyan
      vec3 color2 = vec3(0.0, 1.0, 0.5);  // Green
      vec3 color3 = vec3(0.5, 0.0, 1.0);  // Purple
      
      vec3 finalColor = mix(color1, color2, sin(uTime + p.x + p.y) * 0.5 + 0.5);
      finalColor = mix(finalColor, color3, wave * 0.5 + 0.5);
      
      finalColor *= line * 0.3;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
  
  // Create shader function
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // Create program function
  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }
  
  // Create shaders and program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  
  // Set up geometry
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  
  // Get attribute and uniform locations
  const positionLocation = gl.getAttribLocation(program, 'position');
  const timeLocation = gl.getUniformLocation(program, 'uTime');
  const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Animation loop
  function animate() {
    gl.useProgram(program);
    
    // Set uniforms
    gl.uniform1f(timeLocation, performance.now() * 0.001);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    
    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    requestAnimationFrame(animate);
  }
  
  animate();
}


// Smooth scrolling and navigation
document.addEventListener("DOMContentLoaded", () => {
  // Initialize loading screen first
  initLoadingScreen();
  
  // Initialize sound effects
  initSoundEffects();
  
  // Initialize WebGL shaders
  initWebGLShaders();
  
  // Initialize 3D Avatar after loading screen
  setTimeout(() => {
    init3DAvatar();
  }, 2500);
  
  // Mobile menu toggle
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active")
    navMenu.classList.toggle("active")
  })

  // Close mobile menu when clicking on a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active")
      navMenu.classList.remove("active")
    })
  })

  // Active navigation highlighting
  const sections = document.querySelectorAll("section")
  const navLinks = document.querySelectorAll(".nav-link")

  function updateActiveNav() {
    let current = ""
    sections.forEach((section) => {
      const sectionTop = section.offsetTop
      const sectionHeight = section.clientHeight
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active")
      }
    })
  }

  window.addEventListener("scroll", updateActiveNav)
  

  // Parallax effect for hero section
  const hero = document.querySelector(".hero")
  const heroContent = document.querySelector(".hero-content")

  function parallaxEffect() {
    const scrolled = window.pageYOffset
    const rate = scrolled * -0.5

    if (heroContent) {
      heroContent.style.transform = `translateY(${rate}px)`
    }
  }

  window.addEventListener("scroll", parallaxEffect)

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animateElements = document.querySelectorAll(".skill-card, .project-card, .timeline-item")
  animateElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })

  // Typing effect for hero tagline
  const tagline = document.querySelector(".hero-tagline")
  const taglineText = tagline.textContent
  tagline.textContent = ""

  function typeWriter(text, element, speed = 100) {
    let i = 0
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        setTimeout(type, speed)
      }
    }
    type()
  }

  // Start typing effect after a delay
  setTimeout(() => {
    typeWriter(taglineText, tagline, 80)
  }, 1000)

  // Particle system enhancement
  function createParticle() {
    const particle = document.createElement("div")
    particle.style.position = "absolute"
    particle.style.width = Math.random() * 4 + 1 + "px"
    particle.style.height = particle.style.width
    particle.style.background = `hsl(${Math.random() * 60 + 180}, 100%, 50%)`
    particle.style.borderRadius = "50%"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.top = "100%"
    particle.style.opacity = Math.random() * 0.5 + 0.2
    particle.style.pointerEvents = "none"
    particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`

    document.querySelector(".particles").appendChild(particle)

    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle)
      }
    }, 20000)
  }

  // Create particles periodically
  setInterval(createParticle, 2000)

  // Smooth reveal animations for timeline
  const timelineItems = document.querySelectorAll(".timeline-item")
  timelineItems.forEach((item, index) => {
    item.style.opacity = "0"
    item.style.transform = index % 2 === 0 ? "translateX(-50px)" : "translateX(50px)"
    item.style.transition = "opacity 0.8s ease, transform 0.8s ease"
    observer.observe(item)
  })

  // Add glow effect to buttons on hover
  const buttons = document.querySelectorAll(".btn-primary, .btn-secondary, .contact-btn, .project-btn")
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.filter = "brightness(1.2)"
    })

    button.addEventListener("mouseleave", function () {
      this.style.filter = "brightness(1)"
    })
  })

  // Dynamic background color change based on scroll
  function updateBackgroundGradient() {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
    const hue = 180 + scrollPercent * 60 // Shift from cyan to purple
    document.querySelector(".gradient-overlay").style.background = `
            radial-gradient(circle at 20% 50%, hsla(${hue}, 100%, 50%, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsla(${hue + 60}, 100%, 50%, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, hsla(${hue + 120}, 100%, 50%, 0.1) 0%, transparent 50%)
        `
  }

  window.addEventListener("scroll", updateBackgroundGradient)

  // Contact form handling
  const contactForm = document.getElementById('contactForm')
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault()
      
      // Get form data
      const formData = new FormData(contactForm)
      const name = formData.get('name')
      const email = formData.get('email')
      const subject = formData.get('subject')
      const message = formData.get('message')
      
      // Create mailto link
      const mailtoLink = `mailto:keshavjais1605@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      )}`
      
      // Open email client
      window.location.href = mailtoLink
      
      // Show success message
      showNotification('Email client opened! Please send your message.', 'success')
      
      // Reset form
      contactForm.reset()
    })
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--gradient-primary);
      color: var(--text-light);
      padding: 1rem 2rem;
      border-radius: 10px;
      box-shadow: var(--shadow-glow);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `
    
    document.body.appendChild(notification)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  // Initialize
  updateActiveNav()

  // Skill bars setup - moved inside DOMContentLoaded
  const skillBars = document.querySelectorAll(".skill-progress")
  console.log('Found skill bars:', skillBars.length);

  function showSkillBars() {
    console.log('Showing skill bars...');
    skillBars.forEach((bar, index) => {
      const targetWidth = bar.getAttribute('data-width');
      console.log(`Bar ${index}: Setting width to ${targetWidth}`);
      bar.style.width = targetWidth;
    });
  }

  // Show skill bars immediately
  showSkillBars();

  // Debugging: Check progress bar width setting
  function debugSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach((bar, index) => {
      const targetWidth = bar.getAttribute('data-width');
      console.log(`Bar ${index} target width: ${targetWidth}, current width: ${bar.style.width}`);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    debugSkillBars();
  });
})

// Console message for developers
console.log(`
🚀 Welcome to Keshav Jaiswal's Portfolio!
💻 Built with vanilla HTML, CSS, and JavaScript
✨ Featuring modern animations and responsive design
🎨 Dark theme with neon glow effects

Feel free to explore the code and get in touch!
`)
