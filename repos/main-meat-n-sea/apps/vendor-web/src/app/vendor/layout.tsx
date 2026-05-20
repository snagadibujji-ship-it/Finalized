import VendorGuard from '@/components/VendorGuard';

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VendorGuard>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Stub */}
        <div className="w-64 bg-white shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">MEAT N SEA</h2>
            <p className="text-sm text-gray-500">Vendor Portal</p>
          </div>
          <nav className="mt-6">
            <a href="/vendor/dashboard" className="block px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600">Dashboard</a>
            <a href="/vendor/orders" className="block px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600">Orders</a>
            <a href="/vendor/products" className="block px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-blue-600">Products</a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm">
            <div className="px-6 py-4">
              <h1 className="text-xl font-semibold text-gray-800">Welcome Back</h1>
            </div>
          </header>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </VendorGuard>
  );
}
