import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Eye, EyeOff, HelpCircle, Plus, Trash2, X } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import DataTable from '../../../components/data/DataTable';
import { ErrorBanner, useToast } from '../../../components/ui/StatusIndicators';
import { GOV, TYPO } from '../../../theme/government';
import api from '../../../services/api';

const EMPTY_FORM = {
  question: '',
  answer: '',
  category: '',
  status: 'draft',
  sortOrder: 0
};

const AdminFaqsPanel = () => {
  const { toast, showToast, Toast } = useToast();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/faqs/all');
      setFaqs(response.data?.data?.faqs || []);
    } catch {
      setError('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (faq) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      status: faq.status,
      sortOrder: faq.sortOrder ?? 0
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
    try {
      if (editing) {
        await api.patch(`/api/v1/faqs/${editing.id}`, payload);
        showToast('FAQ updated', 'success');
      } else {
        await api.post('/api/v1/faqs', payload);
        showToast('FAQ created', 'success');
      }
      closeForm();
      await loadFaqs();
    } catch (err) {
      showToast(err?.uiMessage || 'FAQ could not be saved', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (faq) => {
    try {
      const nextStatus = faq.status === 'published' ? 'draft' : 'published';
      await api.patch(`/api/v1/faqs/${faq.id}`, { status: nextStatus });
      showToast(nextStatus === 'published' ? 'FAQ published' : 'FAQ unpublished', 'success');
      await loadFaqs();
    } catch (err) {
      showToast(err?.uiMessage || 'FAQ could not be updated', 'error');
    }
  };

  const deleteFaq = async (faq) => {
    if (!window.confirm(`Delete FAQ "${faq.question}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/v1/faqs/${faq.id}`);
      showToast('FAQ deleted', 'success');
      await loadFaqs();
    } catch (err) {
      showToast(err?.uiMessage || 'FAQ could not be deleted', 'error');
    }
  };

  const columns = [
    {
      key: 'question',
      header: 'Question',
      sortable: true,
      render: (faq) => (
        <div>
          <p className="text-xs font-medium" style={{ color: GOV.text }}>{faq.question}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: GOV.textMuted }}>{faq.answer}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      width: 'w-28',
      render: (faq) => <span className="text-xs" style={{ color: GOV.textMuted }}>{faq.category || '-'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: 'w-24',
      render: (faq) => (
        faq.status === 'published'
          ? <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800"><Eye className="h-3 w-3" />Published</span>
          : <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600"><EyeOff className="h-3 w-3" />Draft</span>
      )
    },
    {
      key: 'actions',
      header: '',
      stopPropagation: true,
      width: 'w-10',
      align: 'right',
      render: (faq) => (
        <ActionMenu actions={[
          {
            label: faq.status === 'published' ? 'Unpublish' : 'Publish',
            Icon: faq.status === 'published' ? EyeOff : Eye,
            onClick: () => togglePublished(faq)
          },
          { label: 'Edit', Icon: Edit2, onClick: () => openEdit(faq) },
          { label: 'Delete', Icon: Trash2, onClick: () => deleteFaq(faq), danger: true }
        ]} />
      )
    }
  ];

  return (
    <>
      <Toast toast={toast} />
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>
                {editing ? 'Edit FAQ' : 'New FAQ'}
              </h3>
              <button type="button" onClick={closeForm} aria-label="Close FAQ form">
                <X className="h-4 w-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <form className="space-y-3 p-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="faq-question" className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Question *</label>
                <input id="faq-question" className="form-control" required value={form.question}
                  onChange={(event) => setForm({ ...form, question: event.target.value })} />
              </div>
              <div>
                <label htmlFor="faq-answer" className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Answer *</label>
                <textarea id="faq-answer" className="form-control" rows={5} required value={form.answer}
                  onChange={(event) => setForm({ ...form, answer: event.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="faq-category" className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Category</label>
                  <input id="faq-category" className="form-control" maxLength={64} value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="faq-status" className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Status</label>
                  <select id="faq-status" className="form-control" value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="faq-sort-order" className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Sort Order</label>
                  <input id="faq-sort-order" type="number" className="form-control" value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving}
                  className="rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: GOV.blue }}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={loadFaqs} className="mb-3" />}
      <div className="overflow-hidden rounded-md border bg-white" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={columns}
          rows={faqs}
          rowKey="id"
          loading={loading}
          emptyTitle="No FAQs yet"
          emptyMessage="Create FAQ items and publish them to the Help page."
          pageSize={15}
          toolbar={(
            <div className="flex w-full items-center gap-2">
              <HelpCircle className="h-4 w-4" style={{ color: GOV.blue }} />
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>FAQ Management</h3>
              <button type="button" onClick={openCreate}
                className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: GOV.blue }}>
                <Plus className="mr-1 inline h-3 w-3" />Add FAQ
              </button>
            </div>
          )}
        />
      </div>
    </>
  );
};

export default AdminFaqsPanel;
