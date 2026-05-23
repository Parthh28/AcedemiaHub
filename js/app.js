// CampusNotes Marketplace - Shared Application Logic & State Management

// Initialize Data Catalogs in localStorage if they don't exist
const DEFAULT_NOTES = [
  {
    id: "ds_algo_marcus",
    title: "Data Structures & Algorithms",
    description: "Meticulously organized study notes on binary trees, graph algorithms, hash tables, and sorting mechanisms. Contains hand-drawn diagrams and step-by-step runtime complexities.",
    price: 746.17,
    seller: "Marcus Thorne",
    sellerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 124,
    category: "Computer Science",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    pages: 42,
    university: "Stanford University",
    course: "CS 106B",
    year: "Junior",
    uploadedDate: "2026-04-12"
  },
  {
    id: "adv_calc_sarah",
    title: "Advanced Calculus III Proofs",
    description: "Detailed handwritten calculus notes showing intricate double/triple integration techniques, Stokes' theorem proofs, and green's theorem exercises. Color-coded steps.",
    price: 456.50,
    seller: "Sarah Jenkins",
    sellerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviewsCount: 89,
    category: "Mathematics",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    pages: 28,
    university: "MIT",
    course: "18.02 Multivariable Calculus",
    year: "Sophomore",
    uploadedDate: "2026-05-01"
  },
  {
    id: "thermo_kevin",
    title: "Thermodynamics Core Concepts",
    description: "Comprehensive engineering diagrams and equations covering the first and second laws, Carnot cycles, heat engine efficiencies, and entropy formulations.",
    price: 996.00,
    seller: "Kevin Zhang",
    sellerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 210,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80",
    pages: 56,
    university: "UC Berkeley",
    course: "ME 40 Thermodynamics",
    year: "Senior",
    uploadedDate: "2026-03-20"
  },
  {
    id: "cog_psych_elena",
    title: "Cognitive Psychology Midterm Prep",
    description: "Study guide summarizing working memory models, selective attention theories, neuroimaging methods, and cognitive biases. Perfect for quick exam revision.",
    price: 414.17,
    seller: "Elena Rossi",
    sellerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviewsCount: 42,
    category: "Psychology",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
    pages: 15,
    university: "NYU",
    course: "PSYCH 22 Cognitive Psych",
    year: "Sophomore",
    uploadedDate: "2026-05-15"
  },
  {
    id: "mol_bio_david",
    title: "Molecular Biology Full Semester",
    description: "Full semester lectures compiled with diagrams of DNA replication, transcription, translation, and PCR techniques. Clean digitised layouts.",
    price: 1245.00,
    seller: "David Miller",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 67,
    category: "Biology",
    image: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&auto=format&fit=crop&q=80",
    pages: 84,
    university: "Harvard University",
    course: "MCB 52 Molecular Bio",
    year: "Senior",
    uploadedDate: "2026-02-10"
  },
  {
    id: "net_sec_sasha",
    title: "Network Security Fundamentals",
    description: "Digital notes outlining cryptography basics (symmetric vs asymmetric keys), firewall setups, threat models, and safe transport layers.",
    price: 663.17,
    seller: "Sasha Vane",
    sellerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 18,
    category: "Cybersecurity",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80",
    pages: 22,
    university: "Georgia Tech",
    course: "CS 3251 Computer Networks",
    year: "Junior",
    uploadedDate: "2026-05-09"
  },
  {
    id: "cs101_marcus",
    title: "CS101 - Intro to Computer Science",
    description: "Introductory notes covering basic python concepts, loops, lists, dictionary maps, and simple recursions. Best for programming beginners.",
    price: 497.17,
    seller: "Marcus Thorne",
    sellerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 312,
    category: "Computer Science",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=80",
    pages: 35,
    university: "Stanford University",
    course: "CS 106A Python",
    year: "Freshman",
    uploadedDate: "2026-01-15"
  },
  {
    id: "discrete_math_priya",
    title: "Discrete Mathematics Study Guide",
    description: "Comprehensive study guide covering graph theory, set theory, propositional logic, and combinatorics. Includes solved exam papers.",
    price: 180.00,
    seller: "Priya Sharma",
    sellerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviewsCount: 14,
    category: "Mathematics",
    image: "https://images.unsplash.com/photo-1453733190148-c44698c265f8?w=600&auto=format&fit=crop&q=80",
    pages: 50,
    university: "IIT Bombay",
    course: "MA 106 Discrete Mathematics",
    year: "Sophomore",
    uploadedDate: "2026-05-18"
  },
  {
    id: "compiler_design_rahul",
    title: "Compiler Design Complete Lecture Notes",
    description: "Handwritten and typed notes detailing lexical analysis, parsing, semantic analysis, syntax-directed translation, and code generation.",
    price: 299.00,
    seller: "Rahul Verma",
    sellerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 22,
    category: "Computer Science",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    pages: 75,
    university: "IIT Bombay",
    course: "CS 302 Compiler Design",
    year: "Junior",
    uploadedDate: "2026-05-10"
  },
  {
    id: "signals_systems_arjun",
    title: "Signals and Systems Exam Prep",
    description: "Exam preparation guide with step-by-step solutions for Fourier transform, Laplace transform, z-transform, and system response calculations.",
    price: 220.00,
    seller: "Arjun Singh",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviewsCount: 19,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    pages: 60,
    university: "IIT Bombay",
    course: "EE 210 Signals and Systems",
    year: "Sophomore",
    uploadedDate: "2026-05-12"
  },
  {
    id: "chemical_reaction_arjun",
    title: "Chemical Reaction Engineering",
    description: "Core concepts of chemical reaction engineering, covering reactor design, kinetics, multiple reactions, and temperature/pressure effects.",
    price: 260.00,
    seller: "Arjun Singh",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviewsCount: 12,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80",
    pages: 85,
    university: "IIT Bombay",
    course: "CL 301 Chemical Reaction Eng",
    year: "Junior",
    uploadedDate: "2026-05-15"
  },
  {
    id: "structural_analysis_arjun",
    title: "Structural Analysis & Mechanics",
    description: "Detailing shear force and bending moment diagrams, deflection of beams, truss analysis, and column buckling theories.",
    price: 199.00,
    seller: "Arjun Singh",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviewsCount: 8,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80",
    pages: 70,
    university: "IIT Bombay",
    course: "CE 204 Structural Mechanics",
    year: "Junior",
    uploadedDate: "2026-05-16"
  },
  {
    id: "aerodynamics_arjun",
    title: "Introduction to Aerodynamics",
    description: "Covers fluid dynamics equations, potential flow, airfoil theory, boundary layer theory, and high-speed aerodynamics principles.",
    price: 320.00,
    seller: "Arjun Singh",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 15,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=80",
    pages: 95,
    university: "IIT Bombay",
    course: "AE 201 Aerodynamics",
    year: "Junior",
    uploadedDate: "2026-05-17"
  },
  {
    id: "classical_mechanics_priya",
    title: "Classical Mechanics & Relativity",
    description: "Lagrangian and Hamiltonian formulations, central force motion, rigid body dynamics, and special relativity concepts.",
    price: 150.00,
    seller: "Priya Sharma",
    sellerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviewsCount: 25,
    category: "Physics",
    image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80",
    pages: 55,
    university: "IIT Bombay",
    course: "PH 108 Classical Mechanics",
    year: "Freshman",
    uploadedDate: "2026-05-14"
  },
  {
    id: "fluid_mechanics_arjun",
    title: "Fluid Mechanics & Machinery Study Material",
    description: "Covers fluid properties, pressure measurements, flow through pipes, boundary layers, and operation of centrifugal pumps and turbines.",
    price: 280.00,
    seller: "Arjun Singh",
    sellerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviewsCount: 18,
    category: "Engineering",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    pages: 80,
    university: "IIT Bombay",
    course: "ME 202 Fluid Mechanics",
    year: "Sophomore",
    uploadedDate: "2026-05-13"
  }
];

