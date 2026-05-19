export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Today's Sales</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Active Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-center py-10 text-gray-500">
          No activity found today.
        </div>
      </div>
    </div>
  );
}
