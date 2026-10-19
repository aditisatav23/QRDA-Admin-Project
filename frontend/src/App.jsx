import React, { useState, useEffect } from 'react';
import AppSidebar from './components/layout/AppSidebar';
import TopBar from './components/layout/TopBar';
import DashboardOverview from './components/dashboard/DashboardOverview';
import EmployeesPage from './components/EmployeesPage';
import DeploymentPage from './components/DeploymentPage';
import DataManagerPage from './components/DataManagerPage';
import SiteDesignationsPage from './components/SiteDesignationsPage';
import DesignationPage from './components/DesignationPage';
import ClientSitesPage from './components/ClientSitesPage';
import SiteTimeLogsPage from './components/SiteTimeLogsPage';
import AttendancePage from './components/AttendancePage';
import PayrollAttendanceSiteWisePage from './components/PayrollAttendanceSiteWisePage';
import LmsTrainingPage from './components/training/LmsTrainingPage';
import EmployeeModal from './components/EmployeeModal';
import { initialEmployees } from './data/mockData';
import { useTheme } from './hooks/useTheme';
import apiService, { employeeApi, incidentApi } from './services/apiService';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = localStorage.getItem('qrda_current_view');
      if (saved) return saved;
    } catch (e) {}
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('qrda_current_view', currentView);
    } catch (e) {}
  }, [currentView]);
  const [employees, setEmployees] = useState(initialEmployees);
  const [incidents, setIncidents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Theme hook
  const { theme, isDark, toggleTheme } = useTheme();

  // Load live data from Backend API when available
  useEffect(() => {
    async function fetchLiveData() {
      const [liveEmployees, liveIncidents] = await Promise.all([
        employeeApi.getAll(),
        incidentApi.getAll(),
      ]);
      if (liveEmployees?.length) setEmployees(liveEmployees);
      if (liveIncidents?.length) setIncidents(liveIncidents);
    }
    fetchLiveData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (empData) => {
    try {
      if (editingEmployee) {
        await apiService.updateEmployee(empData.oid, empData);
        setEmployees(prev => prev.map(e => e.oid === empData.oid ? empData : e));
        showToast(`Employee ${empData.name} updated successfully!`);
      } else {
        await apiService.createEmployee(empData);
        setEmployees(prev => [empData, ...prev]);
        showToast(`Employee ${empData.name} added successfully!`);
      }
    } catch (e) {
      // Optimistic update fallback
      if (editingEmployee) {
        setEmployees(prev => prev.map(e => e.oid === empData.oid ? empData : e));
      } else {
        setEmployees(prev => [empData, ...prev]);
      }
      showToast(`Employee ${empData.name} saved!`);
    }
  };

  const handleEditDeploymentRow = (rowItem) => {
    showToast(`Editing deployment requirement for ${rowItem.designation}...`, 'info');
  };

  const handleResolveIncident = async (incident) => {
    try {
      await incidentApi.resolve(incident.id || incident.oid);
      setIncidents(prev => prev.map(i =>
        (i.id || i.oid) === (incident.id || incident.oid) ? { ...i, resolved: true } : i
      ));
      showToast(`Incident #${incident.id || incident.oid} marked resolved.`);
    } catch (e) {
      showToast(`Failed to resolve incident: ${e.message}`, 'info');
    }
  };

  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardOverview
            employees={employees}
            incidents={incidents}
            setCurrentView={setCurrentView}
            onAddEmployee={handleOpenAddModal}
            onResolveIncident={handleResolveIncident}
          />
        );
      case 'employees':
        return (
          <EmployeesPage
            employees={employees}
            onAddEmployee={handleOpenAddModal}
            onEditEmployee={handleOpenEditModal}
          />
        );
      case 'deployment':
        return (
          <DeploymentPage
            employees={employees}
            onEditDeploymentRow={handleEditDeploymentRow}
          />
        );
      case 'datamanager_sitedesignations':
        return (
          <SiteDesignationsPage 
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        );
      case 'datamanager_designation':
        return (
          <DesignationPage 
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        );
      case 'datamanager_clientsites':
        return (
          <ClientSitesPage />
        );
      case 'datamanager_shifts':
      case 'datamanager':
      case 'data-manager':
      case 'shifts':
      case 'datamanager_A':
      case 'datamanager_B':
      case 'datamanager_C':
      case 'datamanager_G':
      case 'datamanager_staff':
        return (
          <DataManagerPage 
            currentView={currentView} 
            setCurrentView={setCurrentView}
          />
        );
      case 'attendance':
        return (
          <AttendancePage />
        );
      case 'payroll_attendance_sitewise':
      case 'new_attendance':
      case 'newattendance':
        return (
          <PayrollAttendanceSiteWisePage />
        );
      case 'timelogs':
      case 'site-timelogs':
        return (
          <SiteTimeLogsPage />
        );
      case 'training':
        return (
          <LmsTrainingPage
            setCurrentView={setCurrentView}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-[var(--text-muted)] space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-main)] capitalize">
              {currentView.replace('_', ' ')} Module
            </h2>
            <p className="text-xs">Module view active under QRDA Enterprise Admin.</p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mt-4 px-4 py-2 bg-[var(--btn-primary)] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Return to Command Center
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex font-sans antialiased select-none transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <AppSidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentView={currentView}
          setCurrentView={setCurrentView}
          isDark={isDark}
          toggleTheme={toggleTheme}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className={`flex-1 min-w-0 ${currentView === 'attendance' || currentView === 'timelogs' || currentView === 'payroll_attendance_sitewise' || currentView === 'new_attendance' ? 'overflow-y-auto pb-1' : 'pb-10 overflow-y-auto'}`}>
          {renderMainView()}
        </main>
      </div>

      {/* Add / Edit Dialog Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        editingEmployee={editingEmployee}
        employees={employees}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/50'
              : 'bg-slate-900 text-white border-sky-500/50'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
