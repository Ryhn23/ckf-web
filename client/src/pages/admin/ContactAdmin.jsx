import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useFetch from '../../hooks/useFetch';
import { getMessages, markMessageRead, toggleMessageRead, deleteMessage } from '../../api/contact';
import { errMsg } from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
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
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
            Pesan Masuk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pesan yang dikirim pengunjung melalui form kontak.
          </p>
        </div>
        <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded text-teal-700 accent-teal-700"
          />
          <span>Hanya yang belum dibaca</span>
        </label>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon="fa-inbox"
          title="Tidak ada pesan"
          description="Belum ada pesan masuk dari pengunjung."
        />
      ) : (
        <>
          <div className="admin-card overflow-hidden divide-y divide-slate-100">
            {messages.map((msg) => (
              <div key={msg.id} className="transition">
                {/* Baris item pesan */}
                <button
                  type="button"
                  onClick={() => toggleRead(msg)}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left transition ${
                    msg.isRead ? 'hover:bg-slate-50/70' : 'bg-teal-50/25 hover:bg-teal-50/50'
                  }`}
                >
                  <StatusBadge
                    status={msg.isRead ? 'READ' : 'UNREAD'}
                    className="!py-0.5 !text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${msg.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {msg.subject || '(Tanpa subjek pesan)'}
                    </p>
                    <p className="truncate text-xs text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-600">{msg.name}</span> · {msg.email}
                    </p>
                  </div>
                  <span className="hidden whitespace-nowrap text-xs text-slate-400 sm:block">
                    {formatDate(msg.createdAt, 'd MMM yyyy, HH:mm')}
                  </span>
                  <FontAwesomeIcon
                    icon={['fa-solid', expandedId === msg.id ? 'fa-chevron-up' : 'fa-chevron-down']}
                    className="text-xs text-slate-400"
                  />
                </button>

                {/* Isi detail pesan */}
                {expandedId === msg.id && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 space-y-4">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-xs whitespace-pre-line">
                      {msg.message}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-slate-500">
                        Pengirim: <strong className="text-slate-800">{msg.name}</strong> ({msg.email})
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject || 'Tanggapan Cinta Kasih Fatimah'}`)}`}
                          className="admin-btn-primary !px-3.5 !py-1.5 text-xs font-semibold"
                        >
                          <FontAwesomeIcon icon={['fa-solid', 'fa-reply']} />
                          <span>Balas via Email</span>
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await toggleMessageRead(msg.id);
                              refetch();
                            } catch {}
                          }}
                          className="admin-btn-secondary !px-3 !py-1.5 text-xs font-medium"
                        >
                          {msg.isRead ? 'Tandai Belum Dibaca' : 'Tandai Dibaca'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === msg.id}
                          onClick={() => handleDelete(msg)}
                          className="admin-btn-danger !px-3 !py-1.5 text-xs font-medium"
                          title="Hapus Pesan"
                        >
                          {deletingId === msg.id ? (
                            '…'
                          ) : (
                            <>
                              <FontAwesomeIcon icon={['fa-solid', 'fa-trash']} />
                              <span>Hapus</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 text-xs text-slate-500">
              <span>
                Halaman <strong className="text-slate-800">{meta.page}</strong> dari{' '}
                <strong className="text-slate-800">{meta.totalPages}</strong> (Total {meta.total} pesan)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="admin-btn-secondary !px-3 !py-1 text-xs font-medium"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="admin-btn-secondary !px-3 !py-1 text-xs font-medium"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