// express API Configuration
const API_BASE_URL = 'https://academiahub-backend-k2cq.onrender.com/api/v1';

async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  options.headers = options.headers || {};
  const token = localStorage.getItem('accessToken');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  try {
    let res = await fetch(url, options);
    
    if (res.status === 401 && localStorage.getItem('refreshToken')) {
      console.log('🔄 Access token expired. Refreshing...');
      const refreshed = await refreshTokens();
      if (refreshed) {
        options.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
        res = await fetch(url, options);
      }
    }
    
    const json = await res.json();
    if (!res.ok) {
      throw { status: res.status, ...json };
    }
    return json;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
}

async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (res.ok) {
      const json = await res.json();
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      return true;
    } else {
      console.warn('❌ Refresh token invalid. Logging out.');
      logoutUser();
      return false;
    }
  } catch (err) {
    console.error('Refresh token failed:', err);
    return false;
  }
}

function logoutUser() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('current_user');
  localStorage.removeItem('shopping_cart');
  window.location.href = 'login.html';
}

// Protected route checks
const PROTECTED_PAGES = ['buyer-dashboard.html', 'seller-dashboard.html', 'admin-dashboard.html', 'upload.html', 'settings.html', 'checkout.html'];
const pagePath = window.location.pathname.split('/').pop() || 'index.html';

