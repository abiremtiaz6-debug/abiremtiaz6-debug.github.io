import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { NiktoResponse, TaskItem } from '../types';

interface DashboardProps {
  tasks: TaskItem[];
  onUpdateTaskStatus?: (id: string, status: 'Pending' | 'In Progress' | 'Completed') => void;
  onBulkUpdate?: (ids: string[], updates: Partial<TaskItem>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, onUpdateTaskStatus, onBulkUpdate }) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState('');

  // Extract unique assignees
  const assignees = useMemo(() => {
    const list = tasks.filter(t => t.IsTask && t.Assignee).map(t => t.Assignee!);
    return ['All', ...Array.from(new Set(list))];
  }, [tasks]);

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return 'No Deadline';
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return 'Invalid';
    const now = new Date();
    // Only count as overdue if not completed
    if (d < now) return 'Overdue';
    return 'Upcoming';
  };

  // Filter Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Base check: We are displaying Tasks here primarily
      if (!t.IsTask) return false;

      // Priority Filter
      if (priorityFilter !== 'All' && t.Priority !== priorityFilter) return false;

      // Assignee Filter
      if (assigneeFilter !== 'All' && t.Assignee !== assigneeFilter) return false;

      // Deadline Status Filter
      if (deadlineFilter !== 'All') {
          const status = getDeadlineStatus(t.Deadline);
          if (deadlineFilter === 'Overdue' && (status !== 'Overdue' || t.status === 'Completed')) return false; // Don't show completed as overdue usually
          if (deadlineFilter === 'Upcoming' && status !== 'Upcoming') return false;
          if (deadlineFilter === 'No Deadline' && status !== 'No Deadline') return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = t.TaskName.toLowerCase().includes(q);
        const matchDesc = t.Description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter, deadlineFilter, searchQuery]);

  // Derived Data for Charts based on FILTERED tasks
  const priorityData = [
    { name: 'High', value: filteredTasks.filter(t => t.Priority === 'High').length, color: '#dc2626' },
    { name: 'Medium', value: filteredTasks.filter(t => t.Priority === 'Medium').length, color: '#f59e0b' },
    { name: 'Low', value: filteredTasks.filter(t => t.Priority === 'Low').length, color: '#10b981' },
  ];

  // Progress Calculations
  const totalTaskCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.status === 'Completed').length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'In Progress').length;
  const completionRate = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  // Selection Logic
  const isAllSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
      if (isAllSelected) {
          // Deselect currently filtered
          const filteredIds = filteredTasks.map(t => t.id);
          setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
      } else {
          // Select all currently filtered
          const filteredIds = filteredTasks.map(t => t.id);
          setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
      }
  };

  const toggleSelectRow = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const executeBulkUpdate = (updates: Partial<TaskItem>) => {
      if (onBulkUpdate && selectedIds.length > 0) {
          onBulkUpdate(selectedIds, updates);
          setSelectedIds([]); // Clear selection after action
          setBulkAssignee('');
      }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in pb-20">
      
      {/* Filters & Search Bar */}
      <div className="bg-nikto-surface p-4 rounded-xl border border-gray-700 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="flex flex-wrap gap-4 w-full md:w-auto">
             {/* Priority Select */}
             <div className="relative">
                 <select
                   value={priorityFilter}
                   onChange={e => setPriorityFilter(e.target.value)}
                   className="appearance-none bg-slate-900 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-white focus:ring-2 focus:ring-nikto-primary outline-none cursor-pointer hover:border-gray-500"
                 >
                   <option value="All">All Priorities</option>
                   <option value="High">High Priority</option>
                   <option value="Medium">Medium Priority</option>
                   <option value="Low">Low Priority</option>
                 </select>
                 <i className="fas fa-chevron-down absolute right-3 top-3 text-gray-400 pointer-events-none text-xs"></i>
             </div>

             {/* Assignee Select */}
             <div className="relative">
                 <select
                   value={assigneeFilter}
                   onChange={e => setAssigneeFilter(e.target.value)}
                   className="appearance-none bg-slate-900 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-white focus:ring-2 focus:ring-nikto-primary outline-none cursor-pointer hover:border-gray-500"
                 >
                    {assignees.map(a => <option key={a} value={a}>{a === 'All' ? 'All Assignees' : a}</option>)}
                 </select>
                 <i className="fas fa-chevron-down absolute right-3 top-3 text-gray-400 pointer-events-none text-xs"></i>
             </div>

             {/* Deadline Select */}
             <div className="relative">
                 <select
                   value={deadlineFilter}
                   onChange={e => setDeadlineFilter(e.target.value)}
                   className="appearance-none bg-slate-900 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-white focus:ring-2 focus:ring-nikto-primary outline-none cursor-pointer hover:border-gray-500"
                 >
                   <option value="All">All Deadlines</option>
                   <option value="Overdue">Overdue (Active)</option>
                   <option value="Upcoming">Upcoming</option>
                   <option value="No Deadline">No Deadline</option>
                 </select>
                 <i className="fas fa-chevron-down absolute right-3 top-3 text-gray-400 pointer-events-none text-xs"></i>
             </div>
         </div>
         
         <div className="relative w-full md:w-64">
            <i className="fas fa-search absolute left-3 top-3 text-gray-500"></i>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
            />
         </div>
      </div>
      
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-xl border border-nikto-primary shadow-[0_0_15px_rgba(220,38,38,0.2)] flex flex-wrap items-center gap-4 animate-fade-in relative z-20">
              <div className="flex items-center gap-2 text-white font-bold border-r border-gray-600 pr-4 mr-2">
                  <span className="bg-nikto-primary px-2 py-0.5 rounded text-sm">{selectedIds.length}</span>
                  <span className="hidden sm:inline">Selected</span>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center flex-1">
                  <select 
                    className="bg-slate-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-nikto-primary outline-none cursor-pointer"
                    onChange={(e) => executeBulkUpdate({ status: e.target.value as any })}
                    value=""
                  >
                      <option value="" disabled>Set Status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                  </select>

                  <select
                     className="bg-slate-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:border-nikto-primary outline-none cursor-pointer"
                     onChange={(e) => executeBulkUpdate({ Priority: e.target.value as any })}
                     value=""
                  >
                      <option value="" disabled>Set Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                  </select>

                  <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        placeholder="Assignee..." 
                        value={bulkAssignee}
                        onChange={(e) => setBulkAssignee(e.target.value)}
                        className="bg-slate-900 border border-gray-600 rounded-l px-3 py-1.5 text-sm text-white focus:border-nikto-primary outline-none w-32"
                        onKeyDown={(e) => e.key === 'Enter' && bulkAssignee && executeBulkUpdate({ Assignee: bulkAssignee })}
                      />
                      <button 
                        onClick={() => bulkAssignee && executeBulkUpdate({ Assignee: bulkAssignee })}
                        className="bg-slate-700 hover:bg-slate-600 border border-l-0 border-gray-600 text-white px-3 py-1.5 rounded-r text-sm font-medium"
                      >
                          Apply
                      </button>
                  </div>
              </div>
              
              <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-white text-sm font-medium px-2">
                  Cancel
              </button>
          </div>
      )}

      {/* Progress & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="bg-slate-800 p-4 rounded-lg border border-gray-700 shadow-md relative overflow-hidden md:col-span-1">
            <h3 className="text-gray-400 text-sm font-bold uppercase mb-2">Completion Rate</h3>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">{completionRate}%</span>
                <span className="text-sm text-gray-400 mb-1">of filtered tasks</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-nikto-primary to-orange-500 h-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
            </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 shadow-md">
           <h3 className="text-gray-400 text-sm">In Progress</h3>
           <p className="text-2xl font-bold text-white">{inProgressCount}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500 shadow-md">
           <h3 className="text-gray-400 text-sm">Completed</h3>
           <p className="text-2xl font-bold text-white">{completedCount}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-600 shadow-md">
           <h3 className="text-gray-400 text-sm">High Priority</h3>
           <p className="text-2xl font-bold text-white">{priorityData[0].value}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="bg-nikto-surface p-6 rounded-xl border border-gray-700 shadow-lg h-96 md:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-nikto-primary">Priority Distribution</h3>
            {filteredTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{fill: '#334155'}}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
            )}
          </div>

          {/* Task List */}
          <div className="bg-nikto-surface rounded-xl border border-gray-700 shadow-lg overflow-hidden md:col-span-2 flex flex-col h-96">
             <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-slate-800/50">
                <h3 className="font-bold text-lg text-white"><i className="fas fa-list-ul mr-2 text-nikto-primary"></i>Task Progress</h3>
             </div>
             <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-slate-900 text-gray-200 uppercase font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-10 text-center">
                                <input 
                                    type="checkbox" 
                                    checked={isAllSelected} 
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-600 bg-slate-800 text-nikto-primary focus:ring-offset-slate-900 focus:ring-nikto-primary"
                                />
                            </th>
                            <th className="p-3 w-1/3">Task</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Deadline</th>
                            <th className="p-3">Assignee</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredTasks.length > 0 ? filteredTasks.map(task => {
                            const dStatus = getDeadlineStatus(task.Deadline);
                            const isOverdue = dStatus === 'Overdue' && task.status !== 'Completed';
                            const isSelected = selectedIds.includes(task.id);
                            
                            return (
                                <tr key={task.id} className={`${isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/50'} transition-colors`}>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => toggleSelectRow(task.id)}
                                            className="rounded border-gray-600 bg-slate-800 text-nikto-primary focus:ring-offset-slate-900 focus:ring-nikto-primary"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-white max-w-[200px] truncate" title={task.TaskName}>
                                        {task.TaskName}
                                        {task.Tags && task.Tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {task.Tags.map(tag => (
                                                    <span key={tag} className="text-[10px] bg-gray-700 px-1.5 rounded text-gray-300">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="relative inline-block group">
                                            <button 
                                                className={`px-2 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1
                                                ${task.status === 'Completed' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                                                  task.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 
                                                  'bg-gray-700 text-gray-400 border-gray-600'}`}
                                            >
                                                {task.status === 'Completed' && <i className="fas fa-check"></i>}
                                                {task.status === 'In Progress' && <i className="fas fa-spinner fa-spin"></i>}
                                                {task.status === 'Pending' && <i className="far fa-circle"></i>}
                                                {task.status}
                                            </button>
                                            
                                            {/* Status Dropdown on Hover/Focus */}
                                            {onUpdateTaskStatus && (
                                                <div className="absolute top-full left-0 mt-1 w-32 bg-slate-800 border border-gray-600 rounded-lg shadow-xl z-20 hidden group-hover:block">
                                                    <button onClick={() => onUpdateTaskStatus(task.id, 'Pending')} className="block w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-gray-300">Pending</button>
                                                    <button onClick={() => onUpdateTaskStatus(task.id, 'In Progress')} className="block w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-blue-300">In Progress</button>
                                                    <button onClick={() => onUpdateTaskStatus(task.id, 'Completed')} className="block w-full text-left px-3 py-2 hover:bg-slate-700 text-xs text-green-300">Completed</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                            task.Priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                            task.Priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        }`}>
                                            {task.Priority === 'High' && <i className="fas fa-exclamation-triangle mr-1"></i>}
                                            {task.Priority || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className={`text-xs ${isOverdue ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                                            {task.Deadline || 'No Date'}
                                        </div>
                                        {isOverdue && <span className="text-[10px] text-red-500 uppercase">Overdue</span>}
                                    </td>
                                    <td className="p-3 text-gray-300 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                                            {task.Assignee ? task.Assignee.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span className="truncate max-w-[80px]">{task.Assignee || 'Unassigned'}</span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <i className="far fa-folder-open text-3xl mb-2 opacity-50"></i>
                                        No tasks match your filters.
                                    </div>
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

export default Dashboard;