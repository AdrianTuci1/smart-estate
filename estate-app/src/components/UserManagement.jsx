import { useState, useEffect } from 'react';
import { User, UserPlus, Edit, Trash2, Shield, Users, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'agent'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.error || 'Eroare la încărcarea utilizatorilor');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Eroare la încărcarea utilizatorilor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Numele utilizatorului este obligatoriu');
      return;
    }
    if (!editingUser && !formData.password) {
      setError('Parola este obligatorie pentru utilizatori noi');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let response;
      if (editingUser) {
        // Update existing user
        const updateData = {
          username: formData.username.trim(),
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        response = await apiService.updateUser(editingUser.id, updateData);
      } else {
        // Create new user
        response = await apiService.createUser({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role
        });
      }

      if (response.success) {
        await loadUsers();
        resetForm();
      } else {
        setError(response.error || 'Eroare la salvarea utilizatorului');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || 'Eroare la salvarea utilizatorului');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`Ești sigur că vrei să ștergi utilizatorul "${username}"?`)) {
      return;
    }

    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        await loadUsers();
      } else {
        setError(response.error || 'Eroare la ștergerea utilizatorului');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Eroare la ștergerea utilizatorului');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'agent'
    });
    setEditingUser(null);
    setShowCreateForm(false);
    setError('');
  };

  const startEdit = (userData) => {
    setFormData({
      username: userData.username,
      password: '',
      role: userData.role
    });
    setEditingUser(userData);
    setShowCreateForm(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p>Accesul este restricționat. Doar administratorii pot gestiona utilizatorii.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Gestionare Utilizatori
            </h2>
            <p className="text-gray-600 mt-1">
              Gestionează utilizatorii companiei tale
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Adaugă Utilizator
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Editează Utilizator' : 'Utilizator Nou'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nume Utilizator
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input w-full"
                  placeholder="ex: john.doe"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  className="input w-full"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parolă {editingUser && <span className="text-gray-500">(lasă gol pentru a păstra parola actuală)</span>}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input w-full pr-10"
                  placeholder={editingUser ? 'Parolă nouă (opțional)' : 'Parola'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Se salvează...
                  </div>
                ) : (
                  editingUser ? 'Actualizează' : 'Creează'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Utilizatori ({users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Se încarcă utilizatorii...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Nu există utilizatori încă</p>
            <p className="text-sm">Creează primul utilizator pentru a începe</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((userData) => (
              <div key={userData.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      {userData.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary-600" />
                      ) : (
                        <User className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {userData.username}
                      </p>
                      {userData.id === user?.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Tu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {userData.role === 'admin' ? 'Administrator' : 'Agent'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(userData)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editează utilizator"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {userData.id !== user?.id && (
                    <button
                      onClick={() => handleDelete(userData.id, userData.username)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Șterge utilizator"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