if (PROTECTED_PAGES.includes(pagePath) && !localStorage.getItem('accessToken')) {
  window.location.href = 'login.html';
}

// Pre-fill catalogs if not present
if (!localStorage.getItem('notes_catalog')) {
  localStorage.setItem('notes_catalog', JSON.stringify(DEFAULT_NOTES));
}

// CART FUNCTIONS
function getCart() {
  return JSON.parse(localStorage.getItem('shopping_cart')) || [];
}

function getPurchasedNotes() {
  return JSON.parse(localStorage.getItem('purchased_notes')) || [];
}

async function syncPurchasesWithBackend() {
  if (!localStorage.getItem('accessToken')) return;
  try {
    const json = await apiFetch('/purchases?limit=100');
    const purchasedIds = (json.data.purchases || []).map(p => p.notes?.id).filter(Boolean);
    localStorage.setItem('purchased_notes', JSON.stringify(purchasedIds));
    window.dispatchEvent(new CustomEvent('purchasesUpdated'));
  } catch (err) {
    console.error('Failed to sync purchases with backend:', err);
  }
}

async function syncCartWithBackend() {
  if (!localStorage.getItem('accessToken')) return;
  try {
    const json = await apiFetch('/cart');
    const backendCart = (json.data.items || []).map(item => {
      const note = item.notes || {};
      return {
        id: note.id,
        title: note.title,
        price: note.price || 0,
        image: note.preview_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
        university: "IIT Bombay",
        seller: note.seller ? `${note.seller.first_name || ''} ${note.seller.last_name || ''}`.trim() : 'Contributor',
        cartItemId: item.id
      };
    });
    localStorage.setItem('shopping_cart', JSON.stringify(backendCart));
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (err) {
    console.error('Failed to sync cart with backend:', err);
  }
}

async function addToCart(noteId) {
  if (!localStorage.getItem('accessToken')) {
    showNotification("Please log in to add notes to cart!", "error");
    setTimeout(() => { window.location.href = "login.html"; }, 1000);
    return;
  }
  
  showNotification("Adding item to cart...", "info");
  try {
    await apiFetch('/cart/add', {
      method: 'POST',
      body: { notesId: noteId }
    });
    await syncCartWithBackend();
    showNotification("Added to cart!", "success");
  } catch (err) {
    showNotification(err.error?.message || "Failed to add to cart.", "error");
  }
}

async function removeFromCart(noteId) {
  if (!localStorage.getItem('accessToken')) return;
  
  const cart = getCart();
  const item = cart.find(item => item.id === noteId);
  if (!item) return;
  
  showNotification("Removing item from cart...", "info");
  try {
    if (item.cartItemId) {
      await apiFetch(`/cart/${item.cartItemId}`, { method: 'DELETE' });
    }
    await syncCartWithBackend();
    showNotification("Removed from cart!", "success");
  } catch (err) {
    showNotification(err.error?.message || "Failed to remove from cart.", "error");
  }
}

async function clearCart() {
  const cart = getCart();
  localStorage.setItem('shopping_cart', JSON.stringify([]));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated'));

  if (localStorage.getItem('accessToken')) {
    for (const item of cart) {
      if (item.cartItemId) {
        try {
          await apiFetch(`/cart/${item.cartItemId}`, { method: 'DELETE' });
        } catch (err) { console.error('Error clearing item:', err); }
      }
    }
    await syncCartWithBackend();
  }
}


function updateCartBadge() {
  const cart = getCart();
  const cartButtons = document.querySelectorAll('button.material-symbols-outlined, a.material-symbols-outlined');
  
  cartButtons.forEach(btn => {
    if (btn.textContent.trim() === 'shopping_cart' || btn.querySelector('[data-icon="shopping_cart"]') || btn.classList.contains('cart-icon')) {
      // Find or create badge
      let badge = btn.querySelector('.cart-badge');
      if (!badge) {
        btn.classList.add('relative');
        badge = document.createElement('span');
        badge.className = 'cart-badge absolute -top-1 -right-1 w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center';
        btn.appendChild(badge);
      }
      if (cart.length > 0) {
        badge.textContent = cart.length;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });
}

// TOAST NOTIFICATIONS
function showNotification(message, type = "success") {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(container);
  }

  const notification = document.createElement('div');
  notification.className = `p-4 rounded-xl shadow-2xl glass-card transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-auto flex items-center gap-3 border border-outline-variant/30 max-w-sm`;
  
  let icon = "check_circle";
  let iconColor = "text-primary";
  if (type === "error") {
    icon = "error";
    iconColor = "text-error";
  } else if (type === "info") {
    icon = "info";
    iconColor = "text-secondary-container";
  }

  notification.innerHTML = `
    <span class="material-symbols-outlined ${iconColor}">${icon}</span>
    <p class="font-body-md text-on-surface text-sm font-medium">${message}</p>
  `;

  container.appendChild(notification);

  // Trigger entrance animation
  setTimeout(() => {
    notification.classList.remove('translate-y-10', 'opacity-0');
  }, 10);

  // Trigger slide out and remove
  setTimeout(() => {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3500);
}

// INTERACTIVE DROPDOWN ON PROFILE PICTURE
function setupProfileDropdown() {
  const profileDiv = document.getElementById('profile-picture-container');
  if (!profileDiv) return;

  profileDiv.classList.add('cursor-pointer', 'relative');
  profileDiv.classList.remove('overflow-hidden');
  
  const avatarImg = document.getElementById('header-avatar');
  if (avatarImg) {
    avatarImg.classList.add('rounded-full');
  }
  
  // Create Dropdown Element
  const dropdown = document.createElement('div');
  dropdown.className = 'profile-dropdown hidden absolute right-0 top-12 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-2xl p-4 z-[9999] glass-card';
  
  function renderDropdownContent() {
    const user = JSON.parse(localStorage.getItem('current_user'));
    if (!user) return;
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const getLinkClass = (path) => {
      if (currentPath === path) {
        return "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold text-sm transition-all duration-200";
      }
      return "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5 text-on-surface-variant hover:text-primary transition-colors text-sm";
    };

    const getIconStyle = (path) => {
      if (currentPath === path) {
        return "style=\"font-variation-settings: 'FILL' 1;\"";
      }
      return "";
    };

    dropdown.innerHTML = `
      <div class="flex items-center gap-3 pb-3 border-b border-outline-variant/20 mb-3">
        <img src="${user.profileImage}" class="w-10 h-10 rounded-full object-cover">
        <div>
          <h4 class="font-bold text-on-surface text-sm">${user.name}</h4>
          <p class="text-[11px] text-on-surface-variant font-label-sm">${user.major} • ${user.year}</p>
        </div>
      </div>
      <ul class="space-y-1">
        <li>
          <a href="buyer-dashboard.html" class="${getLinkClass('buyer-dashboard.html')}">
            <span class="material-symbols-outlined text-[20px]" ${getIconStyle('buyer-dashboard.html')}>school</span>
            <span>My Study Hub (Buyer)</span>
          </a>
        </li>
        <li>
          <a href="seller-dashboard.html" class="${getLinkClass('seller-dashboard.html')}">
            <span class="material-symbols-outlined text-[20px]" ${getIconStyle('seller-dashboard.html')}>monetization_on</span>
            <span>Earnings & Sales (Seller)</span>
          </a>
        </li>
        <li>
          <a href="admin-dashboard.html" class="${getLinkClass('admin-dashboard.html')}">
            <span class="material-symbols-outlined text-[20px]" ${getIconStyle('admin-dashboard.html')}>admin_panel_settings</span>
            <span>Admin System Overview</span>
          </a>
        </li>
        <li>
          <a href="settings.html" class="${getLinkClass('settings.html')}">
            <span class="material-symbols-outlined text-[20px]" ${getIconStyle('settings.html')}>person</span>
            <span>Profile & Settings</span>
          </a>
        </li>
        <li class="pt-2 border-t border-outline-variant/10 mt-2">
          <button id="switch-user-btn" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/5 text-error hover:text-error transition-colors text-sm text-left">
            <span class="material-symbols-outlined text-[20px]">logout</span>
            <span>Switch Account</span>
          </button>
        </li>
      </ul>
    `;
    
    // Re-bind Switch User action
    const switchBtn = dropdown.querySelector('#switch-user-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('current_user');
        window.location.href = "login.html";
      });
    }
  }

  if (!JSON.parse(localStorage.getItem('current_user'))) return;
  renderDropdownContent();
  profileDiv.appendChild(dropdown);
  
  // Toggle on click
  profileDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Stop propagation on dropdown clicks so clicking inside it doesn't close it
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close when clicking elsewhere
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  // Re-render when profile settings update
  window.addEventListener('userUpdated', renderDropdownContent);
}

// SETUP HEADER NAVIGATION AND LINKS CORRECTION
function setupHeaderLinks() {
  // Correct Home/Browse/Logo links on all screens to stay local
  const logoText = document.querySelector('.font-headline-md.text-primary, .font-headline-md.text-inverse-primary');
  if (logoText) {
    const parentA = logoText.closest('a') || logoText;
    if (parentA.tagName === 'A') {
      parentA.href = "index.html";
    } else {
      // Wrap logo in A tag if not already
      logoText.style.cursor = 'pointer';
      logoText.onclick = () => window.location.href = "index.html";
    }
  }

  // Bind top navbar "Browse" and links
  const navLinks = document.querySelectorAll('nav a, header a');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const currentSearch = window.location.search;

  navLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    
    // Set Href
    if (text === 'browse') {
      link.href = "browse.html";
    } else if (text === 'categories') {
      link.href = "browse.html?ref=categories";
    } else if (text === 'sellers') {
      link.href = "browse.html?ref=sellers";
    }

    // Check active state
    let isActive = false;
    if (text === 'browse' && currentPath === 'browse.html' && !currentSearch.includes('ref=categories') && !currentSearch.includes('ref=sellers')) {
      isActive = true;
    } else if (text === 'categories' && currentPath === 'browse.html' && currentSearch.includes('ref=categories')) {
      isActive = true;
    } else if (text === 'sellers' && currentPath === 'browse.html' && currentSearch.includes('ref=sellers')) {
      isActive = true;
    }

    // Set classes based on active state
    if (link.tagName === 'A' && (text === 'browse' || text === 'categories' || text === 'sellers')) {
      if (isActive) {
        link.className = "text-primary font-bold border-b-2 border-primary h-16 flex items-center transition-all duration-200";
      } else {
        link.className = "text-on-surface-variant hover:text-primary transition-colors duration-200 h-16 flex items-center";
      }
    }
  });

  // Bind sidebar/aside navigation links active state dynamically
  const asideLinks = document.querySelectorAll('aside nav a');
  asideLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const normalizedHref = href.split('?')[0].split('#')[0];
    const isSidebarActive = normalizedHref === currentPath;

    if (isSidebarActive) {
      link.className = "flex items-center gap-3 p-3 bg-primary/10 text-primary font-bold rounded-xl transition-all duration-200";
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "'FILL' 1";
      }
    } else {
      link.className = "flex items-center gap-3 p-3 text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all duration-200 rounded-xl";
      const icon = link.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.style.fontVariationSettings = "";
      }
    }
  });

  // Bind Upload button
  const uploadBtn = document.querySelector('header button.bg-primary, header a.bg-primary');
  if (uploadBtn) {
    if (uploadBtn.tagName === 'BUTTON') {
      uploadBtn.onclick = () => window.location.href = "upload.html";
    } else {
      uploadBtn.href = "upload.html";
    }
  }

  // Bind Cart button icon
  const cartBtns = document.querySelectorAll('button.material-symbols-outlined, a.material-symbols-outlined');
  cartBtns.forEach(btn => {
    if (btn.textContent.trim() === 'shopping_cart') {
      btn.style.cursor = 'pointer';
      btn.onclick = () => window.location.href = "cart.html";
    }
  });

  // Centralized search input handler (redirect to browse.html unless we are already on it)
  const navSearch = document.getElementById('nav-search');
  if (navSearch && currentPath !== 'browse.html') {
    navSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && navSearch.value.trim() !== '') {
        window.location.href = `browse.html?search=${encodeURIComponent(navSearch.value.trim())}`;
      }
    });
  }
}

