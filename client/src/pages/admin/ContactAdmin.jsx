import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getMessages, markMessageRead, deleteMessage } from '../../api/contact';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 15;

export default function ContactAdmin() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getMessages({ page, limit: PAGE_SIZE, unread: unreadOnly ? 'true' : undefined }),
    [page, unreadOnly],
  );

  const messages = data?.data || [];
  const meta = data?.meta || {};

  async function toggleRead(msg) {
    if (!msg.isRead) {
      try {
        await markMessageRead(msg.id);
        refetch();
      } catch {
        /* abaikan */
      }
    }
    setExpandedId((cur) => (cur === msg.id ? null : msg.id));
  }

  async function handleDelete(msg) {
    if (!window.confirm(`Hapus pesan dari ${msg.name}?`)) return;
    setDeletingId(msg.id);
    try {
      await deleteMessage(msg.id);
      if (messages.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch {
      /* abaikan */
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <Spinner label="Memuat pesan…" />;
  if (error) return <EmptyState icon="fa-triangle-exclamation" title="Gagal memuat pesan" description={errMsg(error)} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Pesan</h1>
          <p className="mt-1 text-sm text-slate-500">Pesan masuk dari formulir kontak.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} className="h-4 w-4 accent-teal-700" />
          Hanya yang belum dibaca
        </label>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon="fa-inbox" title="Tidak ada pesan" description="Pesan dari formulir kontak akan muncul di sini." />
      ) : (
        <>
          <div className="card divide-y divide-slate-100">
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Baris header */}
                <button
                  type="button"
                  onClick={() => toggleRead(msg)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/60"
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${msg.isRead ? 'bg-slate-200' : 'bg-teal-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${msg.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>
                      {msg.subject || '(Tanpa subjek)'}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {msg.name} · {msg.email}
                    </p>
                  </div>
                  <span className="hidden whitespace-nowrap text-xs text-slate-400 sm:block">
                    {formatDate(msg.createdAt, 'd MMM yyyy, HH:mm')}
                  </span>
                  <FontAwesomeIcon icon={['fa-solid', msg.isRead ? 'fa-envelope-open' : 'fa-envelope']} className="text-slate-300" />
                </button>

                {/* Isi pesan */}
                {expandedId === msg.id && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{msg.message}</p>
                    <div className="mt-4 flex justify-end gap-2">
                      {!msg.isRead && (
                        <button type="button" onClick={() => { markMessageRead(msg.id).then(refetch).catch(() => {}); }} className="btn-outline !px-3 !py-1.5 text-xs">
                          Tandai dibaca
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={deletingId === msg.id}
                        onClick={() => handleDelete(msg)}
                        className="btn-danger !px-3 !py-1.5 text-xs"
                      >
                        {deletingId === msg.id ? '…' : (
                          <>
                            <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                            Hapus
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Halaman {meta.page} dari {meta.totalPages} · {meta.total} pesan</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline !px-3 !py-1.5 text-xs">
                  Sebelumnya
                </button>
                <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline !px-3 !py-1.5 text-xs">
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
