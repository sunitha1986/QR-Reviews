import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Tags,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import config from '../../config';
import { TableShimmer } from '../../components/Shimmer';

export default function BusinessCategories({ onGoToOnboarding }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State (Add or Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null if adding new
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Delete confirmation modal state
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/categories`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load categories');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setLabel('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setLabel(cat.label || cat.name);
    setDescription(cat.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError('');
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const url = editingCategory ? `${config.API_BASE_URL}/api/categories/${editingCategory.id}` : `${config.API_BASE_URL}/api/categories`;
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          label: label.trim() || name.trim(),
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      setSuccessNotice(data.message || (editingCategory ? 'Category updated!' : 'Category added successfully!'));
      setTimeout(() => setSuccessNotice(''), 3500);

      closeModal();
      await fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      setSuccessNotice(data.message || 'Category deleted successfully!');
      setTimeout(() => setSuccessNotice(''), 3500);

      setDeletingCategory(null);
      await fetchCategories();
    } catch (err) {
      alert(err.message || 'Error deleting category');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.label && c.label.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const totalAssignedBusinesses = categories.reduce((sum, c) => sum + (c.clientCount || 0), 0);
  const activeIndustriesCount = categories.filter((c) => (c.clientCount || 0) > 0).length;

  return (
    <div className="fade-in">
      {/* Top Banner & Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
            <Tags size={22} />
          </div>
          <div>
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Total Business Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div className="stat-value">{totalAssignedBusinesses}</div>
            <div className="stat-label">Active Clients Mapped</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">{activeIndustriesCount} / {categories.length}</div>
            <div className="stat-label">Active Categories with Clients</div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '10px',
          color: '#6EE7B7',
          marginBottom: '20px',
          fontSize: '0.88rem',
          animation: 'fadeIn 0.25s ease'
        }}>
          <CheckCircle2 size={18} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Actions & Search Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tags size={20} style={{ color: 'var(--primary)' }} />
              <span>Dynamic Business Categories</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Add and manage industry categories. Newly added categories populate dynamically into client onboarding & edit dropdowns.
            </p>
          </div>

          <div className="responsive-toolbar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="responsive-search-wrap" style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '220px', paddingLeft: '34px', fontSize: '0.84rem' }}
                placeholder="Search category name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Refresh */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchCategories}
              title="Refresh categories list"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* + Add Category Button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={openAddModal}
              id="btn-add-new-category"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Plus size={16} />
              <span>Add Business Category</span>
            </button>
          </div>
        </div>

        {/* Categories Table */}
        {loading && categories.length === 0 ? (
          <div style={{ padding: '6px 0' }}>
            <TableShimmer columns={4} rows={5} showHeaderActions={false} title="Business Categories" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Tags size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4, display: 'block' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {search ? 'No categories match your search query' : 'No Business Categories Found'}
            </div>
            <p style={{ fontSize: '0.82rem', maxWidth: '380px', margin: '0 auto 16px auto' }}>
              {search ? 'Try clearing your search terms to see all available categories.' : 'Click "Add Business Category" above to create your first industry category.'}
            </p>
            {search && (
              <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category / Industry</th>
                  <th>Display Label in Forms</th>
                  <th>Description / Overview</th>
                  <th>Assigned Clients</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    {/* Category Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.14)',
                          color: '#A5B4FC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Tags size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ID: <code>{cat.id}</code>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Display Label */}
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                        {cat.label || cat.name}
                      </span>
                    </td>

                    {/* Description */}
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {cat.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>— No description</span>}
                    </td>

                    {/* Assigned Clients */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${cat.clientCount > 0 ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '0.76rem' }}>
                          {cat.clientCount} {cat.clientCount === 1 ? 'Business' : 'Businesses'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#FCD34D' }}
                          onClick={() => openEditModal(cat)}
                          title="Edit Category"
                          id={`btn-edit-category-${cat.id}`}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#F87171' }}
                          onClick={() => setDeletingCategory(cat)}
                          title="Delete Category"
                          id={`btn-delete-category-${cat.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          ADD / EDIT CATEGORY MODAL
          ======================================================== */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tags size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.18rem', color: 'var(--text-primary)' }}>
                    {editingCategory ? 'Edit Business Category' : 'Add New Business Category'}
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {editingCategory ? 'Update existing category details' : 'Define a new industry classification for onboarding'}
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={closeModal} style={{ borderRadius: '50%', padding: '6px' }}>
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '0.82rem',
                marginBottom: '14px'
              }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory}>
              {/* Category Name */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="cat-name">
                  Category Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jewelry & Diamonds, Bakery & Cafe, Real Estate"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!label || label === name) {
                      setLabel(e.target.value);
                    }
                  }}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Used as the primary key and category identifier in client profiles.
                </span>
              </div>

              {/* Display Label */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="cat-label">
                  Form Display Label <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <input
                  id="cat-label"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fine Jewelry, Gold & Diamond Ornaments"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Formatted label displayed to admin in the onboarding dropdown.
                </span>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" htmlFor="cat-desc">
                  Description / Service Scope <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <textarea
                  id="cat-desc"
                  className="form-textarea"
                  style={{ minHeight: '70px', fontSize: '0.84rem' }}
                  placeholder="Brief description of the businesses that fall under this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Live Preview Chip */}
              <div style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '8px',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Preview in Client Onboarding dropdown:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-primary">
                    {label || name || 'Category Label'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (Stored as: <code>{name || 'Category Name'}</code>)
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  id="btn-save-category"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      {deletingCategory && createPortal(
        <div className="modal-overlay" onClick={() => setDeletingCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Delete Category?</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                  Are you sure you want to remove <strong>"{deletingCategory.name}"</strong>?
                </p>
                {deletingCategory.clientCount > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '6px',
                    color: 'var(--warning)',
                    fontSize: '0.78rem'
                  }}>
                    ⚠️ <strong>Notice:</strong> {deletingCategory.clientCount} business client(s) currently use this category. Existing clients will retain their setting, but it will no longer appear for new onboardings.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingCategory(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteCategory}
                disabled={deleteLoading}
                id="btn-confirm-delete-category"
              >
                {deleteLoading ? 'Removing...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
