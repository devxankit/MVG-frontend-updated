import React, { useState } from 'react';
import { FaWallet, FaMoneyBillWave, FaChartLine, FaUsers } from 'react-icons/fa';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs.jsx';
import { Card, CardContent } from '../ui/Card.jsx';
import AdminWalletOverview from './AdminWalletOverview.jsx';
import AdminWithdrawalManagement from './AdminWithdrawalManagement.jsx';
import AdminSellerEarnings from './AdminSellerEarnings.jsx';

const AdminWallet = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabConfig = [
    {
      value: 'overview',
      label: 'Overview',
      icon: FaWallet,
      description: 'Platform financial summary'
    },
    {
      value: 'withdrawals',
      label: 'Withdrawals',
      icon: FaMoneyBillWave,
      description: 'Manage withdrawal requests'
    },
    {
      value: 'earnings',
      label: 'Seller Earnings',
      icon: FaChartLine,
      description: 'Track seller performance'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <FaWallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Wallet Management</h2>
            <p className="text-blue-100 text-sm sm:text-base">Manage platform finances, withdrawals, and seller earnings</p>
          </div>
        </div>
      </div>

      {/* Clean Tabs - Mobile Responsive */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Simple Tab Navigation */}
            <div className="bg-gray-50 p-1">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto bg-transparent p-1 rounded-lg border-0">
                {tabConfig.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.value;
                  
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="
                        flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:p-4 rounded-md transition-all duration-200
                        data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200
                        hover:bg-white/70
                      "
                    >
                      <div className="flex items-center gap-2">
                        <div className={`
                          p-1.5 rounded-md transition-colors duration-200
                          ${isActive 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-500'
                          }
                        `}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <div className={`
                            font-semibold text-sm transition-colors duration-200
                            ${isActive ? 'text-blue-700' : 'text-gray-700'}
                          `}>
                            {tab.label}
                          </div>
                          <div className={`
                            text-xs transition-colors duration-200 hidden sm:block
                            ${isActive ? 'text-blue-500' : 'text-gray-500'}
                          `}>
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="overview" className="space-y-4 mt-0">
                <AdminWalletOverview />
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4 mt-0">
                <AdminWithdrawalManagement />
              </TabsContent>

              <TabsContent value="earnings" className="space-y-4 mt-0">
                <AdminSellerEarnings />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWallet;
