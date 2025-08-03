import { Route } from "../../types/company";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  route: Route | null;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, route, isDeleting }: DeleteConfirmModalProps) {
  if (!isOpen || !route) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4 dark:bg-red-900/20">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Xác nhận xóa tuyến đường
            </h3>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bạn có chắc chắn muốn xóa tuyến đường này không?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Mã tuyến:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{route.routeId}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Tuyến:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {route.fromLocation} → {route.toLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Công ty:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{route.companyName}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-red-600 dark:text-red-400 text-sm mt-4">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Xóa tuyến đường
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}