// Initialize layout elements once DOM is fully loaded
function updateDOMWithUser(user) {
  const profileContainer = document.getElementById('profile-picture-container');
  const headerActions = profileContainer ? profileContainer.parentElement : null;

  if (!user) {
    if (profileContainer) profileContainer.classList.add('hidden');
    // Show a login button in the header instead
    if (headerActions && !document.getElementById('login-action-btn')) {
      const loginBtn = document.createElement('button');
      loginBtn.id = 'login-action-btn';
      loginBtn.className = 'bg-primary/10 text-primary px-5 py-2 rounded-full font-bold hover:bg-primary/20 transition-all text-sm';
      loginBtn.textContent = 'Log In';
      loginBtn.onclick = () => window.location.href = 'login.html';
      headerActions.appendChild(loginBtn);
    }
    return;
  } else {
    if (profileContainer) profileContainer.classList.remove('hidden');
    const loginBtn = document.getElementById('login-action-btn');
    if (loginBtn) loginBtn.remove();
  }
  
  // Header Avatar
  const headerAvatar = document.getElementById('header-avatar');
  if (headerAvatar && user.profileImage) {
    headerAvatar.src = user.profileImage;
  }

  // Sidebar Avatar
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  if (sidebarAvatar) {
    if (user.profileImage) {
      sidebarAvatar.src = user.profileImage;
    }
    const sidebarProfileContainer = sidebarAvatar.parentElement;
    if (sidebarProfileContainer) {
      sidebarProfileContainer.classList.add('cursor-pointer', 'hover:bg-primary/5', 'rounded-2xl', 'transition-all', 'duration-200');
      sidebarProfileContainer.addEventListener('click', () => {
        window.location.href = "settings.html";
      });
    }
  }

  // Sidebar Name
  const sidebarName = document.getElementById('sidebar-name');
  if (sidebarName && user.name) {
    sidebarName.textContent = user.name;
  }

  // Sidebar Major
  const sidebarMajor = document.getElementById('sidebar-major');
  if (sidebarMajor && user.major && user.year) {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath !== 'admin-dashboard.html') {
      sidebarMajor.textContent = `${user.major} • ${user.year}`;
    }
  }

  // Sidebar University
  const sidebarUni = document.getElementById('sidebar-uni');
  if (sidebarUni && user.university) {
    sidebarUni.textContent = user.university;
  }
}

