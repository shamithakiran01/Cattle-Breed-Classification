const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function predictFromFile(file, topK = 3) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/predict/file?top_k=${topK}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  return response.json();
}

export async function loginUser(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function registerUser(username, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function getProfile(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

export async function predictFromBase64(base64Image, topK = 3) {
  const response = await fetch(`${API_BASE_URL}/predict/base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, top_k: topK }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  return response.json();
}

export async function getBreeds(animalType, search) {
  const params = new URLSearchParams();
  if (animalType) params.append('animal_type', animalType);
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/breeds?${params}`);
  if (!response.ok) throw new Error('Failed to fetch breeds');
  return response.json();
}

export async function getBreedDetail(breedName) {
  const response = await fetch(`${API_BASE_URL}/breeds/${encodeURIComponent(breedName)}`);
  if (!response.ok) throw new Error('Breed not found');
  return response.json();
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

export async function getVersion() {
  const response = await fetch(`${API_BASE_URL}/version`);
  return response.json();
}
