const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
    "http://localhost:3000",
    "https://ayushp254-sycle.vercel.app"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function loadUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

app.post('/api/signup', (req, res) => {
  const { firstName, lastName, email, pwd, phone, address, zipcode, city, state, country, option } = req.body;

  if (!firstName || !lastName || !email || !pwd || !phone || !address || !zipcode || !city || !state || !country || !option) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = loadUsers();
  const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(409).json({ error: 'A user with that email already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    password: pwd,
    phone,
    address,
    zipcode,
    city,
    state,
    country,
    option,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return res.status(201).json({ message: 'User registered successfully.', user: { id: newUser.id, firstName, lastName, email, phone, address, zipcode, city, state, country, option } });
});

app.post('/api/login', (req, res) => {
  const { email, pwd } = req.body;

  if (!email || !pwd) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== pwd) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.status(200).json({ message: 'Login successful.', user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, address: user.address, zipcode: user.zipcode, city: user.city, state: user.state, country: user.country, option: user.option } });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, address, city, state, country, email, password } = req.body;

  const updates = {};

  if (firstName !== undefined && firstName !== '') updates.firstName = firstName;
  if (lastName !== undefined && lastName !== '') updates.lastName = lastName;
  if (phone !== undefined && phone !== '') updates.phone = phone;
  if (address !== undefined && address !== '') updates.address = address;
  if (city !== undefined && city !== '') updates.city = city;
  if (state !== undefined && state !== '') updates.state = state;
  if (country !== undefined && country !== '') updates.country = country;
  if (email !== undefined && email !== '') updates.email = email;
  if (password !== undefined && password !== '') updates.password = password;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update.' });
  }

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (updates.email) {
    const emailTaken = users.some((u, index) => index !== userIndex && u.email.toLowerCase() === updates.email.toLowerCase());
    if (emailTaken) {
      return res.status(409).json({ error: 'That email is already in use.' });
    }
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  };

  saveUsers(users);

  return res.status(200).json({ message: 'User updated successfully.', user: users[userIndex] });
});

app.get('/api/users', (req, res) => {
  const users = loadUsers();
  res.json(users.map(({ password, ...rest }) => rest));
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