async function syncUserWithBackend() {
  if (!localStorage.getItem('accessToken')) return;
  try {
    const json = await apiFetch('/auth/me');
    const dbUser = json.data.user;
    
    // Map dbUser fields to current_user
    const mappedUser = {
      id: dbUser.id,
      name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || 'Anonymous User',
      email: dbUser.email,
      university: dbUser.colleges ? dbUser.colleges.name : 'Not set',
      college_id: dbUser.colleges ? dbUser.colleges.id : null,
      major: dbUser.departments ? dbUser.departments.name : 'Not set',
      department_id: dbUser.departments ? dbUser.departments.id : null,
      year: dbUser.year ? ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Fifth Year', 'Graduate'][dbUser.year - 1] : 'Not set',
      yearNum: dbUser.year,
      bio: dbUser.bio || '',
      phone: dbUser.phone || '',
      upiId: dbUser.upi_id || '',
      role: dbUser.role || 'buyer',
      profileImage: dbUser.profile_pic_url ? (dbUser.profile_pic_url.startsWith('http') ? dbUser.profile_pic_url : 'https://academiahub-backend-k2cq.onrender.com' + dbUser.profile_pic_url) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      earnings: 0.0,
      soldCount: 0,
      balance: dbUser.balance || 0.0
    };
    
    // Fetch stats if they are a seller
    if (mappedUser.role === 'seller' || mappedUser.role === 'both') {
      try {
        const statsJson = await apiFetch('/seller/dashboard');
        if (statsJson.success && statsJson.data?.dashboard) {
          mappedUser.earnings = statsJson.data.dashboard.total_earnings || 0;
          mappedUser.soldCount = statsJson.data.dashboard.total_sales || 0;
          mappedUser.balance = statsJson.data.dashboard.available_earnings || 0;
        }
      } catch (err) {
        console.warn('Could not fetch seller stats for user mapping', err);
      }
    }
    
    localStorage.setItem('current_user', JSON.stringify(mappedUser));
    updateDOMWithUser(mappedUser);
    window.dispatchEvent(new CustomEvent('userUpdated'));
    syncCartWithBackend();
    syncPurchasesWithBackend();
  } catch (err) {
    console.error('Failed to sync user with backend:', err);
    if (err.status === 401) {
      logoutUser();
    }
  }
}



document.addEventListener('DOMContentLoaded', () => {
  setupHeaderLinks();
  updateCartBadge();
  setupProfileDropdown();

  // Globally bind user details to header and sidebar if they exist
  const user = JSON.parse(localStorage.getItem('current_user'));
  updateDOMWithUser(user);

  if (localStorage.getItem('accessToken')) {
    syncUserWithBackend();
    syncCartWithBackend();
    syncPurchasesWithBackend();
  }
});
