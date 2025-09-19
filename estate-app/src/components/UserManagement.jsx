import { useState, useEffect } from 'react';
import { User, UserPlus, Edit, Trash2, Shield, Users, UserCog, Eye, EyeOff, Lock, X } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'User'
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

  const handleDelete = async (userId, username, userRole) => {
    // Prevent deleting self
    if (userId === user?.id) {
      setError('Nu poți șterge propriul cont');
      return;
    }
    
    // Show different confirmation messages for different roles
    const confirmMessage = userRole === 'admin' 
      ? `Ești sigur că vrei să ștergi administratorul "${username}"? Această acțiune este ireversibilă!`
      : `Ești sigur că vrei să ștergi utilizatorul "${username}"?`;
    
    if (!confirm(confirmMessage)) {
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
      role: 'User'
    });
    setEditingUser(null);
    setShowCreateDrawer(false);
    setError('');
  };

  const startEdit = (userData) => {
    // Prevent editing self
    if (userData.id === user?.id) {
      setError('Nu poți edita propriul cont');
      return;
    }
    
    setFormData({
      username: userData.username,
      password: '',
      role: userData.role
    });
    setEditingUser(userData);
    setShowCreateDrawer(true);
  };

  if (user?.role !== 'admin' && user?.role !== 'Moderator') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p>Accesul este restricționat. Doar administratorii și moderatorii pot gestiona utilizatorii.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Lista Utilizatori
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {users.length} utilizatori în sistem
          </p>
        </div>
        <button
          onClick={() => setShowCreateDrawer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <UserPlus className="h-4 w-4" />
          <span>Adaugă Utilizator</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* User Management Drawer */}
      {showCreateDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={resetForm}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingUser ? 'Editează Utilizator' : 'Utilizator Nou'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Nume Utilizator
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="User">User</option>
                      <option value="PowerUser">PowerUser</option>
                      {(user?.role === 'admin') && (
                        <option value="Moderator">Moderator</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Parolă {editingUser && <span className="text-gray-500 text-sm">(lasă gol pentru a păstra parola actuală)</span>}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Se salvează...</span>
                      </>
                    ) : (
                      <span>{editingUser ? 'Actualizează' : 'Creează'}</span>
                    )}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Se încarcă utilizatorii...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium">Nu există utilizatori încă</p>
            <p className="text-sm text-gray-400 mt-1">Creează primul utilizator pentru a începe</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((userData) => (
              <div key={userData.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      {userData.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary-600" />
                      ) : userData.role === 'Moderator' ? (
                        <UserCog className="h-5 w-5 text-primary-600" />
                      ) : userData.role === 'PowerUser' ? (
                        <Users className="h-5 w-5 text-primary-600" />
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
                      {userData.role === 'admin' ? 'Administrator' : 
                       userData.role === 'Moderator' ? 'Moderator' :
                       userData.role === 'PowerUser' ? 'Power User' : 'User'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* Edit button - admins can edit everyone except self, moderators can edit non-moderators */}
                  {userData.id !== user?.id && 
                   ((user?.role === 'admin') || 
                    (user?.role === 'Moderator' && userData.role !== 'Moderator' && userData.role !== 'admin')) && (
                    <button
                      onClick={() => startEdit(userData)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Editează utilizator"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Delete button - admins can delete everyone except self, moderators can delete non-moderators */}
                  {userData.id !== user?.id && 
                   ((user?.role === 'admin') || 
                    (user?.role === 'Moderator' && userData.role !== 'Moderator' && userData.role !== 'admin')) && (
                    <button
                      onClick={() => handleDelete(userData.id, userData.username, userData.role)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title={userData.role === 'admin' ? 'Șterge administrator' : 'Șterge utilizator'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Show lock icon only for current user */}
                  {userData.id === user?.id && (
                    <div className="p-2 text-gray-300" title="Nu poți edita sau șterge propriul cont">
                      <Lock className="h-4 w-4" />
                    </div>
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
