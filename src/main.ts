import './styles/main.css';

/**
 * Design Foundation Generator
 * Main application entry point
 */

const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <h1>Design Foundation Generator</h1>
        <div class="nav-tabs">
          <button class="tab-button active" data-tab="color-management">Color Management</button>
          <button class="tab-button" data-tab="typography">Typography</button>
          <button class="tab-button" data-tab="export">Export</button>
        </div>
      </header>
      
      <main class="app-content">
        <div class="tab-content active" id="color-management">
          <h2>Color Management</h2>
          <p>Color management tools will be implemented here.</p>
        </div>
        
        <div class="tab-content" id="typography">
          <h2>Typography</h2>
          <p>Typography tools will be implemented here.</p>
        </div>
        
        <div class="tab-content" id="export">
          <h2>Export</h2>
          <p>Export tools will be implemented here.</p>
        </div>
      </main>
    </div>
  `;

  // Set up tab navigation
  setupTabs();
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

      // Show corresponding content
      const tabId = button.getAttribute('data-tab');
      if (tabId) {
        const content = document.getElementById(tabId);
        if (content) {
          content.classList.add('active');
        }
      }
    });
  });
} 