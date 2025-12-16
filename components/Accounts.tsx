import React, { useState } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AccountsProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const Accounts: React.FC<AccountsProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('General');

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAddTransaction({
        amount: parseFloat(amount),
        type,
        category,
        description
    });
    setAmount('');
    setDescription('');
    setCategory('General');
  };

  // Sort by date desc
  const sortedTransactions = [...transactions].sort((a, b) => b.date - a.date);

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <i className="fas fa-wallet text-nikto-primary"></i> Financial Accounts
        </h2>
        <div className="text-sm text-gray-400">Manage your agency cash flow</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-gray-700 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="text-gray-400 text-sm uppercase font-bold tracking-wider">Current Balance</h3>
                <p className={`text-4xl font-bold mt-2 ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    ${balance.toLocaleString()}
                </p>
            </div>
            <i className="fas fa-coins absolute -right-4 -bottom-4 text-9xl text-white opacity-5"></i>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-green-500 shadow-lg">
            <h3 className="text-green-400 text-sm uppercase font-bold tracking-wider">Total Income</h3>
            <p className="text-3xl font-bold text-white mt-1">+${totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border-l-4 border-red-500 shadow-lg">
            <h3 className="text-red-400 text-sm uppercase font-bold tracking-wider">Total Expenses</h3>
            <p className="text-3xl font-bold text-white mt-1">-${totalExpense.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Transaction Form */}
        <div className="bg-nikto-surface p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Add Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Type</label>
                    <div className="flex bg-slate-900 rounded-lg p-1">
                        <button 
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 text-sm font-bold rounded ${type === 'income' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Income
                        </button>
                        <button 
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 text-sm font-bold rounded ${type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Expense
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Amount ($)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
                        placeholder="0.00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Description</label>
                    <input 
                        type="text" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
                        placeholder="e.g., Client Payment, Server Cost"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Category</label>
                    <select 
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
                    >
                        <option>General</option>
                        <option>Project Fee</option>
                        <option>Salary</option>
                        <option>Software/Tools</option>
                        <option>Marketing</option>
                        <option>Office</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-nikto-primary hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all mt-2">
                    <i className="fas fa-plus mr-2"></i> Add Record
                </button>
            </form>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2 bg-nikto-surface rounded-xl border border-gray-700 shadow-lg flex flex-col h-[500px]">
             <div className="p-4 border-b border-gray-700 bg-slate-800/50 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-white">Recent Transactions</h3>
                 <span className="text-xs text-gray-400 bg-slate-900 px-2 py-1 rounded">{transactions.length} entries</span>
             </div>
             <div className="flex-1 overflow-auto custom-scrollbar p-0">
                 <table className="w-full text-left text-sm text-gray-400">
                     <thead className="bg-slate-900 text-gray-200 uppercase font-bold sticky top-0">
                         <tr>
                             <th className="p-4">Description</th>
                             <th className="p-4">Date</th>
                             <th className="p-4 text-right">Amount</th>
                             <th className="p-4 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-700">
                         {sortedTransactions.length > 0 ? sortedTransactions.map(t => (
                             <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                                 <td className="p-4">
                                     <div className="font-medium text-white">{t.description}</div>
                                     <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                         <span className="bg-slate-800 px-1.5 rounded">{t.category}</span>
                                     </div>
                                 </td>
                                 <td className="p-4 text-xs">
                                     {new Date(t.date).toLocaleDateString()}
                                 </td>
                                 <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                     {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                                 </td>
                                 <td className="p-4 text-center">
                                     <button onClick={() => onDeleteTransaction(t.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                         <i className="fas fa-trash"></i>
                                     </button>
                                 </td>
                             </tr>
                         )) : (
                             <tr>
                                 <td colSpan={4} className="p-12 text-center text-gray-500">
                                     No transactions found. Start tracking your agency finances.
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;