import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

const Manager = () => {
  const [form, setForm] = useState({ site: "", username: "", password: "", id: "" });
  const [passwordArray, setPasswordArray] = useState([]);
  const [visiblePasswordId, setVisiblePasswordId] = useState(null);
  const [formErrors, setFormErrors] = useState({}); // For validation feedback
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);

  // Fetch passwords on mount
  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      const res = await fetch("http://localhost:3000/");
      if (!res.ok) throw new Error('Failed to fetch passwords');
      const data = await res.json();
      setPasswordArray(data);
    } catch (error) {
      toast.error('Error fetching passwords: ' + error.message);
    }
  };

  // Validate form fields, return errors object
  const validateForm = () => {
    const errors = {};
    if (!form.site || form.site.length < 4) errors.site = "Site must be at least 4 characters.";
    if (!form.username || form.username.length < 4) errors.username = "Username must be at least 4 characters.";
    if (!form.password || form.password.length < 4) errors.password = "Password must be at least 4 characters.";
    return errors;
  };

  const savePassword = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix form errors before saving!');
      return;
    }

    setFormErrors({});

    try {
      const id = form.id || uuidv4();

      // If editing (form.id exists), delete old password first
      if (form.id) {
        const deleteRes = await fetch("http://localhost:3000/", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: form.id }),
        });
        if (!deleteRes.ok) throw new Error('Failed to delete old password');
      }

      const newPassword = { ...form, id };

      // Post new password to backend
      const postRes = await fetch("http://localhost:3000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPassword),
      });
      if (!postRes.ok) throw new Error('Failed to save new password');

      // Update local state
      setPasswordArray(prev => [...prev.filter(p => p.id !== id), newPassword]);

      // Reset form
      setForm({ site: "", username: "", password: "", id: "" });
      setShowPasswordInForm(false);
      setVisiblePasswordId(null);

      toast.success('Password saved!');
    } catch (error) {
      toast.error('Error saving password: ' + error.message);
    }
  };

  // Copy text to clipboard with toast
  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied!'))
      .catch(() => toast.error('Copy failed'));
  };

  // Load password data into form for editing
  const editPassword = (id) => {
    const pwd = passwordArray.find(i => i.id === id);
    if (pwd) {
      setForm(pwd);
      setShowPasswordInForm(false);
    }
  };

  // Delete password after confirmation
  const deletePassword = async (id) => {
    if (!window.confirm("Delete password?")) return;

    try {
      const res = await fetch("http://localhost:3000/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete password');

      setPasswordArray(prev => prev.filter(item => item.id !== id));
      toast.success('Password deleted!');
    } catch (error) {
      toast.error('Error deleting password: ' + error.message);
    }
  };

  // Toggle password visibility for form input
  const toggleFormPasswordVisibility = () => {
    setShowPasswordInForm(v => !v);
  };

  // Toggle password visibility for a password row
  const toggleVisibility = (id) => {
    setVisiblePasswordId(visiblePasswordId === id ? null : id);
  };

  return (
    <div className='flex flex-col items-center mt-5 w-full max-w-4xl mx-auto'>
      <h1 className='text-center text-2xl font-bold mb-5'>Password Manager</h1>

      {/* Password Input Form */}
      <div className='flex flex-col w-full max-w-xl bg-gray-800 p-5 rounded-lg shadow-md mb-10'>
        <input
          type="text"
          aria-label="Site"
          placeholder='Enter Site'
          value={form.site}
          onChange={e => setForm({ ...form, site: e.target.value })}
          className={`mb-2 p-2 rounded ${formErrors.site ? 'border-2 border-red-500' : ''}`}
        />
        {formErrors.site && <small className='text-red-500 mb-2'>{formErrors.site}</small>}

        <input
          type="text"
          aria-label="Username"
          placeholder='Enter Username'
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          className={`mb-2 p-2 rounded ${formErrors.username ? 'border-2 border-red-500' : ''}`}
        />
        {formErrors.username && <small className='text-red-500 mb-2'>{formErrors.username}</small>}

        <div className='relative'>
          <input
            type={showPasswordInForm ? "text" : "password"}
            aria-label="Password"
            placeholder='Enter Password'
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className={`mb-2 p-2 rounded w-full ${formErrors.password ? 'border-2 border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={toggleFormPasswordVisibility}
            aria-label={showPasswordInForm ? "Hide password" : "Show password"}
            className='absolute right-2 top-2 cursor-pointer'
          >
            {showPasswordInForm ? (
              <img src="/icons/eye-closed.svg" alt="Hide" className='w-5 h-5' />
            ) : (
              <img src="/icons/eye.svg" alt="Show" className='w-5 h-5' />
            )}
          </button>
        </div>
        {formErrors.password && <small className='text-red-500 mb-2'>{formErrors.password}</small>}

        <button
          className='bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-3'
          onClick={savePassword}
        >
          {form.id ? "Update Password" : "Save Password"}
        </button>
      </div>

      {/* Password List Table */}
      <table className='table-auto w-full max-w-4xl border-collapse border border-gray-600 text-white'>
        <thead>
          <tr className='bg-gray-700'>
            <th className='border border-gray-500 px-4 py-2'>Site</th>
            <th className='border border-gray-500 px-4 py-2'>Username</th>
            <th className='border border-gray-500 px-4 py-2'>Password</th>
            <th className='border border-gray-500 px-4 py-2'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {passwordArray.length === 0 ? (
            <tr>
              <td colSpan="4" className='text-center p-5 text-gray-400'>No passwords saved yet.</td>
            </tr>
          ) : (
            passwordArray.map(item => (
              <tr key={item.id} className='hover:bg-gray-700'>
                <td className='border border-gray-500 px-4 py-2 cursor-pointer' onClick={() => copyText(item.site)} title="Click to copy site">
                  {item.site}
                </td>
                <td className='border border-gray-500 px-4 py-2 cursor-pointer' onClick={() => copyText(item.username)} title="Click to copy username">
                  {item.username}
                </td>
                <td className='border border-gray-500 px-4 py-2'>
                  <div className='flex items-center justify-center space-x-2'>
                    <span className='cursor-pointer select-none' title={visiblePasswordId === item.id ? "Click to hide password" : "Click to show password"} onClick={() => toggleVisibility(item.id)}>
                      {visiblePasswordId === item.id ? item.password : "*".repeat(item.password.length)}
                    </span>
                    <button
                      onClick={() => copyText(item.password)}
                      aria-label="Copy password"
                      className='p-1 bg-gray-600 rounded hover:bg-gray-500'
                      title="Copy password"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => editPassword(item.id)}
                      aria-label="Edit password"
                      className='p-1 bg-green-600 rounded hover:bg-green-500'
                      title="Edit password"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deletePassword(item.id)}
                      aria-label="Delete password"
                      className='p-1 bg-red-600 rounded hover:bg-red-500'
                      title="Delete password"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
                <td className='hidden'></td> {/* Placeholder if you want another column */}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Manager;
