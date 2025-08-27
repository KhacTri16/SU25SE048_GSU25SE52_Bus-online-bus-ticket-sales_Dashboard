import { useEffect, useMemo, useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/api';
import { Ticket } from '../../types/company';

export default function StaffSoldTickets() {
  const { isStaff, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!isStaff() || !user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ticketService.getTicketsBySystemUser(parseInt(user.id,10));
        setTickets(data);
      } catch (e: any) {
        setError(e?.message || 'Không tải được vé đã bán tại quầy');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff, user]);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (search) {
        const keyword = search.toLowerCase();
        if (!(
          t.ticketId.toLowerCase().includes(keyword) ||
          t.customerName?.toLowerCase().includes(keyword) ||
          t.fromTripStation.toLowerCase().includes(keyword) ||
          t.toTripStation.toLowerCase().includes(keyword) ||
          t.companyName.toLowerCase().includes(keyword)
        )) return false;
      }
      if (statusFilter !== '') {
        return String(t.status) === statusFilter;
      }
      return true;
    });
  }, [tickets, search, statusFilter]);

  if (!isStaff()) {
    return <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] text-red-600 dark:text-red-400">Chỉ nhân viên có thể truy cập trang này.</div>;
  }

  return (
    <>
      <PageMeta title="Vé đã bán tại quầy" description="Danh sách vé do nhân viên này bán tại quầy" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vé đã bán tại quầy</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Nhân viên: {user?.fullName} (ID: {user?.id})</p>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tìm kiếm</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mã vé / Tên KH / Trạm / Công ty" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Trạng thái</label>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Tất cả</option>
              <option value="0">Mới</option>
              <option value="1">Đã CheckIn</option>
              <option value="2">Hoàn thành</option>
              <option value="3">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center text-gray-500 dark:text-gray-400">Đang tải...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">Không có vé nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <Th text="Mã vé" />
                  <Th text="Khách hàng" />
                  <Th text="Ghế" />
                  <Th text="Giá" />
                  <Th text="Tuyến" />
                  <Th text="Thời gian" />
                  <Th text="Tạo lúc" />
                  <Th text="Công ty" />
                  <Th text="TT" />
                  <Th text="QR" />
                  <Th text="PDF" />
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                    <Td>{t.ticketId}</Td>
                    <Td>{t.customerName || 'Unknown'}</Td>
                    <Td>{t.seatId}</Td>
                    <Td className="font-medium text-gray-900 dark:text-white">{t.price.toLocaleString('vi-VN')}₫</Td>
                    <Td>{t.fromTripStation} → {t.toTripStation}</Td>
                    <Td>
                      <div>{new Date(t.timeStart).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(t.timeEnd).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>
                    </Td>
                    <Td>{new Date(t.createDate).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</Td>
                    <Td>{t.companyName}</Td>
                    <Td><StatusBadge status={t.status} /></Td>
                    <Td>{t.qrCodeUrl && <a href={t.qrCodeUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">QR</a>}</Td>
                    <Td>{t.pdfUrl && <a href={t.pdfUrl} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">PDF</a>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Th({ text }: { text: string }) {
  return <th className="px-4 py-2 text-left text-[11px] font-semibold tracking-wide text-gray-600 dark:text-gray-400 uppercase">{text}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 align-top text-gray-700 dark:text-gray-300 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    0: { label: 'Mới', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    1: { label: 'CheckIn', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    2: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    3: { label: 'Hủy', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const s = map[status] || { label: 'Khác', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.cls}`}>{s.label}</span>;
}
