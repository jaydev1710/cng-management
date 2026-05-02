'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ticketService, companyService } from '@/lib/firebase-services';

interface Ticket {
  id?: string;
  documentId?: string;
  ticketId: string;
  company: string;
  companyId: string;
  contact: string;
  contactPhone: string;
  contactEmail: string;
  device: string;
  deviceId: string;
  problem: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdDate: string;
  createdBy: string;
  assignedTo: string;
  assignedToId: number;
  dueDate: string;
  attachments: number;
  comments: number;
  whatsappEnabled: boolean;
  resolvedDate?: string;
  resolution?: string;
}

export default function TicketsPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [tempPriority, setTempPriority] = useState('');
  
  // State for Firebase data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company: '',
    companyId: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    device: '',
    deviceId: '',
    problem: '',
    description: '',
    category: '',
    priority: 'Medium',
    assignedTo: ''
  });

  // Fetch data from Firebase
  useEffect(() => {
    fetchTickets();
    fetchCompanies();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAll();
      const transformedTickets = data.map((item: any) => ({
        id: item.documentId,
        documentId: item.documentId,
        ticketId: item.ticketId || `TKT-${item.documentId?.slice(0, 8)}`,
        company: item.company || '',
        companyId: item.companyId || '',
        contact: item.contact || '',
        contactPhone: item.contactPhone || '',
        contactEmail: item.contactEmail || '',
        device: item.device || '',
        deviceId: item.deviceId || '',
        problem: item.problem || '',
        description: item.description || '',
        category: item.category || 'Other',
        priority: item.priority || 'Medium',
        status: item.status || 'Open',
        createdDate: item.createdDate || item.createdAt || new Date().toLocaleString(),
        createdBy: item.createdBy || 'Admin',
        assignedTo: item.assignedTo || 'Unassigned',
        assignedToId: item.assignedToId || 0,
        dueDate: item.dueDate || new Date(Date.now() + 86400000).toLocaleDateString(),
        attachments: item.attachments || 0,
        comments: item.comments || 0,
        whatsappEnabled: item.whatsappEnabled ?? true,
        resolvedDate: item.resolvedDate || null,
        resolution: item.resolution || null
      }));
      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getAll();
      const transformedCompanies = data.map((item: any) => ({
        id: item.documentId,
        name: item.name || '',
        location: item.location || '',
        contact: item.contact || ''
      }));
      setCompanies(transformedCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const updateTicketPriority = async (ticketId: string, newPriority: string) => {
    try {
      setLoading(true);
      await ticketService.update(ticketId, { priority: newPriority });
      await fetchTickets();
      setEditingPriorityId(null);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      alert('Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const productCatalog: { [key: string]: string[] } = {
    'Laptop': ['Dell Latitude 5420', 'Dell XPS 13', 'HP EliteBook 840', 'HP ProBook 450', 'Lenovo ThinkPad X1', 'Apple MacBook Air M1', 'Apple MacBook Pro 14"'],
    'Desktop': ['Dell OptiPlex 7080', 'Dell XPS Desktop', 'HP EliteDesk 800', 'HP Pavilion Desktop', 'Lenovo ThinkCentre M70s', 'Apple Mac Mini', 'Apple iMac 24"'],
    'Printer': ['HP LaserJet Pro M15w', 'HP OfficeJet Pro 9015', 'Canon imageCLASS MF743Cdw', 'Epson WorkForce Pro WF-3720', 'Brother HL-L2350DW'],
    'Server': ['Dell PowerEdge R740', 'Dell PowerEdge T340', 'HP ProLiant DL380', 'Lenovo ThinkSystem SR650', 'Cisco UCS C220'],
    'Network': ['Cisco Catalyst 9200', 'Cisco Meraki MX68', 'Juniper EX2300', 'Ubiquiti UniFi Dream Machine', 'Netgear GS724T'],
    'Mobile': ['iPhone 14 Pro', 'iPhone 13', 'Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11', 'iPad Pro 12.9"'],
    'Other': ['Projector', 'Scanner', 'Router', 'Switch', 'Firewall', 'UPS', 'Monitor']
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedProduct('');
    if (category && productCatalog[category]) {
      setFilteredProducts(productCatalog[category]);
    } else {
      setFilteredProducts([]);
    }
    setFormData(prev => ({ ...prev, category }));
  };

  const handleCompanySelect = (company: any) => {
    setCompanySearch(company.name);
    setFormData(prev => ({ ...prev, company: company.name, companyId: company.id }));
    setShowCompanyDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendWhatsAppMessage = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setWhatsappSent(true);
    setTimeout(() => {
      setWhatsappSent(false);
      setShowWhatsAppModal(false);
      setWhatsappMessage('');
    }, 2000);
  };

  const createNewTicket = async () => {
    if (!formData.company || !formData.contactName || !formData.contactPhone || !formData.problem) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const newTicketId = `TKT-${new Date().getFullYear()}-${(tickets.length + 1).toString().padStart(3, '0')}`;
      
      const newTicket = {
        ticketId: newTicketId,
        company: formData.company,
        companyId: formData.companyId,
        contact: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        device: formData.device,
        deviceId: formData.deviceId,
        problem: formData.problem,
        description: formData.description,
        category: formData.category || 'Other',
        priority: formData.priority,
        status: 'Open',
        createdDate: new Date().toLocaleString(),
        createdBy: 'Admin',
        assignedTo: formData.assignedTo || 'Unassigned',
        assignedToId: 0,
        dueDate: new Date(Date.now() + 86400000).toLocaleDateString(),
        attachments: 0,
        comments: 0,
        whatsappEnabled: true,
        createdAt: new Date().toISOString()
      };

      await ticketService.add(newTicket);
      await fetchTickets();
      
      const whatsappMsg = `🔔 *New Ticket Created*\n\nTicket ID: ${newTicketId}\nProblem: ${formData.problem}\nPriority: ${formData.priority}\nStatus: Open\n\nYour ticket has been created. Our technician will contact you soon.`;
      sendWhatsAppMessage(formData.contactPhone, whatsappMsg);
      
      setShowModal(false);
      setFormData({
        company: '', companyId: '', contactName: '', contactPhone: '', contactEmail: '',
        device: '', deviceId: '', problem: '', description: '', category: '', priority: 'Medium', assignedTo: ''
      });
      setSelectedCategory('');
      setSelectedProduct('');
      setCompanySearch('');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticket: Ticket, newStatus: string, note: string = '') => {
    if (!ticket.documentId) return;
    
    try {
      setLoading(true);
      const updateData: any = { status: newStatus };
      if (newStatus === 'Closed') {
        updateData.resolvedDate = new Date().toLocaleString();
        updateData.resolution = note || 'Issue resolved';
      }
      
      await ticketService.update(ticket.documentId, updateData);
      await fetchTickets();
      
      let statusMessage = '';
      if (newStatus === 'In Progress') {
        statusMessage = `🔄 *Ticket Status Update*\n\nTicket ID: ${ticket.ticketId}\nStatus: In Progress\nNote: ${note || 'Technician has started working on your ticket.'}`;
      } else if (newStatus === 'Closed') {
        statusMessage = `✅ *Ticket Resolved*\n\nTicket ID: ${ticket.ticketId}\nStatus: Closed\nResolution: ${note || 'Issue resolved'}`;
      }
      if (statusMessage) sendWhatsAppMessage(ticket.contactPhone, statusMessage);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    } finally {
      setLoading(false);
      setShowStatusModal(false);
      setStatusNote('');
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
    highPriority: tickets.filter(t => t.priority === 'High').length,
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return { bg: '#fef3c7', color: '#92400e' };
      case 'In Progress': return { bg: '#dbeafe', color: '#1e40af' };
      case 'Closed': return { bg: '#d1fae5', color: '#166534' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return { bg: '#fee2e2', color: '#991b1b' };
      case 'Medium': return { bg: '#fef3c7', color: '#92400e' };
      case 'Low': return { bg: '#d1fae5', color: '#166534' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const handleStatusAction = (ticket: Ticket, action: string) => {
    setSelectedTicket(ticket);
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const handleSendWhatsApp = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setWhatsappMessage(`Ticket ${ticket.ticketId} update: Your ticket is ${ticket.status}`);
    setShowWhatsAppModal(true);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/companies', icon: '🏢', label: 'Companies' },
    { path: '/devices', icon: '💻', label: 'Devices' },
    { path: '/tickets', icon: '🎫', label: 'Tickets' },
    { path: '/reports', icon: '📈', label: 'Reports' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  const getMainContentMargin = () => {
    if (isMobile) return '0';
    return collapsed ? '70px' : '250px';
  };

  // Mobile Ticket Card
  const MobileTicketCard = ({ ticket }: { ticket: Ticket }) => {
    const statusStyle = getStatusColor(ticket.status);
    const priorityStyle = getPriorityColor(ticket.priority);

    return (
      <div
        onClick={() => setSelectedTicket(ticket)}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          border: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>{ticket.ticketId}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{ticket.company}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '500' }}>{ticket.status}</span>
            <span style={{ background: priorityStyle.bg, color: priorityStyle.color, padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '500' }}>{ticket.priority}</span>
          </div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>{ticket.problem}</div>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          <div>👤 {ticket.contact}</div>
          <div>📞 {ticket.contactPhone}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: '#666' }}>📅 {ticket.dueDate}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(ticket); }} style={{ background: '#25D366', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>📱</button>
            {ticket.status !== 'In Progress' && ticket.status !== 'Closed' && (
              <button onClick={(e) => { e.stopPropagation(); handleStatusAction(ticket, 'In Progress'); }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Start</button>
            )}
            {ticket.status !== 'Closed' && (
              <button onClick={(e) => { e.stopPropagation(); handleStatusAction(ticket, 'Closed'); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Close</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div style={{
      width: collapsed ? '70px' : '250px',
      height: '100vh',
      background: '#1e293b',
      color: 'white',
      position: 'fixed',
      left: 0,
      top: 0,
      transition: 'width 0.3s',
      overflowX: 'hidden',
      overflowY: 'auto',
      zIndex: 1000
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AC</div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>Access Computer</h3>
          </div>
        ) : (
          <div style={{ margin: '0 auto' }}>
            <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AC</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: '#334155', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>{collapsed ? '→' : '←'}</button>
      </div>
      <div style={{ padding: '10px 0' }}>
        {menuItems.map((item) => (
          <div key={item.path} onClick={() => router.push(item.path)} style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '12px' : '12px 20px', cursor: 'pointer',
            background: item.path === '/tickets' ? '#334155' : 'transparent',
            borderLeft: item.path === '/tickets' ? '4px solid #3b82f6' : '4px solid transparent'
          }}>
            <span style={{ fontSize: '20px', minWidth: '30px' }}>{item.icon}</span>
            {!collapsed && <span style={{ marginLeft: '10px' }}>{item.label}</span>}
          </div>
        ))}
      </div>
      {!collapsed && (
        <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '20px', borderTop: '1px solid #334155', background: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>A</div>
            <div><div style={{ fontWeight: 'bold' }}>Admin User</div><div style={{ fontSize: '12px', color: '#94a3b8' }}>admin@itasset.com</div></div>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      {mobileSidebarOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={() => setMobileSidebarOpen(false)} />
      )}
      <div style={{
        position: 'fixed', top: 0, left: mobileSidebarOpen ? 0 : '-280px', width: '280px', height: '100%',
        background: '#1e293b', color: 'white', zIndex: 1001, transition: 'left 0.3s ease',
        display: 'flex', flexDirection: 'column', boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ width: 32, height: 32, background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AC</div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>Access Computer</h3>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', padding: '5px' }}>×</button>
        </div>
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '50px', height: '50px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>A</div>
            <div><div style={{ fontWeight: 'bold', fontSize: '16px' }}>Admin User</div><div style={{ fontSize: '12px', color: '#94a3b8' }}>admin@itasset.com</div></div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {menuItems.map((item) => (
            <div key={item.path} onClick={() => { router.push(item.path); setMobileSidebarOpen(false); }} style={{
              display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer',
              background: item.path === '/tickets' ? '#334155' : 'transparent',
              borderLeft: item.path === '/tickets' ? '4px solid #3b82f6' : '4px solid transparent',
              margin: '0 8px', borderRadius: '8px'
            }}>
              <span style={{ fontSize: '22px', minWidth: '40px' }}>{item.icon}</span>
              <span style={{ marginLeft: '12px', fontSize: '15px' }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #334155', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          <div>© 2026 Dcodes tech Manager</div>
          <div style={{ marginTop: '5px' }}>Version 1.0.0</div>
        </div>
      </div>
    </>
  );

  // Mobile Header
  const MobileHeader = () => (
    <div style={{
      position: 'sticky', top: 0, background: 'white', padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 99, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setMobileSidebarOpen(true)} style={{ background: '#f3f4f6', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '10px', borderRadius: '12px', width: '44px', height: '44px' }}>☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>AC</div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>Tickets</h3>
        </div>
      </div>
      <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', minHeight: '44px' }}>+ New</button>
    </div>
  );

  if (loading && tickets.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading tickets...</div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      {isMobile ? (
        <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
          <MobileHeader />
          <MobileSidebar />

          <div style={{ flex: 1, padding: '16px', width: '100%', boxSizing: 'border-box' }}>
            {/* Stats Cards - 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Total</div>
              </div>
              <div style={{ background: 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.open}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Open</div>
              </div>
              <div style={{ background: 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.inProgress}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Progress</div>
              </div>
              <div style={{ background: 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.closed}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Closed</div>
              </div>
              <div style={{ background: 'white', padding: '14px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.highPriority}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>High</div>
              </div>
            </div>

            {/* WhatsApp Status */}
            <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #25D366' }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold', color: '#075e54', fontSize: '13px' }}>WhatsApp Active</span></div>
              <span style={{ color: '#25D366', fontWeight: 'bold', fontSize: '12px' }}>✓ Connected</span>
            </div>

            {/* Search & Filters */}
            <div style={{ background: 'white', padding: '12px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <input type="text" placeholder="🔍 Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', marginBottom: '10px', background: '#f9fafb' }} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', background: 'white', marginBottom: '10px' }}>
                <option value="all">All Status</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Closed">Closed</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', background: 'white' }}>
                <option value="all">All Priority</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
              </select>
            </div>

            {/* Tickets List */}
            <div>{filteredTickets.map((ticket) => <MobileTicketCard key={ticket.id} ticket={ticket} />)}</div>
            {filteredTickets.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '16px', color: '#666' }}>No tickets found.</div>}
          </div>

          {/* Footer */}
          <div style={{ background: 'white', padding: '12px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>
            © {new Date().getFullYear()} Dcodes tech. All rights reserved.
          </div>
        </div>
      ) : (
        /* Desktop View */
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb', overflowX: 'hidden' }}>
          <DesktopSidebar />

          <div style={{ 
            marginLeft: getMainContentMargin(),
            flex: 1,
            width: `calc(100% - ${getMainContentMargin()})`,
            minHeight: '100vh',
            transition: 'margin-left 0.3s, width 0.3s',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Desktop Header */}
            <div style={{ background: 'white', padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>Tickets</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <button style={{ background: '#f3f4f6', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '8px', borderRadius: '50%', width: '40px', height: '40px' }}>🔔</button>
                <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+ New Ticket</button>
              </div>
            </div>

            {/* Desktop Content */}
            <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1 }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Total</div></div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.open}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Open</div></div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.inProgress}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Progress</div></div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.closed}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>Closed</div></div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.highPriority}</div><div style={{ fontSize: '14px', color: '#6b7280' }}>High</div></div>
              </div>

              {/* WhatsApp Status */}
              <div style={{ background: '#e8f5e9', padding: '15px 20px', borderRadius: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #25D366' }}>
                <span style={{ fontSize: '24px' }}>📱</span>
                <div style={{ flex: 1 }}><span style={{ fontWeight: 'bold', color: '#075e54', fontSize: '14px' }}>WhatsApp Active</span></div>
                <span style={{ color: '#25D366', fontWeight: 'bold', fontSize: '14px' }}>✓ Connected</span>
              </div>

              {/* Search & Filters */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                  <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', background: '#f9fafb' }} />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', background: 'white' }}>
                    <option value="all">All Status</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Closed">Closed</option>
                  </select>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', background: 'white' }}>
                    <option value="all">All Priority</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table */}
              <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Ticket ID</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Company</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Contact</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Problem</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Priority</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>WhatsApp</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>Actions</th>
                   </tr></thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const statusStyle = getStatusColor(ticket.status);
                      const priorityStyle = getPriorityColor(ticket.priority);
                      return (
                        <tr key={ticket.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '15px', fontSize: '13px', fontWeight: '500', color: '#3b82f6' }}>{ticket.ticketId}</td>
                          <td style={{ padding: '15px', fontSize: '13px' }}>{ticket.company}</td>
                          <td style={{ padding: '15px', fontSize: '12px' }}><div>{ticket.contact}</div><div style={{ fontSize: '11px', color: '#666' }}>{ticket.contactPhone}</div></td>
                          <td style={{ padding: '15px', fontSize: '13px', maxWidth: '200px' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.problem}</div></td>
                          <td style={{ padding: '15px' }}><span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>{ticket.status}</span></td>
                          <td style={{ padding: '15px' }}>
                            {editingPriorityId === ticket.id ? (
                              <select
                                value={tempPriority}
                                onChange={(e) => setTempPriority(e.target.value)}
                                onBlur={() => {
                                  if (tempPriority && tempPriority !== ticket.priority) {
                                    updateTicketPriority(ticket.documentId!, tempPriority);
                                  } else {
                                    setEditingPriorityId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (tempPriority && tempPriority !== ticket.priority) {
                                      updateTicketPriority(ticket.documentId!, tempPriority);
                                    } else {
                                      setEditingPriorityId(null);
                                    }
                                  }
                                }}
                                autoFocus
                                style={{ padding: '5px 8px', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '11px', background: 'white', cursor: 'pointer' }}
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            ) : (
                              <span 
                                onClick={() => {
                                  setEditingPriorityId(ticket.id!);
                                  setTempPriority(ticket.priority);
                                }}
                                style={{ 
                                  background: priorityStyle.bg, 
                                  color: priorityStyle.color, 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'inline-block'
                                }}
                              >
                                {ticket.priority} ▼
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '15px' }}><button onClick={() => handleSendWhatsApp(ticket)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>📱 WhatsApp</button></td>
                          <td style={{ padding: '15px' }}><div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => setSelectedTicket(ticket)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>View</button>
                            {ticket.status !== 'In Progress' && ticket.status !== 'Closed' && <button onClick={() => handleStatusAction(ticket, 'In Progress')} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Start</button>}
                            {ticket.status !== 'Closed' && <button onClick={() => handleStatusAction(ticket, 'Closed')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Close</button>}
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTickets.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>No tickets found.</div>}
              </div>
            </div>

            {/* Footer */}
            <div style={{ background: 'white', padding: '15px 30px', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              © {new Date().getFullYear()} Dcodes tech. All rights reserved.
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {selectedTicket && !showStatusModal && !showWhatsAppModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px'
        }} onClick={() => setSelectedTicket(null)}>
          <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: '20px', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px' }}>Ticket {selectedTicket.ticketId}</h2>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ background: getStatusColor(selectedTicket.status).bg, color: getStatusColor(selectedTicket.status).color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{selectedTicket.status}</span>
              <span style={{ background: getPriorityColor(selectedTicket.priority).bg, color: getPriorityColor(selectedTicket.priority).color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{selectedTicket.priority} Priority</span>
              <span style={{ background: '#25D36620', color: '#075e54', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>📱 WhatsApp Enabled</span>
            </div>
            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div><div style={{ fontWeight: 'bold' }}>Customer Contact</div><div>📞 {selectedTicket.contactPhone}</div><div>📧 {selectedTicket.contactEmail}</div></div>
              <button onClick={() => handleSendWhatsApp(selectedTicket)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>📱 Send WhatsApp</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Company Information</h3>
                <div><strong>{selectedTicket.company}</strong></div>
                <div>Contact: {selectedTicket.contact}</div>
              </div>
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Assignment</h3>
                <div><strong>Assigned To:</strong> {selectedTicket.assignedTo}</div>
                <div><strong>Created:</strong> {selectedTicket.createdDate}</div>
                <div><strong>Due Date:</strong> {selectedTicket.dueDate}</div>
              </div>
            </div>
            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Problem Description</h3>
              <div>{selectedTicket.description || selectedTicket.problem}</div>
            </div>
            {selectedTicket.resolution && (
              <div style={{ background: '#d1fae5', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#166534' }}>Resolution</h3>
                <div>{selectedTicket.resolution}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => handleSendWhatsApp(selectedTicket)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>📱 WhatsApp</button>
              {selectedTicket.status !== 'In Progress' && selectedTicket.status !== 'Closed' && (
                <button onClick={() => { handleStatusAction(selectedTicket, 'In Progress'); setSelectedTicket(null); }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Start Progress</button>
              )}
              {selectedTicket.status !== 'Closed' && (
                <button onClick={() => { handleStatusAction(selectedTicket, 'Closed'); setSelectedTicket(null); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Close Ticket</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedTicket && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px'
        }} onClick={() => setShowStatusModal(false)}>
          <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: '20px', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0' }}>{statusAction === 'Closed' ? 'Close Ticket' : 'Mark In Progress'}</h2>
            <p><strong>Ticket:</strong> {selectedTicket.ticketId}<br /><strong>Problem:</strong> {selectedTicket.problem}</p>
            {statusAction === 'Closed' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Resolution Notes *</label>
                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Describe how the issue was resolved..." rows={4} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
            )}
            {statusAction === 'In Progress' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Update Note (Optional)</label>
                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Add a note about progress..." rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowStatusModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => updateTicketStatus(selectedTicket, statusAction, statusNote)} style={{ padding: '10px 20px', background: statusAction === 'Closed' ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{statusAction === 'Closed' ? 'Close Ticket' : 'Start Progress'}</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && selectedTicket && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px'
        }} onClick={() => setShowWhatsAppModal(false)}>
          <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: '20px', width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><span style={{ fontSize: '32px' }}>📱</span><h2 style={{ margin: 0 }}>Send WhatsApp Message</h2></div>
            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div><strong>To:</strong> {selectedTicket.contact}</div>
              <div><strong>Phone:</strong> {selectedTicket.contactPhone}</div>
              <div><strong>Ticket:</strong> {selectedTicket.ticketId}</div>
            </div>
            <textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} rows={5} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }} />
            {whatsappSent && <div style={{ background: '#d1fae5', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>✅ Message sent successfully via WhatsApp!</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowWhatsAppModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => sendWhatsAppMessage(selectedTicket.contactPhone, whatsappMessage)} style={{ padding: '10px 20px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send via WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ticket Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px'
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: isMobile ? '20px' : '30px', borderRadius: '20px', width: '100%', maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0' }}>Create New Ticket</h2>
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Company Name *</label>
              <input type="text" placeholder="Type to search company..." value={companySearch} onChange={(e) => { setCompanySearch(e.target.value); setShowCompanyDropdown(true); }} onFocus={() => setShowCompanyDropdown(true)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              {showCompanyDropdown && companySearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', maxHeight: '200px', overflow: 'auto', zIndex: 1000 }}>
                  {filteredCompanies.map(company => (
                    <div key={company.id} onClick={() => handleCompanySelect(company)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                      <div style={{ fontWeight: '500' }}>{company.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{company.location} - {company.contact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input type="text" name="contactName" placeholder="Contact Person *" value={formData.contactName} onChange={handleInputChange} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
              <input type="text" name="contactPhone" placeholder="Phone Number *" value={formData.contactPhone} onChange={handleInputChange} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
            </div>
            <input type="email" name="contactEmail" placeholder="Email Address *" value={formData.contactEmail} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
            
            {/* Category Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Device Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.keys(productCatalog).map((category) => (
                  <button key={category} type="button" onClick={() => handleCategoryChange(category)} style={{ padding: '8px', background: selectedCategory === category ? '#3b82f6' : '#f3f4f6', color: selectedCategory === category ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>{category}</button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            {selectedCategory && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Select Device/Product *</label>
                <select name="device" value={formData.device} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                  <option value="">Select {selectedCategory}</option>
                  {filteredProducts.map((product) => (<option key={product} value={product}>{product}</option>))}
                </select>
              </div>
            )}

            <input type="text" name="problem" placeholder="Problem Title *" value={formData.problem} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
            <textarea name="description" placeholder="Problem Description *" rows={4} value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
              </select>
              <textarea 
                name="assignedTo" 
                placeholder="Assign Technician (Enter names, one per line)" 
                value={formData.assignedTo} 
                onChange={handleInputChange} 
                rows={3}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><input type="checkbox" defaultChecked /> <span>Send WhatsApp notification to customer when ticket is created</span></label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createNewTicket} disabled={loading} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Creating...' : 'Create Ticket & Notify'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
