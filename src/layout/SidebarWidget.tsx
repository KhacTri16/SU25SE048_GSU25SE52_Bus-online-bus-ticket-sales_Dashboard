export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-pink-50 px-4 py-5 text-center dark:bg-pink-900/10`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        🚌 XeTiic System
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        Hệ thống quản lý bán vé xe khách hiện đại và thông minh.
      </p>
      <a
        href="#"
        target="_blank"
        rel="nofollow"
        className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-pink-600 text-theme-sm hover:bg-pink-700"
      >
        Liên hệ hỗ trợ
      </a>
    </div>
  );
}
