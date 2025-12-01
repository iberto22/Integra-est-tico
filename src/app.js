require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
// Servir archivos estáticos bajo la ruta `/static` para que las vistas puedan usar
// URLs como `/static/css/global.css` (coincide con los enlaces en las plantillas)
app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Exponer `isHome` en las vistas para controlar header transparente y logo
app.use((req, res, next) => {
  res.locals.isHome = req.path === '/';
  next();
});

// Helpers for data
const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contactos.json');
const SERVICES_FILE = path.join(__dirname, '..', 'data', 'services.json');

function readContacts() {
  try {
    const raw = fs.readFileSync(CONTACTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeContacts(arr) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(arr, null, 2));
}

function readServices() {
  try {
    const raw = fs.readFileSync(SERVICES_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

// Middleware: auth
function ensureAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/admin');
}

// Routes
app.get('/', (req, res) => {
  const services = readServices();
  res.render('principal', { services });
});

app.get('/nosotros', (req, res) => res.render('nosotros'));

app.get('/servicios', (req, res) => {
  const services = readServices();
  res.render('servicios', { services });
});

app.get('/servicio/:id', (req, res) => {
  const services = readServices();
  const id = req.params.id;
  const service = services.find(s => s.id === id);
  if (!service) return res.status(404).render('404_error');
  const otherServices = services.filter(s => s.id !== id);
  res.render('cada_servicio', { service, otherServices });
});



// Contact form view
app.get('/contactos', (req, res) => {
  const success = req.session.success;
  delete req.session.success;
  res.render('contactos', { success });
});

// Contact form submission, saves to data/contactos.json
app.post('/contacto', (req, res) => {
  const { name, email, phone, message } = req.body;
  const contacts = readContacts();
  const newContact = {
    id: uuidv4(),
    name: name || '',
    email: email || '',
    phone: phone || '',
    message: message || '',
    date: new Date().toISOString(),
  };
  contacts.push(newContact);
  writeContacts(contacts);
  req.session.success = true;
  res.redirect('/contactos');
});

// modal contactos
function openPolicyModal() {
    document.getElementById("privacyModal").style.display = "flex";
}

function closePolicyModal() {
    document.getElementById("privacyModal").style.display = "none";
}





// Admin login
app.get('/admin', (req, res) => {
  const error = req.session.authError;
  delete req.session.authError;
  res.render('admin_contactos', { authenticated: req.session.authenticated, error });
});

app.post('/admin', (req, res) => {
  const { user, pass, logout } = req.body;
  if (logout) {
    req.session.destroy(() => res.redirect('/admin'));
    return;
  }

  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    req.session.authenticated = true;
    return res.redirect('/admin/contactos');
  }
  req.session.authError = 'Credenciales incorrectas';
  return res.redirect('/admin');
});

app.get('/admin/contactos', ensureAuth, (req, res) => {
  const contacts = readContacts();
  res.render('admin_contactos', { authenticated: true, contacts });
});

app.post('/admin/contactos/delete/:id', ensureAuth, (req, res) => {
  const contacts = readContacts();
  const id = req.params.id;
  const filtered = contacts.filter(c => c.id !== id);
  writeContacts(filtered);
  res.redirect('/admin/contactos');
});

// 404
app.use((req, res) => {
  res.status(404).render('404_error');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
